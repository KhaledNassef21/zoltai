#!/usr/bin/env python3
"""Zoltai reel v3: pixel-art step narrative (ref reel 2 style). 360x640 canvas upscaled 3x."""
import math, os, random
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
CW, CH = 360, 640          # pixel canvas
SC = 3
FPS = 30
DUR = 20.0
N = int(FPS * DUR)
OUT = "/tmp/zoltai_reel/frames3"
os.makedirs(OUT, exist_ok=True)

DARK = (18, 12, 34)
PANEL = (30, 22, 56)
EDGE = (86, 64, 156)
PURPLE = (139, 92, 246)
PURPLE_D = (88, 56, 170)
INK = (240, 236, 255)
MUT = (150, 142, 180)
GOLD = (250, 190, 40)
GREEN = (74, 222, 128)
RED = (248, 113, 113)
BLUE = (96, 165, 250)
WHITE = (255, 255, 255)

F = "/usr/share/fonts/truetype/noto/"
def font(name, size): return ImageFont.truetype(F + name, size)
PBLACK = lambda s: font("NotoSansMono-Black.ttf", s)
PBOLD = lambda s: font("NotoSansMono-Bold.ttf", s)

def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))

# pixel stars
random.seed(11)
STARS = [(random.randint(2, CW - 3), random.randint(2, CH - 60), random.uniform(0, 6.28)) for _ in range(40)]

def bg(t):
    img = Image.new("RGB", (CW, CH), DARK)
    d = ImageDraw.Draw(img)
    for (x, y, ph) in STARS:
        on = math.sin(t * 2 + ph) > -0.2
        if on:
            d.point((x, y), fill=(120, 110, 170))
    # ground
    d.rectangle([0, CH - 46, CW, CH], fill=(26, 18, 48))
    for x in range(0, CW, 12):
        d.rectangle([x, CH - 46, x + 5, CH - 44], fill=(40, 30, 72))
    return img

def px(d, x, y, w, h, c):
    w, h = int(w), int(h)
    if w < 1 or h < 1:
        return
    d.rectangle([int(x), int(y), int(x) + w - 1, int(y) + h - 1], fill=c)

def draw_zolt(d, x, y, t, wave=False, s=2):
    """Pixel Zolt: blocky bolt-bot. x,y = top-left, s = block size."""
    hop = -s if (t * 4) % 1 < 0.5 else 0
    y += hop
    B = s
    def rect(cx, cy, w, h, c): px(d, x + cx * B, y + cy * B, w * B, h * B, c)
    # antenna bolt
    rect(3, -2, 2, 1, GOLD); rect(2, -1, 2, 1, GOLD); rect(3, 0, 2, 1, GOLD)
    # head
    rect(0, 1, 8, 6, PURPLE)
    rect(0, 1, 8, 1, PURPLE_D)
    # face
    rect(1, 2, 6, 4, (24, 16, 46))
    blink = (t % 3.0) < 2.85
    if blink:
        rect(2, 3, 1, 1, WHITE); rect(5, 3, 1, 1, WHITE)
    else:
        rect(2, 3, 1, 1, (70, 60, 110)); rect(5, 3, 1, 1, (70, 60, 110))
    rect(3, 5, 2, 1, GOLD)  # smile
    # arms
    rect(-1, 3, 1, 2, PURPLE_D)
    if wave and (t * 6) % 1 < 0.5:
        rect(8, 1, 1, 2, PURPLE_D)
    else:
        rect(8, 3, 1, 2, PURPLE_D)
    # feet
    rect(1, 7, 2, 1, PURPLE_D); rect(5, 7, 2, 1, PURPLE_D)

def bubble(d, x, y, w, h, text, tail="left"):
    px(d, x, y, w, h, WHITE)
    px(d, x, y, w, 2, (210, 205, 230))
    if tail == "left":
        px(d, x + 6, y + h, 6, 4, WHITE)
        px(d, x + 4, y + h + 4, 4, 4, WHITE)
    else:
        px(d, x + w - 12, y + h, 6, 4, WHITE)
        px(d, x + w - 8, y + h + 4, 4, 4, WHITE)
    d.text((x + w / 2, y + h / 2 + 1), text, font=PBOLD(11), fill=(30, 20, 55), anchor="mm")

