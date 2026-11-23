#!/usr/bin/env python3
"""Zoltai reel v2: 'one list, cycling previews' format (ref reel 3), code-rendered, Zoltai brand."""
import math, os, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1080, 1920
FPS = 30
DUR = 29.1
N = int(FPS * DUR)
OUT = "/tmp/zoltai_reel/frames2"
os.makedirs(OUT, exist_ok=True)

VIOLET = (124, 58, 237)
VIOLET_L = (167, 139, 250)
BG_TOP = (13, 8, 23)
BG_BOT = (24, 12, 48)
INK = (245, 242, 255)
MUTED = (165, 155, 195)
GOLD = (251, 191, 36)
BLUE = (96, 165, 250)
CARD = (23, 16, 42)
CARD_EDGE = (88, 66, 160)

F = "/usr/share/fonts/truetype/noto/"
def font(name, size): return ImageFont.truetype(F + name, size)
BLACK = lambda s: font("NotoSans-Black.ttf", s)
XBOLD = lambda s: font("NotoSans-ExtraBold.ttf", s)
BOLD = lambda s: font("NotoSans-Bold.ttf", s)
MED = lambda s: font("NotoSans-Medium.ttf", s)

def ease_out_cubic(x): return 1 - (1 - x) ** 3
def ease_out_back(x):
    c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def lerp(a, b, x): return a + (b - a) * x
def text_w(d, s, f): return d.textlength(s, font=f)

# ---------- background ----------
def build_bg():
    img = Image.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        t = y / H
        row = tuple(int(lerp(BG_TOP[i], BG_BOT[i], t)) for i in range(3))
        for x in range(W):
            px[x, y] = row
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

# ---------- mascot (original bolt-bot) ----------
def draw_mascot(base, cx, cy, s, t, wave=False):
    m = Image.new("RGBA", (int(320 * s), int(360 * s)), (0, 0, 0, 0))
    d = ImageDraw.Draw(m)
    u = s
    def R(x): return x * u
    bolt = [(150, 6), (128, 46), (148, 46), (130, 92), (176, 34), (152, 34), (172, 6)]
    d.polygon([(R(x), R(y)) for x, y in bolt], fill=GOLD + (255,))
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
    d.rounded_rectangle([R(58), R(96), R(262), R(264)], radius=R(46), fill=VIOLET + (255,),
                        outline=(196, 171, 255, 255), width=int(R(5)))
    d.rounded_rectangle([R(82), R(130), R(238), R(226)], radius=R(30), fill=(26, 16, 50, 255))
    blink = 1.0 if (t % 3.4) < 3.25 else 0.15
    for ex in (128, 192):
        eh = 17 * blink
        d.ellipse([R(ex - 14), R(166 - eh), R(ex + 14), R(166 + eh)], fill=(255, 255, 255, 255))
        if blink > 0.5:
            d.ellipse([R(ex - 6), R(160), R(ex + 6), R(172)], fill=(20, 12, 40, 255))
    d.arc([R(140), R(188), R(180), R(214)], start=15, end=165, fill=GOLD + (255,), width=int(R(6)))
    d.rounded_rectangle([R(96), R(264), R(140), R(288)], radius=R(10), fill=VIOLET_L + (255,))
    d.rounded_rectangle([R(180), R(264), R(224), R(288)], radius=R(10), fill=VIOLET_L + (255,))
    base.alpha_composite(m, (int(cx - 160 * s), int(cy - 100 * s)))

# ---------- shared UI ----------
def draw_top_ui(d, t):
    d.rounded_rectangle([60, 56, 246, 116], radius=30, fill=(23, 16, 42, 220), outline=CARD_EDGE + (255,), width=2)
    d.text((104, 86), "ZOLTAI", font=XBOLD(30), fill=INK, anchor="lm")
    bolt = [(76, 66), (68, 86), (76, 86), (68, 106), (88, 80), (80, 80), (88, 66)]
    d.polygon(bolt, fill=GOLD + (255,))
    d.rounded_rectangle([60, 140, W - 60, 150], radius=5, fill=(255, 255, 255, 28))
    pw = int((W - 120) * clamp(t / DUR))
    if pw > 6:
        d.rounded_rectangle([60, 140, 60 + pw, 150], radius=5, fill=VIOLET_L + (255,))

