#!/usr/bin/env python3
import json, re, sqlite3, sys
from pathlib import Path

db = Path(sys.argv[1] if len(sys.argv) > 1 else "/opt/portia-audit/data/portia.db")
conn = sqlite3.connect(db)
row = conn.execute("SELECT payload FROM mission_state WHERE id = 1").fetchone()
s = json.loads(row[0])

hits = []

def walk(obj, path=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            p = f"{path}.{k}" if path else k
            if re.search(r"portia", k, re.I):
                hits.append((p + " [KEY]", str(k)[:80]))
            walk(v, p)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            walk(v, f"{path}[{i}]")
    elif isinstance(obj, str) and re.search(r"portia", obj, re.I):
        hits.append((path, obj[:120].replace("\n", " ")))

walk(s)
for p, t in hits[:50]:
    print(p, "->", t)
print("TOTAL", len(hits))
