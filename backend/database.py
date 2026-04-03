from urllib.parse import unquote, urlparse

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConfigurationError

from config import settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongodb_uri)
    return _client


def _database_name_from_uri(uri: str) -> str | None:
    for prefix in ("mongodb://", "mongodb+srv://"):
        if uri.startswith(prefix):
            rest = uri[len(prefix) :]
            break
    else:
        rest = uri
    if "/" not in rest:
        return None
    path_part = rest.split("/", 1)[1]
    path_part = path_part.split("?")[0]
    name = path_part.strip("/").split("/")[0]
    return unquote(name) if name else None


def get_db() -> AsyncIOMotorDatabase:
    client = get_client()
    try:
        return client.get_default_database()
    except ConfigurationError:
        name = _database_name_from_uri(settings.mongodb_uri)
        return client[name or settings.mongodb_db_name]


async def connect_db() -> None:
    client = get_client()
    await client.admin.command("ping")
    db = get_db()
    await db[settings.users_collection].create_index("email", unique=True)
    await db[settings.transactions_collection].create_index("userId")
    await db[settings.transactions_collection].create_index([("date", -1)])


async def close_db() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
