import asyncio
import os
import sys
sys.path.append(os.path.abspath('.'))
from model import ApexAIBackend

async def test():
    backend = ApexAIBackend()
    print("API Key:", backend.openrouter_key[:12] + "...")
    
    models = [
        "qwen/qwen-2.5-coder-32b-instruct",
        "google/gemini-2.5-flash",
        "deepseek/deepseek-chat"
    ]
    
    system_prompt = "You are a coding assistant. Respond with hello."
    prompt = "Ping"
    
    for model in models:
        print(f"\nTrying model: {model}...")
        res = await backend.ask_openrouter_async(system_prompt, prompt, model)
        if "OpenRouter Error" in res or "OpenRouter Exception" in res:
            print(f"-> Failed: {res[:150]}")
        else:
            print(f"-> SUCCESS! Response: {res.strip()}")

if __name__ == "__main__":
    asyncio.run(test())