def step_badge(d, n):
    px(d, 128, 40, 104, 26, GOLD)
    d.text((180, 53), f"STEP 0{n}", font=PBLACK(14), fill=(40, 26, 4), anchor="mm")

def top_ui(d, t):
    d.text((10, 12), "ZOLTAI", font=PBLACK(13), fill=INK)
    px(d, 12, 28, 30, 3, GOLD)
    px(d, 10, 34, int((CW - 20) * clamp(t / DUR)), 2, PURPLE)

def center(d, y, s, f, c=INK):
    d.text((CW / 2, y), s, font=f, fill=c, anchor="mm")

# ---------- step visuals ----------
def vis_notepad(d, lt):
    px(d, 70, 180, 220, 210, PANEL); px(d, 70, 180, 220, 14, EDGE)
    d.text((180, 187), "WHAT I NEED", font=PBOLD(9), fill=INK, anchor="mm")
    items = ["write emails", "edit images", "plan posts"]
    for i, it in enumerate(items):
        nch = int(clamp((lt - 0.3 - i * 0.7) / 0.6) * len(it))
        if nch <= 0: continue
        y = 220 + i * 52
        px(d, 88, y, 12, 12, DARK); px(d, 88, y, 12, 2, EDGE)
        d.text((110, y + 6), it[:nch], font=PBOLD(11), fill=INK, anchor="lm")

def vis_shortlist(d, lt):
    names = ["tool A", "tool B", "tool C"]
    marks = [GREEN, GREEN, RED]
    for i in range(3):
        x = 52 + i * 92
        pop = clamp((lt - 0.2 - i * 0.35) / 0.25)
        if pop <= 0: continue
        h = int(150 * pop)
        px(d, x, 300 - h, 76, h, PANEL)
        px(d, x, 300 - h, 76, 10, EDGE)
        d.text((x + 38, 292), names[i], font=PBOLD(10), fill=INK, anchor="mm")
        mp = clamp((lt - 1.3 - i * 0.3) / 0.2)
        if mp > 0:
            c = marks[i]
            px(d, x + 26, 318, 24, 24, c)
            if c == GREEN:
                d.line([(x + 31, 330), (x + 36, 336), (x + 45, 322)], fill=DARK, width=3)
            else:
                d.line([(x + 31, 323), (x + 45, 337)], fill=DARK, width=3)
                d.line([(x + 45, 323), (x + 31, 337)], fill=DARK, width=3)

def vis_price(d, lt):
    d.text((90, 190), "monthly", font=PBOLD(10), fill=MUT, anchor="mm")
    d.text((270, 190), "yearly/mo", font=PBOLD(10), fill=MUT, anchor="mm")
    p1 = clamp((lt - 0.3) / 0.8); p2 = clamp((lt - 0.9) / 0.8)
    px(d, 50, 210, int(80 * p1), 40, RED)
    px(d, 230, 210, int(80 * p2), 40, GREEN)
    d.text((90, 230), "$30", font=PBLACK(13), fill=WHITE, anchor="mm")
    d.text((270, 230), "$20", font=PBLACK(13), fill=DARK, anchor="mm")
    if lt > 1.7:
        px(d, 70, 300, 220, 60, PANEL); px(d, 70, 300, 220, 8, GOLD)
        d.text((180, 330), "yearly = 2 months free", font=PBOLD(10), fill=GOLD, anchor="mm")

def vis_review(d, lt):
    px(d, 80, 170, 200, 230, PANEL); px(d, 80, 170, 200, 12, EDGE)
    for i in range(5):
        x = 108 + i * 30
        fill = GOLD if i < 4 and lt > 0.4 + i * 0.25 else (60, 50, 95)
        px(d, x, 200, 18, 18, fill)
        px(d, x + 5, 195, 8, 4, fill)
    for i in range(4):
        p = clamp((lt - 1.8 - i * 0.2) / 0.2)
        if p <= 0: continue
        px(d, 100, 250 + i * 30, int(160 * (0.9 - i * 0.15) * p), 8, (120, 110, 160))

STEPS = [
    ("know what you need", vis_notepad, "start with YOUR tasks"),
    ("shortlist 2-3 tools", vis_shortlist, "more than 3 = overwhelm"),
    ("check the real price", vis_price, "yearly is usually cheaper"),
    ("read honest reviews", vis_review, "no hype, no sponsored picks"),
]
HOOK_END = 2.5
STEP_WIN = 3.25
CTA_START = HOOK_END + 4 * STEP_WIN   # 15.5

