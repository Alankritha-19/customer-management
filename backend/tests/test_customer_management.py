import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus, ResponseStatus

# Setup isolated in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="function", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    assert "status" in res.json()

    res_h = client.get("/health")
    assert res_h.status_code == 200
    assert res_h.json()["status"] == "healthy"

def test_owner_and_customer_registration_and_login():
    # 1. Register Business Owner
    owner_payload = {
        "email": "owner@acmecorp.com",
        "password": "password123",
        "name": "Acme Owner",
        "role": "BUSINESS_OWNER",
        "phone": "+1234567890"
    }
    res_owner = client.post("/auth/register", json=owner_payload)
    assert res_owner.status_code == 201
    owner_data = res_owner.json()
    assert owner_data["user"]["role"] == "BUSINESS_OWNER"
    assert "access_token" in owner_data

    # 2. Register Customer
    customer_payload = {
        "email": "customer@client.com",
        "password": "password123",
        "name": "Jane Customer",
        "role": "CUSTOMER",
        "phone": "+1987654321"
    }
    res_cust = client.post("/auth/register", json=customer_payload)
    assert res_cust.status_code == 201
    cust_data = res_cust.json()
    assert cust_data["user"]["role"] == "CUSTOMER"

    # 3. Login Owner
    login_owner = client.post("/auth/login", json={"email": "owner@acmecorp.com", "password": "password123"})
    assert login_owner.status_code == 200
    assert login_owner.json()["user"]["role"] == "BUSINESS_OWNER"

    # 4. Login Customer
    login_cust = client.post("/auth/login", json={"email": "customer@client.com", "password": "password123"})
    assert login_cust.status_code == 200
    assert login_cust.json()["user"]["role"] == "CUSTOMER"

def test_customer_submits_enquiry_and_portal_access():
    # Register Owner
    owner_res = client.post("/auth/register", json={
        "email": "owner2@agency.com", "password": "password123", "name": "Agency Boss", "role": "BUSINESS_OWNER"
    })
    owner_token = owner_res.json()["access_token"]
    owner_id = owner_res.json()["user"]["id"]

    # Register Customer
    cust_res = client.post("/auth/register", json={
        "email": "cust2@client.com", "password": "password123", "name": "Bob Client", "role": "CUSTOMER"
    })
    cust_token = cust_res.json()["access_token"]

    # Customer submits enquiry
    enquiry_res = client.post(
        "/customer/enquiries",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={"message": "We need a complete website redesign and CRM setup urgently.", "owner_id": owner_id}
    )
    assert enquiry_res.status_code == 201
    enquiry_data = enquiry_res.json()
    assert enquiry_data["name"] == "Bob Client"
    assert enquiry_data["status"] == "NEW"
    assert enquiry_data["approved_response"] is None  # Not approved yet
    enquiry_id = enquiry_data["id"]

    # Customer lists their enquiries
    my_enquiries = client.get("/customer/enquiries", headers={"Authorization": f"Bearer {cust_token}"})
    assert my_enquiries.status_code == 200
    assert len(my_enquiries.json()) == 1

    # Customer gets single enquiry
    single = client.get(f"/customer/enquiries/{enquiry_id}", headers={"Authorization": f"Bearer {cust_token}"})
    assert single.status_code == 200
    assert single.json()["id"] == enquiry_id

