import pdfplumber
import sys
import json

try:
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No file paths provided"}))
        sys.exit(1)
        
    paths = sys.argv[1:]
    extracted_text = ""
    for path in paths:
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                extracted_text += (page.extract_text() or "") + "\n"
            extracted_text += "\n--- END OF FILE ---\n"
            
    print(json.dumps({"success": True, "text": extracted_text}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
