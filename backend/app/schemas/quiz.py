from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.question import QuestionDetailedResponse, QuestionStudentResponse


class QuizBase(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: int
    time_limit: int = 30  # in minutes
    max_attempts: int = 3
    pass_percentage: float = 50.0
    negative_marking: float = 0.0
    random_questions: bool = False
    random_options: bool = False
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class QuizCreate(QuizBase):
    is_published: bool = False


class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    time_limit: Optional[int] = None
    max_attempts: Optional[int] = None
    pass_percentage: Optional[float] = None
    negative_marking: Optional[float] = None
    is_published: Optional[bool] = None
    random_questions: Optional[bool] = None
    random_options: Optional[bool] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class QuizResponse(QuizBase):
    id: int
    creator_id: int
    is_published: bool
    created_at: datetime
    category_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class QuizDetailedResponse(QuizResponse):
    questions: List[QuestionDetailedResponse]

    model_config = ConfigDict(from_attributes=True)


class QuizStudentResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category_id: int
    time_limit: int
    max_attempts: int
    pass_percentage: float
    negative_marking: float
    random_questions: bool
    random_options: bool
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    questions: List[QuestionStudentResponse]

    model_config = ConfigDict(from_attributes=True)
