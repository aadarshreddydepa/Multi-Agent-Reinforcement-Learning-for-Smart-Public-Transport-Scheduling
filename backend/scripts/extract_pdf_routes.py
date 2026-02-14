#!/usr/bin/env python3
"""
Extract bus route text from 'Bus route details.pdf'.
Run from project root: python backend/scripts/extract_pdf_routes.py
"""
import os
import sys

def main():
    pdf_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "Bus route details.pdf"
    )
    if not os.path.isfile(pdf_path):
        print(f"PDF not found: {pdf_path}")
        sys.exit(1)

    try:
        from pypdf import PdfReader
    except ImportError:
        print("Install pypdf: pip install pypdf")
        sys.exit(1)

    reader = PdfReader(pdf_path)
    full_text = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if text:
            full_text.append(f"--- Page {i+1} ---\n{text}")
    output = "\n\n".join(full_text)
    out_path = os.path.join(os.path.dirname(pdf_path), "backend", "data", "bus_route_details_extracted.txt")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(output)
    print(f"Extracted {len(reader.pages)} pages to {out_path}")
    print("\n--- First 8000 chars ---\n")
    print(output[:8000])

if __name__ == "__main__":
    main()
