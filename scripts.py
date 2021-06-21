'''
This script is meant to work around caching issues when deploying new changes
HTML caching is not so bad but CSS and JS caching is very strong
The script will rename the CSS/JS files and update the HTML to point to the new files

'''

import os
from posixpath import join
import random
import string
import sys
import mimetypes

DEPLOY_FOLDER = 'deploy'


def random_string(n):
    return ''.join([random.choice(string.ascii_lowercase + string.digits) for _ in range(n)])


def deploy():
    url = 'https://media.toscreen.net/bsn/'
    if not os.path.exists(DEPLOY_FOLDER):
        os.mkdir(DEPLOY_FOLDER)
        os.mkdir(DEPLOY_FOLDER + '/css')
        os.mkdir(DEPLOY_FOLDER + '/js')

    os.system('rsync -a img {}/'.format(DEPLOY_FOLDER))
    os.system("rm -rf {}/js {}/css".format(DEPLOY_FOLDER, DEPLOY_FOLDER))
    os.system("rm {}/*.html ".format(DEPLOY_FOLDER))
    postfix = random_string(4)
    os.system("mkdir {}/css".format(DEPLOY_FOLDER))
    os.system("mkdir {}/js".format(DEPLOY_FOLDER))
    os.system('cp css/main.css {}/css/main-{}.css'.format(DEPLOY_FOLDER, postfix))
    js = open('js/main.js').read()
    js = js.replace('{{share_url}}', '{}index-{}.html'.format(url, postfix))
    with open('{}/js/main-{}.js'.format(DEPLOY_FOLDER, postfix), 'w') as f:
        f.write(js)
    html = open('index.html').read()
    html = html.replace('{{url}}', url)
    html = html.replace('js/main.js', 'js/main-{}.js'.format(postfix))
    html = html.replace('css/main.css', 'css/main-{}.css'.format(postfix))
    with open('{}/index-{}.html'.format(DEPLOY_FOLDER, postfix), 'w') as f:
        f.write(html)

    with open('{}/index.html'.format(DEPLOY_FOLDER, postfix), 'w') as f:
        f.write(html)
    print('{}index-{}.html'.format(url, postfix))
    upload_file('deploy', '/img')


def upload_file(path=None, excludes=None):
    if path is None:
        path = sys.argv[2]
    if excludes and path.find(excludes) > -1:
        return
    if path.find('.DS_Store') >= 0:
        return
    if os.path.isfile(path):
        aws_upload(path)
    else:
        for f in os.listdir(path):
            p = os.path.join(path, f)
            upload_file(p, excludes)


def gen_webp():
    folder = sys.argv[2]
    delay = 120
    mux = 'webpmux'
    conversion = ''
    path = os.path.expanduser('~/Downloads/' + folder)
    files = sorted([f for f in os.listdir(path) if f.endswith('png')])
    for n, f in enumerate(files):
        n += 1
        if n % 8 != 1:
            continue
        input = os.path.join(path, f)
        output = os.path.join(path, f.replace('.png', '.webp'))
        # conversion += 'convert %s -resize 538x400 -define webp:lossless=true -background none %s\n' % (input, output)
        # conversion += 'convert %s -resize 400x400 -define webp:lossless=true -background none %s\n' % (input, output)
        mux += ' -frame %s +%s+0+0+1+b' % (output, delay)
    mux += ' -loop 0 -bgcolor 0,0,0,0 -o %s.webp\n' % (folder,)
    with open('/Users/sliang/Desktop/%s.sh' % (folder,), 'w') as f:
        f.write(conversion)
        f.write(mux)
    os.system('cd ~/Desktop && sh %s.sh' % (folder,))


def gen_gif():
    folder = sys.argv[2]
    delay = 120
    path = os.path.expanduser('~/Downloads/' + folder)
    files = sorted([f for f in os.listdir(path) if f.endswith('png')])
    cmd = ''
    # os.mkdir(os.path.expanduser('~/Desktop/' + folder))
    for n, f in enumerate(files):
        if n % 8 > 0:
            continue
        output = os.path.expanduser('~/Desktop/%s/%04i.png' % (folder, (n // 8)))
        os.system('cp %s %s' % (os.path.join(path, f), output))
        # os.system('convert %s -resize 538x400 %s' % (os.path.join(path, f), output))
        # os.system('convert %s -resize 538x400 %s' % (os.path.join(path, f), output))


def aws_upload(path=None):
    path = path or sys.argv[2]
    bucket = 'media.toscreen.net'
    key = path.replace('deploy/', 'bsn/')
    cmd = f'aws s3api put-object --acl public-read --content-type {mimetypes.guess_type(key)[0]} --bucket {bucket} --key {key} --body {path}'
    print(os.system(cmd))


def aws_invalidate(path=None):
    path = path or sys.argv[2]
    distribution = 'E31CEYG1KV9HMQ'
    cmd = f'aws cloudfront create-invalidation --distribution-id {distribution} --paths "{path}"'
    print(os.system(cmd))

# gen_webp("happy")
# gen_webp("cry")
# gen_webp("shake")
# gen_webp("idle"


if __name__ == '__main__':
    locals()[sys.argv[1]]()
