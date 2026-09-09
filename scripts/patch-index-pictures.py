# -*- coding: utf-8 -*-
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
M = json.load(open(os.path.join(ROOT,'images','image-manifest.json'), encoding='utf-8'))
POSTER_MAP = {'images/castetarbaise.png':'posters/castetarbaise.png','images/affiche-castetarbe-en-fete.jpg':'posters/affiche-castetarbe-en-fete.jpg'}

def lookup(source):
    if source in POSTER_MAP: return M.get(POSTER_MAP[source])
    return M.get(source.replace('images/',''))

def pic(source, alt, sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px', cls='', fetch='', loading='lazy'):
    e = lookup(source)
    if not e:
        c = f' class="{cls}"' if cls else ''
        return f'<img src="{source}" alt="{alt}" width="800" height="600" loading="{loading}"{c}>'
    ss = ', '.join(f'{p} {w}w' for p,w in zip(e['webp'], e['widths']))
    c = f' class="{cls}"' if cls else ''
    f = f' fetchpriority="{fetch}"' if fetch else ''
    return (f'<picture><source type="image/webp" srcset="{ss}" sizes="{sizes}">'
            f'<img src="{e["jpg"]}" alt="{alt}" width="{e["sourceWidth"]}" height="{e["sourceHeight"]}" loading="{loading}"{f}{c}></picture>')

def lb(source):
    e = lookup(source)
    return e['webp'][-1] if e and e.get('webp') else (e['jpg'] if e else source)

html = open(os.path.join(ROOT,'index.html'), encoding='utf-8').read()
cards = [
 ('pachera','images/chemins/Pachera/Pachera-01.jpg','Le chemin Pachera'),
 ('jacob','images/chemins/Jacob/Jacob-01.jpg','Le chemin Jacob'),
 ('barricots','images/chemins/Barricots/Barricots-01.jpg','Le chemin des Barricots'),
 ('touya','images/chemins/Menain-Touya/Menain-Touya-01.jpg','Le chemin de Touya'),
 ('menain','images/chemins/Menain-Touya/Menain-Touya-02.jpg','Le chemin de Menain'),
 ('justine','images/chemins/Justine-Peyraube/Justine-Peyraube-01.jpg','Le chemin de Justine — en chantier'),
 ('beller','images/chemins/Beller/Beller-01.jpg','Le chemin Beller'),
 ('des-cretes','images/chemins/des-cretes/des-cretes-01.jpg','Le chemin des crêtes'),
 ('du-lac','images/chemins/du-lac/du-lac-01.jpg','Le chemin du lac'),
 ('lalanne','images/chemins/Lalanne/Lalanne-01.jpg','Le chemin Lalanne'),
 ('lasserre','images/chemins/Lasserre/Lasserre-01.jpg','Le chemin Lasserre'),
]
for tid, src, alt in cards:
    html = re.sub(rf'(<article[^>]*data-trail="{tid}"[\s\S]*?<div class="trail-card__image">\s*)<img[^>]+>',
                  rf'\1{pic(src,alt)}', html, count=1)

he = lookup('images/legacy/hero.jpg')
hss = ', '.join(f'{p} {w}w' for p,w in zip(he['webp'], he['widths']))
html = re.sub(r'<div class="hero__bg">\s*<img[\s\S]*?</div>\s*<div class="hero__overlay">',
    f'<div class="hero__bg">\n        <picture><source type="image/webp" srcset="{hss}" sizes="100vw"><img src="{he["jpg"]}" alt="Chemins de Castétarbe" class="hero__bg-img" width="{he["sourceWidth"]}" height="{he["sourceHeight"]}" fetchpriority="high"></picture>\n        <div class="hero__overlay">', html, count=1)

html = re.sub(r'(<div class="about__visual reveal">\s*)<img[\s\S]*?loading="lazy"\s*>',
    rf'\1{pic("images/legacy/apropos.jpg","Un chemin entretenu par l\'association", sizes="(max-width: 768px) 100vw, 50vw")}', html, count=1)

PS = '(max-width: 640px) 100vw, 800px'
for local in ['images/legacy/plan-chemins-castetarbe.png','images/legacy/plan-8-5km.png']:
    html = re.sub(rf'data-lightbox="[^"]*"\s*aria-label="([^"]*)"[\s\S]*?<img src="{re.escape(local.replace("images/legacy/","images/legacy/"))}[^"]*"[^>]*>',
                  'TEMP', html)  # skip complex

# Replace external URLs in data-lightbox and img src
repls = {
 'https://www.lescheminsdecastetarbe.fr/wp-content/uploads/2022/01/carte-des-chemins-Castetarbe.png': ('images/legacy/plan-chemins-castetarbe.png', 'Plan'),
 'https://www.lescheminsdecastetarbe.fr/wp-content/uploads/2019/04/85-km-1024x640.png': ('images/legacy/plan-8-5km.png', 'Plan'),
}
for old, (local, alt) in repls.items():
    html = html.replace(f'data-lightbox="{old}"', f'data-lightbox="{lb(local)}"')
    e = lookup(local)
    html = html.replace(f'src="{old}"', f'src="{e["jpg"]}"')

# Event posters
html = html.replace('data-lightbox="images/castetarbaise.png"', f'data-lightbox="{lb("images/castetarbaise.png")}"')
html = html.replace('src="images/castetarbaise.png"', f'src="{lookup("images/castetarbaise.png")["jpg"]}"')
old_ev = 'images/702612740_1390186716468098_5944499274401343429_n.jpg'
html = html.replace(old_ev, lookup('images/affiche-castetarbe-en-fete.jpg')['jpg'])
html = html.replace(f'data-lightbox="{old_ev}"', f'data-lightbox="{lb("images/affiche-castetarbe-en-fete.jpg")}"')

open(os.path.join(ROOT,'index.html'),'w',encoding='utf-8').write(html)
print('patched')
