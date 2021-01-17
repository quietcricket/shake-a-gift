let GAME_DURATION = 8;
let PRIZE_UNLOCKS = [30, 40, 50];
let SHAKE_THRESHOLD = 80;
let SHAKE_INTERVAL = 50;

let startTime;
let remainingTime;

let shakeTime;
let shakeCount = 0;
let prevMotion;

function countdownTick() {
  let t = GAME_DURATION - (new Date().getTime() - startTime) / 1000;
  document.querySelector("svg.circle circle").style.strokeDashoffset =
    (500 * t) / GAME_DURATION;
  t = Math.round(t);
  (500 * t) / GAME_DURATION;
  if (t != remainingTime) {
    //TODO: Play sound effect
    document.querySelector(".countdown .timer").innerHTML = t;
    remainingTime = t;
    if (t == 0) {
      document.querySelector(".countdown").classList.add("hidden");
      document.querySelector(".timeup").classList.remove("hidden");
      window.removeEventListener("devicemotion", monitorShake);
      document.querySelector(".shake-count").innerHTML = shakeCount;
    }
  }
  if (remainingTime > 0) requestAnimationFrame(countdownTick);
}

function monitorShake(e) {
  let t = new Date().getTime();
  if (t - shakeTime < SHAKE_INTERVAL) return;
  shakeTime = t;
  let currMotion = {
    x: e.accelerationIncludingGravity.x,
    y: e.accelerationIncludingGravity.y,
    z: e.accelerationIncludingGravity.z,
  };
  if (!prevMotion) {
    prevMotion = { x: currMotion.x, y: currMotion.y, z: currMotion.z };
    return;
  }
  let dx = Math.abs(currMotion.x - prevMotion.x);
  let dy = Math.abs(currMotion.x - prevMotion.x);
  let dz = Math.abs(currMotion.x - prevMotion.x);
  if (dx + dy + dz > SHAKE_THRESHOLD * 3) shakeCount++;
  prevMotion = { x: currMotion.x, y: currMotion.y, z: currMotion.z };
}

function show(section) {
  document.querySelectorAll(".section").forEach((ele) => {
    if (ele.classList.contains("section-" + section)) {
      ele.classList.remove("hidden");
    } else {
      ele.classList.add("hidden");
    }
  });

  if (section == "game") {
    SHAKE_THRESHOLD = parseInt(document.querySelector(".threshold").value);
    document.querySelector(".countdown").classList.remove("hidden");
    document.querySelector(".timeup").classList.add("hidden");
    startTime = new Date().getTime();
    remainingTime = -1;

    shakeTime = startTime;
    shakeCount = 0;
    prevMotion = {};

    requestAnimationFrame(countdownTick);
    window.addEventListener("devicemotion", monitorShake);
  } else if (section == "result") {
    if (shakeCount >= PRIZE_UNLOCKS[0]) {
      show("result-pass");
    } else {
      show("result-fail");
    }
  }
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

// show("landing");
show("instruction");
// show("game");
// show("result-pass");
