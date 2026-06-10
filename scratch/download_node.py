import urllib.request
import zipfile
import os
import sys

def main():
    # Download portable Windows x64 zip of Node.js LTS
    url = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-win-x64.zip"
    dest_zip = "node.zip"
    extract_to = os.path.abspath("../node_portable")
    
    print(f"Downloading Node.js portable from {url}...")
    try:
        # User-agent bypass if needed
        opener = urllib.request.build_opener()
        opener.addheaders = [('User-agent', 'Mozilla/5.0')]
        urllib.request.install_opener(opener)
        
        urllib.request.urlretrieve(url, dest_zip)
        print("Download complete. Extracting zip archive...")
        
        os.makedirs(extract_to, exist_ok=True)
        with zipfile.ZipFile(dest_zip, 'r') as zip_ref:
            zip_ref.extractall(extract_to)
            
        print(f"Extraction complete! Node.js is located in: {extract_to}")
        
        if os.path.exists(dest_zip):
            os.remove(dest_zip)
            
        # Verify node executable runs successfully
        node_dir = os.path.join(extract_to, "node-v20.11.1-win-x64")
        node_exe = os.path.join(node_dir, "node.exe")
        print(f"Testing node path: {node_exe}")
        
        import subprocess
        res = subprocess.run([node_exe, "-v"], capture_output=True, text=True, timeout=5)
        print("SUCCESS! Node.js version:", res.stdout.strip())
        
    except Exception as e:
        print("Error occurred:", e)

if __name__ == "__main__":
    main()
