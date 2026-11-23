#!/usr/bin/env python3
"""Zoltai tier-list reel: fully code-rendered animated frames (1080x1920, 30fps)."""
import math, os, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1080, 1920
FPS = 30
DUR = 29.8
N = int(FPS * DUR)
OUT = "/tmp/zoltai_reel/frames"
os.makedirs(OUT, exist_ok=True)

# brand
VIOLET = (124, 58, 237)
VIOLET_L = (167, 139, 250)
BG_TOP = (13, 8, 23)
BG_BOT = (24, 12, 48)
INK = (245, 242, 255)
MUTED = (170, 160, 200)
GOLD = (251, 191, 36)
BLUE = (96, 165, 250)
CARD = (23, 16, 42)
CARD_EDGE = (88, 66, 160)
GREEN = (52, 211, 153)

F = "/usr/share/fonts/truetype/noto/"
def font(name, size): return ImageFont.truetype(F + name, size)
BLACK = lambda s: font("NotoSans-Black.ttf", s)
XBOLD = lambda s: font("NotoSans-ExtraBold.ttf", s)
BOLD = lambda s: font("NotoSans-Bold.ttf", s)
MED = lambda s: font("NotoSans-Medium.ttf", s)
MONO = lambda s: font("NotoSansMono-Bold.ttf", s)

def ease_out_cubic(x): return 1 - (1 - x) ** 3
def ease_out_back(x):
    c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def lerp(a, b, x): return a + (b - a) * x

def text_w(d, s, f): return d.textlength(s, font=f)

# ---------- static background ----------
def build_bg():
    img = Image.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        t = y / H
        px_row = tuple(int(lerp(BG_TOP[i], BG_BOT[i], t)) for i in range(3))
        for x in range(W):
            px[x, y] = px_row
    d = ImageDraw.Draw(img, "RGBA")
    for gx in range(0, W + 1, 90):
        d.line([(gx, 0), (gx, H)], fill=(124, 58, 237, 14), width=1)
    for gy in range(0, H + 1, 90):
        d.line([(0, gy), (W, gy)], fill=(124, 58, 237, 14), width=1)
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([-300, -250, 500, 550], fill=(124, 58, 237, 70))
    gd.ellipse([650, 1400, 1450, 2200], fill=(59, 90, 246, 55))
    glow = glow.filter(ImageFilter.GaussianBlur(180))
    img = Image.alpha_composite(img.convert("RGBA"), glow)
    return img
BG = build_bg()

random.seed(7)
DOTS = [(random.randint(40, W - 40), random.randint(120, H - 120),
         random.uniform(0.4, 1.4), random.uniform(0, 6.28)) for _ in range(26)]

def draw_dots(d, t):
    for (x, y, sp, ph) in DOTS:
        yy = (y - 14 * t * sp) % H
        a = int(60 + 50 * math.sin(t * 1.3 * sp + ph))
        r = 2.2 * sp
        d.ellipse([x - r, yy - r, x + r, yy + r], fill=(167, 139, 250, max(0, a)))

# ---------- mascot: "Zolt" the little bolt-bot (original) ----------
def draw_mascot(base, cx, cy, s, t, wave=False):
    m = Image.new("RGBA", (int(320 * s), int(360 * s)), (0, 0, 0, 0))
    d = ImageDraw.Draw(m)
    u = s  # unit
    def R(x): return x * u
    # antenna bolt
    bolt = [(150, 6), (128, 46), (148, 46), (130, 92), (176, 34), (152, 34), (172, 6)]
    d.polygon([(R(x), R(y)) for x, y in bolt], fill=GOLD + (255,))
    # arms
    arm_l = math.sin(t * 2.2) * 6
    d.line([(R(58), R(180)), (R(16), R(214 + arm_l))], fill=VIOLET_L + (255,), width=int(R(16)))
    if wave:
        ang = -0.9 + 0.45 * math.sin(t * 9)
        hx, hy = 262, 178
        ex = hx + 78 * math.cos(ang - 1.2)
        ey = hy + 78 * math.sin(ang - 1.2)
        d.line([(R(hx), R(hy)), (R(ex), R(ey))], fill=VIOLET_L + (255,), width=int(R(16)))
        d.ellipse([R(ex) - R(14), R(ey) - R(14), R(ex) + R(14), R(ey) + R(14)], fill=VIOLET_L + (255,))
    else:
        d.line([(R(262), R(180)), (R(304), R(214 - arm_l))], fill=VIOLET_L + (255,), width=int(R(16)))
    # head
    d.rounded_rectangle([R(58), R(96), R(262), R(264)], radius=R(46), fill=VIOLET + (255,),
                        outline=(196, 171, 255, 255), width=int(R(5)))
    # face plate
    d.rounded_rectangle([R(82), R(130), R(238), R(226)], radius=R(30), fill=(26, 16, 50, 255))
    # eyes
    blink = 1.0 if (t % 3.4) < 3.25 else 0.15
    for ex in (128, 192):
        eh = 17 * blink
        d.ellipse([R(ex - 14), R(166 - eh), R(ex + 14), R(166 + eh)], fill=(255, 255, 255, 255))
        if blink > 0.5:
            d.ellipse([R(ex - 6), R(160), R(ex + 6), R(172)], fill=(20, 12, 40, 255))
    # smile
    d.arc([R(140), R(188), R(180), R(214)], start=15, end=165, fill=GOLD + (255,), width=int(R(6)))
    # feet
    d.rounded_rectangle([R(96), R(264), R(140), R(288)], radius=R(10), fill=VIOLET_L + (255,))
    d.rounded_rectangle([R(180), R(264), R(224), R(288)], radius=R(10), fill=VIOLET_L + (255,))
    base.alpha_composite(m, (int(cx - 160 * s), int(cy - 100 * s)))

