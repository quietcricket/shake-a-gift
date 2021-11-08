const liveServer = require('live-server');
const fs = require('fs');
const path = require('path');
const minify = require('minify');
const showdown = require('showdown');
const { count } = require('console');
const DEPLOY_FOLDER = "deploy"

async function genHTML() {
	let config = JSON.parse(fs.readFileSync("config.json"));
	let html = fs.readFileSync(path.join('src', 'index.html')).toString('utf-8');
	let css = await minify(path.join('src', 'main.css'));
	// let js = await minify(path.join('src', 'main.js'));
	let js = fs.readFileSync(path.join('src', 'main.js')).toString('utf-8');
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
	//Resizing the image
	const WIDTH = 400; //target width, 0 means scale based on height
	const HEIGHT = 0; //target height, 0 means scale based on width
	const GIF_SCALING = WIDTH > 0 ? WIDTH + ':-1' : '-1:' + HEIGHT;
	const FRAMERATE = 5;

	if (!fs.existsSync(DEPLOY_FOLDER)) {
		fs.mkdirSync(DEPLOY_FOLDER);
	}
	let dir = path.resolve(process.argv[3])
	let output = path.resolve(path.join(DEPLOY_FOLDER, 'img', dir.split('/').pop() + '.gif'));
	let temp = require('os').tmpdir();
	const ffmpeg = require('ffmpeg-static');
	const webp = require('webp-converter');
	const shell = require('child_process');
	webp.grant_permission();
	let counter = 0;
	let frames = [];
	for (let f of fs.readdirSync(dir).sort()) {
		if (f.toLocaleLowerCase().endsWith('png')) {
			let pathOriginal = path.join(dir, f);
			let pathPng = path.join(dir, (counter < 10 ? '0' : '') + counter + '.png');
			let pathWebp = pathPng.replace('.png', '.webp');
			if (pathOriginal != pathPng) {
				fs.renameSync(pathOriginal, pathPng);
			}
			await webp.cwebp(pathPng, pathWebp, `-q 80 -resize ${WIDTH} ${HEIGHT}`);
			frames.push({ path: pathWebp, offset: `+${1000 / FRAMERATE}+0+0+1+b` });
			counter++;
		}
	}
	webp.webpmux_animate(frames, output.replace('.gif', '.webp'), 0, '0,0,0,0', "");
	let paletteCmd = `${ffmpeg} -i ${path.join(dir, '%02d.png')} -vf palettegen  ${path.join(temp, 'palette.png')} -y`;
	let gifCmd = `${ffmpeg} -framerate ${FRAMERATE} -i ${path.join(dir, '%02d.png')} -i ${path.join(temp, 'palette.png')} -filter_complex "scalconst =${GIF_SCALING}:flags=lanczos[x];[x][1:v]paletteuse" "${output}" -y`;
	shell.execSync(paletteCmd);
	shell.execSync(gifCmd);
	console.log("GIF created at: " + output);
	console.log("WEBP created at: " + output.replace('.gif', '.webp'));
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