import sys
import os
n = sys.argv[1]
js_file='js/main{}.js'.format(n)
html_file='index{}.html'.format(n)
html = open('index.html').read()
html = html.replace('js/main.js', js_file)
js=open('js/main.js').read()

with open(js_file,'w') as f:
    f.write(js)
with open(html_file,'w') as f:
    f.write(html)

os.system('firebase deploy')
os.unlink(js_file)
os.unlink(html_file)