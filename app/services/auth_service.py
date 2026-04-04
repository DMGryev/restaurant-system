from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.utils.security import hash_password, verify_password, create_access_token
from app.schemas.user import UserCreate


async def authenticate_user(db: AsyncSession, username: str, password: str) -> User | None:
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if user is None:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def authenticate_by_card(db: AsyncSession, card_id: str) -> User | None:
    result = await db.execute(select(User).where(User.card_id == card_id))
    user = result.scalar_one_or_none()
    return user


async def register_user(db: AsyncSession, user_data: UserCreate) -> User:
    user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hash_password(user_data.password),
        role=user_data.role,
        phone=user_data.phone,
        card_id=user_data.card_id,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


def create_user_token(user: User) -> str:
    return create_access_token(
        data={"sub": str(user.id), "role": user.role.value, "username": user.username}
    )