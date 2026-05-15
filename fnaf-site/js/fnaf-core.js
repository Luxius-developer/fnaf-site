// fnaf-core.js — игровая логика Five Nights at Freddy's
// Ожидает, что где-то определён объект FNAF.Render (fnaf-render.js) с функцией draw(state, ctx)

(function() {
  window.FNAF = window.FNAF || {};

  // Звуки — загружаются один раз, необязательные
  const sounds = {
    phoneRing: new Audio('sounds/phone-ring.mp3'),
    door: new Audio('sounds/door.mp3'),
    light: new Audio('sounds/light.mp3'),
    cameraUp: new Audio('sounds/camera_up.mp3'),
    cameraDown: new Audio('sounds/camera_down.mp3'),
    scream: new Audio('sounds/scream.mp3'),
    foxyRun: new Audio('sounds/foxy_run.mp3'),
    freddyLaugh: new Audio('sounds/freddy_laugh.mp3'),
  };

  // Базовое состояние игры
  const defaultState = {
    night: 1,
    difficulty: 1.0,
    timeLeft: 360,            // секунд до 6 AM
    power: 100,
    hourProgress: 0,
    gameOver: false,
    victory: false,
    view: 'office',           // 'office' или 'cameras'
    currentCam: '1A',
    doorLeft: false,
    doorRight: false,
    lightLeft: false,
    lightRight: false,
    animatronics: [],
    foxyStage: 0,
    foxyTimer: 0,
    foxyAttackCooldown: 0,
    foxyRunning: false,
    powerOutTimer: 0,
    powerOut: false,
    freddyPlaying: false,
    killTrigger: null,
    moveTimer: 0,
    message: '',
    messageTimer: 0,
    phoneCallActive: false,
    phoneAnswered: false,
    globalSpeedMultiplier: 1.0,
    mouseX: 960 / 2,
    mouseY: 640 / 2,
  };

  // Список камер и расстояний
  const cameraList = ['1A','1B','1C','2A','2B','3','4A','4B','5','6','7'];
  const camDistance = {
    '1A': 'Далеко', '1B': 'Далеко', '1C': 'Далеко',
    '2A': 'Средне', '2B': 'Средне', '3': 'Близко',
    '4A': 'Близко', '4B': 'Близко', '5': 'Опасно',
    '6': 'Опасно', '7': 'У двери'
  };

  class Animatronic {
    constructor(name, path, doorSide, color) {
      this.name = name;
      this.path = path;
      this.position = path[0];
      this.pathIndex = 0;
      this.doorSide = doorSide;
      this.atDoor = false;
      this.color = color;
    }
    moveNext() {
      if (this.pathIndex < this.path.length - 1) {
        this.pathIndex++;
        this.position = this.path[this.pathIndex];
        if (this.position === 'doorL' || this.position === 'doorR') {
          this.atDoor = true;
        }
      }
    }
    moveBack() {
      if (this.atDoor) {
        this.atDoor = false;
        if (this.pathIndex > 0) {
          this.pathIndex--;
          this.position = this.path[this.pathIndex];
        }
      }
    }
  }

  class Core {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.state = JSON.parse(JSON.stringify(defaultState));
      this.options = options; // onGameOver, onVictory и т.д.

      // Инициализация аниматроников
      this.initAnimatronics();

      // Запуск игрового таймера
      this.tickInterval = setInterval(() => this.tick(), 1000);

      // Привязка обработчиков
      this.bindEvents();
    }

    // ---------- Вспомогательные ----------
    getAnimatronicByName(name) {
      return this.state.animatronics.find(a => a.name === name);
    }
    isCameraUp() {
      return this.state.view === 'cameras';
    }
    isWatching(cam) {
      return this.isCameraUp() && this.state.currentCam === cam;
    }
    addMessage(text) {
      this.state.message = text;
      this.state.messageTimer = 4;
    }

    playSound(name) {
      const snd = sounds[name];
      if (snd) {
        snd.volume = 0.5; // базовая громкость, можно вынести в настройки
        snd.play().catch(() => {});
      }
    }

    // ---------- Инициализация аниматроников ----------
    initAnimatronics() {
      this.state.animatronics = [
        new Animatronic('Bonnie', ['1A','1B','2A','2B','3','4A','4B','doorL'], 'left', '#9b59b6'),
        new Animatronic('Chica',  ['1A','1B','2A','2B','4A','4B','7','doorR'], 'right', '#f1c40f'),
        new Animatronic('Freddy', ['1A','1B','2A','3','4A','4B','7','doorR'], 'right', '#8b4513'),
        new Animatronic('Foxy',   [], null, '#c0392b')
      ];
      this.state.animatronics[3].position = '1C';
    }

    // ---------- Сброс ночи ----------
    resetNight(nightNum) {
      Object.assign(this.state, JSON.parse(JSON.stringify(defaultState)));
      this.state.night = nightNum;
      // Сложность растёт с ночами: ночь 1 => 1.0, далее +0.6 за ночь до 7, потом +0.5
      if (nightNum <= 1) this.state.difficulty = 1.0;
      else if (nightNum <= 7) this.state.difficulty = 1.0 + (nightNum - 1) * 0.6;
      else this.state.difficulty = 4.0 + (nightNum - 7) * 0.5;
      this.state.aiLevel = this.state.difficulty;
      this.initAnimatronics();
    }

    // ---------- Сохранения ----------
    getSaveData() {
      return {
        night: this.state.night,
        difficulty: this.state.difficulty,
        // Можно добавить другие ключевые параметры, если нужно
      };
    }

    loadFromSave(saveData) {
      this.resetNight(saveData.night);
      // Восстанавливаем сложность, если она есть в сохранении
      if (saveData.difficulty !== undefined) {
        this.state.difficulty = saveData.difficulty;
        this.state.aiLevel = saveData.difficulty;
      }
    }

    // ---------- Звонок ----------
    startPhoneCall() {
      this.state.phoneCallActive = true;
      this.state.phoneAnswered = false;
      this.updateHangupButton(true);
      this.playSound('phoneRing');
    }

    endPhoneCall() {
      this.state.phoneCallActive = false;
      this.updateHangupButton(false);
      this.state.globalSpeedMultiplier = this.state.phoneAnswered ? 1.5 : 1.0;
      this.addMessage(this.state.phoneAnswered ? 'Вы ответили! Аниматроники быстрее.' : 'Звонок завершён.');
    }

    answerPhone() {
      if (!this.state.phoneAnswered && this.state.phoneCallActive) {
        this.state.phoneAnswered = true;
        this.addMessage('Вы ответили на звонок. Скорость аниматроников повышена.');
      }
    }

    updateHangupButton(visible) {
      const btn = document.getElementById('hangup-btn');
      if (btn) btn.style.display = visible ? 'block' : 'none';
    }

    // ---------- Игровой цикл (каждую секунду) ----------
    tick() {
      if (this.state.gameOver || this.state.victory) return;

      this.consumePower();
      this.updateTime();
      // Звонок не имеет авто-завершения, просто висит

      if (!this.state.powerOut) {
        this.state.moveTimer++;
        if (this.state.moveTimer >= 5) {
          this.state.moveTimer = 0;
          this.moveAnimatronics();
        }
      }
      this.checkDoorDanger();
    }

    // ---------- Расход энергии ----------
    consumePower() {
      if (this.state.power <= 0) return;
      let drain = 0.05; // базовое потребление
      if (this.state.doorLeft) drain += 0.04;
      if (this.state.doorRight) drain += 0.04;
      if (this.state.lightLeft) drain += 0.04;
      if (this.state.lightRight) drain += 0.04;
      if (this.isCameraUp()) drain += 0.04;
      this.state.power = Math.max(0, this.state.power - drain);
      if (this.state.power === 0 && !this.state.powerOut) {
        this.state.powerOut = true;
        this.state.powerOutTimer = 15;
        this.state.doorLeft = false;
        this.state.doorRight = false;
        this.state.lightLeft = false;
        this.state.lightRight = false;
        this.state.view = 'office';
        this.addMessage('Энергия кончилась!');
      }
    }

    // ---------- Обновление времени ----------
    updateTime() {
      if (this.state.timeLeft > 0) {
        this.state.timeLeft--;
        this.state.hourProgress = 1 - (this.state.timeLeft / 360);
        if (this.state.timeLeft <= 0) {
          this.state.victory = true;
          this.state.view = 'office';
          if (this.options.onVictory) this.options.onVictory(this.state.night);
        }
      }
      if (this.state.powerOut && !this.state.gameOver && !this.state.victory) {
        if (this.state.powerOutTimer > 0) {
          this.state.powerOutTimer--;
          if (this.state.powerOutTimer === 0) {
            this.triggerKill('Freddy');
          } else if (this.state.powerOutTimer === 12 && !this.state.freddyPlaying) {
            this.state.freddyPlaying = true;
            this.addMessage('Фредди играет марш...');
            this.playSound('freddyLaugh');
          }
        }
      }
      if (this.state.messageTimer > 0) {
        this.state.messageTimer--;
        if (this.state.messageTimer === 0) this.state.message = '';
      }
    }

    // ---------- Перемещение аниматроников ----------
    moveAnimatronics() {
      const diff = this.state.difficulty * this.state.globalSpeedMultiplier;

      for (let a of this.state.animatronics) {
        if (a.name === 'Foxy') continue;
        let chance = 0;
        if (a.name === 'Bonnie') chance = Math.min(0.9, diff * 0.12);
        else if (a.name === 'Chica') chance = Math.min(0.85, diff * 0.1);
        else if (a.name === 'Freddy') {
          if (this.isCameraUp() && this.isWatching(a.position)) continue;
          chance = Math.min(0.7, diff * 0.08);
        }
        if (a.atDoor) {
          const doorClosed = (a.doorSide === 'left') ? this.state.doorLeft : this.state.doorRight;
          if (doorClosed && Math.random() < 0.2) {
            a.moveBack();
            this.addMessage(`${a.name} отошёл от двери`);
          }
          continue;
        }
        if (Math.random() < chance) {
          a.moveNext();
          if (a.name === 'Freddy') this.playSound('freddyLaugh');
        }
      }

      // Фокси
      const foxy = this.getAnimatronicByName('Foxy');
      if (this.state.foxyRunning) {
        this.state.foxyAttackCooldown--;
        if (this.state.foxyAttackCooldown <= 0) {
          if (this.state.doorLeft) {
            this.state.power = Math.max(0, this.state.power - 4);
            this.addMessage('Фокси стучит в левую дверь! -4% энергии');
            this.playSound('door');
          } else {
            this.triggerKill('Foxy');
          }
          this.state.foxyRunning = false;
          this.state.foxyStage = 0;
          this.state.foxyTimer = 0;
        }
        return;
      }

      // Пороги стадий Фокси
      let baseThresholds = [20, 25, 30];
      if (this.state.night === 1) baseThresholds = [500, 700, 900];
      else if (this.state.night === 2) baseThresholds = [60, 80, 100];
      const stageThresholds = baseThresholds.map(t => Math.max(5, Math.floor(t / diff)));

      if (this.state.foxyStage < 3) {
        if (!this.isWatching('1C') && !this.state.gameOver && !this.state.victory && !this.state.powerOut) {
          this.state.foxyTimer += 5;
          for (let i = this.state.foxyStage; i < 3; i++) {
            if (this.state.foxyTimer >= stageThresholds[i]) {
              this.state.foxyStage = i + 1;
              if (this.state.foxyStage === 3) {
                this.state.foxyRunning = true;
                this.state.foxyAttackCooldown = 2;
                this.addMessage('Фокси сорвался с места!');
                this.playSound('foxyRun');
              } else {
                this.addMessage(`Фокси становится активнее (стадия ${this.state.foxyStage})`);
              }
              break;
            }
          }
        } else if (this.isWatching('1C')) {
          this.state.foxyStage = 0;
          this.state.foxyTimer = 0;
        }
      }
    }

    // ---------- Смерть ----------
    triggerKill(name) {
      if (this.state.gameOver) return;
      this.state.killTrigger = name;
      this.state.gameOver = true;
      this.state.view = 'office';
      this.playSound('scream');
      if (this.options.onGameOver) this.options.onGameOver(this.state.night);
    }

    // ---------- Проверка опасности у дверей ----------
    checkDoorDanger() {
      if (this.state.powerOut || this.state.gameOver || this.state.victory) return;
      if (!this.isCameraUp()) {
        for (let a of this.state.animatronics) {
          if (a.atDoor) {
            const doorClosed = (a.doorSide === 'left') ? this.state.doorLeft : this.state.doorRight;
            if (!doorClosed) {
              this.triggerKill(a.name);
              return;
            }
          }
        }
      }
    }

    // ---------- Отрисовка (делегирует рендеру) ----------
    draw() {
      if (window.FNAF && window.FNAF.Render) {
        window.FNAF.Render.draw(this.state, this.ctx, this.canvas);
      } else {
        // Заглушка, если рендер ещё не загружен
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px "Courier New"';
        this.ctx.fillText('Загрузка графики...', 400, 300);
      }
    }

    // ---------- Обработка действий игрока ----------
    bindEvents() {
      // Мышь
      this.canvas.addEventListener('click', (e) => {
        if (this.state.gameOver || this.state.victory) return;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = 960 / rect.width;
        const scaleY = 640 / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;

        if (this.state.view === 'office') {
          if (mx >= 50 && mx <= 160 && my >= 500 && my <= 535) {
            this.state.doorLeft = !this.state.doorLeft; this.playSound('door');
          } else if (mx >= 800 && mx <= 910 && my >= 500 && my <= 535) {
            this.state.doorRight = !this.state.doorRight; this.playSound('door');
          } else if (mx >= 50 && mx <= 160 && my >= 545 && my <= 575) {
            this.state.lightLeft = !this.state.lightLeft; this.playSound('light');
          } else if (mx >= 800 && mx <= 910 && my >= 545 && my <= 575) {
            this.state.lightRight = !this.state.lightRight; this.playSound('light');
          } else if (mx >= 380 && mx <= 580 && my >= 555 && my <= 605) {
            this.state.view = 'cameras'; this.playSound('cameraUp');
          }
        } else { // cameras
          if (mx >= 380 && mx <= 580 && my >= 555 && my <= 605) {
            this.state.view = 'office'; this.playSound('cameraDown');
          } else if (mx >= 60 && mx <= 190 && my >= 450 && my <= 490) {
            const idx = cameraList.indexOf(this.state.currentCam);
            this.state.currentCam = cameraList[(idx - 1 + cameraList.length) % cameraList.length];
          } else if (mx >= 450 && mx <= 580 && my >= 450 && my <= 490) {
            const idx = cameraList.indexOf(this.state.currentCam);
            this.state.currentCam = cameraList[(idx + 1) % cameraList.length];
          }
        }
      });

      // Клавиатура
      window.addEventListener('keydown', (e) => {
        if (this.state.gameOver || this.state.victory) {
          if (e.key === 'r' || e.key === 'R') {
            if (this.state.victory) this.resetNight(this.state.night + 1);
            else this.resetNight(this.state.night);
          }
          return;
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          this.state.view = this.state.view === 'office' ? 'cameras' : 'office';
          this.playSound(this.state.view === 'cameras' ? 'cameraUp' : 'cameraDown');
        }
        if (e.key === 'a' || e.key === 'A') { this.state.doorLeft = !this.state.doorLeft; this.playSound('door'); }
        if (e.key === 'd' || e.key === 'D') { this.state.doorRight = !this.state.doorRight; this.playSound('door'); }
        if (e.key === 'q' || e.key === 'Q') { this.state.lightLeft = !this.state.lightLeft; this.playSound('light'); }
        if (e.key === 'e' || e.key === 'E') { this.state.lightRight = !this.state.lightRight; this.playSound('light'); }
        if (this.state.view === 'cameras') {
          const idx = cameraList.indexOf(this.state.currentCam);
          if (e.key === 'ArrowLeft') this.state.currentCam = cameraList[(idx - 1 + cameraList.length) % cameraList.length];
          else if (e.key === 'ArrowRight') this.state.currentCam = cameraList[(idx + 1) % cameraList.length];
        }
        if (e.key === ' ' && this.state.phoneCallActive && !this.state.phoneAnswered) {
          e.preventDefault();
          this.answerPhone();
        }
      });

      // Движение мыши для параллакса
      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.state.mouseX = (e.clientX - rect.left) * (960 / rect.width);
        this.state.mouseY = (e.clientY - rect.top) * (640 / rect.height);
      });
    }

    // Остановка таймера при необходимости
    destroy() {
      clearInterval(this.tickInterval);
    }
  }

  // Экспорт
  FNAF.Core = Core;
  FNAF.cameraList = cameraList;
  FNAF.camDistance = camDistance;
})();