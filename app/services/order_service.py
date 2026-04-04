import random
import string
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.order import Order, OrderItem, OrderStatus, OrderItemStatus, Table, TableStatus
from app.models.menu import MenuItem
from app.models.crm import Customer
from app.schemas.order import OrderCreate
from app.utils.timezone import now_local


def generate_order_number() -> str:
    timestamp = now_local().strftime("%H%M")
    random_part = "".join(random.choices(string.digits, k=4))
    return f"ORD-{timestamp}-{random_part}"


async def find_customer_by_phone(db: AsyncSession, phone: str) -> Customer | None:
    """Поиск клиента по телефону"""
    if not phone:
        return None
    result = await db.execute(
        select(Customer).where(Customer.phone == phone)
    )
    return result.scalar_one_or_none()


async def create_order(
    db: AsyncSession, order_data: OrderCreate, waiter_id: int
) -> Order:
    order_number = generate_order_number()

    # Ищем клиента
    customer = None
    customer_discount = 0.0
    
    if order_data.customer_id:
        # Если передан ID клиента
        result = await db.execute(
            select(Customer).where(Customer.id == order_data.customer_id)
        )
        customer = result.scalar_one_or_none()
    elif order_data.customer_phone:
        # Или ищем по телефону
        customer = await find_customer_by_phone(db, order_data.customer_phone)
    
    # Если клиент найден — берём его скидку
    if customer:
        customer_discount = customer.discount_percent

    # Считаем общую сумму
    total = 0.0
    order_items = []

    for item_data in order_data.items:
        result = await db.execute(
            select(MenuItem).where(MenuItem.id == item_data.menu_item_id)
        )
        menu_item = result.scalar_one_or_none()
        if menu_item is None:
            raise ValueError(f"Блюдо с ID {item_data.menu_item_id} не найдено")
        if not menu_item.is_available:
            raise ValueError(f"Блюдо '{menu_item.name}' сейчас недоступно")

        item_total = menu_item.price * item_data.quantity
        total += item_total

        order_items.append(
            OrderItem(
                menu_item_id=item_data.menu_item_id,
                quantity=item_data.quantity,
                price=menu_item.price,
                notes=item_data.notes,
            )
        )

    # Налог (например, НДС 0% или можно настроить)
    tax = round(total * 0.0, 2)
    
    # Скидка клиента
    discount = round(total * (customer_discount / 100), 2)
    
    # Итоговая сумма
    final_amount = total + tax - discount

    order = Order(
        order_number=order_number,
        table_id=order_data.table_id,
        waiter_id=waiter_id,
        customer_id=customer.id if customer else None,
        status=OrderStatus.NEW,
        total_amount=round(total, 2),
        tax=tax,
        discount=discount,
        final_amount=round(final_amount, 2),
        notes=order_data.notes,
    )

    db.add(order)
    await db.flush()

    for oi in order_items:
        oi.order_id = order.id
        db.add(oi)

    # Обновляем статус стола
    if order_data.table_id:
        result = await db.execute(select(Table).where(Table.id == order_data.table_id))
        table = result.scalar_one_or_none()
        if table:
            table.status = TableStatus.OCCUPIED

    await db.flush()
    await db.refresh(order)

    # Загружаем items
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order.id)
    )
    return result.scalar_one()


async def update_order_item_status(
    db: AsyncSession, item_id: int, new_status: OrderItemStatus, cook_id: int = None
) -> OrderItem:
    result = await db.execute(select(OrderItem).where(OrderItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise ValueError("Позиция заказа не найдена")

    item.status = new_status

    if new_status == OrderItemStatus.PREPARING:
        item.started_at = now_local()
        if cook_id:
            item.cook_id = cook_id
    elif new_status == OrderItemStatus.READY:
        item.ready_at = now_local()

    await db.flush()
    await db.refresh(item)
    return item


async def get_order_with_items(db: AsyncSession, order_id: int) -> Order | None:
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    return result.scalar_one_or_none()


async def record_customer_visit(db: AsyncSession, customer_id: int, amount: float):
    """Записать визит клиента при оплате заказа"""
    from app.services.crm_service import record_visit
    await record_visit(db, customer_id, amount)