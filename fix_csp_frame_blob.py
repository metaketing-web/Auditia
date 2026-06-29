#!/usr/bin/env python3
from pathlib import Path

p = Path("/opt/portia-audit/server.py")
text = p.read_text(encoding="utf-8")
old = '"img-src \'self\' data: blob:; connect-src \'self\'"'
new = '"img-src \'self\' data: blob:; frame-src \'self\' blob:; connect-src \'self\'"'
if old not in text:
    raise SystemExit("csp block not found")
p.write_text(text.replace(old, new, 1), encoding="utf-8")
print("csp updated")
