from datetime import datetime

from pydantic import EmailStr, Field

from app.schemas.common import ORMModel


class UserCreate(ORMModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)


class UserRead(ORMModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime


class LoginRequest(ORMModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(ORMModel):
    access_token: str
    token_type: str = "bearer"
