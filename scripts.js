const liveServer = require('live-server');
const fs = require('fs');
const path = require('path');
const minify = require('minify');
const showdown = require('showdown');

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
	const folder = "deploy"
	if (!fs.existsSync(folder)) {
		fs.mkdirSync(folder);
	}
	for (let f of fs.readdirSync(folder)) {
		if (f.endsWith('html')) fs.rmSync(path.join(folder, f));
	};
	let filename = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5) + ".html";
	let html = await genHTML()
	fs.writeFileSync(path.join(folder, filename), html);
	require('sync-directory')(path.resolve('src', 'img'), path.resolve(folder, 'img'));
}

switch (process.argv[2]) {
	case 'dev':
		localDev();
		break;
	case 'export':
		deploy();
		break;
}