def test_owner_manages_enquiry_and_approves_response():
    # Setup Owner and Customer
    owner_res = client.post("/auth/register", json={
        "email": "owner3@agency.com", "password": "password123", "name": "Boss 3", "role": "BUSINESS_OWNER"
    })
    owner_token = owner_res.json()["access_token"]
    owner_id = owner_res.json()["user"]["id"]

    cust_res = client.post("/auth/register", json={
        "email": "cust3@client.com", "password": "password123", "name": "Alice Customer", "role": "CUSTOMER"
    })
    cust_token = cust_res.json()["access_token"]

    # Customer submits enquiry
    enq = client.post(
        "/customer/enquiries",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={"message": "Need pricing for 10 hours of consulting.", "owner_id": owner_id}
    ).json()
    enquiry_id = enq["id"]

    # Owner views enquiries list
    owner_list = client.get("/leads", headers={"Authorization": f"Bearer {owner_token}"})
    assert owner_list.status_code == 200
    assert len(owner_list.json()) == 1
    assert owner_list.json()[0]["id"] == enquiry_id

    # Owner runs AI analysis
    analyze_res = client.post(f"/leads/{enquiry_id}/analyze", headers={"Authorization": f"Bearer {owner_token}"})
    assert analyze_res.status_code == 200
    analysis_data = analyze_res.json()
    assert "category" in analysis_data
    assert "ai_summary" in analysis_data

    # Owner generates suggested response
    gen_res = client.post(
        f"/leads/{enquiry_id}/generate-response",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={"tone": "professional", "response_type": "initial"}
    )
    assert gen_res.status_code == 200
    assert "suggested_response" in gen_res.json()

    # Before owner approves, customer sees approved_response as None
    cust_view_before = client.get(f"/customer/enquiries/{enquiry_id}", headers={"Authorization": f"Bearer {cust_token}"}).json()
    assert cust_view_before["approved_response"] is None

    # Owner edits and approves response
    approved_text = "Hi Alice, Thank you for reaching out! Our rate is /hr for consulting."
    update_res = client.put(
        f"/leads/{enquiry_id}",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={"suggested_response": approved_text, "response_status": "APPROVED", "status": "CONTACTED"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["response_status"] == "APPROVED"
    assert update_res.json()["status"] == "CONTACTED"

    # Now Customer sees the approved reply in their portal!
    cust_view_after = client.get(f"/customer/enquiries/{enquiry_id}", headers={"Authorization": f"Bearer {cust_token}"}).json()
    assert cust_view_after["approved_response"] == approved_text
    assert cust_view_after["status"] == "CONTACTED"

def test_access_control_and_role_restrictions():
    # Owner & Customer setup
    owner_res = client.post("/auth/register", json={
        "email": "owner4@biz.com", "password": "password123", "name": "Owner 4", "role": "BUSINESS_OWNER"
    })
    owner_token = owner_res.json()["access_token"]

    cust1_res = client.post("/auth/register", json={
        "email": "cust4a@test.com", "password": "password123", "name": "Cust 4A", "role": "CUSTOMER"
    })
    cust1_token = cust1_res.json()["access_token"]

    cust2_res = client.post("/auth/register", json={
        "email": "cust4b@test.com", "password": "password123", "name": "Cust 4B", "role": "CUSTOMER"
    })
    cust2_token = cust2_res.json()["access_token"]

    # 1. Customer trying to access Owner endpoint /leads -> 403 Forbidden
    cust_leads = client.get("/leads", headers={"Authorization": f"Bearer {cust1_token}"})
    assert cust_leads.status_code == 403

    # 2. Customer trying to access Owner endpoint /analytics -> 403 Forbidden
    cust_analytics = client.get("/analytics", headers={"Authorization": f"Bearer {cust1_token}"})
    assert cust_analytics.status_code == 403

    # 3. Cust 1 submits enquiry
    enquiry = client.post(
        "/customer/enquiries",
        headers={"Authorization": f"Bearer {cust1_token}"},
        json={"message": "Confidential enquiry from customer A"}
    ).json()
    enquiry_id = enquiry["id"]

    # 4. Cust 2 trying to access Cust 1's enquiry -> 404 (Not Found or Access Denied)
    cust2_view = client.get(f"/customer/enquiries/{enquiry_id}", headers={"Authorization": f"Bearer {cust2_token}"})
    assert cust2_view.status_code == 404

    # 5. Owner trying to access customer-only route -> 403 Forbidden
    owner_as_cust = client.get("/customer/enquiries", headers={"Authorization": f"Bearer {owner_token}"})
    assert owner_as_cust.status_code == 403

    # 6. Webhook endpoint should be disabled (403 Forbidden)
    webhook_res = client.post("/webhooks/lead", json={"name": "Test", "email": "test@test.com", "message": "Hi"})
    assert webhook_res.status_code == 403
