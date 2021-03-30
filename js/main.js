let GAME_DURATION = 8;
let PRIZE_UNLOCKS = [30, 50, 70];
let SHAKE_THRESHOLD = 35;
let SHAKE_INTERVAL = 50;

let permissionGranted = false;
let startTime;
let remainingTime;
let shakeTime;
let shakeCount = 0;
let prevMotion;
let totalMotion;

let tikSound = new Audio("img/tik.mp3");
let timeupSound = new Audio("img/timeup.mp3");
tikSound.volume = 0;
timeupSound.volume = 0;
tikSound.preload = "auto";
timeupSound.preload = "auto";

document.querySelector(".btn-ready").addEventListener("touchend", e => {
  tikSound.play();
  timeupSound.play();
});

function startGame() {
  tikSound.volume = 1;
  timeupSound.volume = 1;

  startTime = new Date().getTime();
  remainingTime = GAME_DURATION - 1;
  shakeTime = startTime;
  shakeCount = 0;
  prevMotion = undefined;
  requestAnimationFrame(countdownTick);
  window.addEventListener("devicemotion", monitorShake);
  document.querySelectorAll(".countdown img").forEach((ele, index) => {
    ele.style.display = index == remainingTime ? "block" : "none";
  });
}
function addParticle() {
  let img = new Image();
  img.src = "img/particle-" + Math.floor(Math.random() * 2 + 1) + ".png";
  img.width = Math.random() * 100 + 50;
  document.querySelector(".particle-holder").appendChild(img);
  img.top = window.innerHeight * 0.5 + Math.random() * window.innerHeight * 0.2;
  img.left = window.innerWidth * 0.3 + Math.random() * window.innerWidth * 0.4 - img.width / 2;
  img.rotation = Math.random() * 90 - 45;
  img.style.transform = `translate(${img.left}px,${img.top}px) rotate(${img.rotation}deg)`;
  img.style.opacity = 1;
  img.speed = Math.random() * 0.5 + 0.05;
}
function countdownTick() {
  let t = GAME_DURATION - (new Date().getTime() - startTime) / 1000;
  t = Math.round(t);
  // if (Math.random() < 0.02) addParticle();
  if (t != remainingTime && t >= 0) {
    remainingTime = t;
    if (t < GAME_DURATION && t > 0) {
      tikSound.currentTime = 0;
      tikSound.play();
      document.querySelectorAll(".countdown img").forEach((ele, index) => {
        ele.style.display = index == remainingTime - 1 ? "block" : "none";
      });
    }

    if (t == 0) {
      timeupSound.currentTime = 0;
      timeupSound.play();

      document.querySelectorAll(".particle-holder img").forEach(ele => ele.parentNode.removeChild(ele));
      show("result");
    }
  }
  for (let img of document.querySelectorAll(".particle-holder img")) {
    img.speed *= 1.02;
    // img.rotation *= 0.8;
    img.top += img.speed * 2 * Math.sin((img.rotation / 180) * Math.PI + Math.PI * 0.25);
    img.left += img.speed * Math.cos((img.rotation / 180) * Math.PI + Math.PI * 0.25);
    img.style.opacity -= 0.02;
    img.style.transform = `translate3d(${img.left}px,${img.top}px,0) rotate(${img.rotation}deg)`;
    if (img.style.opacity <= 0) img.parentNode.removeChild(img);
  }
  if (remainingTime > 0) requestAnimationFrame(countdownTick);
}

