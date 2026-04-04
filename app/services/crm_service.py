from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.crm import Customer, CustomerVisit
from app.schemas.crm import CustomerCreate, CustomerUpdate


async def create_customer(db: AsyncSession, data: CustomerCreate) -> Customer:
    customer = Customer(
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        email=data.email,
        birthday=data.birthday,
        card_number=data.card_number,
    )
    db.add(customer)
    await db.flush()
    await db.refresh(customer)
    return customer


async def record_visit(
    db: AsyncSession, customer_id: int, amount: float
) -> CustomerVisit:
    # Начисляем 1 балл за каждые 100 единиц потраченных
    points_earned = int(amount // 100)

    visit = CustomerVisit(
        customer_id=customer_id,
        amount_spent=amount,
        points_earned=points_earned,
    )
    db.add(visit)

    # Обновляем данные клиента
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if customer:
        customer.visit_count += 1
        customer.total_spent += amount
        customer.loyalty_points += points_earned

        # VIP-статус при 10+ визитах или 50000+ потрачено
        if customer.visit_count >= 10 or customer.total_spent >= 50000:
            customer.is_vip = True
            customer.discount_percent = max(customer.discount_percent, 5.0)

    await db.flush()
    await db.refresh(visit)
    return visit