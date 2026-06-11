/* ============================================================
   WOMBAT ARCADE — Just4Fun
   Three tiny retro games. Vanilla JS, canvas, zero dependencies.
   Wombat Home Loans — wombathomeloans.com.au
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Palette (Wombat brand) ---------- */
  var PAL = {
    D: '#060b38', N: '#1c476a', S: '#507fa9', L: '#97bcd7', P: '#cadbe5',
    K: '#0a0a0c', G: '#c89a4a', R: '#b8443c', E: '#2f7d5c', W: '#fdfcfa'
  };

  /* ---------- Sprites (rows of palette chars, . = transparent) ---------- */
  var WOMBAT = [
    '..DD..........DD..',
    '.DSSD........DSSD.',
    '.DSLLDDDDDDDDLLSD.',
    '.DSLLLLLLLLLLLLSD.',
    'DSLLLLLLLLLLLLLLSD',
    'DSLPKPLLLLLLPKPLSD',
    'DSLPKPLLLLLLPKPLSD',
    'DNLLLLLPPPPLLLLLND',
    'DNLLLLPDKKDPLLLLND',
    'DNSLLLPDKKDPLLLSND',
    'DNSLLLLPPPPLLLLSND',
    '.DNSLLLLLLLLLLSND.',
    '.DDNSLLLLLLLLSNDD.',
    '..DKKD.DKKD.DKKD..'
  ];
  var WOMBAT_B = WOMBAT.slice(0, 13).concat(['.DKKD..DKKD..DKKD.']);

  var COIN = [
    '..DDD..',
    '.DGGGD.',
    'DGPGGGD',
    'DGGGGGD',
    'DGPGGGD',
    '.DGGGD.',
    '..DDD..'
  ];
  var AVO = [
    '.DDDDDDD.',
    'DGGGGGGGD',
    'DGEEEEEGD',
    'DGEEKEEGD',
    'DGEEEEEGD',
    'DGGGGGGGD',
    '.DDDDDDD.'
  ];
  var RATE = [
    'DDDDDDDDD',
    'DRRRRRRRD',
    'DRRRWRRRD',
    'DRRWWWRRD',
    'DRWWWWWRD',
    'DRRRWRRRD',
    'DRRRWRRRD',
    'DRRRRRRRD',
    'DDDDDDDDD'
  ];
  var HOUSE = [
    '....K....',
    '...DDD...',
    '..DNNND..',
    '.DNNNNND.',
    'DDDDDDDDD',
    '.DNPNPND.',
    '.DNPNPND.',
    '.DDDDDDD.'
  ];
  var HEART = [
    '.KK.KK.',
    'KRRKRRK',
    'KRRRRRK',
    '.KRRRK.',
    '..KRK..',
    '...K...'
  ];

  function drawSprite(ctx, rows, x, y, s) {
    for (var j = 0; j < rows.length; j++) {
      var row = rows[j];
      for (var i = 0; i < row.length; i++) {
        var c = row[i];
        if (c !== '.') {
          ctx.fillStyle = PAL[c];
          ctx.fillRect(Math.round(x + i * s), Math.round(y + j * s), s, s);
        }
      }
    }
  }
  function spriteW(rows, s) { return rows[0].length * s; }
  function spriteH(rows, s) { return rows.length * s; }

  /* ---------- Canvas & shared state ---------- */
  var W = 320, H = 440;
  var canvas = document.getElementById('arcadeCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  canvas.width = W; canvas.height = H;
  ctx.imageSmoothingEnabled = false;

  var menuEl = document.getElementById('arcadeMenu');
  var stageEl = document.getElementById('arcadeStage');
  var overlayEl = document.getElementById('arcadeOverlay');
  var ovTitle = document.getElementById('ovTitle');
  var ovLine = document.getElementById('ovLine');
  var ovBest = document.getElementById('ovBest');
  var hudTitle = document.getElementById('hudTitle');

  var current = null, raf = null, last = 0, currentName = '';

  var keys = {};
  var pointer = { x: null, down: false };

  function pickFont(px) { return px + 'px "Press Start 2P", monospace'; }
  function text(str, x, y, px, col, align) {
    ctx.font = pickFont(px || 8);
    ctx.fillStyle = col || PAL.P;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(str, x, y);
  }

  /* ---------- Best scores ---------- */
  function loadBests() {
    try { return JSON.parse(localStorage.getItem('wombatArcade') || '{}'); }
    catch (e) { return {}; }
  }
  function saveBest(key, val) {
    var b = loadBests(); b[key] = val;
    try { localStorage.setItem('wombatArcade', JSON.stringify(b)); } catch (e) { /* private mode */ }
  }

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function money(n) { return '$' + n.toLocaleString('en-AU'); }

  /* ---------- Game loop ---------- */
  function loop(t) {
    if (!current) return;
    var dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    current.update(dt);
    if (!current) return; // game ended during update
    current.draw();
    raf = requestAnimationFrame(loop);
  }

  function startGame(name) {
    currentName = name;
    current = GAMES[name]();
    menuEl.style.display = 'none';
    stageEl.style.display = 'block';
    overlayEl.style.display = 'none';
    hudTitle.textContent = current.title;
    current.init();
    last = performance.now();
    raf = requestAnimationFrame(loop);
    if (window.umami) { try { umami.track('just4fun-play', { game: name }); } catch (e) {} }
  }

  function stopGame() {
    current = null;
    if (raf) cancelAnimationFrame(raf);
  }

  function toMenu() {
    stopGame();
    overlayEl.style.display = 'none';
    stageEl.style.display = 'none';
    menuEl.style.display = 'block';
  }

  function endGame(title, line, bestLine) {
    stopGame();
    ovTitle.textContent = title;
    ovLine.textContent = line;
    ovBest.textContent = bestLine || '';
    overlayEl.style.display = 'flex';
  }

  /* ============================================================
     GAME 1 — DEPOSIT DASH (catch coins, dodge rate rises)
     ============================================================ */
  function DepositDash() {
    var TARGET = 100000, SCALE = 2.5;
    var wx, vx, items, popups, moneyAmt, lives, t, spawnT, frame, frameT, hurtT;
    var ww = spriteW(WOMBAT, SCALE), wh = spriteH(WOMBAT, SCALE);
    var wy = H - wh - 26;

    var winLines = [
      'Deposit saved in {T}s. Real ones take a touch longer. That part is my job.',
      '{T} seconds to $100k. If only payslips worked like this.'
    ];
    var loseLines = [
      'Lifestyle creep wins again. It usually does.',
      'Three rate rises and it is all gone. Too real?'
    ];

    function spawn() {
      var r = Math.random(), type = r < 0.62 ? 'coin' : (r < 0.84 ? 'avo' : 'rate');
      items.push({ type: type, x: rand(16, W - 30), y: -24, v: rand(85, 115) + t * 3.5 });
    }

    return {
      title: 'DEPOSIT DASH',
      init: function () {
        wx = W / 2 - ww / 2; vx = 0; items = []; popups = [];
        moneyAmt = 0; lives = 3; t = 0; spawnT = 0.5; frame = 0; frameT = 0; hurtT = 0;
      },
      update: function (dt) {
        t += dt; spawnT -= dt; hurtT = Math.max(0, hurtT - dt);
        if (spawnT <= 0) { spawn(); spawnT = Math.max(0.32, 0.85 - t * 0.012); }

        var dir = 0;
        if (keys.ArrowLeft || keys.a) dir = -1;
        if (keys.ArrowRight || keys.d) dir = 1;
        if (pointer.x !== null && pointer.down) {
          var target = pointer.x - ww / 2;
          dir = Math.abs(target - wx) < 4 ? 0 : (target > wx ? 1 : -1);
        }
        wx += dir * 240 * dt;
        wx = Math.max(2, Math.min(W - ww - 2, wx));
        if (dir !== 0) { frameT += dt; if (frameT > 0.12) { frame = 1 - frame; frameT = 0; } }

        for (var i = items.length - 1; i >= 0; i--) {
          var it = items[i];
          it.y += it.v * dt;
          var iw = it.type === 'coin' ? 7 * 3 : 9 * 3;
          if (it.y + iw > wy + 8 && it.y < wy + wh - 6 && it.x + iw > wx + 6 && it.x < wx + ww - 6) {
            if (it.type === 'coin') {
              moneyAmt += 5000;
              popups.push({ x: it.x, y: it.y, txt: '+$5k', col: PAL.G, t: 0 });
            } else if (it.type === 'avo') {
              moneyAmt = Math.max(0, moneyAmt - 8000);
              popups.push({ x: it.x - 20, y: it.y, txt: '-$8k brunch', col: PAL.E, t: 0 });
            } else {
              lives--; hurtT = 0.5;
              popups.push({ x: it.x - 16, y: it.y, txt: 'RATE RISE!', col: PAL.R, t: 0 });
            }
            items.splice(i, 1);
            continue;
          }
          if (it.y > H) items.splice(i, 1);
        }
        for (var p = popups.length - 1; p >= 0; p--) {
          popups[p].t += dt; popups[p].y -= 28 * dt;
          if (popups[p].t > 0.9) popups.splice(p, 1);
        }

        if (moneyAmt >= TARGET) {
          var secs = Math.round(t);
          var bests = loadBests();
          var bestLine = '';
          if (!bests.dash || secs < bests.dash) { saveBest('dash', secs); bestLine = 'NEW BEST TIME!'; }
          else { bestLine = 'BEST: ' + bests.dash + 's'; }
          endGame('DEPOSIT SAVED!', pick(winLines).replace('{T}', secs), bestLine);
        } else if (lives <= 0) {
          endGame('GAME OVER', pick(loseLines), loadBests().dash ? 'BEST: ' + loadBests().dash + 's' : '');
        }
      },
      draw: function () {
        ctx.fillStyle = PAL.D; ctx.fillRect(0, 0, W, H);
        // skyline
        ctx.fillStyle = PAL.N;
        var sk = [30, 70, 45, 90, 55, 75, 40, 85];
        for (var s = 0; s < 8; s++) ctx.fillRect(s * 40, H - 20 - sk[s], 36, sk[s]);
        ctx.fillStyle = PAL.S;
        for (var s2 = 0; s2 < 8; s2++) for (var wY = 0; wY < 3; wY++)
          ctx.fillRect(s2 * 40 + 8, H - 36 - sk[s2] + wY * 18 + 16, 6, 6);
        ctx.fillStyle = PAL.K; ctx.fillRect(0, H - 20, W, 20);
        ctx.fillStyle = PAL.G; ctx.fillRect(0, H - 22, W, 2);

        for (var i = 0; i < items.length; i++) {
          var it = items[i];
          drawSprite(ctx, it.type === 'coin' ? COIN : (it.type === 'avo' ? AVO : RATE), it.x, it.y, 3);
        }

        if (!(hurtT > 0 && Math.floor(hurtT * 12) % 2 === 0)) {
          drawSprite(ctx, frame ? WOMBAT_B : WOMBAT, wx, wy, SCALE);
        }

        for (var p = 0; p < popups.length; p++) {
          text(popups[p].txt, popups[p].x, popups[p].y, 8, popups[p].col);
        }

        // HUD
        text(money(moneyAmt), 8, 8, 8, PAL.W);
        text('GOAL ' + money(TARGET), 8, 22, 8, PAL.S);
        ctx.fillStyle = PAL.N; ctx.fillRect(8, 36, 140, 8);
        ctx.fillStyle = PAL.G; ctx.fillRect(8, 36, Math.min(140, 140 * moneyAmt / TARGET), 8);
        for (var l = 0; l < lives; l++) drawSprite(ctx, HEART, W - 26 - l * 26, 8, 3);
      }
    };
  }

  /* ============================================================
     GAME 2 — BUYER vs SELLER (vertical pong, first to 5)
     ============================================================ */
  function BuyerVsSeller() {
    var PW = 62, PH = 8, BS = 2;
    var bw = spriteW(HOUSE, BS), bh = spriteH(HOUSE, BS);
    var px, ax, ball, pScore, aScore, serveT, msg, msgT;

    var winLines = [
      'You negotiate like someone with unconditional approval.',
      'Sold to the wombat with the pre-approval!'
    ];
    var loseLines = [
      'The seller had another offer. They always say that.',
      'Passed in. Happens to the best of us.'
    ];

    function serve(toPlayer) {
      ball = {
        x: W / 2 - bw / 2, y: H / 2 - bh / 2,
        vx: rand(-90, 90), vy: toPlayer ? 170 : -170
      };
      serveT = 0.7;
    }
    function flash(s) { msg = s; msgT = 1.1; }

    return {
      title: 'BUYER vs SELLER',
      init: function () {
        px = W / 2; ax = W / 2; pScore = 0; aScore = 0; msg = ''; msgT = 0;
        serve(Math.random() < 0.5);
      },
      update: function (dt) {
        msgT = Math.max(0, msgT - dt);
        if (keys.ArrowLeft || keys.a) px -= 260 * dt;
        if (keys.ArrowRight || keys.d) px += 260 * dt;
        if (pointer.x !== null && pointer.down) px += (pointer.x - px) * Math.min(1, 14 * dt);
        px = Math.max(PW / 2, Math.min(W - PW / 2, px));

        if (serveT > 0) { serveT -= dt; return; }

        // AI tracks ball with capped speed (gets harder as it loses)
        var aiSpeed = 105 + pScore * 14;
        var dx = (ball.x + bw / 2) - ax;
        ax += Math.max(-aiSpeed * dt, Math.min(aiSpeed * dt, dx));
        ax = Math.max(PW / 2, Math.min(W - PW / 2, ax));

        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (ball.x < 2) { ball.x = 2; ball.vx = Math.abs(ball.vx); }
        if (ball.x > W - bw - 2) { ball.x = W - bw - 2; ball.vx = -Math.abs(ball.vx); }

        // player paddle (bottom)
        var py = H - 26;
        if (ball.vy > 0 && ball.y + bh >= py && ball.y + bh <= py + PH + 10 &&
            ball.x + bw > px - PW / 2 && ball.x < px + PW / 2) {
          ball.vy = -Math.min(430, Math.abs(ball.vy) * 1.06);
          ball.vx += ((ball.x + bw / 2) - px) / (PW / 2) * 110;
        }
        // AI paddle (top)
        var ay = 18;
        if (ball.vy < 0 && ball.y <= ay + PH && ball.y >= ay - 10 &&
            ball.x + bw > ax - PW / 2 && ball.x < ax + PW / 2) {
          ball.vy = Math.min(430, Math.abs(ball.vy) * 1.06);
          ball.vx += ((ball.x + bw / 2) - ax) / (PW / 2) * 110;
        }

        if (ball.y < -bh) {
          pScore++; flash('PRICE DROPS $15K!');
          if (pScore >= 5) {
            var b = loadBests(); var wins = (b.pongWins || 0) + 1; saveBest('pongWins', wins);
            endGame('SETTLED!', pick(winLines), 'DEALS SETTLED: ' + wins);
            return;
          }
          serve(false);
        } else if (ball.y > H + bh) {
          aScore++; flash('VENDOR HOLDS FIRM');
          if (aScore >= 5) {
            var b2 = loadBests();
            endGame('PASSED IN', pick(loseLines), b2.pongWins ? 'DEALS SETTLED: ' + b2.pongWins : '');
            return;
          }
          serve(true);
        }
      },
      draw: function () {
        ctx.fillStyle = PAL.D; ctx.fillRect(0, 0, W, H);
        // centre line
        ctx.fillStyle = PAL.N;
        for (var i = 0; i < W; i += 16) ctx.fillRect(i, H / 2 - 1, 8, 2);

        text('SELLER', 8, 34, 8, PAL.R);
        text(String(aScore), 8, 46, 10, PAL.W);
        text('BUYER', 8, H - 56, 8, PAL.G);
        text(String(pScore), 8, H - 44, 10, PAL.W);

        // paddles
        ctx.fillStyle = PAL.R; ctx.fillRect(ax - PW / 2, 18, PW, PH);
        ctx.fillStyle = PAL.G; ctx.fillRect(px - PW / 2, H - 26, PW, PH);
        // wombat rides the buyer paddle
        drawSprite(ctx, WOMBAT, px - spriteW(WOMBAT, 1) / 2, H - 26 - spriteH(WOMBAT, 1) - 1, 1);

        drawSprite(ctx, HOUSE, ball.x, ball.y, BS);

        if (msgT > 0) text(msg, W / 2, H / 2 + 12, 8, PAL.P, 'center');
        if (serveT > 0) text('READY...', W / 2, H / 2 - 24, 8, PAL.S, 'center');
        ctx.textAlign = 'left';
      }
    };
  }

  /* ============================================================
     GAME 3 — THE STACK (build the house, floor by floor)
     ============================================================ */
  function TheStack() {
    var BH = 16, BASE_W = 130, MIN_W = 8;
    var blocks, cur, swingT, speed, floors, dropFlash, over;

    var lines = [
      '{N}. The strata report writes itself.',
      '{N} up. The certifier has questions.',
      '{N} of pure optimism.'
    ];
    var lowLines = [
      '{N}. Granny flat energy.',
      '{N}. A bold land bank strategy.'
    ];

    function topBlock() { return blocks[blocks.length - 1]; }

    function drop() {
      if (over) return;
      var lastB = topBlock();
      var dx = cur.x - lastB.x;
      var adx = Math.abs(dx);
      if (adx < 3) {
        // perfect
        cur.x = lastB.x;
        dropFlash = { t: 0, txt: 'PERFECT!', col: PAL.G };
      } else {
        cur.w = Math.max(0, cur.w - adx);
        cur.x = lastB.x + dx / 2; // centre over the overlap region
        if (cur.w < MIN_W) {
          over = true;
          var n = floors;
          var nStr = n + (n === 1 ? ' storey' : ' storeys');
          var bests = loadBests();
          var bestLine;
          if (!bests.stack || n > bests.stack) { saveBest('stack', n); bestLine = 'NEW RECORD!'; }
          else { bestLine = 'BEST: ' + bests.stack; }
          var pool = n < 4 ? lowLines : lines;
          endGame('TOWER DOWN', pick(pool).replace('{N}', nStr), bestLine);
          return;
        }
        dropFlash = null;
      }
      blocks.push({ x: cur.x, w: cur.w });
      floors++;
      speed = Math.min(4.2, 1.6 + floors * 0.12);
      cur = { x: 0, w: cur.w };
      swingT = rand(0, Math.PI * 2);
    }

    return {
      title: 'THE STACK',
      init: function () {
        blocks = [{ x: W / 2, w: BASE_W }];
        cur = { x: W / 2, w: BASE_W };
        swingT = 0; speed = 1.6; floors = 0; dropFlash = null; over = false;
        this._dropQueued = false;
      },
      update: function (dt) {
        swingT += dt * speed;
        var range = (W - cur.w) / 2 - 8;
        cur.x = W / 2 + Math.sin(swingT) * range;
        if (dropFlash) { dropFlash.t += dt; if (dropFlash.t > 0.8) dropFlash = null; }
        if (this._dropQueued) { this._dropQueued = false; drop(); }
      },
      drop: function () { this._dropQueued = true; },
      draw: function () {
        ctx.fillStyle = PAL.D; ctx.fillRect(0, 0, W, H);
        // stars
        ctx.fillStyle = PAL.N;
        for (var st = 0; st < 24; st++) ctx.fillRect((st * 53) % W, (st * 97) % (H - 120), 2, 2);

        var cam = Math.max(0, (floors - 12) * BH);
        var groundY = H - 30 + cam;

        ctx.fillStyle = PAL.G; ctx.fillRect(0, groundY, W, 4);
        ctx.fillStyle = PAL.K; ctx.fillRect(0, groundY + 4, W, H);

        // placed blocks
        for (var i = 0; i < blocks.length; i++) {
          var b = blocks[i];
          var by = groundY - (i + 1) * BH;
          if (by > H || by < -BH) continue;
          ctx.fillStyle = PAL.N; ctx.fillRect(b.x - b.w / 2, by, b.w, BH);
          ctx.fillStyle = PAL.S; ctx.fillRect(b.x - b.w / 2, by, b.w, 3);
          ctx.fillStyle = PAL.P;
          for (var wx2 = b.x - b.w / 2 + 6; wx2 < b.x + b.w / 2 - 8; wx2 += 14)
            ctx.fillRect(wx2, by + 6, 5, 6);
        }
        // swinging block
        var cy = groundY - (blocks.length + 1) * BH - 18;
        ctx.fillStyle = PAL.S; ctx.fillRect(cur.x - cur.w / 2, cy, cur.w, BH);
        ctx.fillStyle = PAL.L; ctx.fillRect(cur.x - cur.w / 2, cy, cur.w, 3);
        // crane line
        ctx.fillStyle = PAL.N; ctx.fillRect(cur.x - 1, 0, 2, cy);

        // wombat foreman on the top block
        var tb = topBlock();
        var tby = groundY - blocks.length * BH;
        drawSprite(ctx, WOMBAT, tb.x - spriteW(WOMBAT, 1) / 2, tby - spriteH(WOMBAT, 1), 1);

        if (dropFlash) text(dropFlash.txt, W / 2, cy - 16, 8, dropFlash.col, 'center');
        ctx.textAlign = 'left';
        text('FLOORS: ' + floors, 8, 8, 8, PAL.W);
        var bests = loadBests();
        if (bests.stack) text('BEST: ' + bests.stack, 8, 22, 8, PAL.S);
        text('TAP / SPACE TO DROP', W / 2, H - 14, 7, PAL.N, 'center');
        ctx.textAlign = 'left';
      }
    };
  }

  var GAMES = { dash: DepositDash, pong: BuyerVsSeller, stack: TheStack };

  /* ---------- Input ---------- */
  document.addEventListener('keydown', function (e) {
    if (!current) return;
    keys[e.key] = true;
    if (e.key === ' ' || e.key === 'ArrowUp') {
      if (current.drop) current.drop();
      e.preventDefault();
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.preventDefault();
    if (e.key === 'Escape') toMenu();
  });
  document.addEventListener('keyup', function (e) { keys[e.key] = false; });

  function pointerPos(e) {
    var r = canvas.getBoundingClientRect();
    return (e.clientX - r.left) * (W / r.width);
  }
  canvas.addEventListener('pointerdown', function (e) {
    pointer.down = true; pointer.x = pointerPos(e);
    if (current && current.drop) current.drop();
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', function (e) {
    pointer.x = pointerPos(e);
  });
  window.addEventListener('pointerup', function () { pointer.down = false; });

  /* ---------- Menu wiring ---------- */
  var carts = document.querySelectorAll('[data-game]');
  for (var c = 0; c < carts.length; c++) {
    (function (el) {
      el.addEventListener('click', function () { startGame(el.getAttribute('data-game')); });
      var mini = el.querySelector('canvas');
      if (mini) {
        var mctx = mini.getContext('2d');
        mctx.imageSmoothingEnabled = false;
        mctx.fillStyle = PAL.D; mctx.fillRect(0, 0, mini.width, mini.height);
        drawSprite(mctx, WOMBAT, 6, mini.height - 46, 2.2);
        var g = el.getAttribute('data-game');
        if (g === 'dash') { drawSprite(mctx, COIN, 62, 10, 3); drawSprite(mctx, RATE, 86, 30, 2); }
        if (g === 'pong') { drawSprite(mctx, HOUSE, 66, 16, 3); }
        if (g === 'stack') {
          mctx.fillStyle = PAL.N; mctx.fillRect(58, 48, 50, 10); mctx.fillRect(63, 36, 40, 10);
          mctx.fillStyle = PAL.S; mctx.fillRect(68, 24, 30, 10);
        }
      }
    })(carts[c]);
  }

  document.getElementById('btnAgain').addEventListener('click', function () { startGame(currentName); });
  document.getElementById('btnMenu').addEventListener('click', toMenu);
  document.getElementById('btnBack').addEventListener('click', toMenu);

  // big wombat on the menu marquee
  var hero = document.getElementById('menuWombat');
  if (hero) {
    var hctx = hero.getContext('2d');
    hctx.imageSmoothingEnabled = false;
    drawSprite(hctx, WOMBAT, 2, 2, 6);
  }
})();
