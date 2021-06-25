'''
This script used to create local dev server and deploy to server
It monitors changes in the src folder

'''

import os
import random
import string
import sys
import mimetypes
import json
import csv

config = json.load(open('config.json'))


def random_string(n):
    return ''.join([random.choice(string.ascii_lowercase + string.digits) for _ in range(n)])


def deploy():
    url = 'https://media.toscreen.net/bsn/'
    if not os.path.exists('deploy'):
        os.mkdir('deploy/img')


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


def gen_report():
    path = sys.argv[2]
    reader = csv.reader(open(path))
    rows = list(reader)
    title = 'ブラック・サージナイト'
    games60 = [0, 0]
    games100 = [0, 0]
    games = [0, 0]
    report = {}
    for r in rows:
        if len(r)<3:
            continue
        if r[0].find(title) == -1 or r[0].find('-') == -1:
            continue
        parts = [s.strip() for s in r[0].split('-')]
        section = parts[1]
        n1 = int(r[1])
        n2 = int(r[2])
        if section == 'result':
            shakes = int(parts[2])
            games[0] += n1
            games[1] += n2
            if shakes >= 60:
                games60[0] += n1
                games60[1] += n2
            if shakes >= 100:
                games100[0] += n1
                games100[1] += n2
        else:
            report[section] = [n1, n2]
    report['completed games'] = games
    report['60 shakes and above'] = games60
    report['100 shakes and above'] = games100

    for k, v in report.items():
        print('{}, {}, {}'.format(k, v[0], v[1]))


if __name__ == '__main__':
    locals()[sys.argv[1]]()
