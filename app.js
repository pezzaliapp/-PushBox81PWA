/* PushBox 81 — v2 scaling — © 2025 pezzaliAPP (MIT) */
(() => {
  const $ = sel => document.querySelector(sel);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn, {passive:false});
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  // Audio
  const Audio = (() => {
    const ctx = (window.AudioContext || window.webkitAudioContext) ? new (window.AudioContext||window.webkitAudioContext)() : null;
    let muted = false;
    function tone(freq=440, dur=0.07, type='square', vol=0.08){
      if(!ctx || muted) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g).connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.stop(ctx.currentTime + dur);
    }
    return {
      move(){ tone(420, .045, 'square', .06); },
      push(){ tone(220, .06, 'square', .08); },
      block(){ tone(110, .09, 'sawtooth', .06); },
      win(){ tone(660, .12, 'square', .08); setTimeout(()=>tone(880,.12),90); setTimeout(()=>tone(990,.18),200); },
      toggle(){ muted=!muted; return !muted; }
    };
  })();

  const LEVELS = [
    ["#####","#.@ #","# $ #","# . #","#####"],
    ["######","# .  #","# $$ #","#  @ #","######"],
    ["########","#  .   #","#  $$  #","#  @   #","########"],
    ["########","# .  ###","# $$  .#","#  @   #","########"],
    ["########","#  .   #","###$####","#  @   #","#   $  #","#   .  #","########"],
    ["########","# .  . #","# $$ $ #","#  @   #","########"],
    ["#########","#  . .  #","# $$ $  #","##   ####","#   @   #","#########"],
    ["#########","# .   . #","# $$ $$ #","#   @   #","#########"],
    ["#########","# . . . #","# $$$$  #","#   @   #","#########"],
    ["#########","# . . . #","# $$$$  #","###   ###","#   @   #","#########"]
  ];

  let TILE = 24;
  let levelIndex = +localStorage.getItem('pb81.level') || 0;
  let grid = []; let W=0, H=0; let px=0, py=0;
  let anim = null; let history = []; let moves = 0;

  const canvas = $("#game"), ctx = canvas.getContext("2d");
  const msg = $("#msg");

  function resizeAndFit(){
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const maxW = rect.width * 0.94;
    const maxH = rect.height * 0.94;
    TILE = Math.max(14, Math.floor(Math.min(maxW / W, maxH / H)));
  }

  function loadLevel(i){
    levelIndex = clamp(i, 0, LEVELS.length-1);
    const rows = LEVELS[levelIndex];
    H = rows.length; W = Math.max(...rows.map(r=>r.length));
    grid = Array.from({length:H}, (_,y) => Array.from({length:W}, (_,x) => rows[y][x] || ' '));
    for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(grid[y][x]==='@'){ px=x; py=y; grid[y][x]=' '; }
    history=[]; moves=0; updateHUD();
    resizeAndFit(); draw();
    flash(`Livello ${levelIndex+1} pronto. Sposta le casse sui punti.`);
    localStorage.setItem('pb81.level', levelIndex);
  }

  function updateHUD(){
    $("#levelInfo").textContent = `Lv ${levelIndex+1}/${LEVELS.length}`;
    $("#movesInfo").textContent = `${moves} mosse`;
  }

  function draw(){
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#030814";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    const rect = canvas.getBoundingClientRect();
    const gw = W*TILE, gh=H*TILE;
    const sx = Math.floor((rect.width - gw)/2);
    const sy = Math.floor((rect.height - gh)/2);

    for(let y=0;y<H;y++){
      for(let x=0;x<W;x++){
        const ch = grid[y][x];
        const tx = sx + x*TILE, ty= sy + y*TILE;
        ctx.fillStyle = "#0b1436";
        ctx.fillRect(tx,ty,TILE,TILE);
        ctx.fillStyle = "#0e173c";
        ctx.fillRect(tx, ty+TILE-1, TILE, 1);
        if(ch === '#'){
          ctx.fillStyle = "#1a2c6a"; ctx.fillRect(tx,ty,TILE,TILE);
          ctx.fillStyle = "#243a8a"; ctx.fillRect(tx+2,ty+2,TILE-4,TILE-4);
        }
        if(ch === '.' || ch === '*'){
          ctx.strokeStyle = "#35e06f"; ctx.lineWidth = Math.max(2, Math.floor(TILE/12));
          ctx.strokeRect(tx+TILE*0.25,ty+TILE*0.25,TILE*0.5,TILE*0.5);
        }
        if(ch === '$' || ch === '*'){ drawCrate(tx,ty); }
      }
    }
    const p = anim ? anim.pos() : {x:px, y:py};
    drawPlayer(sx + p.x*TILE, sy + p.y*TILE);
  }

  function drawCrate(x,y){
    const t=TILE;
    ctx.fillStyle = "#8e6b3a"; ctx.fillRect(x+2,y+2,t-4,t-4);
    ctx.strokeStyle = "#c89b52"; ctx.lineWidth = Math.max(2, Math.floor(TILE/12));
    ctx.strokeRect(x+4,y+4,t-8,t-8);
    ctx.beginPath();
    ctx.moveTo(x+4,y+4); ctx.lineTo(x+t-4,y+t-4);
    ctx.moveTo(x+t-4,y+4); ctx.lineTo(x+4,y+t-4);
    ctx.stroke();
  }

  function drawPlayer(x,y){
    const t=TILE;
    ctx.fillStyle = "#e9f1ff"; ctx.fillRect(x+t*0.25,y+t*0.25,t*0.5,t*0.5);
    ctx.fillStyle = "#0a0f1e";
    const e = Math.max(2,Math.floor(t*0.12));
    ctx.fillRect(x+t*0.35,y+t*0.35,e,e);
    ctx.fillRect(x+t*0.53,y+t*0.35,e,e);
    ctx.fillStyle = "#0006"; ctx.fillRect(x+t*0.2,y+t*0.85,t*0.6,Math.max(2,Math.floor(t*0.08)));
  }

  const DIRS = {left:[-1,0], right:[1,0], up:[0,-1], down:[0,1]};
  function tryMove(dx,dy){
    if(anim) return;
    const nx = px+dx, ny=py+dy;
    if(!inBounds(nx,ny) || grid[ny][nx]==='#'){ Audio.block(); return; }
    let pushed=false;
    if(isBox(nx,ny)){
      const bx=nx+dx, by=ny+dy;
      if(!inBounds(bx,by) || isWall(bx,by) || isBox(bx,by)){ Audio.block(); return; }
      saveState(); moveBox(nx,ny,bx,by); pushed=true;
    } else { saveState(); }
    startAnim(px,py,nx,ny,pushed?80:60);
    px=nx; py=ny; moves++; updateHUD();
    if(pushed) Audio.push(); else Audio.move();
    if(isWin()){ setTimeout(()=>{ Audio.win(); flash("🎉 Livello completato!"); },120); setTimeout(()=>loadLevel(levelIndex+1),900); }
  }

  function startAnim(ax,ay,bx,by,dur=80){
    const t0 = performance.now();
    const step = () => {
      const k = clamp((performance.now()-t0)/dur, 0, 1);
      anim = { pos(){ return {x: ax + (bx-ax)*k, y: ay + (by-ay)*k}; } };
      draw();
      if(k<1) requestAnimationFrame(step); else { anim=null; draw(); }
    };
    step();
  }

  function isWall(x,y){ return grid[y][x] === '#'; }
  function isBox(x,y){ const c=grid[y][x]; return c === '$' || c === '*'; }
  function inBounds(x,y){ return x>=0 && y>=0 && x<W && y<H; }

  function moveBox(x1,y1,x2,y2){
    const from = grid[y1][x1]; const to = grid[y2][x2];
    grid[y1][x1] = (from==='*') ? '.' : ' ';
    grid[y2][x2] = (to==='.' ? '*' : '$');
  }

  function isWin(){
    for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(grid[y][x]==='.') return false;
    return true;
  }

  function saveState(){ history.push({grid: grid.map(r=>r.slice()), px, py, moves}); if(history.length>100) history.shift(); }
  function undo(){
    const st = history.pop(); if(!st){ Audio.block(); return; }
    grid = st.grid; px=st.px; py=st.py; moves=st.moves; updateHUD(); draw(); Audio.move();
  }

  on($("#btnUndo"), "click", e=> undo());
  on($("#btnReset"), "click", e=> loadLevel(levelIndex));
  on($("#btnPrev"), "click", e=> loadLevel(levelIndex-1));
  on($("#btnNext"), "click", e=> loadLevel(levelIndex+1));
  on($("#btnMute"), "click", e=> { const on = Audio.toggle(); $("#btnMute").textContent = on ? "🔊" : "🔈"; });

  on(window, "keydown", e=>{
    const k = e.key.toLowerCase();
    if(["arrowup","w"].includes(k)) { e.preventDefault(); tryMove(0,-1); }
    else if(["arrowdown","s"].includes(k)) { e.preventDefault(); tryMove(0,1); }
    else if(["arrowleft","a"].includes(k)) { e.preventDefault(); tryMove(-1,0); }
    else if(["arrowright","d"].includes(k)) { e.preventDefault(); tryMove(1,0); }
    else if(k === 'u') undo(); else if(k === 'r') loadLevel(levelIndex);
  });

  document.querySelectorAll(".key").forEach(btn=>{
    on(btn, "touchstart", ev=>{ ev.preventDefault(); const [dx,dy] = DIRS[btn.dataset.dir]; tryMove(dx,dy); });
    on(btn, "click", ev=>{ const [dx,dy] = DIRS[btn.dataset.dir]; tryMove(dx,dy); });
  });

  let sx=0, sy=0, dx=0, dy=0;
  on(canvas, "touchstart", e=>{ const t=e.touches[0]; sx=t.clientX; sy=t.clientY; });
  on(canvas, "touchmove", e=>{ const t=e.touches[0]; dx=t.clientX-sx; dy=t.clientY-sy; });
  on(canvas, "touchend", e=>{ if(Math.abs(dx)>20 || Math.abs(dy)>20){ if(Math.abs(dx)>Math.abs(dy)) tryMove(dx>0?1:-1,0); else tryMove(0, dy>0?1:-1);} dx=dy=0; });

  let hideTO=null;
  function flash(text){ msg.textContent = text; msg.classList.remove("hide"); clearTimeout(hideTO); hideTO = setTimeout(()=> msg.classList.add("hide"), 1200); }

  let deferredPrompt=null;
  window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); deferredPrompt=e; $("#btnInstall").classList.remove("hide"); });
  on($("#btnInstall"), "click", async ()=>{ if(deferredPrompt){ deferredPrompt.prompt(); await deferredPrompt.userChoice; $("#btnInstall").classList.add("hide"); deferredPrompt=null; }});

  on(window, "resize", ()=>{ resizeAndFit(); draw(); });
  on(window, "orientationchange", ()=>{ setTimeout(()=>{ resizeAndFit(); draw(); }, 200); });

  if('serviceWorker' in navigator){ navigator.serviceWorker.register('./sw.js'); }
  loadLevel(levelIndex);
  on(window, "touchend", () => { try { (new AudioContext()).resume?.(); } catch {} });
})();
