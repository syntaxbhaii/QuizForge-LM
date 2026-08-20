# 🚀 QuizForge — The Next Generation Quiz Management & Online Assessment Platform

QuizForge is a production-ready, enterprise-grade online evaluation system. Designed as a SaaS commercial platform, it combines a secure Python/FastAPI backend with a premium, responsive React 19 frontend utilizing Tailwind CSS and Framer Motion animations. 

It provides secure auto-grading, dynamic PDF certificate generation, detailed answer review explanations, negative marking rules, csv/excel questions import, and weekly/monthly/overall leaderboard statistics.

---

## 📦 Architecture & Folder Structure

QuizForge uses a clean, layered architectural pattern dividing logical areas into frontend client layers and backend API service layers.

```
QuizForge/
├── backend/                  # Python FastAPI Backend
│   ├── app/
│   │   ├── api/              # Routers and Endpoint controllers
│   │   ├── core/             # Configuration, Database engine, Security middleware
│   │   ├── models/           # SQLAlchemy Declarative models
│   │   ├── schemas/          # Pydantic request/response validation
│   │   ├── services/         # PDF generator, CSV imports, emails
│   │   └── tests/            # Pytest test suites (auth, quizzes, grading)
│   ├── alembic/              # Database migration tracking folder
│   ├── requirements.txt      # Python libraries dependencies list
│   ├── seed.py               # Database seeds initialization script
│   └── Dockerfile            # Container configuration for backend uvicorn
├── frontend/                 # React 19 Frontend
│   ├── src/
│   │   ├── components/       # Reusable components (ErrorBoundary, Loader)
│   │   ├── context/          # State systems (AuthContext, ThemeContext)
│   │   ├── layouts/          # Layout frame views (AdminLayout, StudentLayout)
│   │   ├── services/         # Central Axios client wrapper (api.js)
│   │   ├── views/            # Screen views (Login, Dashboards, QuizAttempt)
│   │   ├── App.jsx           # Master react router mapping
│   │   └── index.css         # Styling styles and scrollbars
│   ├── package.json          # Node libraries list
│   └── Dockerfile            # Container configuration for dev server
└── docker-compose.yml        # Orchestration script binding all services
```

---

## 🛠 Tech Stack

### Frontend
- **React 19 & Vite**: Fast compiles and renders
- **Tailwind CSS**: Curved cards, slate colors, dark mode adjustments
- **Framer Motion**: Smooth page slides and animations
- **Recharts**: High-contrast SVG analytics graphs
- **Lucide React**: Vector dashboard icon collection
- **React Hot Toast**: Action alerts and system error reports
- **React Router Dom & Axios**: Multi-page routing and centralized client calls

### Backend
- **FastAPI**: Asynchronous REST controllers with automatic OpenAPI/Swagger documentation
- **SQLAlchemy (v2.0)**: Object relational database manager
- **Alembic**: Autogenerate database schema revisions
- **ReportLab**: Compilation of passed attempts into printable PDF certificates
- **Pandas & OpenPyXL**: Parsing question data from CSV or Excel uploads
- **Jose JWT & Bcrypt**: Encryption keys and password hash encoders
- **Pytest**: Multi-tier testing suite

---

## 🛡 Security Rules

QuizForge implements strict backend-first validation protocols:
1. **Never Trust the Client**: All scoring, question pools, pass checking, and time bounds are calculated and validated in python controllers directly. Correct answers are never sent to students during active quiz attempts.
2. **Access Control (RBAC)**: Active user checks enforce separate roles. Admin controls are protected from student routes.
3. **Stateless Tokens**: JWT keys are signed with HS256 and verified dynamically. Password recoveries are secured with signed reset JWT codes.
4. **Relational Integrity**: Foreign key constraints enforce strict CASCADE delete rules. Deleting a Category automatically deletes quizzes under it, and user removals cascade into attempts deletion.

---

## 📊 Database Schema (PostgreSQL)

```mermaid
erDiagram
    USERS {
        int id PK
        string email UNIQUE
        string hashed_password
        string full_name
        string role "admin | student"
        boolean is_active
        datetime created_at
    }
    CATEGORIES {
        int id PK
        string name UNIQUE
        string description
        datetime created_at
    }
    QUIZZES {
        int id PK
        string title
        string description
        int category_id FK
        int creator_id FK
        int time_limit
        int max_attempts
        float pass_percentage
        float negative_marking
        boolean is_published
        boolean random_questions
        boolean random_options
        datetime starts_at
        datetime ends_at
        datetime created_at
    }
    QUESTIONS {
        int id PK
        int quiz_id FK
        string question_text
        string question_type "single | multiple | boolean"
        float points
        string explanation
        datetime created_at
    }
    OPTIONS {
        int id PK
        int question_id FK
        string option_text
        boolean is_correct
        datetime created_at
    }
    ATTEMPTS {
        int id PK
        int user_id FK
        int quiz_id FK
        float score
        float percentage
        boolean passed
        int time_taken
        string status "started | completed | auto_submitted"
        datetime started_at
        datetime completed_at
    }
    ATTEMPT_ANSWERS {
        int id PK
        int attempt_id FK
        int question_id FK
        int selected_option_id FK
        boolean is_correct
        float points_earned
    }
    CERTIFICATES {
        int id PK
        int attempt_id FK UNIQUE
        string certificate_code UNIQUE
        datetime issued_at
    }

    USERS ||--o{ ATTEMPTS : has
    CATEGORIES ||--o{ QUIZZES : contains
    USERS ||--o{ QUIZZES : creates
    QUIZZES ||--o{ QUESTIONS : has
    QUIZZES ||--o{ ATTEMPTS : receives
    QUESTIONS ||--o{ OPTIONS : has
    QUESTIONS ||--o{ ATTEMPT_ANSWERS : answers
    ATTEMPTS ||--o{ ATTEMPT_ANSWERS : includes
    ATTEMPTS ||--o| CERTIFICATES : generates
```

