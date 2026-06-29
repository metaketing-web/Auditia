"""Conversion Markdown → HTML propre pour export Word (.doc)."""
from __future__ import annotations

import html
import re
from typing import Callable


def _inline(text: str) -> str:
    """Gras, italique, code — après échappement HTML."""
    t = html.escape(text)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"<i>\1</i>", t)
    t = re.sub(r"`(.+?)`", r"<span style='font-family:Consolas,monospace;background:#f4f0eb;padding:1px 4px'>\1</span>", t)
    return t


def _is_table_sep(line: str) -> bool:
    s = line.strip()
    if not s.startswith("|"):
        return False
    return bool(re.match(r"^\|[\s\-:|]+\|$", s))


def _parse_table_row(line: str) -> list[str]:
    cells = [c.strip() for c in line.strip().strip("|").split("|")]
    return cells


def markdown_to_html(md: str) -> str:
    lines = md.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    out: list[str] = []
    i = 0
    n = len(lines)

    def flush_paragraph(buf: list[str]) -> None:
        if not buf:
            return
        text = " ".join(x.strip() for x in buf if x.strip())
        if text:
            out.append(f"<p>{_inline(text)}</p>")

    para_buf: list[str] = []

    while i < n:
        line = lines[i]
        stripped = line.strip()

        if not stripped:
            flush_paragraph(para_buf)
            para_buf = []
            i += 1
            continue

        # Table
        if stripped.startswith("|") and i + 1 < n and _is_table_sep(lines[i + 1]):
            flush_paragraph(para_buf)
            para_buf = []
            header = _parse_table_row(stripped)
            i += 2
            rows: list[list[str]] = []
            while i < n and lines[i].strip().startswith("|") and not _is_table_sep(lines[i]):
                rows.append(_parse_table_row(lines[i]))
                i += 1
            out.append("<table>")
            out.append("<tr>" + "".join(f"<th>{_inline(c)}</th>" for c in header) + "</tr>")
            for row in rows:
                out.append("<tr>" + "".join(f"<td>{_inline(c)}</td>" for c in row) + "</tr>")
            out.append("</table>")
            continue

        # Page break marker
        if stripped == "<!-- pagebreak -->":
            flush_paragraph(para_buf)
            para_buf = []
            out.append("<div style='page-break-before:always;margin:0;padding:0'><br/></div>")
            i += 1
            continue

        # Horizontal rule
        if re.match(r"^---+$", stripped) or re.match(r"^\*\*\*+$", stripped):
            flush_paragraph(para_buf)
            para_buf = []
            out.append("<hr style='border:none;border-top:1px solid #ccc;margin:18px 0'/>")
            i += 1
            continue

        # Headers (#### before ### before ## before #)
        m = re.match(r"^(#{1,4})\s+(.+)$", stripped)
        if m:
            flush_paragraph(para_buf)
            para_buf = []
            level = len(m.group(1))
            text = _inline(m.group(2).strip())
            styles = {
                1: "font-size:20pt;color:#003366;margin:24px 0 12px;font-weight:bold",
                2: "font-size:14pt;color:#003366;margin:28px 0 12px;padding-bottom:6px;border-bottom:2px solid #003366",
                3: "font-size:12pt;color:#333;margin:20px 0 8px",
                4: "font-size:11pt;color:#444;margin:16px 0 6px;font-weight:bold",
            }
            tag = f"h{min(level, 4)}"
            out.append(f"<{tag} style='{styles[level]}'>{text}</{tag}>")
            i += 1
            continue

        # Blockquote
        if stripped.startswith(">"):
            flush_paragraph(para_buf)
            para_buf = []
            quote_lines: list[str] = []
            while i < n and lines[i].strip().startswith(">"):
                quote_lines.append(lines[i].strip().lstrip(">").strip())
                i += 1
            out.append(
                f"<blockquote style='border-left:4px solid #003366;margin:16px 0;padding:10px 20px;background:#f5f8fc;font-style:italic;color:#333'>"
                f"{_inline(' '.join(quote_lines))}</blockquote>"
            )
            continue

        # Unordered list
        if re.match(r"^[-*]\s+", stripped):
            flush_paragraph(para_buf)
            para_buf = []
            items: list[str] = []
            while i < n and re.match(r"^[-*]\s+", lines[i].strip()):
                items.append(re.sub(r"^[-*]\s+", "", lines[i].strip()))
                i += 1
            out.append("<ul style='margin:8px 0 8px 24px'>")
            for it in items:
                out.append(f"<li>{_inline(it)}</li>")
            out.append("</ul>")
            continue

        # Ordered list
        if re.match(r"^\d+\.\s+", stripped):
            flush_paragraph(para_buf)
            para_buf = []
            items = []
            while i < n and re.match(r"^\d+\.\s+", lines[i].strip()):
                items.append(re.sub(r"^\d+\.\s+", "", lines[i].strip()))
                i += 1
            out.append("<ol style='margin:8px 0 8px 24px'>")
            for it in items:
                out.append(f"<li>{_inline(it)}</li>")
            out.append("</ol>")
            continue

        para_buf.append(stripped)
        i += 1

    flush_paragraph(para_buf)
    return "\n".join(out)


def wrap_word_doc(title: str, body_md: str) -> str:
    body = markdown_to_html(body_md)
    safe_title = html.escape(title)
    return f"""<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>{safe_title}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>
@page {{size:A4;margin:2.5cm 2cm}}
body{{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.6;color:#1a1a1a;margin:0;padding:24px 32px}}
h1{{font-size:20pt;color:#003366;margin:0 0 16px;font-weight:bold;letter-spacing:0.5px}}
h2{{font-size:14pt;color:#003366;margin:28px 0 12px;padding-bottom:6px;border-bottom:2px solid #003366}}
h3{{font-size:12pt;color:#333;margin:20px 0 8px}}
h4{{font-size:11pt;color:#444;margin:16px 0 6px;font-weight:bold}}
table{{border-collapse:collapse;width:100%;margin:14px 0;font-size:10pt}}
td,th{{border:1px solid #999;padding:8px 10px;text-align:left;vertical-align:top}}
th{{background:#e8eef4;font-weight:bold;color:#003366}}
ul,ol{{margin:10px 0;padding-left:28px}}
li{{margin-bottom:6px}}
blockquote{{border-left:4px solid #003366;margin:16px 0;padding:10px 20px;background:#f5f8fc;font-style:italic;color:#333}}
p{{margin:0 0 10px;text-align:justify}}
hr{{border:none;border-top:1px solid #ccc;margin:20px 0}}
.cover{{text-align:center;padding:80px 0 40px}}
.cover h1{{font-size:22pt;border:none}}
.meta-table td:first-child{{width:35%;font-weight:bold;background:#f5f8fc}}
</style></head>
<body>
{body}
</body></html>"""
