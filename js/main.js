const GAME_DURATION = 8;
const MAX_DASH = 500;
let startTime = 0;
let countdownTime = GAME_DURATION;
function countdownTick() {
  let t = GAME_DURATION - (new Date().getTime() - startTime) / 1000;
  document.querySelector("svg.circle circle").style.strokeDashoffset =
    (500 * t) / GAME_DURATION;
  t = Math.round(t);
  (500 * t) / GAME_DURATION;
  if (t != countdownTime) {
    //TODO: Play sound effect
    document.querySelector(".countdown .timer").innerHTML = t;
    countdownTime = t;
    if (t == 0) {
      document.querySelector(".countdown").classList.add("hidden");
      document.querySelector(".timeup").classList.remove("hidden");
    }
  }
  if (countdownTime > 0) requestAnimationFrame(countdownTick);
}

function show(section) {
  document.querySelectorAll(".section").forEach((ele) => {
    ele.classList.add("hidden");
  });
  document.querySelector(".section-" + section).classList.remove("hidden");
  if (section == "game") {
    startTime = new Date().getTime();
    countdownTime = -1;
    document.querySelector(".countdown").classList.remove("hidden");
    document.querySelector(".timeup").classList.add("hidden");
    requestAnimationFrame(countdownTick);
  }
}
// show("landing");
// show("instruction");
show("game");
