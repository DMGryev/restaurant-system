from datetime import datetime, timezone, timedelta

# Новосибирск = UTC+7
NOVOSIBIRSK_OFFSET = timedelta(hours=7)
NOVOSIBIRSK_TZ = timezone(NOVOSIBIRSK_OFFSET)


def now_local() -> datetime:
    """Текущее время в Новосибирске"""
    return datetime.now(NOVOSIBIRSK_TZ).replace(tzinfo=None)


def utc_to_local(dt: datetime) -> datetime:
    """Конвертировать UTC в Новосибирское время"""
    if dt is None:
        return None
    return dt + NOVOSIBIRSK_OFFSET