def draw_caption(base, y, parts, alpha=255):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    f = XBOLD(44)
    box_pad = 14
    gap = 30
    widths = [text_w(d, s.strip(), f) if h else text_w(d, s, f) for s, h in parts]
    total = sum(widths) + gap * 2 * sum(1 for _, h in parts if h)
    x = (W - total) / 2
    for (s, hi), w in zip(parts, widths):
        if hi:
            x += gap
            d.rounded_rectangle([x - box_pad, y - 34, x + w + box_pad, y + 34], radius=14, fill=VIOLET + (alpha,))
            d.text((x, y), s.strip(), font=f, fill=INK + (alpha,), anchor="lm")
            x += w + gap
        else:
            d.text((x, y), s, font=f, fill=INK + (alpha,), anchor="lm")
            x += w
    base.alpha_composite(lay)

def center_text(d, y, s, f, fill=INK, spacing=70):
    if isinstance(s, str): s = [s]
    for i, ln in enumerate(s):
        d.text((W / 2, y + i * spacing), ln, font=f, fill=fill, anchor="mm")

# ---------- tool data ----------
TIER_STYLE = {"S": (GOLD, (30, 22, 4)), "A": (VIOLET_L, (24, 14, 48)), "B": (BLUE, (8, 18, 40))}
TOOLS = [
    ("ChatGPT", "S", "does almost everything well", (16, 163, 127), "all-round daily driver"),
    ("Claude", "S", "best for writing and code", (217, 119, 87), "writing and code"),
    ("Gemini", "A", "best inside Google apps", (66, 133, 244), "inside Google apps"),
    ("Midjourney", "A", "best AI images", (220, 220, 230), "AI images"),
    ("ElevenLabs", "B", "best AI voices", (236, 72, 153), "AI voices"),
    ("Perplexity", "B", "best AI search", (34, 197, 214), "AI search"),
]
HOOK_END = 2.6
TOOL_WIN = 2.6
CYCLE_END = HOOK_END + 6 * TOOL_WIN      # 13.4
GRID_END = CYCLE_END + 6.0               # 17.6
# CTA: 17.6 - 22.5

# ---------- preview scenes (code-drawn, animated) ----------
def scene_chatgpt(d, box, lt, accent):
    x0, y0, x1, y1 = box
    msgs = [(0.0, "left", "Review this tool for me"),
            (0.45, "right", "Pros, cons, pricing?"),
            (0.9, "left", "Full breakdown below")]
    for i, (dt, side, txt) in enumerate(msgs):
        p = ease_out_back(clamp((lt - dt) / 0.3))
        if p <= 0: continue
        w = text_w(d, txt, MED(28)) + 36
        h = 58
        bx = x0 + 30 if side == "left" else x1 - 30 - w
        by = y0 + 40 + i * 84 + int((1 - p) * 40)
        col = CARD if side == "left" else accent
        tc = INK if side == "left" else (10, 20, 18)
        d.rounded_rectangle([bx, by, bx + w, by + h], radius=24, fill=col)
        d.text((bx + 18, by + h / 2), txt, font=MED(28), fill=tc, anchor="lm")

def scene_claude(d, box, lt, accent):
    x0, y0, x1, y1 = box
    lines = 6
    for i in range(lines):
        p = clamp((lt - i * 0.22) / 0.25)
        if p <= 0: continue
        wmax = (x1 - x0 - 80) * (0.55 + 0.4 * ((i * 37) % 10) / 10)
        y = y0 + 50 + i * 62
        d.rounded_rectangle([x0 + 40, y, x0 + 40 + wmax * p, y + 26], radius=13,
                            fill=(200, 190, 230, 200))
    # pen sparkle
    sx = x0 + 60 + (x1 - x0 - 120) * clamp(lt / 1.5)
    sy = y0 + 60 + min(int(lt / 0.22), lines - 1) * 62
    d.polygon([(sx, sy - 16), (sx + 6, sy - 4), (sx + 18, sy), (sx + 6, sy + 4), (sx, sy + 16),
               (sx - 6, sy + 4), (sx - 18, sy), (sx - 6, sy - 4)], fill=accent)

