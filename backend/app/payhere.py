"""PayHere hosted checkout: https://support.payhere.lk/api-&-mobile-sdk/checkout-api

The traveller's browser is sent to PayHere's own payment page, so card details never reach our servers.
A booking is only marked paid after PayHere's server-to-server notification passes the signature check.
"""

import hashlib
import hmac
from decimal import Decimal

from app.config import settings

SUCCESS = 2
PENDING = 0
CANCELLED = -1
FAILED = -2
CHARGED_BACK = -3


def checkout_url() -> str:
    host = "sandbox.payhere.lk" if settings.payhere_sandbox else "www.payhere.lk"
    return f"https://{host}/pay/checkout"


def format_amount(amount: Decimal | float) -> str:
    return f"{Decimal(str(amount)):.2f}"


def _md5_upper(value: str) -> str:
    return hashlib.md5(value.encode()).hexdigest().upper()


def _hashed_secret() -> str:
    return _md5_upper(settings.payhere_merchant_secret)


def checkout_hash(order_id: str, amount: Decimal | float, currency: str) -> str:
    return _md5_upper(f"{settings.payhere_merchant_id}{order_id}{format_amount(amount)}{currency}{_hashed_secret()}")


def notification_is_valid(
    merchant_id: str, order_id: str, amount: str, currency: str, status_code: str, md5sig: str
) -> bool:
    expected = _md5_upper(f"{merchant_id}{order_id}{amount}{currency}{status_code}{_hashed_secret()}")
    return merchant_id == settings.payhere_merchant_id and hmac.compare_digest(expected, md5sig.upper())
