import re
import json

html_path = r"C:\Users\krush\.gemini\antigravity\brain\8beac6cd-b26f-433c-a60f-58521528830a\.system_generated\steps\3236\content.md"
with open(html_path, "r", encoding="utf-8") as f:
    content = f.read()

# Find all sym svelte-1ro3niy cells containing links
# Format: <td class="sym svelte-1ro3niy"><!----><a href="/quote/nse/SYMBOL/">SYMBOL</a><!----></td>
matches = re.findall(r'/quote/nse/([A-Z0-9&\-]+)/', content)

# Remove duplicates while preserving order
seen = set()
ordered_symbols = []
for sym in matches:
    if sym not in seen:
        seen.add(sym)
        ordered_symbols.append(sym)

print(f"Found {len(ordered_symbols)} ordered symbols. Top 30:")
print(ordered_symbols[:30])

with open("nse_symbols_ordered.json", "w") as f:
    json.dump(ordered_symbols, f)