# ---------- caption bar ----------
def draw_caption(d, y, parts):
    # parts: list of (text, highlighted?)
    f = XBOLD(44)
    box_pad = 14  # padding between word and its own box edge
    gap = 30      # clear space between the box and neighbouring words
    widths = [text_w(d, s.strip(), f) if h else text_w(d, s, f) for s, h in parts]
    total = sum(widths) + gap * 2 * sum(1 for _, h in parts if h)
    x = (W - total) / 2
    for (s, hi), w in zip(parts, widths):
        if hi:
            x += gap
            d.rounded_rectangle([x - box_pad, y - 34, x + w + box_pad, y + 34], radius=14, fill=VIOLET)
            d.text((x, y), s.strip(), font=f, fill=INK, anchor="lm")
            x += w + gap
        else:
            d.text((x, y), s, font=f, fill=INK, anchor="lm")
            x += w

def draw_top_ui(d, t):
    # brand pill
    d.rounded_rectangle([60, 56, 246, 116], radius=30, fill=(23, 16, 42, 220), outline=CARD_EDGE + (255,), width=2)
    d.text((104, 86), "ZOLTAI", font=XBOLD(30), fill=INK, anchor="lm")
    bolt = [(76, 66), (68, 86), (76, 86), (68, 106), (88, 80), (80, 80), (88, 66)]
    d.polygon(bolt, fill=GOLD + (255,))
    # AI label pill
    # progress bar
    d.rounded_rectangle([60, 140, W - 60, 150], radius=5, fill=(255, 255, 255, 28))
    pw = int((W - 120) * clamp(t / DUR))
    if pw > 6:
        d.rounded_rectangle([60, 140, 60 + pw, 150], radius=5, fill=VIOLET_L + (255,))

