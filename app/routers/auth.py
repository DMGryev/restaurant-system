from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.schemas.user import UserLogin, UserCreate, Token, UserResponse, CardLogin
from app.services.auth_service import (
    authenticate_user, authenticate_by_card,
    register_user, create_user_token
)
from app.utils.dependencies import get_current_user, require_roles
from app.models.user import User, Role

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, data.username, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )
    token = create_user_token(user)
    return Token(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login/card", response_model=Token)
async def login_by_card(data: CardLogin, db: AsyncSession = Depends(get_db)):
    """Авторизация по магнитной карте"""
    user = await authenticate_by_card(db, data.card_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Card not recognized",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )
    token = create_user_token(user)
    return Token(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login/qr", response_model=Token)
async def login_by_qr(
    qr_token: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db),
):
    """
    Авторизация по QR-коду.
    QR-код содержит ID сотрудника или специальный токен.
    """
    # Пробуем интерпретировать QR-токен как ID пользователя
    try:
        user_id = int(qr_token)
        result = await db.execute(
            select(User).where(
                User.id == user_id, 
                User.is_active == True
            )
        )
        user = result.scalar_one_or_none()
    except ValueError:
        # Если не число — ищем по card_id (для магнитных карт)
        result = await db.execute(
            select(User).where(
                User.card_id == qr_token,
                User.is_active == True
            )
        )
        user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недействительный QR-код"
        )
    
    token = create_user_token(user)
    return Token(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/register", response_model=UserResponse)
async def register(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN)),
):
    """Регистрация нового сотрудника (только админ)"""
    try:
        user = await register_user(db, data)
        return UserResponse.model_validate(user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/register/initial", response_model=UserResponse)
async def register_initial(data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Первоначальная регистрация админа (работает только если нет пользователей)"""
    from sqlalchemy import select, func
    result = await db.execute(select(func.count(User.id)))
    count = result.scalar()
    if count > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Initial registration is no longer available. Use admin account.",
        )
    data.role = Role.ADMIN
    user = await register_user(db, data)
    return UserResponse.model_validate(user)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)