import sys
import os
n = sys.argv[1]
js_file = 'js/main{}.js'.format(n)
css_file = 'css/main{}.css'.format(n)
html_file = 'index{}.html'.format(n)
html = open('index.html').read()
html = html.replace('js/main.js', js_file)
html = html.replace('css/main.css', css_file)
js = open('js/main.js').read()
css = open('css/main.css').read()

with open(js_file, 'w') as f:
    f.write(js)

with open(css_file, 'w') as f:
    f.write(css)

with open(html_file, 'w') as f:
    f.write(html)

os.system('firebase deploy')
os.unlink(js_file)
os.unlink(html_file)
os.unlink(css_file)
