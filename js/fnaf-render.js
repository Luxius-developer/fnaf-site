// fnaf-render.js — отрисовка игры Five Nights at Freddy's
// Используется объектом FNAF.Core через FNAF.Render.draw(state, ctx, canvas)

(function() {
  window.FNAF = window.FNAF || {};

  const W = 960, H = 640;

  // Позиции камер на мини-карте
  const camPositions = {
    '1A': [90, 30], '1B': [190, 30], '1C': [290, 30],
    '2A': [90, 110], '2B': [190, 110], '3': [290, 110],
    '4A': [90, 190], '4B': [190, 190], '5': [290, 190],
    '6': [90, 270], '7': [190, 270]
  };

  // Расстояния камер (для подписей)
  const camDistance = {
    '1A': 'Далеко', '1B': 'Далеко', '1C': 'Далеко',
    '2A': 'Средне', '2B': 'Средне', '3': 'Близко',
    '4A': 'Близко', '4B': 'Близко', '5': 'Опасно',
    '6': 'Опасно', '7': 'У двери'
  };

  // Рисование аниматроника (упрощённые фигуры)
  function drawAnimatronic(ctx, x, y, name, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    switch(name) {
      case 'Bonnie':
        ctx.fillStyle = '#7d3c98'; ctx.fillRect(-20, -40, 40, 80);
        ctx.fillStyle = '#9b59b6'; ctx.beginPath(); ctx.arc(0, -50, 25, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#9b59b6'; ctx.fillRect(-15, -70, 8, 20); ctx.fillRect(7, -70, 8, 20);
        ctx.fillStyle = '#fff'; ctx.fillRect(-10, -55, 6, 6); ctx.fillRect(4, -55, 6, 6);
        ctx.fillStyle = '#000'; ctx.fillRect(-8, -53, 2, 2); ctx.fillRect(6, -53, 2, 2);
        ctx.fillStyle = '#5b2c6f'; ctx.fillRect(-30, -20, 10, 30);
        break;
      case 'Chica':
        ctx.fillStyle = '#f1c40f'; ctx.fillRect(-20, -40, 40, 80);
        ctx.fillStyle = '#f39c12'; ctx.beginPath(); ctx.arc(0, -50, 25, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#e67e22'; ctx.beginPath(); ctx.moveTo(-10, -50); ctx.lineTo(10, -50); ctx.lineTo(0, -35); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(-10, -55, 6, 6); ctx.fillRect(4, -55, 6, 6);
        ctx.fillStyle = '#000'; ctx.fillRect(-8, -53, 2, 2); ctx.fillRect(6, -53, 2, 2);
        break;
      case 'Freddy':
        ctx.fillStyle = '#5d4037'; ctx.fillRect(-20, -40, 40, 80);
        ctx.fillStyle = '#8b4513'; ctx.beginPath(); ctx.arc(0, -50, 25, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#3e2723'; ctx.fillRect(-25, -65, 50, 15); ctx.fillRect(-10, -80, 20, 15);
        ctx.fillStyle = '#fff'; ctx.fillRect(-10, -55, 6, 6); ctx.fillRect(4, -55, 6, 6);
        ctx.fillStyle = '#000'; ctx.fillRect(-8, -53, 2, 2); ctx.fillRect(6, -53, 2, 2);
        break;
      case 'Foxy':
        ctx.fillStyle = '#922b21'; ctx.fillRect(-20, -40, 40, 80);
        ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(0, -50, 25, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.fillRect(-15, -58, 10, 4);
        ctx.fillStyle = '#7f8c8d'; ctx.fillRect(20, -30, 15, 4); ctx.beginPath(); ctx.arc(35, -30, 5, 0, Math.PI*2); ctx.fill();
        break;
    }
    ctx.restore();
  }

  // Параллакс-смещение
  function getParallax(state) {
    const dx = (state.mouseX - W/2) * 0.03;
    const dy = (state.mouseY - H/2) * 0.03;
    return {dx, dy};
  }

  // Офис
  function drawOffice(state, ctx) {
    ctx.clearRect(0, 0, W, H);
    const {dx, dy} = getParallax(state);
    ctx.save();
    ctx.translate(dx, dy);

    // Задник офиса
    const floorGrad = ctx.createLinearGradient(0, 400, 0, H);
    floorGrad.addColorStop(0, '#1a1a1a');
    floorGrad.addColorStop(1, '#0d0d0d');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 400, W, H);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 100, W, 300);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, W, 100);

    // Коридоры
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(180, 180); ctx.lineTo(40, 480); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(180, 480); ctx.lineTo(40, 480); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W-180, 180); ctx.lineTo(W-40, 480); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W-180, 480); ctx.lineTo(W-40, 480); ctx.stroke();

    // Дверные проёмы
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(30, 180, 150, 300);
    ctx.fillRect(W-180, 180, 150, 300);

    // Левая дверь
    if (state.doorLeft) {
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(30, 180, 150, 300);
      ctx.fillStyle = '#3e2723';
      for (let i = 0; i < 5; i++) ctx.fillRect(40, 200 + i * 60, 130, 15);
    }
    // Правая дверь
    if (state.doorRight) {
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(W-180, 180, 150, 300);
      ctx.fillStyle = '#3e2723';
      for (let i = 0; i < 5; i++) ctx.fillRect(W-170, 200 + i * 60, 130, 15);
    }

    // Свет в дверях
    if (state.lightLeft && !state.doorLeft) {
      ctx.fillStyle = 'rgba(255,255,200,0.25)';
      ctx.fillRect(30, 180, 150, 300);
    }
    if (state.lightRight && !state.doorRight) {
      ctx.fillStyle = 'rgba(255,255,200,0.25)';
      ctx.fillRect(W-180, 180, 150, 300);
    }

    // Аниматроники в дверях (если свет включен и дверь открыта)
    const bonnie = state.animatronics.find(a => a.name === 'Bonnie');
    if (bonnie && bonnie.atDoor && !state.doorLeft && state.lightLeft) {
      drawAnimatronic(ctx, 105, 380, 'Bonnie', 0.9);
    }
    const chica = state.animatronics.find(a => a.name === 'Chica');
    if (chica && chica.atDoor && !state.doorRight && state.lightRight) {
      drawAnimatronic(ctx, W-105, 380, 'Chica', 0.9);
    }
    const freddy = state.animatronics.find(a => a.name === 'Freddy');
    if (freddy && freddy.atDoor && !state.doorRight) {
      drawAnimatronic(ctx, W-105, 380, 'Freddy', 0.7);
    }

    ctx.restore(); // сброс параллакса

    // Интерфейсные кнопки (без параллакса)
    // Левая дверь
    ctx.fillStyle = state.doorLeft ? '#27ae60' : '#c0392b';
    ctx.fillRect(50, 500, 110, 35);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px "Courier New"';
    ctx.fillText(state.doorLeft ? 'Открыть' : 'Закрыть', 58, 523);

    // Правая дверь
    ctx.fillStyle = state.doorRight ? '#27ae60' : '#c0392b';
    ctx.fillRect(W-160, 500, 110, 35);
    ctx.fillText(state.doorRight ? 'Открыть' : 'Закрыть', W-152, 523);

    // Левый свет
    ctx.fillStyle = state.lightLeft ? '#f1c40f' : '#7f8c8d';
    ctx.fillRect(50, 545, 110, 30);
    ctx.fillStyle = '#000';
    ctx.fillText(state.lightLeft ? 'Свет ВКЛ' : 'Свет ВЫКЛ', 55, 565);

    // Правый свет
    ctx.fillStyle = state.lightRight ? '#f1c40f' : '#7f8c8d';
    ctx.fillRect(W-160, 545, 110, 30);
    ctx.fillText(state.lightRight ? 'Свет ВКЛ' : 'Свет ВЫКЛ', W-155, 565);

    // Кнопка камер
    ctx.fillStyle = '#3498db';
    ctx.fillRect(380, 555, 200, 50);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px "Courier New"';
    ctx.fillText('КАМЕРЫ [Tab]', 395, 585);

    // Панель энергии и времени
    ctx.fillStyle = '#000';
    ctx.fillRect(10, 10, 260, 85);
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 260, 85);
    ctx.fillStyle = '#0f0';
    ctx.font = '16px "Courier New"';
    ctx.fillText(`Энергия: ${Math.floor(state.power)}%`, 20, 40);
    const hour = Math.floor(state.hourProgress * 6);
    const hourStr = (hour === 0) ? '12 AM' : `${hour} AM`;
    ctx.fillText(`Время: ${hourStr}`, 20, 70);
    ctx.fillText(`Ночь ${state.night}`, 160, 70);
  }

  // План ресторана на экране камер
  function drawRestaurantPlan(state, ctx, highlightCam) {
    const px = 700, py = 30, pw = 230, ph = 420;
    ctx.fillStyle = '#111';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);

    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;

    // Комнаты
    ctx.strokeRect(px+10, py+10, 130, 90);
    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 9px "Courier New"';
    ctx.fillText('Сцена', px+15, py+25);
    ctx.strokeRect(px+10, py+110, 130, 70);
    ctx.fillText('Столовая', px+15, py+125);
    ctx.strokeRect(px+150, py+10, 70, 50);
    ctx.fillText('Пират. бухта', px+155, py+25);
    ctx.strokeRect(px+150, py+70, 70, 50);
    ctx.fillText('Подсобка', px+155, py+85);
    ctx.strokeRect(px+10, py+190, 60, 50);
    ctx.fillText('Кухня', px+15, py+205);
    ctx.strokeRect(px+80, py+190, 140, 50);
    ctx.fillText('Зап. коридор', px+85, py+205);
    ctx.strokeRect(px+80, py+250, 140, 50);
    ctx.fillText('Вост. коридор', px+85, py+265);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(px+110, py+310, 100, 40);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px "Courier New"';
    ctx.fillText('ОФИС', px+130, py+335);
    ctx.beginPath();
    ctx.arc(px+160, py+330, 5, 0, Math.PI*2);
    ctx.fill();

    // Камеры
    const camList = FNAF.cameraList || ['1A','1B','1C','2A','2B','3','4A','4B','5','6','7'];
    for (let cam of camList) {
      const [cx, cy] = camPositions[cam] || [0, 0];
      ctx.fillStyle = (cam === highlightCam) ? '#e74c3c' : '#3498db';
      ctx.fillRect(px + cx - 7, py + cy - 7, 14, 14);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px "Courier New"';
      ctx.fillText(cam, px + cx - 8, py + cy + 3);
    }

    // Легенда
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px "Courier New"';
    ctx.fillText('Расстояние:', px+10, py+380);
    const dc = {'Далеко':'#2ecc71','Средне':'#f1c40f','Близко':'#e67e22','Опасно':'#e74c3c','У двери':'#c0392b'};
    let yOff = 395;
    for (let d in dc) {
      ctx.fillStyle = dc[d];
      ctx.fillRect(px+15, py+yOff, 8, 8);
      ctx.fillStyle = '#fff';
      ctx.fillText(d, px+25, py+yOff+8);
      yOff += 16;
    }
  }

  // Вид из камеры
  function drawCameras(state, ctx) {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, 640, 400);
    ctx.fillStyle = '#000';
    ctx.fillRect(30, 30, 640, 400);

    // Шум
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
      ctx.fillRect(30 + Math.random() * 640, 30 + Math.random() * 400, 1, 15);
    }

    // Аниматроники на текущей камере (кроме Фокси, если он бежит)
    const animsHere = state.animatronics.filter(a => a.position === state.currentCam && !(a.name === 'Foxy' && state.foxyRunning));
    animsHere.forEach((a, i) => {
      drawAnimatronic(ctx, 250 + i * 100, 300, a.name, 1.2);
    });

    // Подпись камеры
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px "Courier New"';
    ctx.fillText(`Камера ${state.currentCam} [${camDistance[state.currentCam]}]`, 50, 65);

    // План ресторана
    drawRestaurantPlan(state, ctx, state.currentCam);

    // Кнопки переключения
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(60, 450, 130, 40);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px "Courier New"';
    ctx.fillText('< Пред.', 75, 475);
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(450, 450, 130, 40);
    ctx.fillText('След. >', 480, 475);

    // Кнопка опустить монитор
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(380, 555, 200, 50);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px "Courier New"';
    ctx.fillText('Опустить [Tab]', 395, 585);
  }

  // Экран смерти
  function drawGameOver(state, ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#c0392b';
    ctx.font = '52px "Courier New"';
    ctx.fillText('СКРИМЕР!', 300, 300);
    ctx.fillStyle = '#fff';
    ctx.font = '28px "Courier New"';
    ctx.fillText(`Вас убил ${state.killTrigger}`, 310, 360);
    ctx.font = '20px "Courier New"';
    ctx.fillText('Нажмите R для перезапуска', 310, 420);
  }

  // Экран победы
  function drawVictory(state, ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f1c40f';
    ctx.font = '52px "Courier New"';
    ctx.fillText('6:00 AM', 330, 300);
    ctx.fillStyle = '#fff';
    ctx.font = '28px "Courier New"';
    ctx.fillText(`Ночь ${state.night} пройдена!`, 320, 360);
    ctx.font = '20px "Courier New"';
    ctx.fillText('Нажмите R для следующей ночи', 270, 420);
  }

  // Главная функция отрисовки
  function draw(state, ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (state.gameOver) {
      drawOffice(state, ctx);
      drawGameOver(state, ctx);
    } else if (state.victory) {
      drawOffice(state, ctx);
      drawVictory(state, ctx);
    } else if (state.view === 'office') {
      drawOffice(state, ctx);
    } else if (state.view === 'cameras') {
      drawCameras(state, ctx);
    }

    // Сообщение (внизу экрана)
    if (state.message && state.messageTimer > 0) {
      ctx.fillStyle = '#fff';
      ctx.font = '16px "Courier New"';
      ctx.fillText(state.message, 300, 620);
    }
  }

  // Экспорт
  FNAF.Render = { draw };

})();