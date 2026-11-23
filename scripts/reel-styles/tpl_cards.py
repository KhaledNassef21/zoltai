import math, random, numpy as np, wave
from PIL import Image, ImageDraw, ImageFont, ImageFilter
W,H,FPS,DUR=1080,1920,30,17.3
N=int(FPS*DUR)
FD='/usr/share/fonts/truetype/noto/'
def F(s,b='Black'): return ImageFont.truetype(FD+f'NotoSans-{b}.ttf',s)
BG=(12,10,28); PUR=(124,92,255); TEAL=(45,212,191); PINK=(255,107,157); WH=(245,243,255); GR=(160,155,190)
def ease(t): t=max(0,min(1,t)); return 1-(1-t)**3
def seg(t,a,b): return ease((t-a)/(b-a))
# own-art panel wall
random.seed(7)
pal=[PUR,TEAL,PINK,(90,140,255),(255,190,80)]
def panel(w,h,k):
    im=Image.new('RGB',(w,h),tuple(int(c*0.35) for c in random.choice(pal)))
    d=ImageDraw.Draw(im); c1=random.choice(pal); c2=random.choice(pal)
    if k==0:
        for i in range(6):
            x0=random.randint(-w//3,w//2); y0=random.randint(-h//3,h//2)
            d.ellipse([x0,y0,x0+random.randint(w//3,w),y0+random.randint(h//3,h)],outline=c1,width=6)
    elif k==1:
        for x in range(0,w,22): d.rectangle([x,h-random.randint(30,h-20),x+14,h],fill=c1)
    elif k==2:
        for y in range(0,h,26): d.line([(0,y+10*math.sin(y)),(w,y+30)],fill=c2,width=5)
    elif k==3:
        d.polygon([(w//2,10),(w-10,h-10),(10,h-10)],fill=c1); d.ellipse([w//2-30,h//2,w//2+30,h//2+60],fill=c2)
    else:
        for i in range(40): x,y=random.randint(0,w),random.randint(0,h); d.ellipse([x,y,x+8,y+8],fill=c2)
        d.arc([w//4,h//4,w*3//4,h*3//4],0,270,fill=c1,width=10)
    return im
cols,rows,pw,ph=4,6,300,420
wall=Image.new('RGB',(cols*pw,rows*ph*2))
for r in range(rows*2):
    for c in range(cols):
        wall.paste(panel(pw-12,ph-12,random.randint(0,4)),(c*pw+6,r*ph+6))
wall=wall.filter(ImageFilter.GaussianBlur(2))
dark=Image.new('RGB',wall.size,BG)
wall=Image.blend(wall,dark,0.62)
def text_c(d,xy,s,font,fill,anchor='mm'): d.text(xy,s,font=font,fill=fill,anchor=anchor)
def glow(img,box_fn,color,r=30):
    g=Image.new('RGB',(W,H),(0,0,0)); box_fn(ImageDraw.Draw(g),color)
    g=g.filter(ImageFilter.GaussianBlur(r))
    return Image.fromarray(np.clip(np.asarray(img,dtype=np.int16)+np.asarray(g,dtype=np.int16)*0.8,0,255).astype('uint8'))
cards=[("ChatGPT","All-rounder","Brainstorming, drafts, quick answers",TEAL),
       ("Claude","Long reads","Big documents, careful writing",PINK),
       ("Gemini","Google fit","Works with Docs, Gmail and Search",(90,140,255))]

HOOK_BIG = "AI"
HOOK_SMALL = "chatbots"
HOOK_Q = "Which one fits your job?"
PANEL_L1 = "Pick by the job,"
PANEL_L2 = "not the hype"
MAPPING = [("Drafts & ideas", "ChatGPT", TEAL), ("Long documents", "Claude", PINK), ("Google apps", "Gemini", (90, 140, 255))]
CTA_L1 = "Full comparison"
CTA_L2 = "on zoltai.org"
CTA_BTN = "Link in bio"
NC = len(cards)
import json as _json, sys as _sys
if len(_sys.argv) > 1:
    _C = _json.load(open(_sys.argv[1]))
    if "cards" in _C:
        cards = [(c["name"], c["tag"], c["desc"], tuple(c["color"])) for c in _C["cards"]]
        assert len(cards) == 3, "style4 takes exactly 3 cards"
    if "hook" in _C:
        HOOK_BIG = _C["hook"].get("big", HOOK_BIG)
        HOOK_SMALL = _C["hook"].get("small", HOOK_SMALL)
        HOOK_Q = _C["hook"].get("q", HOOK_Q)
    if "panel" in _C:
        PANEL_L1 = _C["panel"].get("l1", PANEL_L1)
        PANEL_L2 = _C["panel"].get("l2", PANEL_L2)
        MAPPING = [(m["job"], m["tool"], tuple(m["color"])) for m in _C["panel"].get("mapping", MAPPING)]
    if "cta" in _C:
        CTA_L1 = _C["cta"].get("l1", CTA_L1)
        CTA_L2 = _C["cta"].get("l2", CTA_L2)
        CTA_BTN = _C["cta"].get("button", CTA_BTN)
    NC = len(cards)

def frame(i):
    t=i/FPS
    off=int((t*40)%(rows*ph))
    img=wall.crop((0,off,W,off+H)).copy() if wall.width>=W else None
    img=wall.crop((0,off,cols*pw,off+H)).resize((W,H)) if cols*pw!=W else img
    d=ImageDraw.Draw(img,'RGBA')
    # vignette bands to keep safe-center readable
    d.rectangle([0,0,W,H],fill=(12,10,28,70))
    # brand mark (top, outside safe square is fine; also tiny)
    d.rounded_rectangle([60,110,130,180],14,fill=PUR); text_c(d,(95,145),"Z",F(46),WH)
    d.text((148,145),"zoltai.org",font=F(34,'Bold'),fill=WH,anchor='lm')
    # progress bar
    d.rectangle([60,1780,60+(W-120)*t/DUR,1788],fill=PUR+(255,))
    if t<3.2:
        a=seg(t,0,0.4); n=int(round(NC*seg(t,0.3,1.4)))
        cy=800
        d.rounded_rectangle([110,cy-230,W-110,cy+150],40,fill=(8,6,20,215),outline=PUR+(255,),width=4)
        sc=1+0.06*math.sin(min(1,(t-1.4)*3)*math.pi) if t>1.4 else 1
        text_c(d,(W//2-120,cy-40),str(n),F(int(330*sc)),TEAL)
        text_c(d,(W//2+130,cy-85),HOOK_BIG,F(110),WH); text_c(d,(W//2+130,cy+30),HOOK_SMALL,F(80,'Bold'),WH)
        s=seg(t,1.2,1.9)
        text_c(d,(W//2,cy+215+int(40*(1-s))),HOOK_Q,F(66,'ExtraBold'),(255,255,255,int(255*s)))
    elif t<12.8:
        k=min(NC-1,int((t-3.2)//3.2)); lt=(t-3.2)-k*3.2
        name,tag,desc,col=cards[k]
        s=seg(lt,0,0.45); out=1-seg(lt,2.9,3.2) if k<NC-1 or t>12.2 else 1
        out=1-seg(lt,2.9,3.2) if lt>2.9 else 1
        x0=int(W*(1-s)*0.6)+int((1-out)*-W*0.6)
        cy=830
        d.rounded_rectangle([110+x0,cy-300,W-110+x0,cy+300],44,fill=(8,6,20,225),outline=col+(255,),width=5)
        text_c(d,(W//2+x0,cy-170),f"{k+1}/{NC}",F(48,'Bold'),GR)
        text_c(d,(W//2+x0,cy-60),name,F(150),col)
        text_c(d,(W//2+x0,cy+60),tag,F(80,'ExtraBold'),WH)
        # wrap desc
        words=desc.split(); lines=[]; cur=''
        for w in words:
            if d.textlength((cur+' '+w).strip(),font=F(48,'Bold'))>W-330: lines.append(cur); cur=w
            else: cur=(cur+' '+w).strip()
        lines.append(cur)
        for j,l in enumerate(lines): text_c(d,(W//2+x0,cy+160+j*58),l,F(48,'Bold'),GR)
        # type-on underline
        d.rectangle([260+x0,cy+272,260+x0+int(560*seg(lt,0.3,1.2)),cy+278],fill=col+(255,))
    elif t<15.5:
        lt=t-12.8; s=seg(lt,0,0.5); cy=830
        d.rounded_rectangle([110,cy-330,W-110,cy+330],44,fill=(8,6,20,225),outline=PUR+(255,),width=4)
        text_c(d,(W//2,cy-220),PANEL_L1,F(78),WH); text_c(d,(W//2,cy-125),PANEL_L2,F(78),TEAL)
        for j,(a,b,c) in enumerate(MAPPING):
            e=seg(lt,0.5+j*0.35,1.0+j*0.35); y=cy-10+j*135
            xx=int((1-e)*90)
            d.rounded_rectangle([170+xx,y-50,W-170+xx,y+50],26,fill=c+(int(60*e),),outline=c+(int(255*e),),width=3)
            d.text((210+xx,y),a,font=F(42,'Bold'),fill=WH,anchor='lm'); d.text((W-210+xx,y),b,font=F(42,'Black'),fill=c,anchor='rm')
    else:
        lt=t-15.5; s=seg(lt,0,0.5); cy=830
        d.rounded_rectangle([110,cy-280,W-110,cy+280],44,fill=(8,6,20,225),outline=PUR+(255,),width=4)
        text_c(d,(W//2,cy-150),CTA_L1,F(88),WH)
        text_c(d,(W//2,cy-40),CTA_L2,F(88),TEAL)
        pulse=1+0.04*math.sin(lt*6)
        d.rounded_rectangle([W//2-250,cy+60,W//2+250,cy+160],50,fill=PUR)
        text_c(d,(W//2,cy+110),CTA_BTN,F(int(52*pulse),'ExtraBold'),WH)
    return img
import sys
for i in range(N):
    fr=frame(i)
    fr.save(f'f/{i:04d}.png')
# audio: soft pad + ticks on scene changes
sr=44100; n=int(sr*DUR); x=np.zeros(n)
tt=np.arange(n)/sr
for f0,g in [(110,.10),(164.8,.07),(220,.06),(277.2,.04)]:
    x+=g*np.sin(2*np.pi*f0*tt)*(0.7+0.3*np.sin(2*np.pi*0.25*tt))
beat=0.5
for b in np.arange(0,DUR,beat):
    i0=int(b*sr); L=int(0.08*sr); e=np.exp(-np.arange(L)/(0.02*sr))
    x[i0:i0+L]+=0.12*np.sin(2*np.pi*(80 if int(b/beat)%2==0 else 1200)*np.arange(L)/sr)*e
for b in [0.3,3.2,6.4,9.6,12.8,15.5]:
    i0=int(b*sr); L=int(0.5*sr); e=np.linspace(1,0,L)**2
    sw=np.sin(2*np.pi*(300+1500*np.linspace(0,1,L)**2)*np.arange(L)/sr)
    x[i0:i0+L]+=0.10*sw*e
fade=np.minimum(1,np.minimum(tt/0.5,(DUR-tt)/1.0)); x*=fade
x=x/np.max(np.abs(x))*0.6
with wave.open('a.wav','wb') as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((x*32767).astype('<i2').tobytes())
