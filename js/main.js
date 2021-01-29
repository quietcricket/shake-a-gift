let GAME_DURATION = 8;
let PRIZE_UNLOCKS = [30, 50, 70];
let SHAKE_THRESHOLD = 45;
let SHAKE_INTERVAL = 50;

let startTime;
let remainingTime;

let shakeTime;
let shakeCount = 0;
let prevMotion;
let totalMotion;
let tikSound = new Audio("img/tik.mp3");
let timeupSound = new Audio("img/timeup.mp3");
tikSound.preload = "auto";
timeupSound.preload = "auto";
let permissionGranted = false;

function countdownTick() {
  let t = GAME_DURATION - (new Date().getTime() - startTime) / 1000;
  document.querySelector("svg.circle circle").style.strokeDashoffset =
    (500 * t) / GAME_DURATION;
  t = Math.round(t);
  if (Math.random() < 0.01) addHeart();
  if (t != remainingTime) {
    if (t < GAME_DURATION && t > 0) {
      tikSound.volume = 1;
      tikSound.currentTime = 0;
      tikSound.play();
    }
    //TODO: Play sound effect
    document.querySelector(".countdown .timer").innerHTML = t;
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
    if (img.style.opacity <= 0.01) {
      img.parentNode.removeChild(img);
    }
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
    if (
      typeof DeviceMotionEvent != undefined &&
      typeof DeviceMotionEvent.requestPermission === "function"
    ) {
      DeviceMotionEvent.requestPermission()
        .then((permissionState) => {
          if (permissionState === "granted") {
            permissionGranted = true;
            show("instruction");
          }
        })
        .catch(console.error);
      return;
    }
  }
  document.querySelectorAll(".section").forEach((ele) => {
    if (ele.classList.contains("section-" + section)) {
      ele.classList.remove("hidden");
    } else {
      ele.classList.add("hidden");
    }
  });
  if (section == "game") {
    document.querySelector(".countdown").classList.remove("hidden");
    document.querySelector(".timeup").classList.add("hidden");
    startTime = new Date().getTime();
    remainingTime = -1;

    shakeTime = startTime;
    shakeCount = 0;
    prevMotion = undefined;
    requestAnimationFrame(countdownTick);
    window.addEventListener("devicemotion", monitorShake);
  } else if (section == "result") {
    document.querySelector(".hearts-holder").innerHTML = "";
    if (shakeCount >= PRIZE_UNLOCKS[0]) {
      show("result-pass");
    } else {
      show("result-fail");
    }
  }
}
function addHeart() {
  let img = new Image();
  img.src = "img/heart-" + Math.floor(Math.random() * 4 + 1) + ".png";
  img.width = Math.random() * 25 + 25;
  document.querySelector(".hearts-holder").appendChild(img);
  let angle = Math.random() * Math.PI * 2;
  let r = 50 + 80 * Math.random();
  img.style.top = 220 + r * Math.sin(angle) + "px";
  img.style.left =
    window.innerWidth / 2 + r * Math.cos(angle) - img.width / 2 + "px";
  img.style.transform = "rotate(" + (Math.random() * 60 - 30) + "deg)";
  img.style.opacity = 1;
  img.speed = Math.random() * 0.2 + 0.05;
}
function share() {
  alert("Opens twitter app");
}

function reward() {
  let level = 0;
  for (let i = 0; i < PRIZE_UNLOCKS.length; i++) {
    if (shakeCount > PRIZE_UNLOCKS[i]) level = i + 1;
  }
  alert("Level " + level + " award");
}

document.querySelector(".btn-start").addEventListener("touchend", (e) => {
  tikSound.volume = 0;
  tikSound.play();
});
show("landing");
// show("instruction");
// show("game");
// show("result-pass");
