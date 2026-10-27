"""A minimal tool-calling loop shared by every agent.

Each agent gets an explicit allowlist of tools. The model can only ask for those tools by name;
the arguments it sends are validated before a tool runs, and tools never trust model output
for permissions. Results go back to the model as JSON.
"""

import json
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from pydantic import BaseModel, ValidationError
from sqlalchemy.orm import Session

from app.agents.llm import ChatModel, LLMError, Message

MAX_STEPS = 6


@dataclass
class Tool:
    name: str
    description: str
    args: type[BaseModel]
    run: Callable[[Session, Any], Any]

    def spec(self) -> dict[str, Any]:
        schema = self.args.model_json_schema()
        schema.pop("title", None)
        return {"type": "function", "function": {"name": self.name, "description": self.description, "parameters": schema}}


@dataclass
class ToolCall:
    name: str
    arguments: dict[str, Any]
    result: Any


@dataclass
class AgentResult:
    reply: str
    calls: list[ToolCall] = field(default_factory=list)


def _parse_arguments(raw: Any) -> dict[str, Any]:
    if isinstance(raw, dict):
        return raw
    try:
        value = json.loads(raw or "{}")
    except (TypeError, json.JSONDecodeError):
        return {}
    return value if isinstance(value, dict) else {}


def run_agent(
    model: ChatModel, db: Session, system_prompt: str, conversation: list[Message], tools: list[Tool]
) -> AgentResult:
    by_name = {tool.name: tool for tool in tools}
    specs = [tool.spec() for tool in tools]
    messages: list[Message] = [{"role": "system", "content": system_prompt}, *conversation]
    calls: list[ToolCall] = []

    for _ in range(MAX_STEPS):
        reply = model.chat(messages, specs)
        tool_calls = reply.get("tool_calls") or []
        if not tool_calls:
            return AgentResult(reply=(reply.get("content") or "").strip(), calls=calls)

        messages.append({"role": "assistant", "content": reply.get("content") or "", "tool_calls": tool_calls})
        for call in tool_calls:
            function = call.get("function", {})
            name = function.get("name", "")
            arguments = _parse_arguments(function.get("arguments"))
            tool = by_name.get(name)
            if tool is None:
                result: Any = {"error": f"Unknown tool {name!r}. Use only the tools you were given."}
            else:
                try:
                    result = tool.run(db, tool.args.model_validate(arguments))
                except ValidationError as error:
                    result = {"error": "Invalid arguments", "details": error.errors(include_url=False, include_input=False)}
                calls.append(ToolCall(name=name, arguments=arguments, result=result))
            messages.append(
                {"role": "tool", "tool_call_id": call.get("id", name), "name": name, "content": json.dumps(result, default=str)}
            )

    raise LLMError("The assistant took too many steps without answering")
