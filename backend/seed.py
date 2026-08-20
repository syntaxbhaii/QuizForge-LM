from datetime import datetime, timezone, timedelta
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User
from app.models.category import Category
from app.models.quiz import Quiz
from app.models.question import Question, Option


def seed_database():
    print("Pre-checking database connections and tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # 1. Create Default Users
        print("Seeding Users...")
        admin_user = db.query(User).filter(User.email == "admin@quizforge.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@quizforge.com",
                hashed_password=get_password_hash("adminpassword123"),
                full_name="Biswa Sarathi Subudhi (Admin)",
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            print("Admin created: admin@quizforge.com / adminpassword123")
            
        student_user = db.query(User).filter(User.email == "student@quizforge.com").first()
        if not student_user:
            student_user = User(
                email="student@quizforge.com",
                hashed_password=get_password_hash("studentpassword123"),
                full_name="Jane Doe (Student)",
                role="student",
                is_active=True
            )
            db.add(student_user)
            print("Student created: student@quizforge.com / studentpassword123")
            
        db.commit()
        db.refresh(admin_user)
        
        # 2. Create Categories
        print("Seeding Categories...")
        categories_data = [
            ("Science", "General Science and Astronomy topics"),
            ("Mathematics", "Algebra, Arithmetic, and Logic challenges"),
            ("Web Development", "HTML, CSS, JavaScript and React frameworks"),
            ("General Knowledge", "Geography, History, and Trivia facts")
        ]
        
        seeded_categories = {}
        for cat_name, cat_desc in categories_data:
            cat = db.query(Category).filter(Category.name == cat_name).first()
            if not cat:
                cat = Category(name=cat_name, description=cat_desc)
                db.add(cat)
                db.flush()
            seeded_categories[cat_name] = cat
        db.commit()

        # 3. Create Quizzes & Questions
        print("Seeding Quizzes...")
        
        # Quiz 1: Web Development (JavaScript Core)
        js_quiz = db.query(Quiz).filter(Quiz.title == "JavaScript Fundamentals").first()
        if not js_quiz:
            js_quiz = Quiz(
                title="JavaScript Fundamentals",
                description="Test your understanding of scopes, closures, variables, and asynchronous JS.",
                category_id=seeded_categories["Web Development"].id,
                creator_id=admin_user.id,
                time_limit=15,
                max_attempts=3,
                pass_percentage=60.0,
                negative_marking=0.25,
                is_published=True,
                random_questions=False,
                random_options=False,
                starts_at=datetime.now(timezone.utc) - timedelta(days=1),
                ends_at=datetime.now(timezone.utc) + timedelta(days=30)
            )
            db.add(js_quiz)
            db.flush()
            
            # Question 1: Single Choice (MCQ)
            q1 = Question(
                quiz_id=js_quiz.id,
                question_text="Which keyword is block-scoped in JavaScript?",
                question_type="single",
                points=2.0,
                explanation="let and const are block-scoped keywords introduced in ES6, whereas var is function-scoped."
            )
            db.add(q1)
            db.flush()
            db.add_all([
                Option(question_id=q1.id, option_text="var", is_correct=False),
                Option(question_id=q1.id, option_text="let", is_correct=True),
                Option(question_id=q1.id, option_text="function", is_correct=False),
                Option(question_id=q1.id, option_text="global", is_correct=False)
            ])
            
            # Question 2: Multiple Choice (MRQ)
            q2 = Question(
                quiz_id=js_quiz.id,
                question_text="Which of the following are primitive datatypes in JavaScript? (Select all that apply)",
                question_type="multiple",
                points=3.0,
                explanation="String, Number, and Boolean are primitives. Array and Object are reference types."
            )
            db.add(q2)
            db.flush()
            db.add_all([
                Option(question_id=q2.id, option_text="String", is_correct=True),
                Option(question_id=q2.id, option_text="Number", is_correct=True),
                Option(question_id=q2.id, option_text="Array", is_correct=False),
                Option(question_id=q2.id, option_text="Boolean", is_correct=True)
            ])
            
            # Question 3: True / False
            q3 = Question(
                quiz_id=js_quiz.id,
                question_text="JavaScript is a multi-threaded programming language.",
                question_type="boolean",
                points=1.0,
                explanation="JavaScript is a single-threaded runtime environment, although web workers exist."
            )
            db.add(q3)
            db.flush()
            db.add_all([
                Option(question_id=q3.id, option_text="True", is_correct=False),
                Option(question_id=q3.id, option_text="False", is_correct=True)
            ])
            print("Created quiz: JavaScript Fundamentals")
            
        # Quiz 2: General Knowledge (Solar System)
        science_quiz = db.query(Quiz).filter(Quiz.title == "Solar System Astronomy").first()
        if not science_quiz:
            science_quiz = Quiz(
                title="Solar System Astronomy",
                description="Explore planets, moons, stars, and basic cosmological facts.",
                category_id=seeded_categories["Science"].id,
                creator_id=admin_user.id,
                time_limit=10,
                max_attempts=5,
                pass_percentage=50.0,
                negative_marking=0.0,
                is_published=True,
                random_questions=True,
                random_options=True,
                starts_at=datetime.now(timezone.utc) - timedelta(days=2),
                ends_at=datetime.now(timezone.utc) + timedelta(days=45)
            )
            db.add(science_quiz)
            db.flush()
            
            q1 = Question(
                quiz_id=science_quiz.id,
                question_text="Which planet is known as the Red Planet?",
                question_type="single",
                points=2.0,
                explanation="Mars is called the Red Planet because iron minerals in its soil oxidize (rust), making the soil look red."
            )
            db.add(q1)
            db.flush()
            db.add_all([
                Option(question_id=q1.id, option_text="Venus", is_correct=False),
                Option(question_id=q1.id, option_text="Mars", is_correct=True),
                Option(question_id=q1.id, option_text="Jupiter", is_correct=False),
                Option(question_id=q1.id, option_text="Saturn", is_correct=False)
            ])
            
            q2 = Question(
                quiz_id=science_quiz.id,
                question_text="The Sun is a star, not a planet.",
                question_type="boolean",
                points=1.0,
                explanation="The Sun is classified as a yellow dwarf star at the center of our solar system."
            )
            db.add(q2)
            db.flush()
            db.add_all([
                Option(question_id=q2.id, option_text="True", is_correct=True),
                Option(question_id=q2.id, option_text="False", is_correct=False)
            ])
            print("Created quiz: Solar System Astronomy")

        db.commit()
        print("Database seeded successfully.")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {str(e)}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
