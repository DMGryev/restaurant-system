from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import qrcode
import qrcode.image.svg
from io import BytesIO
import json

from app.database import get_db
from app.models.user import User, Role
from app.utils.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/qr", tags=["QR Codes"])


@router.get("/my-badge")
async def get_my_qr_badge(
    current_user: User = Depends(get_current_user),
):
    """Получить QR-код для своего бейджика"""
    if not current_user.card_id:
        raise HTTPException(
            status_code=400,
            detail="У вас не назначен идентификатор карты. "
                   "Обратитесь к администратору."
        )
    return _generate_qr_response(current_user.card_id)


@router.get("/user/{user_id}/badge")
async def get_user_qr_badge(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN, Role.MANAGER)),
):
    """Получить QR-код сотрудника (только для админа/менеджера)"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")

    if not user.card_id:
        raise HTTPException(
            status_code=400,
            detail=f"У сотрудника {user.full_name} не назначен card_id"
        )

    return _generate_qr_response(user.card_id)


@router.post("/assign-card/{user_id}")
async def assign_card_id(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN)),
):
    """
    Автоматически сгенерировать и назначить card_id сотруднику.
    Используется если у сотрудника ещё нет карты.
    """
    import uuid

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")

    # Генерируем уникальный card_id
    new_card_id = f"QR-{user.username.upper()}-{str(uuid.uuid4())[:8].upper()}"
    user.card_id = new_card_id
    await db.flush()
    await db.refresh(user)

    return {
        "user_id": user.id,
        "full_name": user.full_name,
        "card_id": new_card_id,
        "message": "card_id назначен. Теперь можно скачать QR-бейджик."
    }


def _generate_qr_response(card_id: str) -> StreamingResponse:
    """Генерирует PNG изображение QR-кода"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(card_id)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="image/png",
        headers={
            "Content-Disposition": f'attachment; filename="badge-{card_id}.png"'
        }
    )