import asyncio
from model import ApexAIBackend

async def test_wipro_query():
    backend = ApexAIBackend()
    print("Running APEX TRADE query for WIPRO...")
    response = await backend.process_general_query_async("WIPRO", [], mode="trade")
    
    reply = response.get("reply", "")
    
    # Save to file using UTF-8
    with open("output.txt", "w", encoding="utf-8") as f:
        f.write(reply)
        
    print("\nSaved AI Response to output.txt successfully!")
    
    # Check if there are bracketed placeholders in the response
    placeholders = ["[Insert", "[X]%", "[bullish/bearish/neutral]", "[critical level]", "[lower level]"]
    found = [p for p in placeholders if p in reply]
    if found:
        print("\n[FAIL] Found placeholders in the response:", found)
    else:
        print("\n[SUCCESS] No placeholders found in response!")

if __name__ == "__main__":
    asyncio.run(test_wipro_query())
