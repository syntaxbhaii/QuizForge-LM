from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.api import deps
from app.core.database import get_db
from app.models.attempt import Attempt, AttemptAnswer
from app.models.quiz import Quiz
from app.models.question import Question, Option
from app.models.certificate import Certificate
from app.models.user import User
from app.schemas.attempt import AttemptDetailedResponse, AttemptResponse, AttemptSubmit, AttemptReviewAnswerResponse
from app.services.certificate import generate_certificate_pdf
from app.services.notification import send_quiz_completion_email

router = APIRouter()


@router.post("/quizzes/{quiz_id}/attempts", response_model=AttemptResponse, status_code=status.HTTP_201_CREATED)
def create_attempt(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_student),
) -> Any:
    """
    Initiate a new quiz attempt.
    """
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    if not quiz.is_published:
        raise HTTPException(status_code=400, detail="Quiz is not published")
        
    # Check max attempt limits
    completed_attempts = db.query(Attempt).filter(
        Attempt.user_id == current_user.id,
        Attempt.quiz_id == quiz_id,
        Attempt.status.in_(["completed", "auto_submitted"])
    ).count()
    
    if completed_attempts >= quiz.max_attempts:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum attempts ({quiz.max_attempts}) reached."
        )
        
    # Check if there is an existing ongoing "started" attempt
    ongoing_attempt = db.query(Attempt).filter(
        Attempt.user_id == current_user.id,
        Attempt.quiz_id == quiz_id,
        Attempt.status == "started"
    ).first()
    
    if ongoing_attempt:
        # Return the ongoing attempt instead of making a new one
        return ongoing_attempt
        
    db_attempt = Attempt(
        user_id=current_user.id,
        quiz_id=quiz_id,
        status="started",
        started_at=datetime.now(timezone.utc),
        score=0.0,
        percentage=0.0,
        passed=False,
        time_taken=0
    )
    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)
    return db_attempt


@router.post("/attempts/{attempt_id}/submit", response_model=AttemptResponse)
def submit_attempt(
    attempt_id: int,
    submission: AttemptSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_student),
) -> Any:
    """
    Submit answer choices, grade the attempt, calculate negative marking, and check passing thresholds.
    """
    attempt = db.query(Attempt).filter(Attempt.id == attempt_id, Attempt.user_id == current_user.id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    if attempt.status != "started":
        raise HTTPException(status_code=400, detail="Attempt has already been submitted")
        
    quiz = attempt.quiz
    now = datetime.now(timezone.utc)
    
    # Calculate time taken
    started_time = attempt.started_at.replace(tzinfo=timezone.utc)
    seconds_taken = int((now - started_time).total_seconds())
    
    # Allow a 15 second grace period for network lag
    time_limit_seconds = quiz.time_limit * 60
    is_timeout = seconds_taken > (time_limit_seconds + 15)
    
    attempt.status = "auto_submitted" if is_timeout else "completed"
    attempt.completed_at = now
    attempt.time_taken = min(seconds_taken, time_limit_seconds)
    
    # Grading details
    questions = db.query(Question).filter(Question.quiz_id == quiz.id).all()
    total_max_score = sum(q.points for q in questions)
    
    earned_score = 0.0
    
    # Map submission details for processing
    submission_map = {ans.question_id: ans.selected_option_ids for ans in submission.answers}
    
    for question in questions:
        correct_options = db.query(Option).filter(Option.question_id == question.id, Option.is_correct == True).all()
        correct_ids = [opt.id for opt in correct_options]
        
        selected_ids = submission_map.get(question.id, [])
        
        # Determine if correct
        is_correct = False
        points_gained = 0.0
        
        if selected_ids:
            if question.question_type == "multiple":
                # For multiple responses, all selected answers must be correct and cover all correct answers
                if set(selected_ids) == set(correct_ids):
                    is_correct = True
                    points_gained = question.points
                else:
                    is_correct = False
                    points_gained = -quiz.negative_marking if quiz.negative_marking > 0 else 0.0
            else:
                # Single or boolean choice (expects 1 selected ID)
                first_selected = selected_ids[0]
                if first_selected in correct_ids:
                    is_correct = True
                    points_gained = question.points
                else:
                    is_correct = False
                    points_gained = -quiz.negative_marking if quiz.negative_marking > 0 else 0.0
        else:
            # Skipped question
            is_correct = False
            points_gained = 0.0
            
        earned_score += points_gained
        
        # Save Attempt Answers to database
        if selected_ids:
            for opt_id in selected_ids:
                db_ans = AttemptAnswer(
                    attempt_id=attempt.id,
                    question_id=question.id,
                    selected_option_id=opt_id,
                    is_correct=is_correct,
                    points_earned=points_gained / len(selected_ids) if len(selected_ids) > 0 else 0.0
                )
                db.add(db_ans)
        else:
            db_ans = AttemptAnswer(
                attempt_id=attempt.id,
                question_id=question.id,
                selected_option_id=None,
                is_correct=False,
                points_earned=0.0
            )
            db.add(db_ans)
            
    # Clean score boundary
    earned_score = max(0.0, earned_score)
    attempt.score = earned_score
    attempt.percentage = (earned_score / total_max_score * 100.0) if total_max_score > 0 else 0.0
    attempt.passed = attempt.percentage >= quiz.pass_percentage
    
    # Generate certificate if passed
    if attempt.passed:
        cert = Certificate(attempt_id=attempt.id)
        db.add(cert)
        db.flush()  # gets certificate_code
        cert_code = cert.certificate_code
    else:
        cert_code = None
        
    db.commit()
    db.refresh(attempt)
    
    # Send email notification
    send_quiz_completion_email(
        current_user.email,
        current_user.full_name,
        quiz.title,
        attempt.score,
        attempt.percentage,
        attempt.passed
    )
    
    resp = AttemptResponse.model_validate(attempt)
    resp.quiz_title = quiz.title
    resp.user_name = current_user.full_name
    return resp


@router.get("/attempts/me", response_model=List[AttemptResponse])
def read_my_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_student),
) -> Any:
    """
    List past attempts for the current student.
    """
    attempts = db.query(Attempt).filter(Attempt.user_id == current_user.id).order_by(Attempt.started_at.desc()).all()
    
    response_list = []
    for att in attempts:
        resp = AttemptResponse.model_validate(att)
        resp.quiz_title = att.quiz.title if att.quiz else "Deleted Quiz"
        resp.user_name = current_user.full_name
        response_list.append(resp)
        
    return response_list


