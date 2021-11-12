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
    if (Math.random() < 0.5) {
      this.img.src = 'img/snowflake.png';
      this.rotation = Math.random() * Math.PI;
      this.rspeed = Math.random() - 0.5;
    } else {
      this.img.src = 'img/light.png';
      this.rotation = 0
      this.rspeed = 0
    }
    this.update();
  }

  update() {
    this.y += this.speed;
    this.rotation += this.rspeed * 4;
    this.img.style.transform = `translate(${this.x - this.size / 2}px, ${this.y - this.size / 2}px) rotate(${this.rotation}deg)`;
  }

}
class ArrowTransform {
  constructor(ele, container) {
    this.ele = ele;
    this.container = container;
    this.xmin = -ele.offsetHeight / 2 + 14;
    this.xmax = container.offsetWidth - ele.offsetHeight / 2 - 5;
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
    let r = ob.size / 1.5;
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
    this.utils = new Utils();
    // window.addEventListener('resize', this.resize);
    this.timer = document.querySelector('.timer');
    this.arrow = document.querySelector('.arrow');
    this.container = document.querySelector('.game-area');
    this.duration = 0;
    this.resize();
  }
  resize() {
    let w = document.body.offsetWidth;
    let h = w / 9 * 16;
    if (h > window.innerHeight) {
      h = window.innerHeight;
      document.body.style.maxWidth = h / 16 * 9 + 'px';
    }
    document.querySelectorAll('.section').forEach(ele => {
      ele.style.height = h + 'px';
    });
    document.querySelectorAll('[data-pos]').forEach(ele => {
      ele.style.marginTop = h * parseInt(ele.getAttribute('data-pos')) / 100 + 'px';
    });
    document.querySelector('.game-area').style.height = h - 80 + 'px';
    if (w <= 320) {
      document.querySelector('iframe').setAttribute('width', w - 120);
      document.querySelector('iframe').setAttribute('height', (w - 120) / 16 * 9);
    }
  }

  show(section, value = null) {
    // this.resize();
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
    for (let i = 8; i > -1; i -= 2.5) {
      this._gen_obstacles(i + 2);
    }
    this.counter = 0;
    this._updateGame();
  }

  _gen_obstacles(row) {
    this.cols = 8;
    let arr = [];
    for (let i = 0; i < this.cols; i++)  arr.push(i);

    for (let i = 0; i < arr.length; i++) {
      let p = Math.floor(Math.random() * arr.length);
      let temp = arr[i];
      arr[i] = arr[p];
      arr[p] = temp;
    }

    for (let i = 0; i < arr.length - 1; i++) {
      let ob = new Obstacle(this.container, this.container.offsetWidth / arr.length, row, arr[i]);
      this.obstacles.push(ob);
    }
  }
  _updateGame() {
    this.duration = (new Date().getTime() - this.startTime) / 1000;
    this.timer.innerHTML = `${this.duration.toFixed(1)}s`;
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      this.obstacles[i].update();
    }
    let ob = this.obstacles[0];
    if (this.counter++ > ob.size / ob.speed * 2.5) {
      for (let i = 0; i < this.cols - 1; i++) {
        this.container.removeChild(this.obstacles[i].img);
      }
      this.obstacles.splice(0, this.cols - 1);
      this._gen_obstacles(2);
      this.counter = 0;
    }
    this.arrow.style.transform = this.aTransform.update(this.obstacles);
    let tx = this.container.offsetWidth / 2 - this.arrow.offsetWidth / 2;
    let ty = 70;
    let dx = this.aTransform.x - tx;     //hard coded
    let dy = this.aTransform.y - ty;
    if (dx * dx + dy * dy < 400) {
      this.aTransform.x = tx;
      this.aTransform.y = ty;
      this.arrow.style.transform = this.aTransform.update([]);
      this.endGame();
    }
    if (!this.gameEnded) {
      window.requestAnimationFrame(t => this._updateGame());
    }
  }
  endGame() {
    this.gameEnded = true;
    window.removeEventListener("devicemotion", this._motionUpdated);
    document.querySelector('.confetti').style.display = 'inline-block';
    document.querySelector('.timer-small').innerHTML = this.duration.toFixed(1) + 's';
    setTimeout(() => {
      this.obstacles.forEach(ob => this.container.removeChild(ob.img));
      document.querySelector('.confetti').style.display = 'none';
      this.gameEnded = false;
      this.show('success', this.duration.toFixed(1));
    }, 2000);
  }

  /**
   * Share result as a tweet
   */
  share() {
    gaEvent('share', 'btn-click');
    let message = CONFIG['SUCCESS_TWEET'];
    message = `${this.duration.toFixed(1)}s!\n\n${message}\n\n${document.location.href}`;
    document.location.href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(message);
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
    if (navigator.userAgent.match(/iPhone|iPod|iPad/)) {
      game.aTransform.ax = e.accelerationIncludingGravity.x;
      game.aTransform.ay = -e.accelerationIncludingGravity.y - 4;
    } else {
      game.aTransform.ax = -e.accelerationIncludingGravity.x;
      game.aTransform.ay = e.accelerationIncludingGravity.y - 4;
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
    document.querySelectorAll("[bg]").forEach(ele => this.preloadQueue.push(ele.getAttribute('bg')))
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
// game.endGame();
game.show("landing");
// game.show("success");
// game.show("instruction");