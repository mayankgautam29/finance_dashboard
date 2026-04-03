from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List

from bson import ObjectId
from fastapi import APIRouter, Depends

from config import settings
from database import get_db
from dependencies.roles import require_roles
from utils.serialization import serialize_document

router = APIRouter()


def _match_for_role(user: Dict[str, Any]) -> Dict[str, Any]:
    role = str(user.get("role", "")).lower()
    if role == "viewer":
        return {"userId": ObjectId(user["id"])}
    return {}


def _shift_months_back(year: int, month: int, delta: int) -> tuple[int, int]:
    m = month - delta
    y = year
    while m < 1:
        m += 12
        y -= 1
    return y, m


@router.get("/summary")
async def dashboard_summary(
    current: Dict[str, Any] = Depends(
        require_roles("viewer", "analyst", "admin"),
    ),
):
    db = get_db()
    coll = db[settings.transactions_collection]
    match = _match_for_role(current)

    pipeline_income = [
        {"$match": {**match, "type": "income"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]
    pipeline_expense = [
        {"$match": {**match, "type": "expense"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]
    inc = await coll.aggregate(pipeline_income).to_list(1)
    exp = await coll.aggregate(pipeline_expense).to_list(1)
    total_income = float(inc[0]["total"]) if inc else 0.0
    total_expenses = float(exp[0]["total"]) if exp else 0.0
    net_balance = total_income - total_expenses

    now = datetime.now(timezone.utc)
    monthly: Dict[str, Dict[str, float]] = {}
    for i in range(12):
        yi, mi = _shift_months_back(now.year, now.month, 11 - i)
        key = f"{yi:04d}-{mi:02d}"
        monthly[key] = {"income": 0.0, "expenses": 0.0}

    cursor = coll.find(match)
    async for doc in cursor:
        dt = doc.get("date") or doc.get("createdAt")
        if not isinstance(dt, datetime):
            continue
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        key = f"{dt.year:04d}-{dt.month:02d}"
        if key not in monthly:
            continue
        amt = float(doc.get("amount", 0))
        if doc.get("type") == "income":
            monthly[key]["income"] += amt
        else:
            monthly[key]["expenses"] += amt

    monthly_breakdown: List[Dict[str, Any]] = [
        {"month": k, "income": v["income"], "expenses": v["expenses"]}
        for k, v in sorted(monthly.items())
    ]

    cat_map: Dict[tuple, float] = defaultdict(float)
    async for doc in coll.find({**match}):
        cat = doc.get("category", "")
        t = doc.get("type", "")
        cat_map[(cat, t)] += float(doc.get("amount", 0))
    category_breakdown = [
        {"category": c, "amount": amt, "type": t}
        for (c, t), amt in sorted(cat_map.items(), key=lambda x: -x[1])
    ]

    recent_cursor = coll.find(match).sort("date", -1).limit(5)
    recent_raw = [d async for d in recent_cursor]
    recent_transactions: List[Dict[str, Any]] = []
    users_coll = db[settings.users_collection]
    for d in recent_raw:
        row = serialize_document(d, legacy_id=True)
        if not row:
            continue
        if "description" not in row:
            row["description"] = row.get("note", "")
        uid = d.get("userId")
        if uid:
            u = await users_coll.find_one({"_id": uid})
            if u:
                nm = u.get("name") or u.get("username") or ""
                row["username"] = nm
        recent_transactions.append(row)

    return {
        "totalIncome": total_income,
        "totalExpenses": total_expenses,
        "netBalance": net_balance,
        "monthlyBreakdown": monthly_breakdown,
        "categoryBreakdown": category_breakdown,
        "recentTransactions": recent_transactions,
    }