# ---------- tier card ----------
TIER_STYLE = {
    "S": (GOLD, (30, 22, 4)),
    "A": (VIOLET_L, (24, 14, 48)),
    "B": (BLUE, (8, 18, 40)),
}
def draw_tier_rows(base, rows, p_in, y0=620):
    """rows: list of (tier, name, oneline). Each pops in with stagger."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    rh, gap = 218, 30
    for i, (tier, name, line) in enumerate(rows):
        pi = ease_out_back(clamp((p_in - i * 0.14) / 0.55))
        if pi <= 0: continue
        y = y0 + i * (rh + gap) + int((1 - pi) * 90)
        a = int(255 * clamp(pi * 1.4))
        x0, x1 = 90, W - 90
        d.rounded_rectangle([x0, y, x1, y + rh], radius=30, fill=CARD + (a,),
                            outline=CARD_EDGE + (a,), width=3)
        bc, bd = TIER_STYLE[tier]
        d.rounded_rectangle([x0 + 26, y + 26, x0 + 166, y + rh - 26], radius=22, fill=bc + (a,))
        d.text((x0 + 96, y + rh / 2), tier, font=BLACK(74), fill=bd + (a,), anchor="mm")
        d.text((x0 + 196, y + 72), name, font=XBOLD(56), fill=INK + (a,), anchor="lm")
        d.text((x0 + 196, y + 148), line, font=MED(36), fill=MUTED + (a,), anchor="lm")
    base.alpha_composite(layer)

def center_text(d, y, s, f, fill=INK, spacing=70):
    if isinstance(s, str): s = [s]
    for i, ln in enumerate(s):
        d.text((W / 2, y + i * spacing), ln, font=f, fill=fill, anchor="mm")

# ---------- beats ----------
# (start, end, kind, payload)
BEATS = [
    (0.0, 3.2, "hook", None),
    (3.2, 9.8, "tiers", ("S", [("S", "ChatGPT", "does almost everything well"),
                              ("S", "Claude", "best for writing and code")], "S TIER")),
    (9.8, 16.4, "tiers", ("A", [("A", "Gemini", "best inside Google apps"),
                               ("A", "Midjourney", "best AI images")], "A TIER")),
    (16.4, 23.0, "tiers", ("B", [("B", "ElevenLabs", "best AI voices"),
                                ("B", "Perplexity", "best AI search")], "B TIER")),
    (23.0, 26.4, "rule", None),
    (26.4, DUR, "cta", None),
]
CAPTIONS = [
    (0.0, 3.2, [("Six tools. One ", False), ("honest", True), (" ranking.", False)]),
    (3.2, 9.8, [("S tier: ", False), ("daily drivers", True)]),
    (9.8, 16.4, [("A tier: great at ", False), ("one job", True)]),
    (16.4, 23.0, [("B tier: ", False), ("niche", True), (" but strong", False)]),
    (23.0, 26.4, [("Pick the one you'll ", False), ("actually use", True)]),
    (26.4, DUR, [("Full reviews at ", False), ("zoltai.org", True)]),
]
SUBTITLES = {
    "S": "worth using every day",
    "A": "excellent, just more specialized",
    "B": "great when you need that one thing",
}

# ---------- parametric content (optional JSON config as argv[1]) ----------
HOOK_LINES = [("We ranked", INK), ("6 AI tools", INK), ("in 2026", GOLD)]
HOOK_SUB = "so you don't have to"
HOOK_BADGE = "no hype - just our honest take"
RULE_L1 = ["The best AI tool", "is the one"]
RULE_L2 = "you'll actually use."
RULE_SUB = "Start with one. Add more later."
CTA_L1 = "Honest AI tool reviews."
CTA_L2 = "No hype. No sponsored rankings."
CTA_BTN = "zoltai.org"
CTA_MSG = "new reviews every week"

import json as _json, sys as _sys
if len(_sys.argv) > 1:
    _C = _json.load(open(_sys.argv[1]))
    if "hook" in _C:
        HOOK_LINES = [(_t, globals()[_c]) for _t, _c in _C["hook"]["lines"]]
        HOOK_SUB = _C["hook"].get("sub", HOOK_SUB)
        HOOK_BADGE = _C["hook"].get("badge", HOOK_BADGE)
    if "rule" in _C:
        RULE_L1 = _C["rule"].get("l1", RULE_L1)
        RULE_L2 = _C["rule"].get("l2", RULE_L2)
        RULE_SUB = _C["rule"].get("sub", RULE_SUB)
    if "cta" in _C:
        CTA_L1 = _C["cta"].get("l1", CTA_L1)
        CTA_L2 = _C["cta"].get("l2", CTA_L2)
        CTA_BTN = _C["cta"].get("button", CTA_BTN)
        CTA_MSG = _C["cta"].get("msg", CTA_MSG)
    if "tiers" in _C:
        _trs = _C["tiers"]
        SUBTITLES = {_t["letter"]: _t["subtitle"] for _t in _trs}
        _n = len(_trs)
        _w = (23.0 - 3.2) / _n
        BEATS = [(0.0, 3.2, "hook", None)]
        for _i, _t in enumerate(_trs):
            BEATS.append((3.2 + _i * _w, 3.2 + (_i + 1) * _w, "tiers",
                          (_t["letter"], [(_t["letter"], _nm, _ds) for _nm, _ds in _t["items"]],
                           _t.get("title", _t["letter"] + " TIER"))))
        BEATS += [(23.0, 26.4, "rule", None), (26.4, DUR, "cta", None)]
        if "captions" in _C:
            CAPTIONS = [(BEATS[_i][0], BEATS[_i][1], [(_p, _h) for _p, _h in _cap])
                        for _i, _cap in enumerate(_C["captions"])]


def beat_state(t, start, end):
    p_in = clamp((t - start) / 0.45)
    p_out = 1.0 if end >= DUR - 0.01 else clamp((end - t) / 0.3)
    return ease_out_cubic(p_in), p_out

def render(t):
    img = BG.copy()
    d = ImageDraw.Draw(img, "RGBA")
    draw_dots(d, t)
    draw_top_ui(d, t)
    for (start, end, kind, payload) in BEATS:
        if not (start <= t <= end + 0.05):
            continue
        p_in, p_out = beat_state(t, start, end)
        if start == 0.0:
            p_in = 1.0  # full hook visible on frame 1
        a = int(255 * p_out)
        if a <= 0:
            continue
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer)
        slide = int((1 - p_in) * 120)
        if kind == "hook":
            bob = int(6 * math.sin(t * 2.4))
            for _i, (_txt, _col) in enumerate(HOOK_LINES):
                center_text(ld, 690 + _i * 120 + slide, _txt, BLACK(108), _col + (a,))
            _sy = 690 + len(HOOK_LINES) * 120 + 10
            center_text(ld, _sy + slide, HOOK_SUB, MED(46), MUTED + (a,))
            ld.rounded_rectangle([W / 2 - 265, _sy + 90 + slide, W / 2 + 265, _sy + 154 + slide], radius=32,
                                 outline=VIOLET_L + (a,), width=3)
            center_text(ld, _sy + 122 + slide, HOOK_BADGE, MED(34), VIOLET_L + (a,))
            img.alpha_composite(layer)
            draw_mascot(img, W / 2 + 320, 1245 + bob, 0.55, t, wave=True)
        elif kind == "tiers":
            letter, rows, title = payload
            center_text(ld, 500 + slide, title, BLACK(96), (TIER_STYLE[letter][0]) + (a,))
            center_text(ld, 566 + slide, SUBTITLES[letter], MED(36), MUTED + (a,))
            img.alpha_composite(layer)
            draw_tier_rows(img, rows, p_in)
            bob = int(5 * math.sin(t * 2.2))
            draw_mascot(img, 176, 322 + bob, 0.42, t)
        elif kind == "rule":
            center_text(ld, 760 + slide, RULE_L1, BLACK(84), INK + (a,), spacing=100)
            center_text(ld, 990 + slide, RULE_L2, BLACK(84), GOLD + (a,))
            center_text(ld, 1080 + slide, RULE_SUB, MED(42), MUTED + (a,))
            img.alpha_composite(layer)
            bob = int(6 * math.sin(t * 2.4))
            draw_mascot(img, 175, 1240 + bob, 0.45, t)
        elif kind == "cta":
            pop = ease_out_back(p_in)
            center_text(ld, 800 + slide, CTA_L1, XBOLD(56), INK + (a,))
            center_text(ld, 866 + slide, CTA_L2, MED(40), MUTED + (a,))
            bw = int(640 * pop)
            if bw > 20:
                ld.rounded_rectangle([W / 2 - bw / 2, 950, W / 2 + bw / 2, 1060], radius=55, fill=VIOLET + (a,))
                center_text(ld, 1005, CTA_BTN, BLACK(64), (255, 255, 255, a))
            # typewriter effect (folded in from the second reference reel)
            msg = CTA_MSG
            nch = int(clamp((t - 24.0) / 0.9) * len(msg))
            center_text(ld, 1160, msg[:nch] + ("_" if nch < len(msg) else ""), MED(36), MUTED + (a,))
            img.alpha_composite(layer)
            bob = int(6 * math.sin(t * 2.6))
            draw_mascot(img, W / 2 + 320, 1245 + bob, 0.55, t, wave=True)
    # captions
    for (cs, ce, parts) in CAPTIONS:
        if cs <= t < ce:
            pin = ease_out_cubic(clamp((t - cs) / 0.35))
            cy = 1380 + int((1 - pin) * 50)
            lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            cd = ImageDraw.Draw(lay)
            draw_caption(cd, cy, parts)
            lay.putalpha(lay.split()[3].point(lambda v: int(v * pin)))
            img.alpha_composite(lay)
            break
    return img.convert("RGB")

for n in range(N):
    t = n / FPS
    frame = render(t)
    frame.save(f"{OUT}/f{n:04d}.png")
    if n % 90 == 0:
        print(f"frame {n}/{N}", flush=True)
print("done")
