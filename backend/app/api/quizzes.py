from datetime import datetime, timezone
import random
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.core.database import get_db
from app.models.category import Category
from app.models.quiz import Quiz
from app.models.attempt import Attempt
from app.models.user import User
from app.schemas.quiz import QuizCreate, QuizDetailedResponse, QuizResponse, QuizStudentResponse, QuizUpdate
from app.schemas.question import QuestionStudentResponse, OptionStudentResponse

router = APIRouter()


@router.get("/", response_model=List[QuizResponse])
def read_quizzes(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve quizzes.
    For students: returns only published, active quizzes.
    For admins: returns all quizzes (drafts + published).
    """
    query = db.query(Quiz)
    
    if current_user.role == "student":
        # Students can only see published quizzes
        query = query.filter(Quiz.is_published == True)
        
    if category_id:
        query = query.filter(Quiz.category_id == category_id)
        
    if search:
        query = query.filter(
            (Quiz.title.ilike(f"%{search}%")) | (Quiz.description.ilike(f"%{search}%"))
        )
        
    quizzes = query.offset(skip).limit(limit).all()
    
    # Map category names manually for serialization safety
    response_list = []
    for quiz in quizzes:
        resp = QuizResponse.model_validate(quiz)
        resp.category_name = quiz.category.name if quiz.category else "Uncategorized"
        response_list.append(resp)
        
    return response_list


@router.post("/", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
def create_quiz(
    quiz_in: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """
    Create a new quiz. (Admin Only)
    """
    category = db.query(Category).filter(Category.id == quiz_in.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    db_quiz = Quiz(
        title=quiz_in.title,
        description=quiz_in.description,
        category_id=quiz_in.category_id,
        creator_id=current_user.id,
        time_limit=quiz_in.time_limit,
        max_attempts=quiz_in.max_attempts,
        pass_percentage=quiz_in.pass_percentage,
        negative_marking=quiz_in.negative_marking,
        is_published=quiz_in.is_published,
        random_questions=quiz_in.random_questions,
        random_options=quiz_in.random_options,
        starts_at=quiz_in.starts_at,
        ends_at=quiz_in.ends_at
    )
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    
    resp = QuizResponse.model_validate(db_quiz)
    resp.category_name = category.name
    return resp


@router.get("/{quiz_id}", response_model=QuizDetailedResponse)
def read_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get quiz detailed information. (Admin can see everything. Student sees details without answers if attempting).
    Note: Standard GET quiz for Admin reviews. For actual attempts, students use `/{quiz_id}/attempt`.
    """
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    if current_user.role == "student" and not quiz.is_published:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this draft quiz."
        )
        
    resp = QuizDetailedResponse.model_validate(quiz)
    resp.category_name = quiz.category.name if quiz.category else "Uncategorized"
    return resp


@router.get("/{quiz_id}/attempt", response_model=QuizStudentResponse)
def start_quiz_attempt(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_student),
) -> Any:
    """
    Start/join a quiz attempt. Enforces attempt validation and returns a sanitized student view of questions.
    """
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    if not quiz.is_published:
        raise HTTPException(status_code=400, detail="Quiz is currently in draft mode.")
        
    now = datetime.now(timezone.utc)
    if quiz.starts_at and quiz.starts_at.replace(tzinfo=timezone.utc) > now:
        raise HTTPException(status_code=400, detail="This quiz has not started yet.")
    if quiz.ends_at and quiz.ends_at.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(status_code=400, detail="This quiz has expired.")
        
    # Check max attempt limits
    completed_attempts = db.query(Attempt).filter(
        Attempt.user_id == current_user.id,
        Attempt.quiz_id == quiz_id,
        Attempt.status.in_(["completed", "auto_submitted"])
    ).count()
    
    if completed_attempts >= quiz.max_attempts:
        raise HTTPException(
            status_code=400,
            detail=f"You have reached the maximum allowed attempts ({quiz.max_attempts}) for this quiz."
        )
        
    # Process question lists
    questions_list = list(quiz.questions)
    
    if quiz.random_questions:
        random.shuffle(questions_list)
        
    student_questions = []
    for q in questions_list:
        options = list(q.options)
        if quiz.random_options:
            random.shuffle(options)
            
        student_options = [
            OptionStudentResponse(id=opt.id, option_text=opt.option_text)
            for opt in options
        ]
        
        student_questions.append(QuestionStudentResponse(
            id=q.id,
            quiz_id=q.quiz_id,
            question_text=q.question_text,
            question_type=q.question_type,
            points=q.points,
            options=student_options
        ))
        
    return QuizStudentResponse(
        id=quiz.id,
        title=quiz.title,
        description=quiz.description,
        category_id=quiz.category_id,
        time_limit=quiz.time_limit,
        max_attempts=quiz.max_attempts,
        pass_percentage=quiz.pass_percentage,
        negative_marking=quiz.negative_marking,
        random_questions=quiz.random_questions,
        random_options=quiz.random_options,
        starts_at=quiz.starts_at,
        ends_at=quiz.ends_at,
        questions=student_questions
    )


@router.put("/{quiz_id}", response_model=QuizResponse)
def update_quiz(
    quiz_id: int,
    quiz_in: QuizUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """
    Update a quiz. (Admin Only)
    """
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    update_data = quiz_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(quiz, field, value)
        
    db.commit()
    db.refresh(quiz)
    
    resp = QuizResponse.model_validate(quiz)
    resp.category_name = quiz.category.name if quiz.category else "Uncategorized"
    return resp


@router.delete("/{quiz_id}", response_model=QuizResponse)
def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """
    Delete a quiz. (Admin Only)
    """
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    db.delete(quiz)
    db.commit()
    return quiz