def scene_gemini(d, box, lt, accent):
    cx = (box[0] + box[2]) / 2
    cy = (box[1] + box[3]) / 2
    def star(sx, sy, r, rot, col):
        pts = []
        for k in range(8):
            rr = r if k % 2 == 0 else r * 0.38
            a = rot + k * math.pi / 4
            pts.append((sx + rr * math.cos(a), sy + rr * math.sin(a)))
        d.polygon(pts, fill=col)
    puls = 1 + 0.12 * math.sin(lt * 6)
    star(cx, cy, 86 * puls, lt * 0.8, accent)
    star(cx - 130, cy - 120, 34, -lt * 1.2, VIOLET_L)
    star(cx + 120, cy + 110, 26, lt * 1.5, (240, 200, 255))
    star(cx + 130, cy - 130, 20, lt, (150, 200, 255))

def scene_midjourney(d, box, lt, accent):
    x0, y0, x1, y1 = box
    zoom = 1 + 0.05 * math.sin(lt * 2)
    # framed picture
    d.rounded_rectangle([x0 + 40, y0 + 30, x1 - 40, y1 - 30], radius=18, fill=(28, 34, 60), outline=accent, width=4)
    # sun
    sx, sy = (x0 + x1) / 2, y0 + 130
    sr = 46 * zoom
    d.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=GOLD)
    # mountains
    my = y1 - 110
    d.polygon([(x0 + 60, my), (x0 + 220, my - 170 * zoom), (x0 + 380, my)], fill=(88, 66, 160))
    d.polygon([(x0 + 260, my), (x0 + 400, my - 130 * zoom), (x1 - 60, my)], fill=(60, 44, 110))
    # water shimmer
    for i in range(3):
        wy = my + 26 + i * 22
        ww = 60 + 30 * math.sin(lt * 3 + i)
        d.line([(x0 + 120, wy), (x0 + 120 + ww, wy)], fill=(150, 180, 255), width=4)

def scene_elevenlabs(d, box, lt, accent):
    x0, y0, x1, y1 = box
    cx = (x0 + x1) / 2
    cy = (y0 + y1) / 2
    n = 21
    for i in range(n):
        bx = x0 + 40 + i * (x1 - x0 - 80) / (n - 1)
        amp = (0.25 + 0.75 * abs(math.sin(lt * 5 + i * 0.7))) * (1 - abs(i - n / 2) / (n / 1.6))
        h = 130 * amp + 8
        d.rounded_rectangle([bx - 7, cy - h, bx + 7, cy + h], radius=7, fill=accent)

def scene_perplexity(d, box, lt, accent):
    x0, y0, x1, y1 = box
    # search bar
    d.rounded_rectangle([x0 + 40, y0 + 36, x1 - 40, y0 + 104], radius=34, fill=CARD, outline=accent, width=3)
    q = "best ai tool for research"
    nch = int(clamp(lt / 1.1) * len(q))
    d.text((x0 + 72, y0 + 70), q[:nch] + ("|" if nch < len(q) else ""), font=MED(28), fill=INK, anchor="lm")
    d.ellipse([x1 - 92, y0 + 52, x1 - 62, y0 + 82], outline=accent, width=4)
    d.line([(x1 - 66, y0 + 78), (x1 - 52, y0 + 92)], fill=accent, width=4)
    # answer lines
    for i in range(3):
        p = clamp((lt - 0.9 - i * 0.2) / 0.25)
        if p <= 0: continue
        y = y0 + 150 + i * 52
        d.ellipse([x0 + 46, y + 6, x0 + 58, y + 18], fill=accent)
        d.rounded_rectangle([x0 + 76, y, x0 + 76 + (x1 - x0 - 130) * (0.9 - i * 0.18) * p, y + 24],
                            radius=12, fill=(200, 190, 230, 190))

