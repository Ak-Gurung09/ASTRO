# Rebuilds index.html and astro-lab-standalone.html from dev.html + js/ + css/ (+ models/ embedded in the standalone).  Usage: python3 tools/build/build.py .
import subprocess, sys, os, re
root = sys.argv[1]
es = os.environ.get('ESBUILD', 'esbuild')  # install with: npm i -g esbuild (or set ESBUILD to its path)
js = subprocess.run([es, os.path.join(root, 'js/main.js'), '--bundle', '--format=iife', '--minify', '--target=es2020', '--log-level=warning'], capture_output=True, text=True)
if js.returncode: print(js.stderr); sys.exit(1)
print(js.stderr)
bundle = js.stdout.replace('</script', '<\\/script')
html = open(os.path.join(root, 'dev.html')).read()
css = ''.join(open(os.path.join(root, 'css', f)).read() + '\n' for f in ['style.css', 'career.css'])
html = html.replace('<link rel="stylesheet" href="css/style.css">\n  <link rel="stylesheet" href="css/career.css">', '<style>\n' + css + '</style>')
assert '<style>' in html
html = html.replace('<script type="module" src="js/main.js"></script>', '<script>\n' + bundle + '</script>')
assert 'src="js/main.js"' not in html
# index.html loads the imported models from models/*.glb (needs a web server; from disk it falls back to the built-in models).
open(os.path.join(root, 'index.html'), 'w').write(html)
# astro-lab-standalone.html embeds them, so it also works when opened straight from disk.
import base64, json
mdir = os.path.join(root, 'models')
emb = {f[:-4]: base64.b64encode(open(os.path.join(mdir, f), 'rb').read()).decode() for f in sorted(os.listdir(mdir)) if f.endswith('.glb')} if os.path.isdir(mdir) else {}
standalone = html.replace('<script>\n' + bundle, '<script>window.__ASTRO_MODELS=' + json.dumps(emb) + ';</script>\n  <script>\n' + bundle, 1)
assert not emb or '__ASTRO_MODELS' in standalone
open(os.path.join(root, 'astro-lab-standalone.html'), 'w').write(standalone)
print('built', len(html), 'standalone', len(standalone), 'models', len(emb))
