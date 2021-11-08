class Obstacle {
  constructor(container, size, row, col) {
    this.speed = 0.5;
    this.container = container;
    this.size = size;
    this.row = row;
    this.col = col;
    this.img = new Image();
    this.img.src = Math.random() < 0.5 ? 'img/snowflake.png' : 'img/light.png';
    this.img.classList.add('obstacle');
    this.img.setAttribute('width', size);
    this.container.appendChild(this.img);
    this.x = size * (col + 0.5);
    this.y = size * (row + 0.5);
    this.rotation = Math.random() * Math.PI;
    this.rspeed = Math.random() - 0.5;
    this.update();
  }

  update() {
    this.y += this.speed;
    this.rotation += this.rspeed * 4;
    this.img.style.transform = `translate(${this.x - this.size / 2}px, ${this.y - this.size / 2}px) rotate(${this.rotation}deg)`;
    if (this.y > this.container.offsetHeight) {
      this.container.removeChild(this.img);
      return true;
    }
    return false;
  }

}
class ArrowTransform {
  constructor(ele, container) {
    this.ele = ele;
    this.container = container;
    this.xmin = -ele.offsetHeight / 2;
    this.xmax = container.offsetWidth - ele.offsetHeight / 2;
    this.ymin = 0;
    this.ymax = container.offsetHeight;

    this.x = this.xmax / 2;
    this.y = this.ymax - ele.offsetHeight;
    this.sx = 0;
    this.sy = 0;
    this.ax = 0;
    this.ay = 0;
  }

  _clamp(v, min, max) {
    if (v < min) return min;
    if (v > max) return max;
    return v;
  }

  _bounce(v, min, max) {
    if (v < min) return min;
    if (v > max) return max;
    return v;
  }

  _collision(ob) {
    let r = ob.size / 2;
    let dx = ob.x - r - this.x;
    let dy = ob.y - this.y;
    if (dx * dx + dy * dy < r * r) {
      let ang = Math.atan2(dy, dx);
      this.x = ob.x - r - r * Math.cos(ang);
      this.y = ob.y - r * Math.sin(ang);
    }
  }
  update(obstacles) {
    const MAX_SPEED = 5;
    const ACC_SCALING = 0.1;
    this.sx = this._clamp(this.sx + this.ax * ACC_SCALING, -MAX_SPEED, MAX_SPEED);
    this.sy = this._clamp(this.sy + this.ay * ACC_SCALING, -MAX_SPEED, MAX_SPEED);

    // if (this.x == this.xmin && this.sx < 0 || this.x == this.xmax && this.sx > 0) this.sx *= -1;
    // if (this.y == this.ymin && this.sy < 0 || this.y == this.ymax && this.sy > 0) this.sy *= -1;

    this.x = this._clamp(this.x + this.sx, this.xmin, this.xmax);
    this.y = this._clamp(this.y + this.sy, this.ymin, this.ymax);

    this.sx *= 0.95;
    this.sy *= 0.95;

    for (let ob of obstacles) {
      this._collision(ob);
    }

    return `translate(${this.x}px,${this.y}px) rotate(${Math.atan2(this.sy, this.sx) + Math.PI / 2}rad`;
  }


}
class ShakeAGift {
  constructor() {
    new Utils().preloadBackground();
    window.addEventListener('resize', this.resize);
    this.resize();
    this.timer = document.querySelector('.timer');
    this.arrow = document.querySelector('.arrow');
    this.container = document.querySelector('.game-area');
  }
  resize() {
    let w = document.querySelector('.section').offsetWidth;
    let h = w / 9 * 16;
    document.querySelectorAll('.section').forEach(ele => {
      ele.style.height = h + 'px';
      // ele.style.marginTop = (window.innerHeight - h) / 2 + 'px';
    });
    document.querySelectorAll('[data-pos]').forEach(ele => {
      ele.style.marginTop = h * parseInt(ele.getAttribute('data-pos')) / 100 + 'px';
    });
    document.querySelector('.game-area').style.height = h - 100 + 'px';
  }

  show(section, value = null) {
    // Google Analytics Tracking
    gaEvent(section, 'section-view', section, value);
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
    this.startTime = new Date().getTime();
    this.show("game");
    window.addEventListener('devicemotion', this._motionUpdated);
    this.aTransform = new ArrowTransform(this.arrow, this.container);
    this.obstacles = [];
    this._updateGame();

    for (let i = 0; i < 5; i++) {
      this.obstacles.push(new Obstacle(this.container, this.container.offsetWidth / 5, i + 2, i % 5));
    }
  }
  _updateGame() {
    window.requestAnimationFrame(t => this._updateGame());
    this.duration = (new Date().getTime() - this.startTime) / 1000;
    this.timer.innerHTML = `${this.duration.toFixed(1)}s`;
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      let ob = this.obstacles[i];
      if (ob.update()) {
        this.obstacles.splice(i, 1);
        this.obstacles.push(new Obstacle(this.container, this.container.offsetWidth / 5, 2, Math.round(Math.random() * 5)));
      }
    }
    this.arrow.style.transform = this.aTransform.update(this.obstacles);
  }
  endGame() {
    window.removeEventListener("devicemotion", this._motionUpdated);
    document.querySelectorAll(".time").forEach(ele => (ele.innerHTML = this.shakeCount));
    this.show('success');
  }

  /**
   * Share result as a tweet
   */
  share() {
    gaEvent('share', 'btn-click');
    let message = "Yes berhasil! Jeli kan kaya Clinton & Kate🎯🏹  Coba dong pada ikutan juga sembari nunggu streaming #HawkeyeID di #DisneyPlusHotstarID";
    message = message.replace('[[SHAKE_COUNT]]', this.shakeCount) + '\n' + document.location.href;
    document.location.href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(messages[n]);
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
      this.show("instruction");
    }
  }

  _motionUpdated(e) {
    game.aTransform.ax = -e.accelerationIncludingGravity.x;
    game.aTransform.ay = e.accelerationIncludingGravity.y - 4;
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
// game.show("landing");
// game.show("success");
game.show("instruction");