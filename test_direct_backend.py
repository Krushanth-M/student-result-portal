import asyncio
import os
from model import ApexAIBackend

async def run_tests():
    print("=== STARTING APEX AI BACKEND TESTING ===")
    
    # Instantiate backend. By default, it runs in DEMO_MODE=True unless env variables override it.
    backend = ApexAIBackend()
    print(f"Backend instantiated. DEMO_MODE: {backend.demo_mode}")
    
    print("\n[Test 1] Stock Metrics Retrieval")
    try:
        metrics = await backend.get_stock_metrics_async("AAPL")
        print("AAPL metrics response:", metrics)
        assert metrics["ticker"] == "AAPL"
        assert "price" in metrics
        assert metrics["prediction"] in ["BULLISH", "BEARISH"]
        assert 0.0 <= metrics["confidence"] <= 100.0
        assert "sentiment_label" in metrics
        assert "day_high" in metrics
        assert "day_low" in metrics
        assert "volume" in metrics
        assert "market_cap" in metrics
        print("[OK] Test 1 Passed!")
    except Exception as e:
        print("[FAIL] Test 1 Failed:", e)

    print("\n[Test 2] Stock Vision Mockup Analysis")
    try:
        # Faux base64 png pixel
        mock_image = "iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
        analysis = await backend.analyze_image_async(mock_image, "image/png")
        print("Vision analysis response:", analysis)
        assert "ticker" in analysis
        assert "prediction" in analysis
        assert 0.0 <= analysis["confidence"] <= 100.0
        print("[OK] Test 2 Passed!")
    except Exception as e:
        print("[FAIL] Test 2 Failed:", e)

    print("\n[Test 3] Sandbox Code Execution - Success Case")
    code_success = "print('Hello from the Apex Sandbox!')\n"
    try:
        res = await backend.execute_code_async(code_success)
        print("Execution response (success):", {k: v for k, v in res.items() if k not in ["corrected_code"]})
        assert res["success"] is True
        assert "Hello from the Apex Sandbox!" in res["stdout"]
        assert res["exit_code"] == 0
        print("[OK] Test 3 Passed!")
    except Exception as e:
        print("[FAIL] Test 3 Failed:", e)

    print("\n[Test 4] Sandbox Code Execution - Self-Healing division by zero")
    code_div_zero = "x = 10\ny = 0\nprint(x / y)\n"
    try:
        res = await backend.execute_code_async(code_div_zero)
        print("Execution response (division by zero error):", {k: v for k, v in res.items() if k != "corrected_code"})
        print("Proposed Correction:", res["corrected_code"])
        assert res["success"] is False
        assert "zero" in res["stderr"].lower() or "division" in res["stderr"].lower()
        assert res["corrected_code"] is not None
        assert "/ 1" in res["corrected_code"] or "corrected" in res["corrected_code"].lower() or "y = 1" in res["corrected_code"]
        print("[OK] Test 4 Passed!")
    except Exception as e:
        print("[FAIL] Test 4 Failed:", e)

    print("\n[Test 5] Sandbox Code Execution - Self-Healing NameError")
    code_name_error = "print(y_variable_not_defined)\n"
    try:
        res = await backend.execute_code_async(code_name_error)
        print("Execution response (NameError):", {k: v for k, v in res.items() if k != "corrected_code"})
        print("Proposed Correction:", res["corrected_code"])
        assert res["success"] is False
        assert "defined" in res["stderr"].lower() or "name" in res["stderr"].lower()
        assert res["corrected_code"] is not None
        assert "y_variable_not_defined =" in res["corrected_code"]
        print("[OK] Test 5 Passed!")
    except Exception as e:
        print("[FAIL] Test 5 Failed:", e)

    print("\n[Test 6] Sandbox AST Safety Block")
    code_unsafe = "import os\nos.system('echo unsafe')\n"
    try:
        res = await backend.execute_code_async(code_unsafe)
        print("AST safety check response:", res)
        assert res["success"] is False
        assert "prohibited" in res["stderr"].lower() or "security" in res["stderr"].lower()
        print("[OK] Test 6 Passed!")
    except Exception as e:
        print("[FAIL] Test 6 Failed:", e)

    print("\n=== ALL DIRECT BACKEND TESTS CONCLUDED ===")

if __name__ == "__main__":
    asyncio.run(run_tests())
