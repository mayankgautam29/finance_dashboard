import calendar
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, Query

from config import settings
from database import get_db
from dependencies.auth import get_current_user
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


def _display_role(role: str) -> str:
    m = {"viewer": "Viewer", "analyst": "Analyst", "admin": "Admin"}
    return m.get(str(role).lower(), role or "Viewer")


@router.get("/summary")
async def dashboard_summary(
    startDate: Optional[datetime] = Query(None),
    endDate: Optional[datetime] = Query(None),
    current: Dict[str, Any] = Depends(get_current_user),
):
    db = get_db()
    coll = db[settings.transactions_collection]
    role_key = str(current.get("role", "")).lower()
    match = _match_for_role(current)

    if startDate or endDate:
        dr: Dict[str, Any] = {}
        if startDate:
            dr["$gte"] = startDate
        if endDate:
            dr["$lte"] = endDate
        match["date"] = dr

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

    trend_match = {k: v for k, v in match.items() if k != "date"}
    cursor = coll.find(trend_match)
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
        {
            "month": k,
            "income": v["income"],
            "expenses": v["expenses"],
            "label": f"{calendar.month_abbr[int(k.split('-')[1])]} {k.split('-')[0]}",
        }
        for k, v in sorted(monthly.items())
    ]

    cat_map: Dict[tuple, float] = defaultdict(float)
    async for doc in coll.find({**match, "type": "expense"}):
        cat = doc.get("category", "Other")
        cat_map[cat] += float(doc.get("amount", 0))
    category_breakdown = [
        {"category": c, "amount": amt}
        for c, amt in sorted(cat_map.items(), key=lambda x: -x[1])
    ]

    recent_cursor = coll.find(match).sort("date", -1).limit(8)
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
                row["username"] = u.get("name") or u.get("username") or ""
        recent_transactions.append(row)

    budget_alerts: List[Dict[str, Any]] = []
    current_month = f"{now.year:04d}-{now.month:02d}"
    budget_q: Dict[str, Any] = {"month": current_month}
    if role_key == "viewer":
        budget_q["userId"] = ObjectId(current["id"])
    budgets_coll = db[settings.budgets_collection]
    async for b in budgets_coll.find(budget_q):
        uid = b.get("userId")
        cat = b.get("category", "")
        limit_amt = float(b.get("limit", 0))
        y, m = current_month.split("-")
        start = datetime(int(y), int(m), 1, tzinfo=timezone.utc)
        if int(m) == 12:
            end = datetime(int(y) + 1, 1, 1, tzinfo=timezone.utc)
        else:
            end = datetime(int(y), int(m) + 1, 1, tzinfo=timezone.utc)
        spent_pipeline = [
            {
                "$match": {
                    "userId": uid,
                    "type": "expense",
                    "category": cat,
                    "date": {"$gte": start, "$lt": end},
                }
            },
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ]
        agg = await coll.aggregate(spent_pipeline).to_list(1)
        spent = float(agg[0]["total"]) if agg else 0.0
        pct = round((spent / limit_amt) * 100, 1) if limit_amt else 0
        if pct >= 80:
            budget_alerts.append(
                {
                    "category": cat,
                    "month": current_month,
                    "limit": limit_amt,
                    "spent": spent,
                    "percentUsed": pct,
                    "exceeded": spent > limit_amt,
                },
            )

    users_overview: List[Dict[str, Any]] | None = None
    if role_key == "admin":
        users_overview = await coll.aggregate(
            [
                {
                    "$lookup": {
                        "from": settings.users_collection,
                        "localField": "userId",
                        "foreignField": "_id",
                        "as": "user",
                    }
                },
                {"$unwind": "$user"},
                {
                    "$group": {
                        "_id": {"$ifNull": ["$user.username", "$user.name"]},
                        "totalIncome": {
                            "$sum": {
                                "$cond": [
                                    {"$eq": ["$type", "income"]},
                                    "$amount",
                                    0,
                                ],
                            },
                        },
                        "totalExpense": {
                            "$sum": {
                                "$cond": [
                                    {"$eq": ["$type", "expense"]},
                                    "$amount",
                                    0,
                                ],
                            },
                        },
                    }
                },
            ],
        ).to_list(500)

    return {
        "role": _display_role(current["doc"].get("role", current["role"])),
        "totalIncome": total_income,
        "totalExpenses": total_expenses,
        "netBalance": net_balance,
        "monthlyBreakdown": monthly_breakdown,
        "categoryBreakdown": category_breakdown,
        "recentTransactions": recent_transactions,
        "budgetAlerts": budget_alerts,
        "usersOverview": users_overview,
    }
