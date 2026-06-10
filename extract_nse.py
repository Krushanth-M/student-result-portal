import re

html_path = r"C:\Users\krush\.gemini\antigravity\brain\8beac6cd-b26f-433c-a60f-58521528830a\.system_generated\steps\3236\content.md"
with open(html_path, "r", encoding="utf-8") as f:
    content = f.read()

symbols = re.findall(r'/quote/nse/([A-Z0-9&\-]+)/', content)
symbols = sorted(list(set(symbols)))
print(f"Found {len(symbols)} symbols. First 20:")
print(symbols[:20])

import json
with open("nse_symbols.json", "w") as f:
    json.dump(symbols, f)
