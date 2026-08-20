from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from app.schemas.attempt import AttemptResponse


class QuizPassRate(BaseModel):
    quiz_id: int
    quiz_title: str
    pass_rate: float
    attempt_count: int


class AdminAnalytics(BaseModel):
    total_students: int
    total_quizzes: int
    total_attempts: int
    total_categories: int
    quiz_pass_rates: List[QuizPassRate]
    monthly_attempts_trend: List[Dict[str, Any]]
    recent_attempts: List[AttemptResponse]


class CategoryPerformance(BaseModel):
    category_name: str
    avg_score: float
    quizzes_taken: int


class StudentAnalytics(BaseModel):
    total_attempts: int
    passed_attempts: int
    average_score: float
    average_percentage: float
    performance_by_category: List[CategoryPerformance]
    recent_attempts: List[AttemptResponse]


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    full_name: str
    total_score: float
    quizzes_taken: int
    accuracy: float  # average percentage
