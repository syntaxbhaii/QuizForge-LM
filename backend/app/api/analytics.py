from datetime import datetime, timezone
from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.api import deps
from app.core.database import get_db
from app.models.attempt import Attempt
from app.models.category import Category
from app.models.quiz import Quiz
from app.models.user import User
from app.schemas.analytics import AdminAnalytics, QuizPassRate, CategoryPerformance, StudentAnalytics
from app.schemas.attempt import AttemptResponse

router = APIRouter()


@router.get("/admin", response_model=AdminAnalytics)
def get_admin_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """
    Get admin dashboard stats: total metrics, pass rates per quiz, and monthly trends.
    """
    total_students = db.query(User).filter(User.role == "student").count()
    total_quizzes = db.query(Quiz).count()
    total_attempts = db.query(Attempt).count()
    total_categories = db.query(Category).count()
    
    # Quiz pass rates
    quiz_pass_rates = []
    quizzes = db.query(Quiz).all()
    for q in quizzes:
        att_count = db.query(Attempt).filter(Attempt.quiz_id == q.id).count()
        if att_count > 0:
            pass_count = db.query(Attempt).filter(Attempt.quiz_id == q.id, Attempt.passed == True).count()
            pass_rate = (pass_count / att_count) * 100.0
        else:
            pass_rate = 0.0
        quiz_pass_rates.append(QuizPassRate(
            quiz_id=q.id,
            quiz_title=q.title,
            pass_rate=pass_rate,
            attempt_count=att_count
        ))
        
    # Sort pass rates by attempt count descending
    quiz_pass_rates.sort(key=lambda x: x.attempt_count, reverse=True)
    
    # Monthly attempts trend (last 6 months, mock/grouped)
    # Using simple SQL grouping for PostgreSQL/SQLite compatibility
    trend_query = db.query(
        func.to_char(Attempt.started_at, 'YYYY-MM').label('month'), # standard postgres
        func.count(Attempt.id).label('count')
    ).group_by('month').order_by('month').limit(6).all()
    
    monthly_trend = []
    if trend_query:
        for t in trend_query:
            monthly_trend.append({"date": t[0], "attempts": t[1]})
    else:
        # Fallback if SQLite (which doesn't have to_char in the same way) or empty
        monthly_trend = [
            {"date": datetime.now().strftime("%Y-%m"), "attempts": total_attempts}
        ]
        
    # Recent attempts
    recent_attempts_db = db.query(Attempt).order_by(Attempt.started_at.desc()).limit(5).all()
    recent_attempts = []
    for att in recent_attempts_db:
        resp = AttemptResponse.model_validate(att)
        resp.quiz_title = att.quiz.title if att.quiz else "Deleted Quiz"
        resp.user_name = att.user.full_name if att.user else "Deleted Student"
        recent_attempts.append(resp)
        
    return AdminAnalytics(
        total_students=total_students,
        total_quizzes=total_quizzes,
        total_attempts=total_attempts,
        total_categories=total_categories,
        quiz_pass_rates=quiz_pass_rates[:5],
        monthly_attempts_trend=monthly_trend,
        recent_attempts=recent_attempts
    )


@router.get("/student", response_model=StudentAnalytics)
def get_student_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_student),
) -> Any:
    """
    Get student personal dashboard statistics and category-wise performance.
    """
    attempts_query = db.query(Attempt).filter(Attempt.user_id == current_user.id)
    total_attempts = attempts_query.count()
    
    passed_attempts = attempts_query.filter(Attempt.passed == True).count()
    
    # Averages
    avg_score_db = db.query(func.avg(Attempt.score)).filter(Attempt.user_id == current_user.id).scalar()
    avg_perc_db = db.query(func.avg(Attempt.percentage)).filter(Attempt.user_id == current_user.id).scalar()
    
    average_score = float(avg_score_db) if avg_score_db is not None else 0.0
    average_percentage = float(avg_perc_db) if avg_perc_db is not None else 0.0
    
    # Performance by category
    categories = db.query(Category).all()
    performance_by_category = []
    
    for cat in categories:
        cat_attempts = db.query(Attempt).join(Quiz).filter(
            Attempt.user_id == current_user.id,
            Quiz.category_id == cat.id
        ).all()
        
        if cat_attempts:
            cat_avg = sum(att.percentage for att in cat_attempts) / len(cat_attempts)
            performance_by_category.append(CategoryPerformance(
                category_name=cat.name,
                avg_score=cat_avg,
                quizzes_taken=len(cat_attempts)
            ))
            
    # Recent attempts
    recent_attempts_db = attempts_query.order_by(Attempt.started_at.desc()).limit(5).all()
    recent_attempts = []
    for att in recent_attempts_db:
        resp = AttemptResponse.model_validate(att)
        resp.quiz_title = att.quiz.title if att.quiz else "Deleted Quiz"
        resp.user_name = current_user.full_name
        recent_attempts.append(resp)
        
    return StudentAnalytics(
        total_attempts=total_attempts,
        passed_attempts=passed_attempts,
        average_score=average_score,
        average_percentage=average_percentage,
        performance_by_category=performance_by_category,
        recent_attempts=recent_attempts
    )
