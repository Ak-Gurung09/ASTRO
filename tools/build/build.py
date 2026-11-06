# Rebuilds index.html and astro-lab-standalone.html from dev.html + js/ + css/.  Usage: python3 tools/build/build.py .
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
for name in ['index.html', 'astro-lab-standalone.html']:
    open(os.path.join(root, name), 'w').write(html)
print('built', len(html))
