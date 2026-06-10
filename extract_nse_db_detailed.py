import json
from bs4 import BeautifulSoup

def parse_mcap(mcap_str):
    mcap_str = mcap_str.strip().upper()
    if not mcap_str or mcap_str == "-":
        return None
    try:
        mult = 1
        if mcap_str.endswith("T"):
            mult = 1_000_000_000_000
            mcap_str = mcap_str[:-1]
        elif mcap_str.endswith("B"):
            mult = 1_000_000_000
            mcap_str = mcap_str[:-1]
        elif mcap_str.endswith("M"):
            mult = 1_000_000
            mcap_str = mcap_str[:-1]
        elif mcap_str.endswith("K"):
            mult = 1_000
            mcap_str = mcap_str[:-1]
        return int(float(mcap_str.replace(",", "")) * mult)
    except:
        return None

def main():
    html_path = r"C:\Users\krush\.gemini\antigravity\brain\8beac6cd-b26f-433c-a60f-58521528830a\.system_generated\steps\3236\content.md"
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()

    soup = BeautifulSoup(content, "html.parser")
    table = soup.find("table", {"id": "main-table"})

    db = {}
    if table:
        rows = table.find("tbody").find_all("tr") if table.find("tbody") else table.find_all("tr")
        for row in rows:
            cells = row.find_all("td")
            if len(cells) >= 6:
                link = cells[1].find("a")
                if link:
                    href = link.get("href", "")
                    parts = href.split("/")
                    symbol = parts[3].upper().strip() if (len(parts) >= 4 and parts[2] == "nse") else link.text.strip().upper()
                else:
                    symbol = cells[1].text.strip().upper()
                
                name = cells[2].text.strip()
                mcap_str = cells[3].text.strip()
                price_str = cells[4].text.strip().replace(",", "")
                change_str = cells[5].text.strip().replace("%", "")
                
                price = None
                try:
                    price = float(price_str)
                except:
                    pass
                    
                change_pct = None
                try:
                    change_pct = float(change_str)
                except:
                    pass
                    
                market_cap = parse_mcap(mcap_str)
                
                db[symbol] = {
                    "name": name,
                    "price": price,
                    "market_cap": market_cap,
                    "change_pct": change_pct
                }
                
    print(f"Extracted {len(db)} detailed stocks. Writing to nse_stocks_detailed.json...")
    with open("nse_stocks_detailed.json", "w") as f:
        json.dump(db, f, indent=2)
    print("Done!")

if __name__ == "__main__":
    main()
