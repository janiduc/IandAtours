import logging
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.agents.llm import ChatModel, LLMError, default_model
from app.agents.planner import PlanResult, plan_trip
from app.agents.staff import AssistResult, assist_booking
from app.config import settings
from app.db import get_db
from app.models import Booking
from app.security import RateLimiter, client_ip, require_staff

router = APIRouter(tags=["assistant"])
log = logging.getLogger(__name__)
planner_limiter = RateLimiter(max_attempts=30, window_seconds=60 * 60)


def get_chat_model() -> ChatModel:
    if not settings.assistant_enabled:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "The assistant is not switched on")
    return default_model()


def unavailable(error: LLMError) -> HTTPException:
    log.warning("Assistant failed: %s", error)
    return HTTPException(status.HTTP_502_BAD_GATEWAY, "The assistant is busy right now. Please try again in a moment.")


@router.get("/api/assistant/options")
def assistant_options():
    return {"enabled": settings.assistant_enabled}


class ChatTurn(BaseModel):
    # Only user and assistant turns are accepted, so a visitor can't inject system instructions.
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2_000)


class PlanRequest(BaseModel):
    messages: list[ChatTurn] = Field(min_length=1, max_length=20)


@router.post("/api/assistant/plan", response_model=PlanResult)
def plan(
    body: PlanRequest, request: Request, db: Session = Depends(get_db), model: ChatModel = Depends(get_chat_model)
):
    if body.messages[-1].role != "user":
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "The last message must be from the traveller")
    if not planner_limiter.hit(client_ip(request)):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "You've reached the chat limit for now. Message us on WhatsApp!")
    try:
        return plan_trip(model, db, [m.model_dump() for m in body.messages])
    except LLMError as error:
        raise unavailable(error)


class AssistRequest(BaseModel):
    instruction: str = Field(default="", max_length=1_000)


@router.post("/api/admin/bookings/{booking_id}/assist", response_model=AssistResult, dependencies=[Depends(require_staff)])
def assist(
    booking_id: int, body: AssistRequest, db: Session = Depends(get_db), model: ChatModel = Depends(get_chat_model)
):
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    try:
        return assist_booking(model, db, booking, body.instruction)
    except LLMError as error:
        raise unavailable(error)
