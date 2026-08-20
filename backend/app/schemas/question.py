from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


# Options Schemas
class OptionBase(BaseModel):
    option_text: str


class OptionCreate(OptionBase):
    is_correct: bool = False


class OptionResponse(OptionBase):
    id: int
    is_correct: bool

    model_config = ConfigDict(from_attributes=True)


class OptionStudentResponse(OptionBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# Questions Schemas
class QuestionBase(BaseModel):
    question_text: str
    question_type: str = "single"  # "single", "multiple", "boolean"
    points: float = 1.0
    explanation: Optional[str] = None


class QuestionCreate(QuestionBase):
    options: List[OptionCreate]


class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    question_type: Optional[str] = None
    points: Optional[float] = None
    explanation: Optional[str] = None
    options: Optional[List[OptionCreate]] = None


class QuestionResponse(QuestionBase):
    id: int
    quiz_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class QuestionDetailedResponse(QuestionResponse):
    options: List[OptionResponse]

    model_config = ConfigDict(from_attributes=True)


class QuestionStudentResponse(BaseModel):
    id: int
    quiz_id: int
    question_text: str
    question_type: str
    points: float
    options: List[OptionStudentResponse]

    model_config = ConfigDict(from_attributes=True)
