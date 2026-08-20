from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.api import deps
from app.core.database import get_db
from app.models.quiz import Quiz
from app.models.question import Question, Option
from app.models.user import User
from app.schemas.question import QuestionCreate, QuestionDetailedResponse, QuestionUpdate
from app.services.import_export import generate_questions_template_csv, parse_questions_file

router = APIRouter()


@router.post("/quizzes/{quiz_id}/questions", response_model=QuestionDetailedResponse, status_code=status.HTTP_201_CREATED)
def create_question(
    quiz_id: int,
    question_in: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """
    Create a new question for a specific quiz. (Admin Only)
    """
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    db_question = Question(
        quiz_id=quiz_id,
        question_text=question_in.question_text,
        question_type=question_in.question_type,
        points=question_in.points,
        explanation=question_in.explanation
    )
    db.add(db_question)
    db.flush()  # get db_question.id
    
    for opt in question_in.options:
        db_opt = Option(
            question_id=db_question.id,
            option_text=opt.option_text,
            is_correct=opt.is_correct
        )
        db.add(db_opt)
        
    db.commit()
    db.refresh(db_question)
    return db_question


@router.put("/questions/{question_id}", response_model=QuestionDetailedResponse)
def update_question(
    question_id: int,
    question_in: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """
    Update a question and its options. (Admin Only)
    """
    db_question = db.query(Question).filter(Question.id == question_id).first()
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    if question_in.question_text is not None:
        db_question.question_text = question_in.question_text
    if question_in.question_type is not None:
        db_question.question_type = question_in.question_type
    if question_in.points is not None:
        db_question.points = question_in.points
    if question_in.explanation is not None:
        db_question.explanation = question_in.explanation
        
    if question_in.options is not None:
        # Recreate options for simplicity and consistency
        db.query(Option).filter(Option.question_id == question_id).delete()
        for opt in question_in.options:
            db_opt = Option(
                question_id=question_id,
                option_text=opt.option_text,
                is_correct=opt.is_correct
            )
            db.add(db_opt)
            
    db.commit()
    db.refresh(db_question)
    return db_question


@router.delete("/questions/{question_id}", response_model=QuestionDetailedResponse)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """
    Delete a question. (Admin Only)
    """
    db_question = db.query(Question).filter(Question.id == question_id).first()
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(db_question)
    db.commit()
    return db_question


@router.get("/templates/questions")
def get_template(
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """
    Download a sample CSV file structure for bulk uploading questions.
    """
    csv_bytes = generate_questions_template_csv()
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=questions_template.csv"}
    )


@router.post("/quizzes/{quiz_id}/questions/import")
async def import_questions(
    quiz_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """
    Upload CSV or Excel questions file, validate and bulk insert under a quiz.
    """
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    file_content = await file.read()
    questions, errors = parse_questions_file(file_content, file.filename)
    
    if errors:
        raise HTTPException(
            status_code=400,
            detail={"errors": errors, "message": "Import file format errors detected."}
        )
        
    for q_create in questions:
        db_question = Question(
            quiz_id=quiz_id,
            question_text=q_create.question_text,
            question_type=q_create.question_type,
            points=q_create.points,
            explanation=q_create.explanation
        )
        db.add(db_question)
        db.flush()
        
        for opt in q_create.options:
            db_opt = Option(
                question_id=db_question.id,
                option_text=opt.option_text,
                is_correct=opt.is_correct
            )
            db.add(db_opt)
            
    db.commit()
    return {"message": f"Successfully imported {len(questions)} questions."}