---

## 🚀 Getting Started & Local Installation

### Prerequisites
- **Python**: version 3.10 or higher
- **Node.js**: version 18.x or higher
- **PostgreSQL**: version 15 or higher (or running Docker)

---

### Step-by-Step PostgreSQL Database Setup

For beginners setting up PostgreSQL locally:

#### 1. Install PostgreSQL
- **Windows**: Download and run the installer from the [PostgreSQL Official Website](https://www.postgresql.org/download/windows/). Keep default options and set a master password (e.g. `postgres`).
- **Mac**: Install via Homebrew: `brew install postgresql@15`.
- **Linux (Ubuntu/Debian)**: `sudo apt update && sudo apt install postgresql postgresql-contrib`.

#### 2. Open pgAdmin or Terminal (psql)
To run database queries:
- **pgAdmin**: Launch pgAdmin, connect to the server using your master password.
- **Terminal (psql)**: Open your command line and enter:
  ```bash
  psql -U postgres
  ```

#### 3. Create Database & User Profile
In psql terminal (or query editor in pgAdmin), execute the following commands line by line:
```sql
-- 1. Create a brand new database
CREATE DATABASE quizforge;

-- 2. Create a secure user profile
CREATE USER postgres WITH PASSWORD 'postgres';

-- 3. Grant full privilege access controls to our user
GRANT ALL PRIVILEGES ON DATABASE quizforge TO postgres;
```

---

### Backend Service Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies list:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure configurations:
   Review `backend/.env` settings. Ensure the database connection URL is set correctly:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/quizforge"
   ```
5. Apply database table schema revisions:
   ```bash
   alembic upgrade head
   ```
6. Populate sample databases using our seeding script:
   ```bash
   python seed.py
   ```
7. Fire up the development uvicorn web server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   *The Swagger API documentation page will be viewable at `http://127.0.0.1:8000/docs`.*

---

### Frontend Client Setup (React/Vite)

1. Open a new terminal instance and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Boot up the Vite local developer server:
   ```bash
   npm run dev
   ```
   *The web client interface is now viewable at `http://localhost:3000`.*

---

## 🐳 Docker Deployment (One-Click Launch)

To run the entire multi-tier system (PostgreSQL Database, API backend, React frontend) without configuring python or Node locally:

1. Ensure Docker Desktop is installed and running on your system.
2. In the project root directory containing `docker-compose.yml`, run:
   ```bash
   docker-compose up --build -d
   ```
3. The containers will boot up automatically in order. Once healthy:
   - **React Web Client**: Viewable at `http://localhost:3000`
   - **FastAPI Documentation**: Viewable at `http://localhost:8000/docs`
   - **PostgreSQL Server**: Running internally on port `5432`

To stop container operations:
```bash
docker-compose down
```

---

## 🧪 Testing Suite (Automated Testing)

QuizForge features unit and integration tests covering JWT tokens, access constraints, and attempt scoring modules.

To execute tests:
1. Navigate to the backend folder and activate your virtual environment:
   ```bash
   cd backend
   venv\Scripts\activate
   ```
2. Run pytest:
   ```bash
   pytest -v
   ```
   *Tests will create a temporary local `test_db.db` SQLite file, running all scenarios in isolation.*

---

## 🔑 Demo Access Credentials

The database seeding scripts create the following profiles for instant logging and testing:

- **Platform Admin Profile**:
  - Email: `admin@quizforge.com`
  - Password: `adminpassword123`
- **Student Profile**:
  - Email: `student@quizforge.com`
  - Password: `studentpassword123`

---

## 💡 Troubleshooting

- **Alembic Connection Error**: Ensure PostgreSQL is running. Double check username/password inside `backend/.env`.
- **CORS block error**: If backend logs show CORS exceptions, verify `BACKEND_CORS_ORIGINS` list matches the frontend host URL (defaults to `http://localhost:3000`).
- **ReportLab PDF generation missing fonts**: Standard Helvetica family fonts are used to prevent system layout errors.
- **CSV upload format errors**: Download the standard template using the "Template.csv" action inside the Admin Questions panel to verify column naming styles.

---

## 📄 License
This project is open-source and licensed under the MIT License.
