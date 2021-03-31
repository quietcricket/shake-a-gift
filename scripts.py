'''
This script is meant to work around caching issues when deploying new changes
HTML caching is not so bad but CSS and JS caching is very strong
The script will rename the CSS/JS files and update the HTML to point to the new files

'''

import os
from posix import listdir
import random
import string

DEPLOY_FOLDER = 'deploy'


def random_string(n):
    return ''.join([random.choice(string.ascii_lowercase + string.digits) for _ in range(n)])


def deploy():

    if not os.path.exists(DEPLOY_FOLDER):
        os.mkdir(DEPLOY_FOLDER)
        os.mkdir(DEPLOY_FOLDER + '/css')
        os.mkdir(DEPLOY_FOLDER + '/js')

    os.system('rsync -a img {}/'.format(DEPLOY_FOLDER))
    postfix = random_string(4)
    os.system('cp js/main.js {}/js/main-{}.js'.format(DEPLOY_FOLDER, postfix))
    os.system('cp css/main.css {}/css/main-{}.css'.format(DEPLOY_FOLDER, postfix))
    os.system('cp index.html {}/index.html'.format(DEPLOY_FOLDER))

    html = open('index.html').read()
    html = html.replace('js/main.js', 'js/main-{}.js'.format(postfix))
    html = html.replace('css/main.css', 'css/main-{}.css'.format(postfix))
    with open('{}/index-{}.html'.format(DEPLOY_FOLDER, postfix), 'w') as f:
        f.write(html)

    with open('{}/index.html'.format(DEPLOY_FOLDER), 'w') as f:
        f.write(html)
    os.system('firebase deploy')
    print('http://lifeafter-kyojin.toscreen.net/index-{}.html'.format(postfix))


# os.unlink(js_file)
# os.unlink(html_file)
# os.unlink(css_file)
import os


def gen_webp(folder):
    delay = 33
    mux = 'webpmux'
    conversion = ''
    path = os.path.expanduser('~/Desktop/bocanada2/' + folder)
    files = sorted([f for f in os.listdir(path)])
    for f in files:
        input = os.path.join(path, f)
        output = os.path.join(path, f.replace('.png', '.webp'))
        conversion += 'convert %s -resize 400x400 -define webp:lossless=true -background none %s\n' % (input, output)
        mux += ' -frame %s +%s+0+0+1+b' % (output, delay)
    mux += ' -loop 0 -bgcolor 0,0,0,0 -o %s.webp\n' % (folder,)
    with open('/Users/sliang/Desktop/%s.sh' % (folder,), 'w') as f:
        f.write(conversion)
        f.write(mux)


# gen_webp("happy")
# gen_webp("cry")
# gen_webp("shake")
# gen_webp("idle")
deploy()
