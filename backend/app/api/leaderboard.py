from datetime import datetime, timedelta, timezone
from typing import Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.api import deps
from app.core.database import get_db
from app.models.attempt import Attempt
from app.models.user import User
from app.schemas.analytics import LeaderboardEntry

router = APIRouter()


@router.get("/", response_model=List[LeaderboardEntry])
def get_leaderboard(
    timeframe: str = Query("overall", enum=["weekly", "monthly", "overall"]),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get leaderboard statistics (rank, scores, attempts count, accuracy) filtered by timeframe.
    Timeframe options: 'weekly', 'monthly', 'overall'.
    """
    now = datetime.now(timezone.utc)
    
    # Base query for attempts that are completed
    query = db.query(
        Attempt.user_id,
        func.sum(Attempt.score).label("total_score"),
        func.count(Attempt.id).label("quizzes_taken"),
        func.avg(Attempt.percentage).label("accuracy")
    ).filter(Attempt.status.in_(["completed", "auto_submitted"]))
    
    # Filter by timeframe
    if timeframe == "weekly":
        start_date = now - timedelta(days=7)
        query = query.filter(Attempt.started_at >= start_date)
    elif timeframe == "monthly":
        start_date = now - timedelta(days=30)
        query = query.filter(Attempt.started_at >= start_date)
        
    # Group by user and order by total_score descending, then accuracy descending
    leaderboard_data = query.group_by(Attempt.user_id).order_by(
        func.sum(Attempt.score).desc(),
        func.avg(Attempt.percentage).desc()
    ).limit(50).all()
    
    results = []
    for index, row in enumerate(leaderboard_data):
        user = db.query(User).filter(User.id == row.user_id).first()
        if user:
            results.append(LeaderboardEntry(
                rank=index + 1,
                user_id=row.user_id,
                full_name=user.full_name,
                total_score=float(row.total_score) if row.total_score is not None else 0.0,
                quizzes_taken=row.quizzes_taken,
                accuracy=float(row.accuracy) if row.accuracy is not None else 0.0
            ))
            
    return results
