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

document.querySelector(".btn-tnc").addEventListener("touchend", e => {
  tikSound.play();
  timeupSound.play();
});

function startGame() {
  startTime = new Date().getTime();
  remainingTime = GAME_DURATION - 1;
  shakeTime = startTime;
  shakeCount = 0;
  prevMotion = undefined;
  requestAnimationFrame(countdownTick);
  window.addEventListener("devicemotion", monitorShake);
}
function addHeart() {
  let img = new Image();
  img.src = "img/heart-" + Math.floor(Math.random() * 4 + 1) + ".png";
  img.width = Math.random() * 25 + 25;
  document.querySelector(".hearts-holder").appendChild(img);
  let angle = Math.random() * Math.PI * 2;
  let r = 50 + 80 * Math.random();
  img.style.top = 220 + r * Math.sin(angle) + "px";
  img.style.left = window.innerWidth / 2 + r * Math.cos(angle) - img.width / 2 + "px";
  img.style.transform = "rotate(" + (Math.random() * 60 - 30) + "deg)";
  img.style.opacity = 1;
  img.speed = Math.random() * 0.2 + 0.05;
}
function countdownTick() {
  let t = GAME_DURATION - (new Date().getTime() - startTime) / 1000;
  document.querySelector("svg.circle circle").style.strokeDashoffset = (500 * t) / GAME_DURATION;
  t = Math.round(t);
  if (Math.random() < 0.01) addHeart();
  if (t != remainingTime && t >= 0) {
    if (t < GAME_DURATION && t > 0) {
      tikSound.currentTime = 0;
      tikSound.play();
      let ele = document.querySelector(".timer");
      ele.innerHTML = t;
      ele.style.animationName = "";
      void ele.offsetWidth;
      ele.style.animationName = "zoomin";
    }
    remainingTime = t;
    if (t == 0) {
      document.querySelector(".countdown").classList.add("hidden");
      document.querySelector(".timeup").classList.remove("hidden");
      window.removeEventListener("devicemotion", monitorShake);
      document.querySelector(".shake-count").innerHTML = shakeCount;
      timeupSound.currentTime = 0;
      timeupSound.play();
    }
  }
  for (let img of document.querySelectorAll(".hearts-holder img")) {
    let t = parseInt(img.style.top) - img.speed;
    img.style.top = t + "px";
    img.style.opacity -= img.speed * 0.1;
    if (img.style.opacity <= 0.01) img.parentNode.removeChild(img);
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
      addHeart();
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
    tikSound.volume = 1;
    timeupSound.volume = 1;
    document.querySelector(".countdown").classList.remove("hidden");
    document.querySelector(".timeup").classList.add("hidden");
    let ele = document.querySelector(".timer");
    ele.classList.add("timer-small");
    ele.style.animationName = "zoomin";
    ele.innerHTML = "よーい、ドン！";
    setTimeout(() => {
      ele.innerHTML = "GO!";
      ele.style.animationName = "";
      void ele.offsetWidth;
      ele.style.animationName = "zoomin";
    }, 1000);
    setTimeout(() => {
      ele.classList.remove("timer-small");
      startGame();
    }, 2000);
  } else if (section == "result") {
    document.querySelector(".hearts-holder").innerHTML = "";
    if (shakeCount < PRIZE_UNLOCKS[0]) {
      show("result-fail");
    } else if (shakeCount < PRIZE_UNLOCKS[1]) {
      show("voucher");
    } else {
      show("result-pass");
    }
  }
}

function share(n) {
  let messages = [
    `私は #振ろうもらおう キャンペーンに参加しました！
    @KyokuyaJP をフォローして #バレンタイン ギフトをゲット！
    毎日抽選で最大3,000円のアマギフが当たる⁉️
    #SHAKE すればするほど報酬が豪華に！
    
    今すぐ #極夜大陸 で限定特典をゲット👇
  `,
    `私は31回以上振って「限定特典引換コード」をGETしました！一緒に #振ろうもらおう !
    #SHAKE すればするほど報酬が豪華に！
    毎日抽選で最大3,000円のアマギフが当たる⁉️
    
    今すぐ #極夜大陸 で限定特典をゲット👇
  `,
  ];
  let url = "https://kyokuya.onelink.me/rgKq/2fdd7e10";
  document.location.href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(messages[n]) + "&url=" + encodeURIComponent(url);
}

async function reward() {
  document.querySelector("body").style.pointerEvents = "none";
  let server_url = "https://asia-east2-love-big-2021.cloudfunctions.net/api/v1/coupons/generate";
  let ctype = shakeCount >= PRIZE_UNLOCKS[2] ? "value-3000" : "value-1500";
  try {
    let resp = await fetch(server_url, {
      method: "post",
      body: `{"ctype":"${ctype}"}`,
      mode: "cors",
      cache: "no-cache",
      headers: { "Content-Type": "application/json" },
    });
    let data = await resp.json();
    if (data.url) {
      document.location.href = data.url;
      return;
    }
  } catch (err) {}
  document.querySelector("body").style.pointerEvents = "all";
  show("voucher");
}

show("landing");
// show("instruction");
// show("game");
// startGame();
// show("result-pass");
// show("voucher");
