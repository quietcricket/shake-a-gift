let GAME_DURATION = 8;
let PRIZE_UNLOCKS = [60];
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
let preloadImages = [];

document.querySelector(".btn-tnc").addEventListener("touchend", e => {
  tikSound.play();
  timeupSound.play();
});

function startGame() {
  startTime = new Date().getTime();
  remainingTime = GAME_DURATION;
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
  let angle = Math.random() * Math.PI;
  let r = 20 + 150 * Math.random();
  img.top = 220 + r * Math.sin(angle);
  img.left = window.innerWidth / 2 + r * Math.cos(angle) - img.width / 2;
  img.rotation = Math.random() * 60 - 30;
  img.style.transform = `translate(${img.left}px,${img.top}px) rotate(${img.rotation}deg)`;
  img.style.opacity = 1;
  img.speed = Math.random() * 0.5 + 0.05;
}
function countdownTick() {
  let t = GAME_DURATION - (new Date().getTime() - startTime) / 1000;
  document.querySelector("svg.circle circle").style.strokeDashoffset = (500 * t) / GAME_DURATION;
  if (Math.abs(Math.floor(t) - t) < 0.05) {
    t = Math.floor(t);
  } else {
    t = remainingTime;
  }
  // if (Math.random() < 0.01) addHeart();
  if (t != remainingTime && t >= 0) {
    if (t < GAME_DURATION && t > 0) {
      tikSound.play();
      tikSound.currentTime = 0;
      let ele = document.querySelector(".timer");
      ele.innerHTML = t;
      ele.style.animationName = "";
      void ele.offsetWidth;
      ele.style.animationName = "zoomin";
    }
    remainingTime = t;
    if (t == 0) {
      document.querySelector(".countdown").classList.add("hidden");
      // document.querySelector(".timeup").classList.remove("hidden");
      window.removeEventListener("devicemotion", monitorShake);
      timeupSound.currentTime = 0;
      timeupSound.play();
      show("result");
    }
  }
  for (let img of document.querySelectorAll(".hearts-holder img")) {
    img.speed *= 1.02;
    img.top -= img.speed;
    img.style.opacity -= 0.005;
    img.style.transform = `translate3d(${img.left}px,${img.top}px,0) rotate(${img.rotation}deg)`;
    if (img.top < -100) img.parentNode.removeChild(img);
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
      // addHeart();
    }
    totalMotion = { x: 0, y: 0, z: 0 };
  }
}

function show(section) {
  let tag = section.indexOf("result") == 0 ? "result - " + shakeCount : section;
  document.title = "コード：ドラゴンブラッド（ドラブラ）- " + tag;
  if (section == "replay") section = "instruction";
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
    // document.querySelector(".timeup").classList.add("hidden");
    let ele = document.querySelector(".timer");
    ele.classList.add("timer-small");
    ele.style.animationName = "zoomin";
    document.querySelector("svg.circle circle").style.strokeDashoffset = 0;
    ele.innerHTML = "よーい、ドン！";
    tikSound.play();
    setTimeout(() => {
      ele.innerHTML = "GO!";
      tikSound.play();
      ele.style.animationName = "";
      void ele.offsetWidth;
      ele.style.animationName = "zoomin";
    }, 1000);
    setTimeout(() => {
      ele.classList.remove("timer-small");
      ele.innerHTML = "8";
      ele.style.animationName = "";
      void ele.offsetWidth;
      ele.style.animationName = "zoomin";
      tikSound.play();
      startGame();
    }, 2000);
  } else if (section == "result") {
    document.querySelector(".shake-count").innerHTML = shakeCount;
    console.log(document.querySelector(".shake-count"));
    document.querySelector(".hearts-holder").innerHTML = "";
    show(shakeCount < PRIZE_UNLOCKS[0] ? "result-fail" : "result-pass");
  }
}

function share(n) {
  let messages = ["シェイクしたが生き残れなかった... 一緒にシェイクして世界の為に戦ってみよう！\n{{url}}}", shakeCount + "回シェイクを達成して無事生き残れました。\n {{url}}"];
  document.location.href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(messages[n]);
}

function preload() {
  let url = preloadImages.shift();
  if (!url) return;
  let img = new Image();
  img.src = url;
  img.onload = preload;
}

function webp_polyfill() {
  var elem = document.createElement("canvas");
  let ext = "jpg";
  if (elem.getContext && elem.getContext("2d") && elem.toDataURL("image/webp").indexOf("data:image/webp") == 0) {
    ext = "webp";
  }
  document.querySelectorAll(".section").forEach(ele => {
    if (ele.getAttribute("bg")) {
      let url = `img/bg-${ele.getAttribute("bg")}.${ext}`;
      preloadImages.push(url);
      ele.style.backgroundImage = `url(${url})`;
    }
  });
  preload();
}

webp_polyfill();
show("landing");
// show("instruction");
// show("result");
// show("game");
// shakeCount = 99;
// show("result");
// show("voucher");
