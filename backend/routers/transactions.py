from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo import ReturnDocument

from config import settings
from database import get_db
from dependencies.roles import require_roles
from models.transaction import TransactionCreate, TransactionUpdate
from utils.serialization import serialize_document

router = APIRouter()


@router.get("")
async def list_transactions(
    type: Optional[str] = Query(None),  # noqa: A002
    category: Optional[str] = Query(None),
    startDate: Optional[datetime] = Query(None),
    endDate: Optional[datetime] = Query(None),
    userId: Optional[str] = Query(None),
    current: Dict[str, Any] = Depends(require_roles("analyst", "admin")),
):
    db = get_db()
    coll = db[settings.transactions_collection]
    q: Dict[str, Any] = {}
    if type in ("income", "expense"):
        q["type"] = type
    if category:
        q["category"] = category
    if userId:
        try:
            q["userId"] = ObjectId(userId)
        except InvalidId:
            raise HTTPException(
                status_code=400,
                detail={"message": "Invalid userId"},
            )
    if startDate or endDate:
        dr: Dict[str, Any] = {}
        if startDate:
            dr["$gte"] = startDate
        if endDate:
            dr["$lte"] = endDate
        q["date"] = dr

    cursor = coll.find(q).sort("date", -1)
    items: List[Dict[str, Any]] = []
    async for doc in cursor:
        row = serialize_document(doc, legacy_id=True)
        if row:
            if "description" not in row:
                row["description"] = row.get("note", "")
            items.append(row)
    return items


@router.get("/{tx_id}")
async def get_transaction(
    tx_id: str,
    current: Dict[str, Any] = Depends(require_roles("analyst", "admin")),
):
    try:
        oid = ObjectId(tx_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail={"message": "Not found"})
    db = get_db()
    doc = await db[settings.transactions_collection].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail={"message": "Not found"})
    row = serialize_document(doc, legacy_id=True)
    if row and "description" not in row:
        row["description"] = row.get("note", "")
    return row


@router.post("", status_code=201)
async def create_transaction(
    body: TransactionCreate,
    current: Dict[str, Any] = Depends(require_roles("admin")),
):
    target_user = body.userId or current["id"]
    try:
        uid = ObjectId(target_user)
    except InvalidId:
        raise HTTPException(
            status_code=400,
            detail={"message": "Invalid userId"},
        )

    db = get_db()
    now = datetime.now(timezone.utc)
    dt = body.date or now
    doc = {
        "userId": uid,
        "amount": float(body.amount),
        "type": body.type,
        "category": body.category,
        "note": body.description or "",
        "date": dt,
        "createdAt": now,
        "updatedAt": now,
    }
    ins = await db[settings.transactions_collection].insert_one(doc)
    created = await db[settings.transactions_collection].find_one(
        {"_id": ins.inserted_id},
    )
    row = serialize_document(created, legacy_id=True)
    if row:
        row["description"] = row.get("note", "")
    return row


@router.put("/{tx_id}")
async def update_transaction(
    tx_id: str,
    body: TransactionUpdate,
    current: Dict[str, Any] = Depends(require_roles("admin")),
):
    try:
        oid = ObjectId(tx_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail={"message": "Not found"})

    patch: Dict[str, Any] = {"updatedAt": datetime.now(timezone.utc)}
    if body.amount is not None:
        patch["amount"] = float(body.amount)
    if body.type is not None:
        patch["type"] = body.type
    if body.category is not None:
        patch["category"] = body.category
    if body.description is not None:
        patch["note"] = body.description
    if body.date is not None:
        patch["date"] = body.date

    db = get_db()
    res = await db[settings.transactions_collection].find_one_and_update(
        {"_id": oid},
        {"$set": patch},
        return_document=ReturnDocument.AFTER,
    )
    if not res:
        raise HTTPException(status_code=404, detail={"message": "Not found"})
    row = serialize_document(res, legacy_id=True)
    if row:
        row["description"] = row.get("note", "")
    return row


@router.delete("/{tx_id}")
async def delete_transaction(
    tx_id: str,
    current: Dict[str, Any] = Depends(require_roles("admin")),
):
    try:
        oid = ObjectId(tx_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail={"message": "Not found"})
    db = get_db()
    res = await db[settings.transactions_collection].delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail={"message": "Not found"})
    return {"message": "Transaction deleted successfully"}
