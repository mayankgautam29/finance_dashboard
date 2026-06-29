from datetime import datetime, timezone
from typing import Any, Dict, List

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo import ReturnDocument

from config import settings
from database import get_db
from dependencies.auth import get_current_user
from models.budget import BudgetCreate, BudgetUpdate
from utils.serialization import serialize_document

router = APIRouter()


def _role_key(user: Dict[str, Any]) -> str:
    return str(user.get("role", "")).lower()


@router.get("")
async def list_budgets(
    month: str | None = Query(None, pattern=r"^\d{4}-\d{2}$"),
    current: Dict[str, Any] = Depends(get_current_user),
):
    db = get_db()
    coll = db[settings.budgets_collection]
    tx_coll = db[settings.transactions_collection]
    role = _role_key(current)
    q: Dict[str, Any] = {}
    if role == "viewer":
        q["userId"] = ObjectId(current["id"])
    if month:
        q["month"] = month

    budgets_raw = [b async for b in coll.find(q).sort("category", 1)]
    result: List[Dict[str, Any]] = []

    for b in budgets_raw:
        row = serialize_document(b, legacy_id=True)
        if not row:
            continue
        uid = b.get("userId")
        spent = 0.0
        if uid and b.get("category") and b.get("month"):
            y, m = b["month"].split("-")
            start = datetime(int(y), int(m), 1, tzinfo=timezone.utc)
            if int(m) == 12:
                end = datetime(int(y) + 1, 1, 1, tzinfo=timezone.utc)
            else:
                end = datetime(int(y), int(m) + 1, 1, tzinfo=timezone.utc)
            pipeline = [
                {
                    "$match": {
                        "userId": uid,
                        "type": "expense",
                        "category": b["category"],
                        "date": {"$gte": start, "$lt": end},
                    }
                },
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
            ]
            agg = await tx_coll.aggregate(pipeline).to_list(1)
            spent = float(agg[0]["total"]) if agg else 0.0

        limit_amt = float(b.get("limit", 0))
        row["spent"] = spent
        row["remaining"] = max(0.0, limit_amt - spent)
        row["percentUsed"] = round((spent / limit_amt) * 100, 1) if limit_amt else 0
        row["exceeded"] = spent > limit_amt
        result.append(row)

    return {"budgets": result}


@router.post("", status_code=201)
async def create_budget(
    body: BudgetCreate,
    current: Dict[str, Any] = Depends(get_current_user),
):
    db = get_db()
    role = _role_key(current)
    target = body.userId or current["id"]
    if role == "viewer" and target != current["id"]:
        raise HTTPException(status_code=403, detail={"message": "Forbidden"})
    try:
        uid = ObjectId(target)
    except InvalidId:
        raise HTTPException(status_code=400, detail={"message": "Invalid userId"})

    coll = db[settings.budgets_collection]
    existing = await coll.find_one(
        {"userId": uid, "category": body.category, "month": body.month},
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail={"message": "Budget already exists for this category and month"},
        )

    now = datetime.now(timezone.utc)
    doc = {
        "userId": uid,
        "category": body.category.strip(),
        "month": body.month,
        "limit": float(body.limit),
        "createdAt": now,
        "updatedAt": now,
    }
    ins = await coll.insert_one(doc)
    created = await coll.find_one({"_id": ins.inserted_id})
    row = serialize_document(created, legacy_id=True)
    return row


@router.put("/{budget_id}")
async def update_budget(
    budget_id: str,
    body: BudgetUpdate,
    current: Dict[str, Any] = Depends(get_current_user),
):
    try:
        oid = ObjectId(budget_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail={"message": "Not found"})

    db = get_db()
    coll = db[settings.budgets_collection]
    existing = await coll.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status_code=404, detail={"message": "Not found"})

    role = _role_key(current)
    if role == "viewer" and str(existing.get("userId")) != current["id"]:
        raise HTTPException(status_code=403, detail={"message": "Forbidden"})

    updated = await coll.find_one_and_update(
        {"_id": oid},
        {
            "$set": {
                "limit": float(body.limit),
                "updatedAt": datetime.now(timezone.utc),
            },
        },
        return_document=ReturnDocument.AFTER,
    )
    return serialize_document(updated, legacy_id=True)


@router.delete("/{budget_id}")
async def delete_budget(
    budget_id: str,
    current: Dict[str, Any] = Depends(get_current_user),
):
    try:
        oid = ObjectId(budget_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail={"message": "Not found"})

    db = get_db()
    coll = db[settings.budgets_collection]
    existing = await coll.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status_code=404, detail={"message": "Not found"})

    role = _role_key(current)
    if role == "viewer" and str(existing.get("userId")) != current["id"]:
        raise HTTPException(status_code=403, detail={"message": "Forbidden"})

    await coll.delete_one({"_id": oid})
    return {"message": "Budget deleted"}
