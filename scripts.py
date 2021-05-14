'''
This script is meant to work around caching issues when deploying new changes
HTML caching is not so bad but CSS and JS caching is very strong
The script will rename the CSS/JS files and update the HTML to point to the new files

'''

import os
import random
import string
import sys
import mimetypes

DEPLOY_FOLDER = 'deploy'


def random_string(n):
    return ''.join([random.choice(string.ascii_lowercase + string.digits) for _ in range(n)])


def deploy():
    url = 'https://cdb.toscreen.net/'
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
    js = js.replace('{{url}}', url)
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
    # os.system('firebase deploy')
    print('{}index-{}.html'.format(url, postfix))



def upload_folder(d=DEPLOY_FOLDER):
    for f in os.listdir(d):
        p = os.path.join(d, f)
        if os.path.isdir(p):
            upload_folder(p)
        else:
            aws_upload(p)


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


def aws_upload(path=None):
    if path is None:
        path = sys.argv[2]
    bucket = 'cdb.toscreen.net'
    key = path.replace('deploy/', '')
    cmd = f'aws s3api put-object --acl public-read --content-type {mimetypes.guess_type(key)[0]} --bucket {bucket} --key {key} --body {path}'
    print(os.system(cmd))


# gen_webp("happy")
# gen_webp("cry")
# gen_webp("shake")
# gen_webp("idle"

if __name__ == '__main__':
    locals()[sys.argv[1]]()
