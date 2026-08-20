from fastapi import APIRouter
from app.api import auth, users, categories, quizzes, questions, attempts, analytics, leaderboard

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(quizzes.router, prefix="/quizzes", tags=["quizzes"])
api_router.include_router(questions.router, prefix="", tags=["questions"])
api_router.include_router(attempts.router, prefix="", tags=["attempts"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(leaderboard.router, prefix="/leaderboard", tags=["leaderboard"])