SCENES = [scene_chatgpt, scene_claude, scene_gemini, scene_midjourney, scene_elevenlabs, scene_perplexity]

# ---------- parametric content (optional JSON config as argv[1]) ----------
SCENE_MAP = {f.__name__[6:]: f for f in SCENES}
def scene_generic(d, box, lt, accent):
    x0, y0, x1, y1 = box
    for i in range(4):
        p = ease_out_cubic(clamp((lt - 0.2 - i * 0.15) / 0.3))
        if p <= 0: continue
        d.rounded_rectangle([x0 + 40, y0 + 40 + i * 84,
                             x0 + 40 + (x1 - x0 - 130) * (0.9 - i * 0.18) * p, y0 + 66 + i * 84],
                            radius=12, fill=accent + (180,))
HOOK2_L1 = "6 AI tools,"
HOOK2_L2 = "ranked honestly"
HOOK2_SUB = "no hype - just our take"
HOOK2_BADGE = "zoltai's 2026 list"
CYCLE_HEAD = "the honest tier list"
GRID_HEAD = "the full list"
GRID_FOOT = "S = daily drivers   A = great at one job   B = niche but strong"
CTA_L1 = "Honest AI tool reviews."
CTA_L2 = "No hype. No sponsored rankings."
CTA_BTN = "zoltai.org"
CTA_MSG = "new reviews every week"
CAP2 = [[("Six tools. One ", False), ("honest", True), (" ranking.", False)],
        [("our ", False), ("honest", True), (" take, tool by tool", False)],
        [("six tools, ", False), ("zero hype", True)],
        [("Full reviews at ", False), ("zoltai.org", True)]]

import json as _json, sys as _sys
if len(_sys.argv) > 1:
    _C = _json.load(open(_sys.argv[1]))
    if "tools" in _C:
        TOOLS = [(_t["name"], _t["tier"], _t["oneline"], tuple(_t["accent"]), _t["short"]) for _t in _C["tools"]]
        SCENES = [SCENE_MAP.get(_t.get("scene", ""), scene_generic) for _t in _C["tools"]]
        TOOL_WIN = 10.8 / len(TOOLS)
        CYCLE_END = HOOK_END + len(TOOLS) * TOOL_WIN
        GRID_END = CYCLE_END + 6.0
    if "hook" in _C:
        HOOK2_L1 = _C["hook"].get("l1", HOOK2_L1)
        HOOK2_L2 = _C["hook"].get("l2", HOOK2_L2)
        HOOK2_SUB = _C["hook"].get("sub", HOOK2_SUB)
        HOOK2_BADGE = _C["hook"].get("badge", HOOK2_BADGE)
    CYCLE_HEAD = _C.get("cycle_head", CYCLE_HEAD)
    GRID_HEAD = _C.get("grid_head", GRID_HEAD)
    GRID_FOOT = _C.get("grid_foot", GRID_FOOT)
    if "cta" in _C:
        CTA_L1 = _C["cta"].get("l1", CTA_L1)
        CTA_L2 = _C["cta"].get("l2", CTA_L2)
        CTA_BTN = _C["cta"].get("button", CTA_BTN)
        CTA_MSG = _C["cta"].get("msg", CTA_MSG)
    if "captions" in _C:
        CAP2 = [[(_p, _h) for _p, _h in _cap] for _cap in _C["captions"]]


# ---------- phases ----------
def draw_hook(img, d, t, p_in, p_out):
    a = int(255 * p_out)
    slide = int((1 - p_in) * 120)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lay)
    center_text(ld, 700 + slide, HOOK2_L1, BLACK(116), INK + (a,))
    center_text(ld, 828 + slide, HOOK2_L2, BLACK(116), GOLD + (a,))
    center_text(ld, 956 + slide, HOOK2_SUB, MED(46), MUTED + (a,))
    ld.rounded_rectangle([W / 2 - 200, 1040 + slide, W / 2 + 200, 1104 + slide], radius=32,
                         outline=VIOLET_L + (a,), width=3)
    center_text(ld, 1072 + slide, HOOK2_BADGE, MED(34), VIOLET_L + (a,))
    img.alpha_composite(lay)
    bob = int(6 * math.sin(t * 2.4))
    draw_mascot(img, W / 2 + 320, 1250 + bob, 0.55, t, wave=True)