@router.get("/attempts/{attempt_id}/review", response_model=AttemptDetailedResponse)
def review_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve question-by-question review of an attempt, including correct choices and explanations.
    """
    attempt = db.query(Attempt).filter(Attempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    # Student can only review their own attempts. Admin can review any.
    if current_user.role == "student" and attempt.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to review this attempt")
        
    quiz = attempt.quiz
    questions = db.query(Question).filter(Question.quiz_id == quiz.id).all()
    
    # Extract student's responses
    db_answers = db.query(AttemptAnswer).filter(AttemptAnswer.attempt_id == attempt.id).all()
    
    # Group student's responses by question_id
    student_selections = {}
    for ans in db_answers:
        if ans.question_id not in student_selections:
            student_selections[ans.question_id] = []
        if ans.selected_option_id:
            student_selections[ans.question_id].append(ans.selected_option_id)
            
    review_answers = []
    for q in questions:
        correct_opts = db.query(Option).filter(Option.question_id == q.id, Option.is_correct == True).all()
        correct_ids = [opt.id for opt in correct_opts]
        
        selected_ids = student_selections.get(q.id, [])
        
        # Check if student answered correctly
        is_correct = False
        if selected_ids:
            if q.question_type == "multiple":
                is_correct = set(selected_ids) == set(correct_ids)
            else:
                is_correct = len(selected_ids) > 0 and selected_ids[0] in correct_ids
                
        # Calculate points earned for this question
        pts_earned = 0.0
        ans_records = [a for a in db_answers if a.question_id == q.id]
        if ans_records:
            pts_earned = sum(a.points_earned for a in ans_records)
            
        review_answers.append(AttemptReviewAnswerResponse(
            question_id=q.id,
            question_text=q.question_text,
            question_type=q.question_type,
            explanation=q.explanation,
            points=q.points,
            points_earned=pts_earned,
            selected_option_ids=selected_ids,
            correct_option_ids=correct_ids,
            is_correct=is_correct
        ))
        
    # Get certificate code
    certificate_code = attempt.certificate.certificate_code if attempt.certificate else None
    
    return AttemptDetailedResponse(
        id=attempt.id,
        user_id=attempt.user_id,
        quiz_id=attempt.quiz_id,
        score=attempt.score,
        percentage=attempt.percentage,
        passed=attempt.passed,
        time_taken=attempt.time_taken,
        status=attempt.status,
        started_at=attempt.started_at,
        completed_at=attempt.completed_at,
        quiz_title=quiz.title,
        user_name=attempt.user.full_name,
        certificate_code=certificate_code,
        answers=review_answers
    )


@router.get("/attempts/{attempt_id}/certificate")
def download_certificate(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Download PDF Certificate for a passed attempt.
    """
    attempt = db.query(Attempt).filter(Attempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    # Check permissions
    if current_user.role == "student" and attempt.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this certificate")
        
    if not attempt.passed:
        raise HTTPException(status_code=400, detail="Cannot issue certificate for failed or incomplete attempt")
        
    if not attempt.certificate:
        # Create certificate record if it somehow doesn't exist
        cert = Certificate(attempt_id=attempt.id)
        db.add(cert)
        db.commit()
        db.refresh(attempt)
        
    pdf_bytes = generate_certificate_pdf(
        student_name=attempt.user.full_name,
        quiz_title=attempt.quiz.title,
        score_percentage=attempt.percentage,
        completion_date=attempt.completed_at if attempt.completed_at else attempt.started_at,
        certificate_code=attempt.certificate.certificate_code
    )
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=certificate_{attempt.certificate.certificate_code}.pdf"
        }
    )


@router.get("/", response_model=List[AttemptResponse])
def read_all_attempts(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """
    Retrieve all attempts across the platform. (Admin Only)
    """
    attempts = db.query(Attempt).order_by(Attempt.started_at.desc()).offset(skip).limit(limit).all()
    
    response_list = []
    for att in attempts:
        resp = AttemptResponse.model_validate(att)
        resp.quiz_title = att.quiz.title if att.quiz else "Deleted Quiz"
        resp.user_name = att.user.full_name if att.user else "Deleted User"
        response_list.append(resp)
        
    return response_list
