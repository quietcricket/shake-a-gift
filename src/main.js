let gameImg2 = "background-image: url('img/bg-img-2.jpg')";
let gameImg3 = "background-image: url('img/bg-img-3.jpg')";


class ShakeAGift {

  constructor() {
    let utils = new Utils();
    utils.webpPolyfill();
    utils.preloadBackground();
    utils.initSound(['tik', 'timeup']);
    this.utils = utils;
  }

  show(section, section_title) {
    // Google Analytics Tracking
    if (section != 'landing') {
      section_title = section_title ? section_title : section;
      gaTrack(section_title);
    }
    // Show and hide corresponding section
    document.querySelectorAll(".section").forEach(ele => {
      if (ele.classList.contains("section-" + section)) {
        ele.classList.remove("hidden");
      } else {
        ele.classList.add("hidden");
      }
    });
  }

  startGame() {
    document.querySelector(".countdown").classList.remove("hidden");
    document.querySelector(".section-game .shake-count").innerHTML = 0;
    document.querySelector("svg.circle circle").style.strokeDashoffset = 1;
    this.startTime = new Date().getTime();
    this.currentTime = -1;
    this.shakeCount = 0;
    this.show("game");
    this._updateGame();
  }

  endGame() {
    this.utils.playSound('timeup');
    window.removeEventListener("devicemotion", this._monitorShake);
    document.querySelectorAll(".shake-count").forEach(ele => (ele.innerHTML = this.shakeCount));
    if (this.shakeCount >= CONFIG.PRIZE_UNLOCK) {
      this.show('result-pass', 'result ' + this.shakeCount);
      fetch('https://23q299v3y2.execute-api.ap-northeast-1.amazonaws.com/live').then(resp => resp.json().then(data => {
        //console.log(data.c);
        // Place the CD Key inside the HTML
        document.querySelector('.cdkey').innerHTML = data.c;
      }));
    } else {
      this.show('result-fail', 'result ' + this.shakeCount);
    }
  }

