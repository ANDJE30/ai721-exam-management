#!/usr/bin/env python3
"""Assemble AI721_ASTRA_LUZ_2.0 : version artefact (bibliothèques CDN) et version hors ligne (tout embarqué)."""
import pathlib, sys, re
ROOT = pathlib.Path(__file__).resolve().parent
DIST = ROOT.parent / 'dist'
LIBDIR = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else None

CDN = [
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.6/JsBarcode.all.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
]
LOCAL = [
    'jspdf-2.5.1/package/dist/jspdf.umd.min.js',
    'jspdf-autotable-3.8.2/package/dist/jspdf.plugin.autotable.min.js',
    'jsbarcode-3.11.6/package/dist/JsBarcode.all.min.js',
    'xlsx-0.18.5/package/dist/xlsx.full.min.js',
]
FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,650;12..96,800&family=JetBrains+Mono:wght@400;600&family=Public+Sans:wght@400;500;600;700&display=swap">'

css = (ROOT / 'style.css').read_text(encoding='utf-8')
js = '\n'.join(p.read_text(encoding='utf-8') for p in sorted((ROOT / 'js').glob('*.js')))
head = '<title>AI721_ASTRA_LUZ_2.0</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<meta name="description" content="Suivi des évaluations à anonymat par code-barres, second cycle">\n'

def page(lib_tags):
    return f"{head}{FONTS}\n<style>\n{css}\n</style>\n<div id=\"app\"></div>\n{lib_tags}\n<script>\n{js}\n</script>\n"

DIST.mkdir(exist_ok=True)
art = page('\n'.join(f'<script src="{u}"></script>' for u in CDN))
(DIST / 'artifact.html').write_text(art, encoding='utf-8')

if LIBDIR:
    inline = '\n'.join('<script>\n' + (LIBDIR / p).read_text(encoding='utf-8').replace('</script', '<\\/script') + '\n</script>' for p in LOCAL)
    off = ('<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
           + head + FONTS + f'\n<style>\n{css}\n</style>\n</head>\n<body>\n<div id="app"></div>\n{inline}\n<script>\n{js}\n</script>\n</body>\n</html>\n')
    (DIST / 'AI721_ASTRA_LUZ_2.0_hors_ligne.html').write_text(off, encoding='utf-8')
