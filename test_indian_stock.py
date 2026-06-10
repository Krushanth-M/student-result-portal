import asyncio
from model import ApexAIBackend

async def test_indian():
    backend = ApexAIBackend()
    print("DEMO_MODE:", backend.demo_mode)
    
    # Query TCS
    tcs = await backend.get_stock_metrics_async("TCS")
    print("TCS Lookup Result:")
    print("Ticker:", tcs.get("ticker"))
    print("Name:", tcs.get("name"))
    print("Price:", tcs.get("price"))
    print("Prediction:", tcs.get("prediction"))
    print("History Points:", len(tcs.get("history", [])))
    
    # Query RELIANCE
    rel = await backend.get_stock_metrics_async("RELIANCE")
    print("\nRELIANCE Lookup Result:")
    print("Ticker:", rel.get("ticker"))
    print("Name:", rel.get("name"))
    print("Price:", rel.get("price"))
    
    # Query HDFCBANK
    hdfc = await backend.get_stock_metrics_async("HDFCBANK")
    print("\nHDFCBANK Lookup Result:")
    print("Ticker:", hdfc.get("ticker"))
    print("Name:", hdfc.get("name"))
    print("Price:", hdfc.get("price"))

if __name__ == "__main__":
    asyncio.run(test_indian())
