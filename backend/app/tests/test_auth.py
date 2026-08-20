from fastapi.testclient import TestClient


def test_register_student(client: TestClient):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "new_student@quizforge.com",
            "password": "securepassword123",
            "full_name": "New Student"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "new_student@quizforge.com"
    assert data["role"] == "student"
    assert "id" in data


def test_register_existing_email(client: TestClient):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test_student@quizforge.com",
            "password": "securepassword123",
            "full_name": "Duplicate Student"
        }
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_login_success(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test_student@quizforge.com",
            "password": "teststudent123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user_role"] == "student"
    assert data["user_name"] == "Test Student"


def test_login_invalid_credentials(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test_student@quizforge.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 400
    assert "Incorrect email" in response.json()["detail"]


def test_oauth2_login(client: TestClient):
    response = client.post(
        "/api/v1/auth/login-oauth2",
        data={
            "username": "test_admin@quizforge.com",
            "password": "testadmin123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user_role"] == "admin"


def test_forgot_reset_password_workflow(client: TestClient):
    # Trigger forgot password
    forgot_resp = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "test_student@quizforge.com"}
    )
    assert forgot_resp.status_code == 200
    
    # We retrieve the simulated token printed in terminal or just generate one for testing reset.
    # To test reset password endpoint directly, we create a reset token:
    from app.core.security import create_access_token
    from datetime import timedelta
    token = create_access_token(subject="reset:test_student@quizforge.com", expires_delta=timedelta(minutes=5))
    
    reset_resp = client.post(
        "/api/v1/auth/reset-password",
        json={
            "token": token,
            "new_password": "newpassword123"
        }
    )
    assert reset_resp.status_code == 200
    
    # Verify new login credentials work
    login_resp = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test_student@quizforge.com",
            "password": "newpassword123"
        }
    )
    assert login_resp.status_code == 200
