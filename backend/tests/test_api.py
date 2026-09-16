"""
Integration tests for DSS Ask Policy backend API.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["release"] == "v1.0.0"


@pytest.mark.asyncio
async def test_ask_happy_path(client: AsyncClient):
    headers = {
        "x-clerk-user-id": "user_arjun_test",
        "x-clerk-permissions": "org:audience:all-employees,org:audience:india-employees",
    }
    payload = {"message": "What is the remote-work equipment allowance?"}
    response = await client.post("/ask", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["outcome"] in ("answered", "redirected")
    assert "25,000" in data["answer"] or len(data["citations"]) > 0
    assert data["conversation_id"] is not None


@pytest.mark.asyncio
async def test_ask_permission_boundary_refusal(client: AsyncClient):
    headers = {
        "x-clerk-user-id": "user_arjun_test",
        "x-clerk-permissions": "org:audience:all-employees,org:audience:india-employees",
    }
    payload = {"message": "What are the progressive steps in the internal disciplinary procedure POL-HR-010?"}
    response = await client.post("/ask", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["outcome"] == "declined"
    assert "Access Restricted" in data["answer"]


@pytest.mark.asyncio
async def test_ask_exact_entitlement_redirect(client: AsyncClient):
    headers = {
        "x-clerk-user-id": "user_arjun_test",
        "x-clerk-permissions": "org:audience:all-employees,org:audience:india-employees",
    }
    payload = {"message": "How many leave days do I have left?"}
    response = await client.post("/ask", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["outcome"] == "redirected"
    assert "Workday" in data["answer"] or "portal" in data["answer"]


@pytest.mark.asyncio
async def test_ask_must_escalate(client: AsyncClient):
    headers = {
        "x-clerk-user-id": "user_arjun_test",
        "x-clerk-permissions": "org:audience:all-employees,org:audience:india-employees",
    }
    payload = {"message": "Should I accept this severance package HR offered me?"}
    response = await client.post("/ask", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["outcome"] == "escalated"
    assert data["escalation_token"] is not None

    # Test confirming the escalation
    confirm_payload = {"confirmation_token": data["escalation_token"], "employee_notes": "Urgent review"}
    confirm_resp = await client.post("/escalate/confirm", json=confirm_payload, headers=headers)
    assert confirm_resp.status_code == 200
    confirm_data = confirm_resp.json()
    assert confirm_data["status"] == "confirmed"
    assert confirm_data["jira_issue_key"] is not None


@pytest.mark.asyncio
async def test_ops_console_endpoints(client: AsyncClient):
    ops_headers = {
        "x-clerk-user-id": "user_rahul_ops",
        "x-clerk-permissions": "org:audience:all-employees,org:audience:india-employees,org:audience:hr-managers,org:role:hr-ops",
    }

    # Test overview
    overview_resp = await client.get("/ops/overview", headers=ops_headers)
    assert overview_resp.status_code == 200
    overview = overview_resp.json()
    assert "total_conversations" in overview

    # Test library
    lib_resp = await client.get("/ops/library", headers=ops_headers)
    assert lib_resp.status_code == 200
    library = lib_resp.json()
    assert len(library) >= 10
    doc_ids = [item["doc_id"] for item in library]
    assert "POL-HR-001" in doc_ids
    assert "POL-HR-002" in doc_ids

    # Test quality
    qual_resp = await client.get("/ops/quality", headers=ops_headers)
    assert qual_resp.status_code == 200
    qual = qual_resp.json()
    assert qual["total_gold_cases"] == 36


@pytest.mark.asyncio
async def test_ops_console_forbidden_without_role(client: AsyncClient):
    non_ops_headers = {
        "x-clerk-user-id": "user_arjun_regular",
        "x-clerk-permissions": "org:audience:all-employees,org:audience:india-employees",
    }
    resp = await client.get("/ops/overview", headers=non_ops_headers)
    assert resp.status_code == 403
    problem = resp.json()
    assert problem["title"] == "Access denied"
