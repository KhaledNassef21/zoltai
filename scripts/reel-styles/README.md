# Zoltai code-rendered reel templates (Khaled-approved Nov 23, 2026)
Render: bash /tmp/zoltai_reel/render_style.sh <style> <config.json|-> <out.mp4>
Pass "-" to get the approved default video (bit-identical to the approved prototypes).
All styles: 1080x1920, 30fps, procedural music only (no voiceover), no "Made with AI" pill
(platform AI-label toggle stays ON at upload). Honest copy, no income claims.
Styles:
- tierlist (27.5s): hook -> N tier beats (S/A/B...) -> rule -> CTA.
  Config keys: hook{lines:[[text,colorName]...] (INK/GOLD/VIOLET_L), sub, badge},
  tiers:[{letter,title,subtitle,items:[[name,desc]...]}...], captions (one per beat:
  hook, each tier, rule, cta; each [[part,highlight]...]), rule{l1,l2,sub}, cta{l1,l2,button,msg}
- stylelist (22.5s): hook -> per-tool cycle with animated preview card -> grid -> CTA. Max 6 tools.
  Config: tools:[{name,tier(S/A/B),oneline,accent[r,g,b],short,scene}] scene in
  chatgpt|claude|gemini|midjourney|elevenlabs|perplexity (anything else = generic bars scene),
  hook{l1,l2,sub,badge}, cycle_head, grid_head, grid_foot, captions[4], cta{...}
- pixel (20s): pixel-art steps explainer. Config: hook{lines,sub,bubble},
  steps:[{title,vis,tip}] vis in notepad|shortlist|price|review, cta{l1,l2,button,msg,bubble}
- cards (16s): number countdown -> 3 tool cards -> "pick by the job" mapping -> CTA.
  Exactly 3 cards. Config: cards:[{name,tag,desc,color[r,g,b]}x3], hook{big,small,q},
  panel{l1,l2,mapping:[{job,tool,color}]}, cta{l1,l2,button}
