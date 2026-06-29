import csv
import io
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse

from config import settings
from database import get_db
from dependencies.auth import get_current_user
from dependencies.roles import require_roles
from routers.legacy import find_user_by_username

router = APIRouter()

CSV_HEADERS = ["username", "amount", "type", "category", "date", "note"]


def _match_for_user(current: Dict[str, Any]) -> Dict[str, Any]:
    role = str(current.get("role", "")).lower()
    if role == "viewer":
        return {"userId": ObjectId(current["id"])}
    return {}


@router.get("/transactions")
async def export_transactions_csv(
    startDate: Optional[datetime] = Query(None),
    endDate: Optional[datetime] = Query(None),
    current: Dict[str, Any] = Depends(get_current_user),
):
    db = get_db()
    coll = db[settings.transactions_collection]
    users_coll = db[settings.users_collection]
    match = _match_for_user(current)
    if startDate or endDate:
        dr: Dict[str, Any] = {}
        if startDate:
            dr["$gte"] = startDate
        if endDate:
            dr["$lte"] = endDate
        match["date"] = dr

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(CSV_HEADERS)

    async for doc in coll.find(match).sort("date", -1):
        uid = doc.get("userId")
        username = ""
        if uid:
            u = await users_coll.find_one({"_id": uid})
            if u:
                username = u.get("username") or u.get("name") or ""
        dt = doc.get("date") or doc.get("createdAt")
        date_str = dt.isoformat() if isinstance(dt, datetime) else ""
        writer.writerow(
            [
                username,
                doc.get("amount", 0),
                doc.get("type", ""),
                doc.get("category", ""),
                date_str,
                doc.get("note", ""),
            ],
        )

    output.seek(0)
    filename = f"transactions_{datetime.now(timezone.utc).strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/transactions/import")
async def import_transactions_csv(
    file: UploadFile = File(...),
    current: Dict[str, Any] = Depends(require_roles("admin")),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail={"message": "CSV file required"})

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail={"message": "Invalid file encoding"})

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail={"message": "Empty CSV"})

    db = get_db()
    coll = db[settings.transactions_collection]
    now = datetime.now(timezone.utc)
    imported = 0
    errors: List[str] = []

    for i, row in enumerate(reader, start=2):
        try:
            username = (row.get("username") or "").strip()
            if not username:
                errors.append(f"Row {i}: missing username")
                continue
            owner = await find_user_by_username(db, username)
            if not owner:
                errors.append(f"Row {i}: user '{username}' not found")
                continue
            amount = float(row.get("amount") or 0)
            tx_type = (row.get("type") or "").strip().lower()
            if tx_type not in ("income", "expense"):
                errors.append(f"Row {i}: type must be income or expense")
                continue
            category = (row.get("category") or "").strip()
            if not category:
                errors.append(f"Row {i}: missing category")
                continue
            date_raw = (row.get("date") or "").strip()
            if date_raw:
                dt = datetime.fromisoformat(date_raw.replace("Z", "+00:00"))
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
            else:
                dt = now
            doc = {
                "userId": owner["_id"],
                "amount": amount,
                "type": tx_type,
                "category": category,
                "note": (row.get("note") or "").strip(),
                "date": dt,
                "createdAt": now,
                "updatedAt": now,
            }
            await coll.insert_one(doc)
            imported += 1
        except (ValueError, TypeError) as e:
            errors.append(f"Row {i}: {e}")

    return {
        "imported": imported,
        "errors": errors[:20],
        "message": f"Imported {imported} transaction(s)",
    }
