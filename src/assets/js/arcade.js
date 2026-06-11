/* ============================================================
   WOMBAT ARCADE — Just4Fun (v2: six games)
   Vanilla JS, canvas, zero dependencies.
   Wombat Home Loans — wombathomeloans.com.au
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Palette (brand + arcade brights) ---------- */
  var PAL = {
    D: '#060b38', N: '#1c476a', S: '#507fa9', L: '#97bcd7', P: '#cadbe5',
    K: '#0a0a0c', G: '#c89a4a', R: '#e05548', E: '#5fd39a', W: '#fdfcfa',
    A: '#f2b94b', C: '#5fc9f2', V: '#b48bff', O: '#ff8a5c', F: '#e9c39b'
  };

  /* ---------- Sprites ---------- */
  var WOMBAT = [
    '.ND..............DN.',
    'NLND............DNLN',
    'NLLND..........DNLLN',
    'NLLLNDDDDDDDDDDNLLLN',
    '.NSLLLPPPPPPPPLLLSN.',
    '.NSLLPPPPPPPPPPLLSN.',
    'NSLLKKLPPPPPPLKKLLSN',
    'NSLLKKLLPPPPLLKKLLSN',
    'NSLLKKLLLPPLLLKKLLSN',
    'NSLLLLLLDKKDLLLLLLSN',
    'NNSLLLLDKKKKDLLLLSNN',
    'NNSLLLLLDKKDLLLLLSNN',
    'NSSLLLLLLLLLLLLLLSSN',
    'NSLLLLSLLLLLLLLSLLSN',
    'NSLLSSLLLLLLLLLLSSLN',
    'NNLLSNNSLLNNLLSNNLLN',
    'NLLSN.NLLSNNSLN.NSLN',
    'NLLSN.NLLSNNSLN.NSLN',
    '.NLSN..NLSN.NSN.NSN.',
    '.NSN...NSN..NSN..NN.',
    '..N.....N....N......'
  ];
  // walk frame: legs shifted
  var WOMBAT_B = WOMBAT.slice(0, 16).concat([
    '.NLLSNNLLSNNSLNNSLN.',
    '.NLLSNNLLSNNSLNNSLN.',
    '..NLSN.NLSN.NSNNSN..',
    '..NSN...NN...NN.NN..',
    '...N.....N....N.....'
  ]);

  var AGENT = [
    '..KKKKK..',
    '.KKKKKKK.',
    '.KFFFFFK.',
    '.KFKFKFK.',
    '.KFFFFFK.',
    '..FFFFF..',
    '.DDWWWDD.',
    'DDDWRWDDD',
    'DDDWRWDDD',
    'DDDDDDDDD',
    '.KK...KK.',
    '.KK...KK.'
  ];
  var COIN = [
    '..DDD..',
    '.DAAAD.',
    'DAPAAAD',
    'DAAAAAD',
    'DAPAAAD',
    '.DAAAD.',
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
  var GHOUSE = [
    '....K....',
    '...AAA...',
    '..AAAAA..',
    '.AAAAAAA.',
    'DDDDDDDDD',
    '.DAWAWAD.',
    '.DAWAWAD.',
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

  function drawSprite(ctx, rows, x, y, s, recolor) {
    for (var j = 0; j < rows.length; j++) {
      var row = rows[j];
      for (var i = 0; i < row.length; i++) {
        var c = row[i];
        if (c !== '.') {
          ctx.fillStyle = recolor ? (recolor[c] || PAL[c]) : PAL[c];
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
  var pointer = { x: null, y: null, down: false, sx: 0, sy: 0 };

  function pickFont(px) { return px + 'px "Press Start 2P", monospace'; }
  function text(str, x, y, px, col, align) {
    ctx.font = pickFont(px || 8);
    ctx.fillStyle = col || PAL.P;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(str, x, y);
  }

  function loadBests() {
    try { return JSON.parse(localStorage.getItem('wombatArcade') || '{}'); }
    catch (e) { return {}; }
  }
  function saveBest(key, val) {
    var b = loadBests(); b[key] = val;
    try { localStorage.setItem('wombatArcade', JSON.stringify(b)); } catch (e) {}
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
  function stopGame() { current = null; if (raf) cancelAnimationFrame(raf); }
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
     GAME 1 — DEPOSIT DASH
     ============================================================ */
  function DepositDash() {
    var TARGET = 100000, SCALE = 2.2;
    var wx, items, popups, moneyAmt, lives, t, spawnT, frame, frameT, hurtT;
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
        wx = W / 2 - ww / 2; items = []; popups = [];
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
          var iw = it.type === 'coin' ? 21 : 27;
          if (it.y + iw > wy + 8 && it.y < wy + wh - 6 && it.x + iw > wx + 6 && it.x < wx + ww - 6) {
            if (it.type === 'coin') {
              moneyAmt += 5000;
              popups.push({ x: it.x, y: it.y, txt: '+$5k', col: PAL.A, t: 0 });
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
          var bests = loadBests(), bestLine;
          if (!bests.dash || secs < bests.dash) { saveBest('dash', secs); bestLine = 'NEW BEST TIME!'; }
          else { bestLine = 'BEST: ' + bests.dash + 's'; }
          endGame('DEPOSIT SAVED!', pick(winLines).replace('{T}', secs), bestLine);
        } else if (lives <= 0) {
          endGame('GAME OVER', pick(loseLines), loadBests().dash ? 'BEST: ' + loadBests().dash + 's' : '');
        }
      },
      draw: function () {
        ctx.fillStyle = PAL.D; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = PAL.N;
        var sk = [30, 70, 45, 90, 55, 75, 40, 85];
        for (var s = 0; s < 8; s++) ctx.fillRect(s * 40, H - 20 - sk[s], 36, sk[s]);
        ctx.fillStyle = PAL.A;
        for (var s2 = 0; s2 < 8; s2++) for (var wY = 0; wY < 3; wY++)
          ctx.fillRect(s2 * 40 + 8, H - 36 - sk[s2] + wY * 18 + 16, 5, 5);
        ctx.fillStyle = PAL.K; ctx.fillRect(0, H - 20, W, 20);
        ctx.fillStyle = PAL.A; ctx.fillRect(0, H - 22, W, 2);

        for (var i = 0; i < items.length; i++) {
          var it = items[i];
          drawSprite(ctx, it.type === 'coin' ? COIN : (it.type === 'avo' ? AVO : RATE), it.x, it.y, 3);
        }
        if (!(hurtT > 0 && Math.floor(hurtT * 12) % 2 === 0)) {
          drawSprite(ctx, frame ? WOMBAT_B : WOMBAT, wx, wy, SCALE);
        }
        for (var p = 0; p < popups.length; p++) text(popups[p].txt, popups[p].x, popups[p].y, 8, popups[p].col);

        text(money(moneyAmt), 8, 8, 8, PAL.W);
        text('GOAL ' + money(TARGET), 8, 22, 8, PAL.S);
        ctx.fillStyle = PAL.N; ctx.fillRect(8, 36, 140, 8);
        ctx.fillStyle = PAL.A; ctx.fillRect(8, 36, Math.min(140, 140 * moneyAmt / TARGET), 8);
        for (var l = 0; l < lives; l++) drawSprite(ctx, HEART, W - 26 - l * 26, 8, 3);
      }
    };
  }

  /* ============================================================
     GAME 2 — BUYER vs SELLER
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
      ball = { x: W / 2 - bw / 2, y: H / 2 - bh / 2, vx: rand(-90, 90), vy: toPlayer ? 170 : -170 };
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

        var aiSpeed = 105 + pScore * 14;
        var dx = (ball.x + bw / 2) - ax;
        ax += Math.max(-aiSpeed * dt, Math.min(aiSpeed * dt, dx));
        ax = Math.max(PW / 2, Math.min(W - PW / 2, ax));

        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (ball.x < 2) { ball.x = 2; ball.vx = Math.abs(ball.vx); }
        if (ball.x > W - bw - 2) { ball.x = W - bw - 2; ball.vx = -Math.abs(ball.vx); }

        var py = H - 26;
        if (ball.vy > 0 && ball.y + bh >= py && ball.y + bh <= py + PH + 10 &&
            ball.x + bw > px - PW / 2 && ball.x < px + PW / 2) {
          ball.vy = -Math.min(430, Math.abs(ball.vy) * 1.06);
          ball.vx += ((ball.x + bw / 2) - px) / (PW / 2) * 110;
        }
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
        ctx.fillStyle = PAL.N;
        for (var i = 0; i < W; i += 16) ctx.fillRect(i, H / 2 - 1, 8, 2);

        text('SELLER', 8, 34, 8, PAL.R);
        text(String(aScore), 8, 46, 10, PAL.W);
        text('BUYER', 8, H - 56, 8, PAL.E);
        text(String(pScore), 8, H - 44, 10, PAL.W);

        ctx.fillStyle = PAL.R; ctx.fillRect(ax - PW / 2, 18, PW, PH);
        ctx.fillStyle = PAL.E; ctx.fillRect(px - PW / 2, H - 26, PW, PH);
        drawSprite(ctx, WOMBAT, px - spriteW(WOMBAT, 1) / 2, H - 26 - spriteH(WOMBAT, 1) - 1, 1);
        drawSprite(ctx, HOUSE, ball.x, ball.y, BS);

        if (msgT > 0) text(msg, W / 2, H / 2 + 12, 8, PAL.A, 'center');
        if (serveT > 0) text('READY...', W / 2, H / 2 - 24, 8, PAL.S, 'center');
        ctx.textAlign = 'left';
      }
    };
  }

  /* ============================================================
     GAME 3 — THE STACK
     ============================================================ */
  function TheStack() {
    var BH = 16, BASE_W = 130, MIN_W = 8;
    var blocks, cur, swingT, speed, floors, dropFlash, over, dropQueued;

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
      if (adx < 4) {
        cur.x = lastB.x;
        dropFlash = { t: 0, txt: 'PERFECT!', col: PAL.A };
      } else {
        cur.w = Math.max(0, cur.w - adx);
        cur.x = lastB.x + dx / 2;
        if (cur.w < MIN_W) {
          over = true;
          var n = floors;
          var nStr = n + (n === 1 ? ' storey' : ' storeys');
          var bests = loadBests(), bestLine;
          if (!bests.stack || n > bests.stack) { saveBest('stack', n); bestLine = 'NEW RECORD!'; }
          else { bestLine = 'BEST: ' + bests.stack; }
          endGame('TOWER DOWN', pick(n < 4 ? lowLines : lines).replace('{N}', nStr), bestLine);
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
        swingT = 0; speed = 1.6; floors = 0; dropFlash = null; over = false; dropQueued = false;
      },
      update: function (dt) {
        swingT += dt * speed;
        var range = (W - cur.w) / 2 - 8;
        cur.x = W / 2 + Math.sin(swingT) * range;
        if (dropFlash) { dropFlash.t += dt; if (dropFlash.t > 0.8) dropFlash = null; }
        if (dropQueued) { dropQueued = false; drop(); }
      },
      drop: function () { dropQueued = true; },
      draw: function () {
        ctx.fillStyle = PAL.D; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = PAL.N;
        for (var st = 0; st < 24; st++) ctx.fillRect((st * 53) % W, (st * 97) % (H - 120), 2, 2);

        var cam = Math.max(0, (floors - 12) * BH);
        var groundY = H - 30 + cam;
        ctx.fillStyle = PAL.A; ctx.fillRect(0, groundY, W, 4);
        ctx.fillStyle = PAL.K; ctx.fillRect(0, groundY + 4, W, H);

        for (var i = 0; i < blocks.length; i++) {
          var b = blocks[i];
          var by = groundY - (i + 1) * BH;
          if (by > H || by < -BH) continue;
          ctx.fillStyle = PAL.N; ctx.fillRect(b.x - b.w / 2, by, b.w, BH);
          ctx.fillStyle = PAL.S; ctx.fillRect(b.x - b.w / 2, by, b.w, 3);
          ctx.fillStyle = PAL.A;
          for (var wx2 = b.x - b.w / 2 + 6; wx2 < b.x + b.w / 2 - 8; wx2 += 14)
            ctx.fillRect(wx2, by + 6, 5, 6);
        }
        var cy = groundY - (blocks.length + 1) * BH - 18;
        ctx.fillStyle = PAL.S; ctx.fillRect(cur.x - cur.w / 2, cy, cur.w, BH);
        ctx.fillStyle = PAL.L; ctx.fillRect(cur.x - cur.w / 2, cy, cur.w, 3);
        ctx.fillStyle = PAL.N; ctx.fillRect(cur.x - 1, 0, 2, cy);

        var tb = topBlock();
        var tby = groundY - blocks.length * BH;
        drawSprite(ctx, WOMBAT, tb.x - spriteW(WOMBAT, 1) / 2, tby - spriteH(WOMBAT, 1), 1);

        if (dropFlash) text(dropFlash.txt, W / 2, Math.max(8, cy - 16), 8, dropFlash.col, 'center');
        ctx.textAlign = 'left';
        text('FLOORS: ' + floors, 8, 8, 8, PAL.W);
        var bests = loadBests();
        if (bests.stack) text('BEST: ' + bests.stack, 8, 22, 8, PAL.S);
        text('TAP / SPACE TO DROP', W / 2, H - 14, 7, PAL.N, 'center');
        ctx.textAlign = 'left';
      }
    };
  }

  /* ============================================================
     GAME 4 — OPEN HOME (maze chase)
     ============================================================ */
  function OpenHome() {
    var MAZE = [
      '#############',
      '#o.........o#',
      '#.##.###.##.#',
      '#.#.......#.#',
      '#.#.##.##.#.#',
      '#..A.#.#.A..#',
      '##.#.#.#.#.##',
      '#....#.#....#',
      '#.#.##.##.#.#',
      '#.#...P...#.#',
      '#.##.###.##.#',
      '#o.........o#',
      '#############'
    ];
    var T = 24, COLS = 13, ROWS = 13;
    var OX = (W - COLS * T) / 2, OY = 62;
    var walls, pellets, powers, pelletCount, player, agents, lives, score, frightT, pauseT, t, frame, frameT;

    var winLines = [
      'Every listing secured. The agents respawn. They always respawn.',
      'All yours. The agents will still call you on Monday.'
    ];
    var loseLines = [
      'Cornered at the open home. "Just looking" never works.',
      'They got your number. And your weekend.'
    ];

    function isWall(cx, cy) {
      if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return true;
      return walls[cy][cx];
    }
    function mkEnt(cx, cy, speed) {
      return { x: OX + cx * T + T / 2, y: OY + cy * T + T / 2, cx: cx, cy: cy, dir: null, want: null, speed: speed, hx: cx, hy: cy };
    }
    function open(cx, cy, d) { return !isWall(cx + d[0], cy + d[1]); }
    var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    function playerDecide(e) {
      if (e.want && open(e.cx, e.cy, e.want)) { e.dir = e.want; return; }
      if (e.dir && open(e.cx, e.cy, e.dir)) return;
      e.dir = null;
    }
    function agentDecide(a) {
      var opts = [];
      for (var i = 0; i < 4; i++) {
        var d = DIRS[i];
        if (!open(a.cx, a.cy, d)) continue;
        if (a.dir && d[0] === -a.dir[0] && d[1] === -a.dir[1]) continue; // no reversing
        opts.push(d);
      }
      if (opts.length === 0) {
        a.dir = (a.dir && open(a.cx, a.cy, [-a.dir[0], -a.dir[1]])) ? [-a.dir[0], -a.dir[1]] : null;
        return;
      }
      var best = opts[0], bestScore = null;
      for (var o = 0; o < opts.length; o++) {
        var d2 = opts[o];
        var dist = Math.abs((a.cx + d2[0]) - player.cx) + Math.abs((a.cy + d2[1]) - player.cy);
        var sc = (frightT > 0 ? -dist : dist) + Math.random() * 1.5; // wobble so they are beatable
        if (bestScore === null || sc < bestScore) { bestScore = sc; best = d2; }
      }
      a.dir = best;
    }
    // Move with a travel budget; decisions happen exactly at tile centres.
    function moveEnt(e, dt, decide) {
      var remaining = e.speed * dt, guard = 0;
      while (remaining > 0 && guard++ < 8) {
        if (!e.dir) { decide(e); if (!e.dir) return; }
        var tx = OX + (e.cx + e.dir[0]) * T + T / 2;
        var ty = OY + (e.cy + e.dir[1]) * T + T / 2;
        var dist = Math.abs(tx - e.x) + Math.abs(ty - e.y);
        if (remaining >= dist) {
          e.x = tx; e.y = ty; e.cx += e.dir[0]; e.cy += e.dir[1];
          remaining -= dist;
          decide(e);
          if (!e.dir) return;
        } else {
          e.x += e.dir[0] * remaining; e.y += e.dir[1] * remaining;
          remaining = 0;
        }
      }
    }
    function resetPositions() {
      var ps = player.start;
      player.x = OX + ps[0] * T + T / 2; player.y = OY + ps[1] * T + T / 2;
      player.cx = ps[0]; player.cy = ps[1]; player.dir = null; player.want = null;
      for (var i = 0; i < agents.length; i++) {
        var a = agents[i];
        a.x = OX + a.hx * T + T / 2; a.y = OY + a.hy * T + T / 2;
        a.cx = a.hx; a.cy = a.hy; a.dir = null;
      }
      pauseT = 0.9;
    }

    return {
      title: 'OPEN HOME',
      init: function () {
        walls = []; pellets = {}; powers = {}; agents = []; pelletCount = 0;
        for (var y = 0; y < ROWS; y++) {
          walls.push([]);
          for (var x = 0; x < COLS; x++) {
            var c = MAZE[y][x];
            walls[y].push(c === '#');
            if (c === '.') { pellets[x + ',' + y] = true; pelletCount++; }
            if (c === 'o') { powers[x + ',' + y] = true; }
            if (c === 'P') { player = mkEnt(x, y, 74); player.start = [x, y]; }
            if (c === 'A') { agents.push(mkEnt(x, y, 64)); }
          }
        }
        lives = 3; score = 0; frightT = 0; pauseT = 1.0; t = 0; frame = 0; frameT = 0;
      },
      update: function (dt) {
        t += dt;
        if (pauseT > 0) { pauseT -= dt; return; }
        frightT = Math.max(0, frightT - dt);

        if (keys.ArrowLeft || keys.a) player.want = [-1, 0];
        if (keys.ArrowRight || keys.d) player.want = [1, 0];
        if (keys.ArrowUp || keys.w) player.want = [0, -1];
        if (keys.ArrowDown || keys.s) player.want = [0, 1];
        if (pointer.swipe) { player.want = pointer.swipe; pointer.swipe = null; }

        // instant reversal feels right
        if (player.want && player.dir && player.want[0] === -player.dir[0] && player.want[1] === -player.dir[1]) {
          player.dir = player.want;
        }
        moveEnt(player, dt, playerDecide);
        frameT += dt; if (frameT > 0.15) { frame = 1 - frame; frameT = 0; }

        var key = player.cx + ',' + player.cy;
        if (pellets[key]) { delete pellets[key]; pelletCount--; score += 10; }
        if (powers[key]) { delete powers[key]; frightT = 6; score += 50; }

        for (var i = 0; i < agents.length; i++) {
          var a = agents[i];
          a.speed = frightT > 0 ? 46 : 64;
          moveEnt(a, dt, agentDecide);
          if (Math.abs(a.x - player.x) < 14 && Math.abs(a.y - player.y) < 14) {
            if (frightT > 0) {
              score += 100;
              a.x = OX + a.hx * T + T / 2; a.y = OY + a.hy * T + T / 2;
              a.cx = a.hx; a.cy = a.hy; a.dir = null;
            } else {
              lives--;
              if (lives <= 0) {
                var b = loadBests(), bestLine;
                if (!b.openhome || score > b.openhome) { saveBest('openhome', score); bestLine = 'NEW HIGH SCORE!'; }
                else { bestLine = 'BEST: ' + b.openhome; }
                endGame('CORNERED', pick(loseLines), bestLine);
                return;
              }
              resetPositions();
              return;
            }
          }
        }

        if (pelletCount <= 0) {
          var b2 = loadBests(), bestLine2;
          var finalScore = score + lives * 200;
          if (!b2.openhome || finalScore > b2.openhome) { saveBest('openhome', finalScore); bestLine2 = 'NEW HIGH SCORE!'; }
          else { bestLine2 = 'BEST: ' + b2.openhome; }
          endGame('SOLD TO YOU!', pick(winLines), bestLine2);
        }
      },
      draw: function () {
        ctx.fillStyle = PAL.D; ctx.fillRect(0, 0, W, H);
        // maze walls
        for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) {
          if (walls[y][x]) {
            ctx.fillStyle = PAL.N;
            ctx.fillRect(OX + x * T + 2, OY + y * T + 2, T - 4, T - 4);
            ctx.fillStyle = PAL.S;
            ctx.fillRect(OX + x * T + 2, OY + y * T + 2, T - 4, 3);
          }
        }
        // pellets (keys) & powers (pre-approval houses)
        for (var pk in pellets) {
          var xy = pk.split(',');
          ctx.fillStyle = PAL.A;
          ctx.fillRect(OX + xy[0] * T + T / 2 - 2, OY + xy[1] * T + T / 2 - 2, 4, 4);
        }
        for (var ok in powers) {
          var xy2 = ok.split(',');
          var bob = Math.sin(t * 4) * 2;
          drawSprite(ctx, GHOUSE, OX + xy2[0] * T + T / 2 - 9, OY + xy2[1] * T + T / 2 - 8 + bob, 2);
        }
        // agents
        for (var i = 0; i < agents.length; i++) {
          var a = agents[i];
          var scared = frightT > 0;
          var flashing = scared && frightT < 2 && Math.floor(frightT * 6) % 2 === 0;
          var rc = scared && !flashing ? { K: PAL.S, F: PAL.P, D: PAL.N, W: PAL.P, R: PAL.S } : null;
          drawSprite(ctx, AGENT, a.x - 9, a.y - 12, 2, rc);
        }
        // player wombat
        drawSprite(ctx, frame ? WOMBAT_B : WOMBAT, player.x - 11, player.y - 12, 1.1);

        text('SCORE ' + score, 8, 8, 8, PAL.W);
        if (frightT > 0) text('PRE-APPROVED!', W / 2, 22, 8, PAL.A, 'center');
        ctx.textAlign = 'left';
        for (var l = 0; l < lives; l++) drawSprite(ctx, HEART, W - 26 - l * 26, 8, 3);
        text('LISTINGS LEFT: ' + pelletCount, 8, 22, 7, PAL.S);
        if (pauseT > 0) text('READY...', W / 2, H / 2, 10, PAL.A, 'center');
        ctx.textAlign = 'left';
        text('SWIPE / ARROWS TO MOVE', W / 2, H - 14, 7, PAL.N, 'center');
        ctx.textAlign = 'left';
      }
    };
  }

  /* ============================================================
     GAME 5 — WAIVER WOMBAT (runner)
     ============================================================ */
  function WaiverWombat() {
    var GROUND = H - 70, SCALE = 1.6;
    var wh = spriteH(WOMBAT, SCALE), ww = spriteW(WOMBAT, SCALE);
    var WX = 42;
    var LETTERS = ['W', 'A', 'I', 'V', 'E', 'R'];
    var wy, vy, onGround, speed, dist, obstacles, letters, gotten, spawnT, letterT, t, frame, frameT, jumpQueued;

    var winLines = [
      'Waiver secured. 10% deposit, zero LMI. Tell payroll nothing.',
      'No LMI for you. The perk nobody told you about. Except me. Just then.'
    ];
    var loseLines = [
      'LMI bill: $23,000. There were other doors.',
      'Tripped at the credit policy. It happens to almost everyone.'
    ];

    return {
      title: 'WAIVER WOMBAT',
      init: function () {
        wy = GROUND - wh; vy = 0; onGround = true; speed = 165; dist = 0;
        obstacles = []; letters = []; gotten = 0; spawnT = 1.4; letterT = 2.5;
        t = 0; frame = 0; frameT = 0; jumpQueued = false;
      },
      update: function (dt) {
        t += dt; dist += speed * dt;
        speed = Math.min(290, 165 + t * 4);

        if (jumpQueued) {
          jumpQueued = false;
          if (onGround) { vy = -370; onGround = false; }
        }
        vy += 980 * dt;
        wy += vy * dt;
        if (wy >= GROUND - wh) { wy = GROUND - wh; vy = 0; onGround = true; }

        if (onGround) { frameT += dt; if (frameT > 0.1) { frame = 1 - frame; frameT = 0; } }

        spawnT -= dt;
        if (spawnT <= 0) {
          var tall = Math.random() < 0.3 && t > 8;
          obstacles.push({ x: W + 20, h: tall ? 46 : 26 });
          spawnT = rand(1.05, 1.9) * (165 / speed) + 0.25;
        }
        letterT -= dt;
        if (letterT <= 0 && gotten < LETTERS.length && letters.length === 0) {
          letters.push({ x: W + 20, y: GROUND - rand(70, 110), ch: LETTERS[gotten] });
          letterT = rand(3.5, 5.5);
        }

        for (var i = obstacles.length - 1; i >= 0; i--) {
          var o = obstacles[i];
          o.x -= speed * dt;
          if (o.x < -30) { obstacles.splice(i, 1); continue; }
          if (o.x < WX + ww - 8 && o.x + 22 > WX + 8 && wy + wh > GROUND - o.h + 4) {
            var b = loadBests(), m = Math.round(dist / 10), bestLine;
            if (!b.waiver || m > b.waiver) { saveBest('waiver', m); bestLine = 'NEW BEST: ' + m + 'm'; }
            else { bestLine = 'BEST: ' + b.waiver + 'm'; }
            endGame('DECLINED', pick(loseLines), bestLine);
            return;
          }
        }
        for (var j = letters.length - 1; j >= 0; j--) {
          var L = letters[j];
          L.x -= speed * dt;
          if (L.x < -30) { letters.splice(j, 1); continue; }
          if (L.x < WX + ww - 6 && L.x + 20 > WX + 6 && L.y + 20 > wy && L.y < wy + wh) {
            gotten++;
            letters.splice(j, 1);
            if (gotten >= LETTERS.length) {
              var b2 = loadBests();
              var waivers = (b2.waivers || 0) + 1; saveBest('waivers', waivers);
              endGame('LMI WAIVED!', pick(winLines), 'WAIVERS WON: ' + waivers);
              return;
            }
          }
        }
      },
      drop: function () { jumpQueued = true; },
      draw: function () {
        ctx.fillStyle = PAL.D; ctx.fillRect(0, 0, W, H);
        // parallax skyline
        ctx.fillStyle = PAL.N;
        var off = (dist * 0.3) % 60;
        for (var s = -1; s < 7; s++) ctx.fillRect(s * 60 - off, GROUND - 90 - (s % 3) * 22, 40, 90 + (s % 3) * 22);
        ctx.fillStyle = PAL.K; ctx.fillRect(0, GROUND, W, H - GROUND);
        ctx.fillStyle = PAL.A; ctx.fillRect(0, GROUND, W, 3);
        // dashed ground motion
        ctx.fillStyle = PAL.N;
        var doff = (dist * 1) % 40;
        for (var g = -1; g < 9; g++) ctx.fillRect(g * 40 - doff, GROUND + 18, 18, 3);

        for (var i = 0; i < obstacles.length; i++) {
          var o = obstacles[i];
          ctx.fillStyle = PAL.R;
          ctx.fillRect(o.x, GROUND - o.h, 22, o.h);
          ctx.fillStyle = PAL.W;
          ctx.font = pickFont(7); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.fillText('LMI', o.x + 11, GROUND - o.h + 6);
          ctx.textAlign = 'left';
        }
        for (var j = 0; j < letters.length; j++) {
          var L = letters[j];
          var bob = Math.sin(t * 5) * 3;
          ctx.fillStyle = PAL.A; ctx.fillRect(L.x, L.y + bob, 20, 20);
          ctx.fillStyle = PAL.D;
          ctx.font = pickFont(9); ctx.textAlign = 'center';
          ctx.fillText(L.ch, L.x + 10, L.y + bob + 6);
          ctx.textAlign = 'left';
        }

        drawSprite(ctx, onGround && frame ? WOMBAT_B : WOMBAT, WX, wy, SCALE);

        // HUD: letters
        for (var k = 0; k < LETTERS.length; k++) {
          ctx.fillStyle = k < gotten ? PAL.A : PAL.N;
          ctx.fillRect(8 + k * 24, 8, 20, 20);
          ctx.fillStyle = k < gotten ? PAL.D : PAL.S;
          ctx.font = pickFont(9); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.fillText(LETTERS[k], 18 + k * 24, 14);
          ctx.textAlign = 'left';
        }
        text(Math.round(dist / 10) + 'm', W - 8, 12, 8, PAL.W, 'right');
        ctx.textAlign = 'left';
        text('TAP / SPACE TO JUMP', W / 2, H - 14, 7, PAL.N, 'center');
        ctx.textAlign = 'left';
      }
    };
  }

  /* ============================================================
     GAME 6 — THE RENOVATOR (breakout)
     ============================================================ */
  function TheRenovator() {
    var BCOLS = 8, BROWS = 5, BW = 36, BH = 14, BGAP = 2;
    var BOX = (W - (BCOLS * (BW + BGAP) - BGAP)) / 2, BOY = 64;
    var ROWCOL = ['A', 'O', 'E', 'C', 'V'];
    var PW = 64, PH = 8;
    var px, ball, bricks, lives, remaining, serveT;

    var winLines = [
      'Renovated! Flip it or hold it? Ask your accountant, not me.',
      'Full reno complete. The before photos were a crime.'
    ];
    var loseLines = [
      'The reno blew the budget. Classic.',
      'Out of funds at lock-up stage. Painful.'
    ];

    function serve() {
      ball = { x: W / 2, y: H / 2 + 40, vx: rand(-110, 110), vy: -210 };
      serveT = 0.7;
    }

    return {
      title: 'THE RENOVATOR',
      init: function () {
        px = W / 2; lives = 3; bricks = []; remaining = 0;
        for (var r = 0; r < BROWS; r++) {
          for (var c = 0; c < BCOLS; c++) {
            bricks.push({ x: BOX + c * (BW + BGAP), y: BOY + r * (BH + BGAP), col: ROWCOL[r], alive: true });
            remaining++;
          }
        }
        serve();
      },
      update: function (dt) {
        if (keys.ArrowLeft || keys.a) px -= 280 * dt;
        if (keys.ArrowRight || keys.d) px += 280 * dt;
        if (pointer.x !== null && pointer.down) px += (pointer.x - px) * Math.min(1, 14 * dt);
        px = Math.max(PW / 2, Math.min(W - PW / 2, px));

        if (serveT > 0) { serveT -= dt; return; }

        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (ball.x < 3) { ball.x = 3; ball.vx = Math.abs(ball.vx); }
        if (ball.x > W - 9) { ball.x = W - 9; ball.vx = -Math.abs(ball.vx); }
        if (ball.y < 3) { ball.y = 3; ball.vy = Math.abs(ball.vy); }

        var py = H - 26;
        if (ball.vy > 0 && ball.y + 6 >= py && ball.y + 6 <= py + PH + 10 &&
            ball.x + 6 > px - PW / 2 && ball.x < px + PW / 2) {
          ball.vy = -Math.min(400, Math.abs(ball.vy) * 1.04);
          ball.vx += ((ball.x + 3) - px) / (PW / 2) * 130;
        }

        for (var i = 0; i < bricks.length; i++) {
          var b = bricks[i];
          if (!b.alive) continue;
          if (ball.x + 6 > b.x && ball.x < b.x + BW && ball.y + 6 > b.y && ball.y < b.y + BH) {
            b.alive = false; remaining--;
            // reflect off nearest face
            var overlapX = Math.min(ball.x + 6 - b.x, b.x + BW - ball.x);
            var overlapY = Math.min(ball.y + 6 - b.y, b.y + BH - ball.y);
            if (overlapX < overlapY) ball.vx = -ball.vx; else ball.vy = -ball.vy;
            break;
          }
        }

        if (remaining <= 0) {
          var bst = loadBests();
          var renos = (bst.renos || 0) + 1; saveBest('renos', renos);
          endGame('RENOVATED!', pick(winLines), 'RENOS DONE: ' + renos);
          return;
        }

        if (ball.y > H + 10) {
          lives--;
          if (lives <= 0) {
            var b3 = loadBests();
            endGame('OVER BUDGET', pick(loseLines), b3.renos ? 'RENOS DONE: ' + b3.renos : '');
            return;
          }
          serve();
        }
      },
      draw: function () {
        ctx.fillStyle = PAL.D; ctx.fillRect(0, 0, W, H);
        for (var i = 0; i < bricks.length; i++) {
          var b = bricks[i];
          if (!b.alive) continue;
          ctx.fillStyle = PAL[b.col]; ctx.fillRect(b.x, b.y, BW, BH);
          ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(b.x, b.y, BW, 3);
        }
        ctx.fillStyle = PAL.E; ctx.fillRect(px - PW / 2, H - 26, PW, PH);
        drawSprite(ctx, WOMBAT, px - spriteW(WOMBAT, 1) / 2, H - 26 - spriteH(WOMBAT, 1) - 1, 1);
        ctx.fillStyle = PAL.W; ctx.fillRect(ball.x, ball.y, 6, 6);

        for (var l = 0; l < lives; l++) drawSprite(ctx, HEART, W - 26 - l * 26, 8, 3);
        text('BRICKS: ' + remaining, 8, 8, 8, PAL.W);
        if (serveT > 0) text('READY...', W / 2, H / 2, 8, PAL.S, 'center');
        ctx.textAlign = 'left';
      }
    };
  }

  var GAMES = {
    dash: DepositDash, pong: BuyerVsSeller, stack: TheStack,
    openhome: OpenHome, waiver: WaiverWombat, reno: TheRenovator
  };

  /* ---------- Input ---------- */
  document.addEventListener('keydown', function (e) {
    if (!current) return;
    keys[e.key] = true;
    if (e.key === ' ' || e.key === 'ArrowUp') {
      if (current.drop) current.drop();
    }
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.key) !== -1) e.preventDefault();
    if (e.key === 'Escape') toMenu();
  });
  document.addEventListener('keyup', function (e) { keys[e.key] = false; });

  function pointerPos(e) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (W / r.width),
      y: (e.clientY - r.top) * (H / r.height)
    };
  }
  canvas.addEventListener('pointerdown', function (e) {
    var p = pointerPos(e);
    pointer.down = true; pointer.x = p.x; pointer.y = p.y;
    pointer.sx = p.x; pointer.sy = p.y;
    if (current && current.drop) current.drop();
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', function (e) {
    var p = pointerPos(e);
    pointer.x = p.x; pointer.y = p.y;
    if (pointer.down) {
      var dx = p.x - pointer.sx, dy = p.y - pointer.sy;
      if (Math.abs(dx) > 24 || Math.abs(dy) > 24) {
        pointer.swipe = Math.abs(dx) > Math.abs(dy) ? [dx > 0 ? 1 : -1, 0] : [0, dy > 0 ? 1 : -1];
        pointer.sx = p.x; pointer.sy = p.y;
      }
    }
  });
  window.addEventListener('pointerup', function () { pointer.down = false; });

  /* ---------- Menu wiring ---------- */
  var carts = document.querySelectorAll('[data-game]');
  for (var c = 0; c < carts.length; c++) {
    (function (el) {
      el.addEventListener('click', function () { startGame(el.getAttribute('data-game')); });
      var mini = el.querySelector('canvas');
      if (mini) {
        var m = mini.getContext('2d');
        m.imageSmoothingEnabled = false;
        m.fillStyle = PAL.D; m.fillRect(0, 0, mini.width, mini.height);
        var g = el.getAttribute('data-game');
        drawSprite(m, WOMBAT, 6, mini.height - 52, 2.2);
        if (g === 'dash') { drawSprite(m, COIN, 64, 10, 3); drawSprite(m, RATE, 88, 34, 2); }
        if (g === 'pong') { drawSprite(m, HOUSE, 68, 18, 3); }
        if (g === 'stack') {
          m.fillStyle = PAL.N; m.fillRect(58, 50, 50, 10); m.fillRect(63, 38, 40, 10);
          m.fillStyle = PAL.S; m.fillRect(68, 26, 30, 10);
          m.fillStyle = PAL.A; m.fillRect(72, 54, 5, 5); m.fillRect(84, 54, 5, 5);
        }
        if (g === 'openhome') { drawSprite(m, AGENT, 70, 16, 2); m.fillStyle = PAL.A; m.fillRect(62, 60, 5, 5); m.fillRect(76, 60, 5, 5); m.fillRect(90, 60, 5, 5); }
        if (g === 'waiver') {
          m.fillStyle = PAL.R; m.fillRect(64, 44, 18, 26);
          m.fillStyle = PAL.A; m.fillRect(88, 16, 18, 18);
          m.fillStyle = PAL.D; m.font = '9px monospace'; m.fillText('W', 93, 29);
        }
        if (g === 'reno') {
          var rc = ['A', 'O', 'E'];
          for (var rr = 0; rr < 3; rr++) for (var cc = 0; cc < 3; cc++) {
            m.fillStyle = PAL[rc[rr]]; m.fillRect(58 + cc * 18, 12 + rr * 10, 16, 8);
          }
          m.fillStyle = PAL.W; m.fillRect(76, 52, 5, 5);
        }
      }
    })(carts[c]);
  }

  document.getElementById('btnAgain').addEventListener('click', function () { startGame(currentName); });
  document.getElementById('btnMenu').addEventListener('click', toMenu);
  document.getElementById('btnBack').addEventListener('click', toMenu);

  var hero = document.getElementById('menuWombat');
  if (hero) {
    var hctx = hero.getContext('2d');
    hctx.imageSmoothingEnabled = false;
    drawSprite(hctx, WOMBAT, 2, 2, 5);
  }
})();
