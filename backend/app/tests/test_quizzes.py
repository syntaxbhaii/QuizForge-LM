from fastapi.testclient import TestClient


def get_auth_headers(client: TestClient, email: str, password: str):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_admin_create_quiz(client: TestClient):
    admin_headers = get_auth_headers(client, "test_admin@quizforge.com", "testadmin123")
    
    # 1. First create a Category
    cat_resp = client.post(
        "/api/v1/categories/",
        json={"name": "History", "description": "World History facts"},
        headers=admin_headers
    )
    assert cat_resp.status_code == 201
    cat_id = cat_resp.json()["id"]
    
    # 2. Create Quiz
    quiz_resp = client.post(
        "/api/v1/quizzes/",
        json={
            "title": "WW2 Trivia",
            "description": "Important questions about World War II",
            "category_id": cat_id,
            "time_limit": 20,
            "max_attempts": 2,
            "pass_percentage": 70.0,
            "negative_marking": 0.25,
            "is_published": False
        },
        headers=admin_headers
    )
    assert quiz_resp.status_code == 201
    assert quiz_resp.json()["title"] == "WW2 Trivia"
    assert quiz_resp.json()["is_published"] is False


def test_student_cannot_create_quiz(client: TestClient):
    student_headers = get_auth_headers(client, "test_student@quizforge.com", "teststudent123")
    response = client.post(
        "/api/v1/quizzes/",
        json={
            "title": "Student Hack Quiz",
            "category_id": 1,
            "time_limit": 10
        },
        headers=student_headers
    )
    assert response.status_code == 403
    assert "privileges" in response.json()["detail"]


def test_draft_quiz_isolation(client: TestClient):
    admin_headers = get_auth_headers(client, "test_admin@quizforge.com", "testadmin123")
    student_headers = get_auth_headers(client, "test_student@quizforge.com", "teststudent123")
    
    # Create category and draft quiz
    cat = client.post("/api/v1/categories/", json={"name": "Science Draft"}, headers=admin_headers).json()
    quiz = client.post(
        "/api/v1/quizzes/",
        json={
            "title": "Quantum Mechanics",
            "category_id": cat["id"],
            "time_limit": 30,
            "is_published": False
        },
        headers=admin_headers
    ).json()
    
    # Student reads quizzes list (should not contain draft)
    list_resp = client.get("/api/v1/quizzes/", headers=student_headers)
    assert list_resp.status_code == 200
    quizzes = list_resp.json()
    assert not any(q["id"] == quiz["id"] for q in quizzes)
    
    # Student directly fetches details (should be denied 403)
    detail_resp = client.get(f"/api/v1/quizzes/{quiz['id']}", headers=student_headers)
    assert detail_resp.status_code == 403
    
    # Admin reads quizzes list (should contain draft)
    admin_list = client.get("/api/v1/quizzes/", headers=admin_headers).json()
    assert any(q["id"] == quiz["id"] for q in admin_list)
