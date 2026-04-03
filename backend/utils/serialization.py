from datetime import datetime
from typing import Any, Dict, Mapping, Optional

from bson import ObjectId


def _convert_value(val: Any) -> Any:
    if isinstance(val, ObjectId):
        return str(val)
    if isinstance(val, datetime):
        return val.isoformat()
    return val


def serialize_document(
    doc: Optional[Mapping[str, Any]],
    *,
    legacy_id: bool = True,
) -> Optional[Dict[str, Any]]:
    if doc is None:
        return None
    out: Dict[str, Any] = {}
    for k, v in dict(doc).items():
        if k == "_id":
            oid = str(v)
            out["id"] = oid
            if legacy_id:
                out["_id"] = oid
            continue
        if k == "userId" and isinstance(v, ObjectId):
            out[k] = str(v)
            continue
        if isinstance(v, ObjectId):
            out[k] = str(v)
        elif isinstance(v, datetime):
            out[k] = v.isoformat()
        elif isinstance(v, dict):
            out[k] = {ik: _convert_value(iv) for ik, iv in v.items()}
        elif isinstance(v, list):
            out[k] = [
                serialize_document(i, legacy_id=legacy_id)
                if isinstance(i, dict)
                else _convert_value(i)
                for i in v
            ]
        else:
            out[k] = v
    return out


def serialize_user(doc: Mapping[str, Any]) -> Dict[str, Any]:
    s = serialize_document(doc, legacy_id=True)
    if s is None:
        return {}
    s.pop("password", None)
    name = s.get("name") or s.get("username")
    if name is not None:
        s["name"] = name
        s["username"] = name
    if "isActive" not in s and "is_active" in s:
        s["isActive"] = s["is_active"]
    r = s.get("role")
    if r:
        rm = {"viewer": "Viewer", "analyst": "Analyst", "admin": "Admin"}
        s["role"] = rm.get(str(r).lower(), r)
    return s