print('artifact.html', len(art) // 1024, 'Kio')

# ---------------------------------------------------------------------------
# Version web hébergée (GitHub Pages / Firebase Hosting) : dist/web
# ---------------------------------------------------------------------------
import shutil, hashlib, json
if LIBDIR:
    WEB = DIST / 'web'
    if WEB.exists(): shutil.rmtree(WEB)
    for d in ['assets', 'vendor', 'icons', 'fonts']: (WEB / d).mkdir(parents=True, exist_ok=True)
    reset = 'html{-webkit-text-size-adjust:100%}body{margin:0}img{max-width:100%}\n:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}\n'
    app_css = reset + css
    (WEB / 'assets' / 'app.css').write_text(app_css, encoding='utf-8')
    (WEB / 'assets' / 'app.js').write_text(js, encoding='utf-8')
    vend = {
        'jspdf.umd.min.js': 'jspdf-2.5.1/package/dist/jspdf.umd.min.js',
        'jspdf.plugin.autotable.min.js': 'jspdf-autotable-3.8.2/package/dist/jspdf.plugin.autotable.min.js',
        'JsBarcode.all.min.js': 'jsbarcode-3.11.6/package/dist/JsBarcode.all.min.js',
        'xlsx.full.min.js': 'xlsx-0.18.5/package/dist/xlsx.full.min.js',
        'firebase-app-compat.js': 'firebase-10.12.2/package/firebase-app-compat.js',
        'firebase-auth-compat.js': 'firebase-10.12.2/package/firebase-auth-compat.js',
        'firebase-firestore-compat.js': 'firebase-10.12.2/package/firebase-firestore-compat.js',
    }
    for k, v in vend.items():
        txt = (LIBDIR / v).read_text(encoding='utf-8')
        txt = re.sub(r'//# sourceMappingURL=\S+', '', txt)
        (WEB / 'vendor' / k).write_text(txt, encoding='utf-8')
    fonts = {
        'public-sans-400.woff2': 'fontsource-public-sans-5.0.18/package/files/public-sans-latin-400-normal.woff2',
        'public-sans-500.woff2': 'fontsource-public-sans-5.0.18/package/files/public-sans-latin-500-normal.woff2',
        'public-sans-600.woff2': 'fontsource-public-sans-5.0.18/package/files/public-sans-latin-600-normal.woff2',
        'public-sans-700.woff2': 'fontsource-public-sans-5.0.18/package/files/public-sans-latin-700-normal.woff2',
        'jetbrains-mono-400.woff2': 'fontsource-jetbrains-mono-5.0.20/package/files/jetbrains-mono-latin-400-normal.woff2',
        'jetbrains-mono-600.woff2': 'fontsource-jetbrains-mono-5.0.20/package/files/jetbrains-mono-latin-600-normal.woff2',
        'bricolage-grotesque-var.woff2': 'fontsource-variable-bricolage-grotesque-5.3.0/package/files/bricolage-grotesque-latin-wght-normal.woff2',
    }
    for k, v in fonts.items(): shutil.copy(LIBDIR / v, WEB / 'fonts' / k)
    ff = ''.join(f"@font-face{{font-family:'Public Sans';font-style:normal;font-weight:{w};font-display:swap;src:url(../fonts/public-sans-{w}.woff2) format('woff2')}}\n" for w in (400, 500, 600, 700))
    ff += ''.join(f"@font-face{{font-family:'JetBrains Mono';font-style:normal;font-weight:{w};font-display:swap;src:url(../fonts/jetbrains-mono-{w}.woff2) format('woff2')}}\n" for w in (400, 600))
    ff += "@font-face{font-family:'Bricolage Grotesque';font-style:normal;font-weight:200 800;font-display:swap;src:url(../fonts/bricolage-grotesque-var.woff2) format('woff2-variations'),url(../fonts/bricolage-grotesque-var.woff2) format('woff2')}\n"
    (WEB / 'assets' / 'fonts.css').write_text(ff, encoding='utf-8')
    for f in (ROOT / 'web' / 'icons').glob('*.png'): shutil.copy(f, WEB / 'icons' / f.name)
    for f in ['firestore.rules']: shutil.copy(ROOT / 'web' / f, WEB / f)
    cfg_src = ROOT / 'web' / 'config.js'
    h = hashlib.sha1((app_css + js + (cfg_src.read_text(encoding='utf-8') if cfg_src.exists() else '')).encode()).hexdigest()[:10]
    (WEB / 'config.js').write_text(cfg_src.read_text(encoding='utf-8') if cfg_src.exists() else "window.ASTRA_FIREBASE_CONFIG = null;\n", encoding='utf-8')
    manifest = {"name": "AI721 ASTRA LUZ 2.0 · Secrétariat des évaluations", "short_name": "ASTRA LUZ", "description": "Suivi des évaluations du second cycle avec anonymat par code-barres",
                "lang": "fr", "start_url": "./", "scope": "./", "display": "standalone", "background_color": "#0B1633", "theme_color": "#0B1633",
                "icons": [{"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
                          {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}
    (WEB / 'manifest.webmanifest').write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding='utf-8')
    core = ['./', 'index.html', f'assets/app.css?v={h}', f'assets/app.js?v={h}', 'assets/fonts.css', 'config.js', 'vendor/JsBarcode.all.min.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-32.png'] + [f'fonts/{k}' for k in fonts]
    sw = (ROOT / 'web' / 'sw.js').read_text(encoding='utf-8').replace('__VERSION__', h).replace('__CORE__', json.dumps(core))
    (WEB / 'sw.js').write_text(sw, encoding='utf-8')
    index = f"""<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>AI721_ASTRA_LUZ_2.0 · Secrétariat des évaluations</title>
<meta name="description" content="Suivi des évaluations du second cycle avec anonymat par code-barres : planning, salles, codes, saisie à la douchette, levée d'anonymat et éditions PDF.">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#0B1633">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="icons/icon-32.png">
<link rel="apple-touch-icon" href="icons/icon-180.png">
<link rel="stylesheet" href="assets/fonts.css">
<link rel="stylesheet" href="assets/app.css?v={h}">
</head>
<body>
<div id="app"></div>
<noscript><p style="padding:24px;font-family:sans-serif">Activez JavaScript pour utiliser AI721_ASTRA_LUZ_2.0.</p></noscript>
<script>window.ASTRA_WEB = true;</script>
<script src="config.js?v={h}"></script>
<script src="vendor/JsBarcode.all.min.js"></script>
<script src="assets/app.js?v={h}"></script>
</body>
</html>
"""
    (WEB / 'index.html').write_text(index, encoding='utf-8')
    (WEB / '.nojekyll').write_text('', encoding='utf-8')
    (WEB / 'robots.txt').write_text('User-agent: *\nDisallow: /\n', encoding='utf-8')
    (WEB / 'firebase.json').write_text(json.dumps({"firestore": {"rules": "firestore.rules"}, "hosting": {"public": ".", "ignore": ["firebase.json", "firestore.rules", "README.md", "**/.*"]}}, indent=2), encoding='utf-8')
    readme = ROOT / 'web' / 'README.md'
    if readme.exists(): shutil.copy(readme, WEB / 'README.md')
    print('web', h, sum(f.stat().st_size for f in WEB.rglob('*') if f.is_file()) // 1024, 'Kio')
