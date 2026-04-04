from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.database import get_db
from app.models.crm import Customer, CustomerVisit
from app.models.user import User, Role
from app.schemas.crm import (
    CustomerCreate, CustomerUpdate, CustomerResponse, CustomerVisitResponse
)
from app.services.crm_service import create_customer, record_visit
from app.utils.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/crm", tags=["CRM"])


@router.get("/customers", response_model=List[CustomerResponse])
async def list_customers(
    search: Optional[str] = None,
    vip_only: bool = False,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Customer)
    if search:
        query = query.where(
            (Customer.first_name.ilike(f"%{search}%")) |
            (Customer.last_name.ilike(f"%{search}%")) |
            (Customer.phone.ilike(f"%{search}%"))
        )
    if vip_only:
        query = query.where(Customer.is_vip == True)

    query = query.order_by(Customer.id.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    return [CustomerResponse.model_validate(c) for c in result.scalars().all()]


@router.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return CustomerResponse.model_validate(customer)


@router.post("/customers", response_model=CustomerResponse)
async def new_customer(
    data: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = await create_customer(db, data)
    return CustomerResponse.model_validate(customer)


@router.patch("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(customer, key, value)

    await db.flush()
    await db.refresh(customer)
    return CustomerResponse.model_validate(customer)


@router.get("/customers/{customer_id}/visits", response_model=List[CustomerVisitResponse])
async def customer_visits(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(CustomerVisit)
        .where(CustomerVisit.customer_id == customer_id)
        .order_by(CustomerVisit.visit_date.desc())
    )
    return [CustomerVisitResponse.model_validate(v) for v in result.scalars().all()]


@router.post("/customers/{customer_id}/visits", response_model=CustomerVisitResponse)
async def new_visit(
    customer_id: int,
    amount: float = Query(..., gt=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    visit = await record_visit(db, customer_id, amount)
    return CustomerVisitResponse.model_validate(visit)

@router.get("/search", response_model=List[CustomerResponse])
async def search_customers(
    query: str = Query(..., min_length=1, description="Телефон, email или имя"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Быстрый поиск клиентов для привязки к заказу"""
    
    print(f"🔍 Searching for: {query}")  # ← ОТЛАДКА
    
    result = await db.execute(
        select(Customer).where(
            (Customer.phone.ilike(f"%{query}%")) |
            (Customer.email.ilike(f"%{query}%")) |
            (Customer.first_name.ilike(f"%{query}%")) |
            (Customer.last_name.ilike(f"%{query}%"))
        ).limit(10)
    )
    
    customers = result.scalars().all()
    print(f"✅ Found {len(customers)} customers")  # ← ОТЛАДКА
    
    return [CustomerResponse.model_validate(c) for c in customers]