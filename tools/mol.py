# Test sorularındaki tepkimeler için basit açık yapı formülleri (dikey, Fischer benzeri) → satır içi SVG
import html

CW = 6.4      # karakter genişliği (yaklaşık, 12px)
RH = 21       # satır yüksekliği
BL = 11       # yatay bağ uzunluğu


def tw(s):
    return sum(0.55 if ch in "⁺⁻²³₀₁₂₃₄₅" else 1 for ch in s) * CW


MOL = {
    "glutamat": [("", "COO⁻", ""), ("H₃N⁺", "C", "H"), ("", "CH₂", ""), ("", "CH₂", ""), ("", "COO⁻", "")],
    "aspartat": [("", "COO⁻", ""), ("H₃N⁺", "C", "H"), ("", "CH₂", ""), ("", "COO⁻", "")],
    "oksaloasetat": [("", "COO⁻", ""), ("", "C", "=O"), ("", "CH₂", ""), ("", "COO⁻", "")],
    "α-ketoglutarat": [("", "COO⁻", ""), ("", "C", "=O"), ("", "CH₂", ""), ("", "CH₂", ""), ("", "COO⁻", "")],
    "pirüvat": [("", "COO⁻", ""), ("", "C", "=O"), ("", "CH₃", "")],
    "laktat": [("", "COO⁻", ""), ("HO", "C", "H"), ("", "CH₃", "")],
    "fosfoenolpirüvat": [("", "COO⁻", ""), ("", "C", "O–PO₃²⁻"), ("=", "CH₂", "")],
    "glukoz": [("", "CHO", ""), ("H", "C", "OH"), ("HO", "C", "H"), ("H", "C", "OH"), ("H", "C", "OH"), ("", "CH₂OH", "")],
    "glukoz-6-fosfat": [("", "CHO", ""), ("H", "C", "OH"), ("HO", "C", "H"), ("H", "C", "OH"), ("H", "C", "OH"), ("", "CH₂", "O–PO₃²⁻")],
}


def svg(name):
    rows = MOL[name]
    lw = max(tw(l) for l, c, r in rows if l != "=") if any(l and l != "=" for l, c, r in rows) else 0
    rw = max([tw(r.lstrip("=")) for l, c, r in rows if r] or [0])
    cwm = max(tw(c) for l, c, r in rows)
    x0 = 4 + (lw + BL + 4 if lw else 0) + cwm / 2
    W = x0 + cwm / 2 + (BL + 4 + rw if rw else 0) + 10
    H = len(rows) * RH + 4
    out = []
    for i, (l, c, r) in enumerate(rows):
        y = 14 + i * RH
        out.append(f'<text x="{x0:.1f}" y="{y}" text-anchor="middle">{html.escape(c)}</text>')
        hc = tw(c) / 2
        if l and l != "=":
            out.append(f'<line x1="{x0 - hc - 2:.1f}" y1="{y - 4}" x2="{x0 - hc - 2 - BL:.1f}" y2="{y - 4}"/>')
            out.append(f'<text x="{x0 - hc - 4 - BL:.1f}" y="{y}" text-anchor="end">{html.escape(l)}</text>')
        if r:
            dbl = r.startswith("=")
            rr = r.lstrip("=")
            if dbl:
                out.append(f'<line x1="{x0 + hc + 2:.1f}" y1="{y - 6}" x2="{x0 + hc + 2 + BL:.1f}" y2="{y - 6}"/>')
                out.append(f'<line x1="{x0 + hc + 2:.1f}" y1="{y - 2}" x2="{x0 + hc + 2 + BL:.1f}" y2="{y - 2}"/>')
            else:
                out.append(f'<line x1="{x0 + hc + 2:.1f}" y1="{y - 4}" x2="{x0 + hc + 2 + BL:.1f}" y2="{y - 4}"/>')
            out.append(f'<text x="{x0 + hc + 4 + BL:.1f}" y="{y}">{html.escape(rr)}</text>')
        if i:   # üstteki satırla dikey bağ
            y1, y2 = y - RH + 4, y - 12
            if l == "=":
                out.append(f'<line x1="{x0 - 2:.1f}" y1="{y1}" x2="{x0 - 2:.1f}" y2="{y2}"/><line x1="{x0 + 2:.1f}" y1="{y1}" x2="{x0 + 2:.1f}" y2="{y2}"/>')
            else:
                out.append(f'<line x1="{x0:.1f}" y1="{y1}" x2="{x0:.1f}" y2="{y2}"/>')
    return (f'<svg width="{W:.0f}" height="{H}" viewBox="0 0 {W:.0f} {H}" font-size="12" font-family="inherit" fill="currentColor" '
            f'stroke="currentColor" stroke-width="1.1" style="display:block;margin:0 auto">'
            + "".join(o.replace("<text", '<text stroke="none"') for o in out) + "</svg>")


def fig(name, cap=None):
    return ('<figure style="margin:0;display:inline-flex;flex-direction:column;align-items:center">' + svg(name)
            + f'<figcaption style="font-size:11px;opacity:.75;margin-top:2px">{html.escape(cap or name)}</figcaption></figure>')


def tok(s):
    return f'<span style="font-size:15px;padding:0 2px">{html.escape(s)}</span>'


def rx(parts):
    """parts: molekül adı (MOL'de) ya da düz metin ('+', '⇌', 'ADP')"""
    return ('<div class="mlrx" style="display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:4px 6px;margin:8px 0 4px">'
            + "".join(fig(p) if p in MOL else tok(p) for p in parts) + "</div>")


if __name__ == "__main__":
    demo = "<html><body style='background:#151a24;color:#e6e9ef;font-family:sans-serif;padding:20px'>" + "".join([
        rx(["glutamat", "+", "oksaloasetat", "⇌", "α-ketoglutarat", "+", "aspartat"]),
        rx(["fosfoenolpirüvat", "+", "ADP", "→", "pirüvat", "+", "ATP"]),
        rx(["glukoz", "+", "ATP", "→", "glukoz-6-fosfat", "+", "ADP"]),
        rx(["laktat", "+", "NAD⁺", "⇌", "pirüvat", "+", "NADH + H⁺"])]) + "</body></html>"
    open("/home/claude/work/mol/demo.html", "w").write(demo)