def draw_cycle(img, d, t):
    ct = t - HOOK_END
    idx = min(int(ct / TOOL_WIN), len(TOOLS) - 1)
    lt = ct - idx * TOOL_WIN
    p_card = ease_out_back(clamp(lt / 0.3))
    # heading
    d.text((W / 2, 470), CYCLE_HEAD, font=XBOLD(52), fill=INK, anchor="mm")
    # left numbered list
    ly = 600
    for i, (name, tier, _, accent, _s) in enumerate(TOOLS):
        active = i == idx
        col = INK if active else (110, 102, 140)
        num_f = BOLD(34)
        name_f = XBOLD(40) if active else MED(40)
        y = ly + i * 96
        if active:
            d.rounded_rectangle([80, y - 34, 400, y + 34], radius=16, fill=accent + (55,),
                                outline=accent + (255,), width=2)
        d.text((104, y), f"0{i + 1}", font=num_f, fill=GOLD if active else (110, 102, 140), anchor="lm")
        d.text((180, y), name, font=name_f, fill=col, anchor="lm")
    # right preview card
    if p_card < 0.05:
        bob = int(5 * math.sin(t * 2.2))
        draw_mascot(img, 176, 340 + bob, 0.4, t)
        return
    cx0, cy0, cx1, cy1 = 450, 560, 1010, 1120
    grow = (1 - p_card)
    bx0 = cx0 + (cx1 - cx0) * grow * 0.5
    by0 = cy0 + (cy1 - cy0) * grow * 0.5
    bx1 = cx1 - (cx1 - cx0) * grow * 0.5
    by1 = cy1 - (cy1 - cy0) * grow * 0.5
    name, tier, oneline, accent, _s = TOOLS[idx]
    # clip scene into card: draw on layer then mask
    card_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cd = ImageDraw.Draw(card_layer)
    pulse = 0.5 + 0.5 * math.sin(lt * 4)
    edge_col = tuple(int(lerp(CARD_EDGE[i], accent[i], 0.35 + 0.4 * pulse)) for i in range(3))
    cd.rounded_rectangle([bx0, by0, bx1, by1], radius=28, fill=(17, 12, 32, 255),
                         outline=edge_col + (255,), width=4)
    inner = (bx0 + 24, by0 + 24, bx1 - 24, by1 - 120)
    SCENES[idx](cd, inner, lt, accent)
    # soft shine sweep once per tool switch
    sh = clamp((lt - 0.25) / 0.9)
    if 0.0 < sh < 1.0:
        sx = bx0 - 160 + (bx1 - bx0 + 320) * sh
        band = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        bd2 = ImageDraw.Draw(band)
        bd2.polygon([(sx - 50, by1), (sx + 70, by1), (sx + 190, by0), (sx + 70, by0)],
                    fill=(255, 255, 255, 22))
        mask = Image.new("L", (W, H), 0)
        ImageDraw.Draw(mask).rounded_rectangle([bx0, by0, bx1, by1], radius=28, fill=255)
        band.putalpha(Image.composite(band.split()[3], Image.new("L", (W, H), 0), mask))
        card_layer.alpha_composite(band)
    # tool name + tier badge + one-liner inside card
    bc, bd = TIER_STYLE[tier]
    cd.rounded_rectangle([bx0 + 24, by1 - 80, bx0 + 74, by1 - 30], radius=12, fill=bc)
    cd.text((bx0 + 49, by1 - 55), tier, font=BLACK(30), fill=bd, anchor="mm")
    cd.text((bx0 + 92, by1 - 62), name, font=XBOLD(38), fill=INK, anchor="lm")
    cd.text((bx0 + 92, by1 - 22), oneline, font=MED(26), fill=MUTED, anchor="lm")
    img.alpha_composite(card_layer)
    bob = int(5 * math.sin(t * 2.2))
    draw_mascot(img, 176, 340 + bob, 0.4, t)

