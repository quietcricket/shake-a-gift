const liveServer = require('live-server');
const fs = require('fs');
const path = require('path');
const minify = require('minify');
const showdown = require('showdown');
const DEPLOY_FOLDER = "deploy"

async function genHTML() {
	let config = JSON.parse(fs.readFileSync("config.json"));
	let html = fs.readFileSync(path.join('src', 'index.html')).toString('utf-8');
	let css = await minify(path.join('src', 'main.css'));
	let js = await minify(path.join('src', 'main.js'));
	let tnc = fs.readFileSync(path.join('src', 'tnc.md')).toString('utf-8');

	config['JAVASCRIPT'] = `<script>\nconst CONFIG=${JSON.stringify(config)};\n${js}</script>`;
	config['CSS'] = `<style>${css}</style>`;
	config['TNC'] = (new showdown.Converter()).makeHtml(tnc);

	for (let key in config) {
		html = html.replaceAll(`[[${key}]]`, config[key]);
	}
	return html;
}


function localDev() {
	let params = {
		port: 8080,
		host: process.env.IP,
		root: "src",
		file: "index.html",
		wait: 1000,
		logLevel: 2,
		middleware: [async function (req, res, next) {
			if (req.originalUrl == '/') {
				let html = await genHTML();
				res.setHeader('Content-Type', 'text/html; charset=UTF-8');
				res.write(html);
				res.end();
			} else {
				next();
			}
		}],
	};
	liveServer.start(params);
}

async function deploy() {
	if (!fs.existsSync(DEPLOY_FOLDER)) {
		fs.mkdirSync(DEPLOY_FOLDER);
	}
	for (let f of fs.readdirSync(DEPLOY_FOLDER)) {
		if (f.endsWith('html')) fs.rmSync(path.join(DEPLOY_FOLDER, f));
	};
	let filename = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5) + ".html";
	let html = await genHTML()
	fs.writeFileSync(path.join(DEPLOY_FOLDER, filename), html);
	require('sync-directory')(path.resolve('src', 'img'), path.resolve(DEPLOY_FOLDER, 'img'));
}

async function genAnimation() {
	if (!fs.existsSync(DEPLOY_FOLDER)) {
		fs.mkdirSync(DEPLOY_FOLDER);
	}
	let dir = path.resolve(process.argv[3])
	let output = path.resolve(path.join(DEPLOY_FOLDER, 'img', dir.split('/').pop() + '.gif'));
	let temp = require('os').tmpdir();
	let ffmpeg = require('ffmpeg-static');
	let paletteCmd = ffmpeg;
	let gifCmd = ffmpeg;
	let counter = 0;
	for (let f of fs.readdirSync(dir).sort()) {
		if (f.toLocaleLowerCase().endsWith('png')) {
			paletteCmd += ' -i ' + path.join(dir, f);
			gifCmd += ' -i ' + path.join(dir, f);
			counter++;
		}
	}
	paletteCmd += ' -vf palettegen ' + path.join(temp, 'palette.png')
	gifCmd += ` -i ${path.join(temp, 'palette.png')} -filter_complex "fps=6,scale=400:-1:flags=lanczos[x];[x][${counter}:v]paletteuse" ${output} -y`;
	console.log(gifCmd);
	const cp = require('child_process');
	cp.exec(paletteCmd, err => {
		if (err) {
			console.error(err)
			process.exit(1);
		} else {
			console.log("Palette genrated successfully");
			cp.exec(gifCmd, err => {
				if (err) {
					console.error(err)
					process.exit(1);
				} else {
					console.log("Gif generated successfully: " + output);
				}
			});
		}
	});


}

switch (process.argv[2]) {
	case 'dev':
		localDev();
		break;
	case 'export':
		deploy();
		break;
	case 'gif':
		genAnimation();
		break;
}