  _updateGame() {
    // reference self via window.game instance
    let t = (new Date().getTime() - game.startTime);
    // Show Ready Go
    let seconds = Math.floor(t / 1000);
    if (seconds >= 2) {
      // update the circle
      document.querySelector("svg.circle circle").style.strokeDashoffset = (t - 2000) / CONFIG.GAME_DURATION / 2;
    }
    //Game end
    if (seconds >= CONFIG.GAME_DURATION + 2) {
      game.endGame();
      return;
    }
    requestAnimationFrame(game._updateGame);
    if (seconds != game.currentTime) {
      game.utils.playSound('tik');
      let ele = document.querySelector(".timer");
      let gameBG = document.querySelector(".section-game");
      if (seconds == 0) {
        ele.innerHTML = "よーい、ドン！";
        ele.classList.add("timer-small");
        //TODO: reset image when player choose to retry
        gameBG.setAttribute("style", gameImg2);
      } else if (seconds == 1) {
        ele.innerHTML = "GO";
      } else if (seconds == 2) {
        //TODO: swapping the background here
        gameBG.setAttribute("style", gameImg3);
        ele.classList.remove("timer-small");
        game.prevMotion = undefined;
        game.shakeTime = new Date().getTime();
        window.addEventListener("devicemotion", game._monitorShake);
        ele.innerHTML = CONFIG.GAME_DURATION + 2 - seconds;
      } else {
        ele.innerHTML = CONFIG.GAME_DURATION + 2 - seconds;
      }
      ele.style.animationName = "";
      void ele.offsetWidth;
      ele.style.animationName = "zoomin";
      game.currentTime = seconds;
    }
  }
  /**
   * Share result as a tweet
   */
  share() {
    let message = this.shakeCount >= CONFIG[''] ? CONFIG.SUCCESS_TWEET : CONFIG.FAILURE_TWEET;
    message = message.replace('[[SHAKE_COUNT]]', this.shakeCount) + '\n' + document.location.href;
    document.location.href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(message);
    //console.log(message);
  }
  /**
   * On iOS motion sensor requires permission from the user
   * Android will skip this and directly show the instruction step
   */
  requestPermission() {
    if (this.permissionGranted) {
      this.show("instruction");
      return;
    }
    if (typeof DeviceMotionEvent != undefined && typeof DeviceMotionEvent.requestPermission === "function") {
      DeviceMotionEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === "granted") {
            this.permissionGranted = true;
            this.show("instruction");
          }
        }).catch(console.error);
    } else {

      this.permissionGranted = true;
      //alert(this.permissionGranted);
      this.show("instruction");
    }
  }

  _monitorShake(e) {
    let currMotion = {
      x: e.accelerationIncludingGravity.x,
      y: e.accelerationIncludingGravity.y,
      z: e.accelerationIncludingGravity.z,
    };
    if (!game.prevMotion) {
      game.prevMotion = { x: currMotion.x, y: currMotion.y, z: currMotion.z };
      game.totalMotion = { x: 0, y: 0, z: 0 };
      return;
    }
    game.totalMotion.x += Math.abs(currMotion.x - game.prevMotion.x);
    game.totalMotion.y += Math.abs(currMotion.y - game.prevMotion.y);
    game.totalMotion.z += Math.abs(currMotion.z - game.prevMotion.z);
    game.prevMotion = { x: currMotion.x, y: currMotion.y, z: currMotion.z };
    let t = new Date().getTime();
    if (t - game.shakeTime >= CONFIG.SHAKE_INTERVAL) {
      game.shakeTime = t;
      if (game.totalMotion.x + game.totalMotion.y + game.totalMotion.z > CONFIG.SHAKE_THRESHOLD * 3) {
        game.shakeCount++;
        document.querySelector(".section-game .shake-count").innerHTML = game.shakeCount;
      }
      game.totalMotion = { x: 0, y: 0, z: 0 };
    }
  }
}
/**
 * Utils for some image and sound related tweaking
 * Taken these functions out of the main class
 * to make the main class more clean
 */
class Utils {
  constructor() {
    this.webpPolyfill();
    this.preloadBackground();
    let elem = document.createElement("canvas");
    this.supportsWebp = elem.getContext && elem.getContext("2d") && elem.toDataURL("image/webp").indexOf("data:image/webp") == 0
  }

  webpPolyfill() {
    document.querySelectorAll(".section[bg]").forEach(ele => {
      let url = ele.getAttribute('bg');
      if (!this.supportsWebp) {
        url = url.replace('.webp', '.jpg');
        ele.setAttribute('bg', url);
      }
      ele.style.backgroundImage = `url(${url})`;

    });
    //Centralize the gif character
    document.querySelectorAll(".gif").forEach(ele => {
      if (this.supportsWebp) {
        ele.src = ele.src.replace("gif", "webp");
      }
      ele.style.left = (document.querySelector(".section").offsetWidth - parseInt(ele.getAttribute("img-width"))) / 2 + "px";
    });
  }

  preloadBackground() {
    this.preloadQueue = [];
    document.querySelectorAll(".section[bg]").forEach(ele => this.preloadQueue.push(ele.getAttribute('bg')))
    this._preload();
  }

  _preload() {
    let url = this.preloadQueue.shift();
    if (!url) return;
    let img = new Image();
    img.src = url;
    img.onload = evt => {
      this._preload();
    };
  }

  initSound(names) {
    this.sounds = {};
    for (let n of names) {
      let s = new Audio("img/" + n + ".mp3");
      s.preload = "auto";
      s.volume = 0;
      this.sounds[n] = s;
    }
    document.querySelector('.btn').addEventListener('touchend', evt => {
      for (let name in this.sounds) this.sounds[name].play();
    });
  }
  playSound(name) {
    let s = this.sounds[name];
    s.volume = 1;
    s.currentTime = 0;
    s.play();
  }
}
window.game = new ShakeAGift();
// game.startGame();
//game.show("result-pass");
game.show("landing");