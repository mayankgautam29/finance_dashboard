from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from database import close_db, connect_db
from routers import auth, dashboard, legacy, transactions, users


def _error_body(detail):
    if isinstance(detail, dict) and "message" in detail:
        msg = detail["message"]
        return {**detail, "error": msg}
    msg = str(detail) if detail else "Error"
    return {"message": msg, "error": msg}


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(title="Finance Dashboard API", lifespan=lifespan)


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_body(exc.detail),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _request: Request,
    exc: RequestValidationError,
):
    errs = exc.errors()
    msg = (
        errs[0].get("msg", "Invalid input")
        if errs
        else "Invalid input"
    )
    body = {"message": msg, "error": msg}
    return JSONResponse(status_code=400, content=body)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(legacy.router, prefix="/api", tags=["legacy"])
