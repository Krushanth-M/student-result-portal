import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from model import ApexAIBackend

app = FastAPI(
    title="Apex Intel Backend Engine",
    description="Quantitative stock prediction and isolated code execution sandbox backend.",
    version="1.0.0"
)

# Enable CORS for Next.js dev server on port 3000 or any frontend client port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate the Apex backend orchestrator
backend = ApexAIBackend()

# Ensure sandbox directories exist
os.makedirs("sandbox", exist_ok=True)
os.makedirs("outputs", exist_ok=True)

# Mount outputs directory to serve visualizations statically at /outputs/{file_name}
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# Request Models
class ImageAnalysisRequest(BaseModel):
    image_base64: str
    mime_type: str

class SandboxRunRequest(BaseModel):
    code: str

@app.get("/")
async def root_redirect():
    """Redirect root path to interactive Swagger API documentation."""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/docs")

@app.get("/api/stocks/{ticker}")
async def get_stock_prediction(ticker: str):
    """Retrieve stock forecast analysis from the Quantitative Reasoning Engine."""
    if not ticker or len(ticker.strip()) == 0:
        raise HTTPException(status_code=400, detail="Ticker symbol cannot be empty.")
    try:
        metrics = await backend.get_stock_metrics_async(ticker)
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query Quantitative Engine: {str(e)}")

@app.post("/api/stocks/analyze_image")
async def analyze_chart_mockup(payload: ImageAnalysisRequest):
    """Parse stock chart mockup/screenshot using the Vision Analyst Engine."""
    if not payload.image_base64:
        raise HTTPException(status_code=400, detail="Base64 image content is required.")
    try:
        analysis = await backend.analyze_image_async(payload.image_base64, payload.mime_type)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze chart image: {str(e)}")

@app.post("/api/sandbox/run")
async def run_sandbox_code(payload: SandboxRunRequest):
    """Execute python script inside the unprivileged container sandbox with self-healing fallback."""
    if not payload.code:
        raise HTTPException(status_code=400, detail="Python script content cannot be empty.")
    try:
        result = await backend.execute_code_async(payload.code)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sandbox execution manager exception: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Verify backend and sandbox configuration status."""
    return {
        "status": "online",
        "demo_mode": backend.demo_mode,
        "openrouter_configured": backend.openrouter_key is not None,
        "finnhub_configured": backend.finnhub_key is not None
    }

class ChatRequest(BaseModel):
    prompt: str
    history: list = []
    mode: str = "friend"  # "code" | "trade" | "friend"

@app.post("/api/chat")
async def general_chat_assistant(payload: ChatRequest):
    """Route query to the correct AI pillar based on mode (code / trade / friend)."""
    if not payload.prompt or len(payload.prompt.strip()) == 0:
        raise HTTPException(status_code=400, detail="Prompt content cannot be empty.")
    try:
        response = await backend.process_general_query_async(payload.prompt, payload.history, payload.mode)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI pillar query failed: {str(e)}")

@app.get("/api/trade/screener")
async def get_stock_screener():
    """Return curated best BULLISH stock picks from Indian and US markets."""
    try:
        result = await backend.get_stock_screener_async()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Screener failed: {str(e)}")
