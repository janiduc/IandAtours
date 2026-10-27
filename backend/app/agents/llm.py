"""Model-agnostic chat client.

Ollama, Groq, Google Gemini and most other providers expose the OpenAI chat-completions API,
so one small client covers them all. Switching provider is a configuration change.
"""

from typing import Any, Protocol

import httpx

from app.config import settings

Message = dict[str, Any]


class LLMError(Exception):
    """The model provider could not be reached or returned something unusable."""


class ChatModel(Protocol):
    def chat(self, messages: list[Message], tools: list[dict[str, Any]]) -> Message:
        """Send the conversation and return the assistant's next message (may contain tool_calls)."""
        ...


class OpenAICompatibleModel:
    def __init__(self, base_url: str, model: str, api_key: str = "", timeout: float = 60):
        self.url = base_url.rstrip("/") + "/chat/completions"
        self.model = model
        self.headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
        self.timeout = timeout

    def chat(self, messages: list[Message], tools: list[dict[str, Any]]) -> Message:
        body: dict[str, Any] = {"model": self.model, "messages": messages, "temperature": 0.3}
        if tools:
            body["tools"] = tools
        try:
            response = httpx.post(self.url, json=body, headers=self.headers, timeout=self.timeout)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]
        except (httpx.HTTPError, KeyError, IndexError, ValueError) as error:
            raise LLMError(f"Model request failed: {error.__class__.__name__}") from error


def default_model() -> ChatModel:
    return OpenAICompatibleModel(
        settings.llm_base_url, settings.llm_model, settings.llm_api_key, settings.llm_timeout_seconds
    )