def draw_grid(img, d, t):
    gt = t - CYCLE_END
    p_head = ease_out_cubic(clamp(gt / 0.35))
    slide = int((1 - p_head) * 60)
    center_text(d, 470 + slide, GRID_HEAD, BLACK(72), INK)
    gw, gh, gap = 292, 210, 24
    gx0 = (W - 3 * gw - 2 * gap) / 2
    gy0 = 580
    for i, (name, tier, oneline, accent, short) in enumerate(TOOLS):
        p = ease_out_back(clamp((gt - 0.25 - i * 0.12) / 0.4))
        if p <= 0: continue
        r, c = divmod(i, 3)
        x0 = gx0 + c * (gw + gap)
        y0 = gy0 + r * (gh + gap) + int((1 - p) * 60)
        a = int(255 * clamp(p * 1.5))
        d.rounded_rectangle([x0, y0, x0 + gw, y0 + gh], radius=22, fill=CARD + (a,),
                            outline=CARD_EDGE + (a,), width=3)
        bc, bd = TIER_STYLE[tier]
        d.rounded_rectangle([x0 + 20, y0 + 20, x0 + 62, y0 + 62], radius=10, fill=bc + (a,))
        d.text((x0 + 41, y0 + 41), tier, font=BLACK(26), fill=bd + (a,), anchor="mm")
        d.text((x0 + 20, y0 + 106), name, font=XBOLD(30), fill=INK + (a,), anchor="lm")
        d.text((x0 + 20, y0 + 152), short, font=MED(22), fill=MUTED + (a,), anchor="lm")
    center_text(d, 1140, GRID_FOOT, MED(28), MUTED)
    bob = int(5 * math.sin(t * 2.2))
    draw_mascot(img, 176, 340 + bob, 0.4, t)

def draw_cta(img, d, t):
    ct = t - GRID_END
    p_in = ease_out_cubic(clamp(ct / 0.4))
    slide = int((1 - p_in) * 100)
    center_text(d, 720 + slide, CTA_L1, XBOLD(58), INK)
    center_text(d, 792 + slide, CTA_L2, MED(40), MUTED)
    pop = ease_out_back(clamp(ct / 0.5))
    bw = int(640 * pop)
    if bw > 20:
        d.rounded_rectangle([W / 2 - bw / 2, 880, W / 2 + bw / 2, 990], radius=55, fill=VIOLET)
        center_text(d, 935, CTA_BTN, BLACK(64), (255, 255, 255))
    msg = CTA_MSG
    nch = int(clamp((ct - 0.6) / 1.1) * len(msg))
    center_text(d, 1080, msg[:nch] + ("_" if nch < len(msg) else ""), MED(36), MUTED)
    bob = int(6 * math.sin(t * 2.6))
    draw_mascot(img, W / 2 + 320, 1250 + bob, 0.55, t, wave=True)

def render(t):
    img = BG.copy()
    d = ImageDraw.Draw(img, "RGBA")
    draw_dots(d, t)
    draw_top_ui(d, t)
    if t < HOOK_END:
        draw_hook(img, d, t, 1.0, 1.0)
        draw_caption(img, 1420, CAP2[0])
    elif t < CYCLE_END:
        draw_cycle(img, d, t)
        draw_caption(img, 1420, CAP2[1])
    elif t < GRID_END:
        draw_grid(img, d, t)
        draw_caption(img, 1420, CAP2[2])
    else:
        draw_cta(img, d, t)
        draw_caption(img, 1420, CAP2[3])
    return img.convert("RGB")

for n in range(N):
    t = n / FPS
    render(t).save(f"{OUT}/f{n:04d}.png")
    if n % 90 == 0:
        print(f"frame {n}/{N}", flush=True)
print("done")
