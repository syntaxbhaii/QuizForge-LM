from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class AttemptAnswerSubmit(BaseModel):
    question_id: int
    selected_option_ids: List[int]  # List to support multiple response type questions


class AttemptSubmit(BaseModel):
    answers: List[AttemptAnswerSubmit]


class AttemptAnswerResponse(BaseModel):
    id: int
    question_id: int
    selected_option_id: Optional[int]
    is_correct: bool
    points_earned: float

    model_config = ConfigDict(from_attributes=True)


class AttemptResponse(BaseModel):
    id: int
    user_id: int
    quiz_id: int
    score: float
    percentage: float
    passed: bool
    time_taken: int  # in seconds
    status: str  # "started", "completed", "auto_submitted"
    started_at: datetime
    completed_at: Optional[datetime]
    quiz_title: Optional[str] = None
    user_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# Detailed view for reviews (shows all questions, correct options, user choices, explanations)
class AttemptReviewAnswerResponse(BaseModel):
    question_id: int
    question_text: str
    question_type: str
    explanation: Optional[str]
    points: float
    points_earned: float
    selected_option_ids: List[int]
    correct_option_ids: List[int]
    is_correct: bool


class AttemptDetailedResponse(AttemptResponse):
    answers: List[AttemptReviewAnswerResponse]
    certificate_code: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
