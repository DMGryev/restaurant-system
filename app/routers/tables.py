from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.models.order import Table
from app.models.user import User, Role
from app.schemas.order import TableCreate, TableUpdate, TableResponse
from app.utils.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/tables", tags=["Tables"])


@router.get("/", response_model=List[TableResponse])
async def list_tables(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Table).order_by(Table.number))
    return [TableResponse.model_validate(t) for t in result.scalars().all()]


@router.post("/", response_model=TableResponse)
async def create_table(
    data: TableCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN, Role.MANAGER)),
):
    table = Table(**data.model_dump())
    db.add(table)
    await db.flush()
    await db.refresh(table)
    return TableResponse.model_validate(table)


@router.patch("/{table_id}", response_model=TableResponse)
async def update_table(
    table_id: int,
    data: TableUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Table).where(Table.id == table_id))
    table = result.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(table, key, value)

    await db.flush()
    await db.refresh(table)
    return TableResponse.model_validate(table)