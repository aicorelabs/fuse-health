from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastmcp import Client
from google import genai
from dotenv import load_dotenv
import os
from typing import List, Optional

load_dotenv()

app = FastAPI(title="Gemini Agent API")

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MCP client and Gemini model
mcp_client = Client("http://localhost:8000/mcp/")
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Message]] = []


class ChatResponse(BaseModel):
    response: str
    is_plan: bool = False


async def agent_chat(message: str, history: List[Message]) -> dict:
    """
    An agentic chat function that first plans its tool calls and then
    executes them after user approval.
    Returns a dict with 'response' and 'is_plan' keys.
    """
    async with mcp_client:
        # Create a new chat session with tools
        chat = gemini_client.aio.chats.create(
            model="gemini-2.5-flash",
            config=genai.types.GenerateContentConfig(
                system_instruction='I say high, you say low',
                temperature=0.3,
                tools=[mcp_client.session]
            ),
        )

        # Build the conversation history
        for h in history:
            await chat.send_message(h.content)

        # Send the current message and get the plan
        response = await chat.send_message(message)

        # Check if the model wants to call functions
        if response.candidates and response.candidates[0].content.parts:
            has_function_calls = False
            plan_description = "Here's my plan:\n"

            for part in response.candidates[0].content.parts:
                if hasattr(part, 'function_call') and part.function_call:
                    has_function_calls = True
                    fc = part.function_call
                    args_str = ", ".join(f"{k}='{v}'" for k, v in fc.args.items())
                    plan_description += f"- Call tool `{fc.name}` with arguments: `{args_str}`\n"

            if has_function_calls:
                plan_description += "\nShall I proceed with this plan?"
                return {
                    "response": plan_description,
                    "is_plan": True
                }

        # If no tools are needed, just return the text response
        return {
            "response": response.text if response.text else "No response generated",
            "is_plan": False
        }


async def execute_plan(message: str, history: List[Message]) -> str:
    """
    Execute the approved plan with automatic function calling enabled.
    """
    async with mcp_client:
        # Create a new chat session with automatic function calling and tools
        chat = gemini_client.aio.chats.create(
            model="gemini-2.5-flash",
            config=genai.types.GenerateContentConfig(
                system_instruction='I say high, you say low',
                temperature=0.3,
                tools=[mcp_client.session],
                automatic_function_calling=genai.types.AutomaticFunctionCallingConfig(
                    disable=False
                )
            ),
        )

        # Build the conversation history
        for h in history:
            await chat.send_message(h.content)

        # Send the message and let it execute automatically
        response = await chat.send_message(message)

        return response.text if response.text else "No response generated"


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint. Returns the plan first if tools are needed.
    """
    try:
        result = await agent_chat(request.message, request.history or [])
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/execute", response_model=ChatResponse)
async def execute_endpoint(request: ChatRequest):
    """
    Execute the approved plan. Call this after receiving a plan from /chat.
    """
    try:
        result = await execute_plan(request.message, request.history or [])
        return ChatResponse(response=result, is_plan=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)