# ---------- parametric content (optional JSON config as argv[1]) ----------
VIS_MAP = {"notepad": vis_notepad, "shortlist": vis_shortlist, "price": vis_price, "review": vis_review}
P_HOOK = ["HOW TO PICK", "AN AI TOOL", "IN 2026"]
P_HOOK_SUB = "4 steps. no hype."
P_HOOK_BUBBLE = "easy!"
P_CTA_L1 = "HONEST AI"
P_CTA_L2 = "TOOL REVIEWS"
P_CTA_BTN = "zoltai.org"
P_CTA_MSG = "new reviews every week"
P_CTA_BUBBLE = "see you!"

import json as _json, sys as _sys
if len(_sys.argv) > 1:
    _C = _json.load(open(_sys.argv[1]))
    if "steps" in _C:
        STEPS = [(_s["title"], VIS_MAP.get(_s.get("vis", "notepad"), vis_notepad), _s["tip"]) for _s in _C["steps"]]
        STEP_WIN = 13.0 / len(STEPS)
        CTA_START = HOOK_END + len(STEPS) * STEP_WIN
    if "hook" in _C:
        P_HOOK = _C["hook"].get("lines", P_HOOK)
        P_HOOK_SUB = _C["hook"].get("sub", P_HOOK_SUB)
        P_HOOK_BUBBLE = _C["hook"].get("bubble", P_HOOK_BUBBLE)
    if "cta" in _C:
        P_CTA_L1 = _C["cta"].get("l1", P_CTA_L1)
        P_CTA_L2 = _C["cta"].get("l2", P_CTA_L2)
        P_CTA_BTN = _C["cta"].get("button", P_CTA_BTN)
        P_CTA_MSG = _C["cta"].get("msg", P_CTA_MSG)
        P_CTA_BUBBLE = _C["cta"].get("bubble", P_CTA_BUBBLE)


def render(t):
    img = bg(t)
    d = ImageDraw.Draw(img)
    top_ui(d, t)
    if t < HOOK_END:
        p = clamp(t / 0.35)
        yy = int((1 - p) * 40)
        for _i, _ln in enumerate(P_HOOK):
            center(d, 240 + _i * 50 + yy, _ln, PBLACK(30), [INK, GOLD, INK][_i % 3])
        center(d, 240 + len(P_HOOK) * 50 + yy, P_HOOK_SUB, PBOLD(12), MUT)
        draw_zolt(d, 250, 470, t, wave=True, s=4)
        if t > 0.9:
            bubble(d, 130, 440, 96, 30, P_HOOK_BUBBLE, tail="right")
    elif t < CTA_START:
        st = t - HOOK_END
        idx = min(int(st / STEP_WIN), len(STEPS) - 1)
        lt = st - idx * STEP_WIN
        title, vis, tip = STEPS[idx]
        pin = clamp(lt / 0.3)
        off = int((1 - pin) * 30)
        step_badge(d, idx + 1)
        center(d, 110 + off, title, PBLACK(17), INK)
        vis(d, lt)
        # tip line
        if lt > 1.9:
            center(d, 450, tip, PBOLD(11), GOLD)
        draw_zolt(d, 24, 540, t, s=3)
    else:
        ct = t - CTA_START
        p = clamp(ct / 0.4)
        yy = int((1 - p) * 40)
        center(d, 230 + yy, P_CTA_L1, PBLACK(28), INK)
        center(d, 272 + yy, P_CTA_L2, PBLACK(28), INK)
        if ct > 0.5:
            px(d, 90, 320, 180, 44, PURPLE)
            center(d, 342, P_CTA_BTN, PBLACK(18), WHITE)
        msg = P_CTA_MSG
        nch = int(clamp((ct - 0.9) / 0.8) * len(msg))
        center(d, 410, msg[:nch] + ("_" if nch < len(msg) else ""), PBOLD(11), MUT)
        draw_zolt(d, 160, 480, t, wave=True, s=4)
        if ct > 1.8:
            bubble(d, 218, 452, 100, 30, P_CTA_BUBBLE, tail="left")
    return img.resize((W, H), Image.NEAREST)

for n in range(N):
    render(n / FPS).save(f"{OUT}/f{n:04d}.png")
    if n % 120 == 0:
        print(f"frame {n}/{N}", flush=True)
print("done")
