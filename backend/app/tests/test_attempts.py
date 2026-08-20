from fastapi.testclient import TestClient


def get_auth_headers(client: TestClient, email: str, password: str):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_quiz_attempt_scoring_flow(client: TestClient):
    admin_headers = get_auth_headers(client, "test_admin@quizforge.com", "testadmin123")
    student_headers = get_auth_headers(client, "test_student@quizforge.com", "teststudent123")
    
    # 1. Setup Quiz & Questions (Admin)
    cat = client.post("/api/v1/categories/", json={"name": "Maths"}, headers=admin_headers).json()
    quiz = client.post(
        "/api/v1/quizzes/",
        json={
            "title": "Algebra Quiz",
            "category_id": cat["id"],
            "time_limit": 5,
            "max_attempts": 3,
            "pass_percentage": 50.0,
            "negative_marking": 0.5,
            "is_published": True
        },
        headers=admin_headers
    ).json()
    
    # Add question 1: Single choice MCQ (points: 2)
    q1 = client.post(
        f"/api/v1/quizzes/{quiz['id']}/questions",
        json={
            "question_text": "Solve 2x = 10",
            "question_type": "single",
            "points": 2.0,
            "explanation": "x = 10 / 2 = 5",
            "options": [
                {"option_text": "x=3", "is_correct": False},
                {"option_text": "x=5", "is_correct": True},
                {"option_text": "x=10", "is_correct": False}
            ]
        },
        headers=admin_headers
    ).json()
    opt5_id = [opt["id"] for opt in q1["options"] if opt["option_text"] == "x=5"][0]
    opt3_id = [opt["id"] for opt in q1["options"] if opt["option_text"] == "x=3"][0]
    
    # Add question 2: Multiple choice MRQ (points: 3)
    q2 = client.post(
        f"/api/v1/quizzes/{quiz['id']}/questions",
        json={
            "question_text": "Select even numbers.",
            "question_type": "multiple",
            "points": 3.0,
            "explanation": "2 and 4 are even.",
            "options": [
                {"option_text": "2", "is_correct": True},
                {"option_text": "3", "is_correct": False},
                {"option_text": "4", "is_correct": True}
            ]
        },
        headers=admin_headers
    ).json()
    opt2_id = [opt["id"] for opt in q2["options"] if opt["option_text"] == "2"][0]
    opt4_id = [opt["id"] for opt in q2["options"] if opt["option_text"] == "4"][0]
    
    # 2. Student starts attempt
    attempt = client.post(
        f"/api/v1/quizzes/{quiz['id']}/attempts",
        headers=student_headers
    ).json()
    assert attempt["status"] == "started"
    
    # 3. Student submits correct answers (q1 correct: opt5, q2 correct: opt2 and opt4)
    submit_resp = client.post(
        f"/api/v1/attempts/{attempt['id']}/submit",
        json={
            "answers": [
                {"question_id": q1["id"], "selected_option_ids": [opt5_id]},
                {"question_id": q2["id"], "selected_option_ids": [opt2_id, opt4_id]}
            ]
        },
        headers=student_headers
    )
    assert submit_resp.status_code == 200
    sub_data = submit_resp.json()
    assert sub_data["score"] == 5.0  # 2 + 3
    assert sub_data["percentage"] == 100.0
    assert sub_data["passed"] is True
    
    # 4. Check certificate issue
    review_resp = client.get(f"/api/v1/attempts/{attempt['id']}/review", headers=student_headers).json()
    assert review_resp["certificate_code"] is not None
    assert review_resp["certificate_code"].startswith("QF-")
    
    # 5. Take another attempt (Submit Incorrect for testing negative marking)
    attempt2 = client.post(
        f"/api/v1/quizzes/{quiz['id']}/attempts",
        headers=student_headers
    ).json()
    
    submit_resp2 = client.post(
        f"/api/v1/attempts/{attempt2['id']}/submit",
        json={
            "answers": [
                {"question_id": q1["id"], "selected_option_ids": [opt3_id]}, # incorrect (deducts 0.5)
                {"question_id": q2["id"], "selected_option_ids": [opt2_id]}   # partial incorrect/missing (deducts 0.5)
            ]
        },
        headers=student_headers
    ).json()
    
    # Total score = max(0.0, -0.5 + -0.5) = 0.0
    assert submit_resp2["score"] == 0.0
    assert submit_resp2["passed"] is False
    
    # Review second attempt
    review_resp2 = client.get(f"/api/v1/attempts/{attempt2['id']}/review", headers=student_headers).json()
    assert review_resp2["certificate_code"] is None