function monitorShake(e) {
  let currMotion = {
    x: e.accelerationIncludingGravity.x,
    y: e.accelerationIncludingGravity.y,
    z: e.accelerationIncludingGravity.z,
  };
  if (!prevMotion) {
    prevMotion = { x: currMotion.x, y: currMotion.y, z: currMotion.z };
    totalMotion = { x: 0, y: 0, z: 0 };
    return;
  }
  totalMotion.x += Math.abs(currMotion.x - prevMotion.x);
  totalMotion.y += Math.abs(currMotion.y - prevMotion.y);
  totalMotion.z += Math.abs(currMotion.z - prevMotion.z);
  prevMotion = { x: currMotion.x, y: currMotion.y, z: currMotion.z };
  let t = new Date().getTime();
  if (t - shakeTime >= SHAKE_INTERVAL) {
    shakeTime = t;
    if (totalMotion.x + totalMotion.y + totalMotion.z > SHAKE_THRESHOLD * 3) {
      shakeCount++;
      addParticle();
    }
    totalMotion = { x: 0, y: 0, z: 0 };
  }
}

function show(section) {
  if (section == "instruction" && permissionGranted == false) {
    if (typeof DeviceMotionEvent != undefined && typeof DeviceMotionEvent.requestPermission === "function") {
      DeviceMotionEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === "granted") {
            permissionGranted = true;
            show("instruction");
          }
        })
        .catch(console.error);
      return;
    }
  }
  document.querySelectorAll(".section").forEach(ele => {
    if (ele.classList.contains("section-" + section)) {
      ele.classList.remove("hidden");
    } else {
      ele.classList.add("hidden");
    }
  });
  if (section == "game") {
    startGame();
  } else if (section == "result") {
    let score = document.querySelector(".score");
    score.innerHTML = `あなたは巨人に<span>${shakeCount}</span>のダメージを与え!<br/>
    TWITTER にシェアし、<br/>
    仲間たちにも挑戦させてみよう！`;
  }
}

function share() {
  let message = `私が鎧の巨人に${shakeCount}のダメージを与えた！ あなたもスマホを振って、私と共に巨人の駆逐に参加しよう！
  https://lifeafter-kyojin.web.app/

  巨人を駆逐してやろ: https://go.onelink.me/4QkF/b7c30c5f
   
  #ライアフx進撃
  #生きて奴らを駆逐
  #ライフアフター
  #進撃の巨人
  
  @lifeafter_game`;
  // https://lifeafter-kyojin.web.app/`;
  document.location.href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(message);
}

window.addEventListener("resize", evt => {
  const BG_WIDTH = 540;
  const BG_HEIGHT = 960;
  const BTN_WIDTH = 300;
  const COUNTDOWN_WIDTH = 248;
  scale = document.body.offsetWidth / BG_WIDTH;
  document.querySelectorAll(".bg-img").forEach(img => {
    img.style.width = BG_WIDTH * scale + "px";
    img.style.height = BG_HEIGHT * scale + "px";
  });

  document.querySelectorAll(".btn-img").forEach(btn => {
    btn.style.width = BTN_WIDTH * scale + "px";
  });
  document.querySelectorAll(".section").forEach(ele => {
    let p = parseFloat(ele.getAttribute("margin-top"));
    ele.style.paddingTop = BG_HEIGHT * scale * p + "px";
  });
  let countdown = document.querySelector(".countdown");
  countdown.style.width = COUNTDOWN_WIDTH * scale + "px";

  let score = document.querySelector(".score");
  score.style.top = BG_HEIGHT * scale * 0.25 + "px";
  let footer = document.querySelector(".footer");
  footer.style.top = BG_HEIGHT * scale - 30 + "px";
  footer.style.width = BG_WIDTH * scale + "px";
});

function webp_polyfill() {
  var elem = document.createElement("canvas");
  if (elem.getContext && elem.getContext("2d") && elem.toDataURL("image/webp").indexOf("data:image/webp") == 0) {
    return;
  }
  document.querySelectorAll("img").forEach(img => {
    let src = img.src;
    if (src.indexOf("page-") > -1) {
      img.src = src.replace(".webp", ".jpg");
    } else {
      img.src = src.replace(".webp", ".png");
    }
  });
}
webp_polyfill();
window.dispatchEvent(new Event("resize"));
show("landing");
// show("instruction");
// show("game");
// shakeCount = 188;
// show("result");
