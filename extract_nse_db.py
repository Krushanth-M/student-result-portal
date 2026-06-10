from bs4 import BeautifulSoup
import json

html_path = r"C:\Users\krush\.gemini\antigravity\brain\8beac6cd-b26f-433c-a60f-58521528830a\.system_generated\steps\3236\content.md"
with open(html_path, "r", encoding="utf-8") as f:
    content = f.read()

soup = BeautifulSoup(content, "html.parser")
table = soup.find("table", {"id": "main-table"})

db = {}
ordered_symbols = []

if table:
    rows = table.find("tbody").find_all("tr") if table.find("tbody") else table.find_all("tr")
    for row in rows:
        cells = row.find_all("td")
        if len(cells) >= 3:
            # The second cell has the symbol link
            sym_cell = cells[1]
            link = sym_cell.find("a")
            if link:
                href = link.get("href", "")
                # href is like /quote/nse/RELIANCE/
                parts = href.split("/")
                symbol = None
                if len(parts) >= 4 and parts[2] == "nse":
                    symbol = parts[3].upper().strip()
                else:
                    symbol = link.text.strip().upper()
                
                # The third cell has the name
                name_cell = cells[2]
                name = name_cell.text.strip()
                
                if symbol and name:
                    db[symbol] = name
                    ordered_symbols.append(symbol)

print(f"Extracted {len(db)} stocks using BeautifulSoup. Top 15:")
for sym in ordered_symbols[:15]:
    print(f"{sym}: {db[sym]}")

with open("nse_stocks.json", "w") as f:
    json.dump(db, f)
