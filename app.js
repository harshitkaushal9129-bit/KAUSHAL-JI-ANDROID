// Polished launch animation: reveal the app after its first render.
(function(){
 const splash=document.getElementById("splashScreen");
 if(!splash)return;
 const finish=()=>{splash.classList.add("is-leaving");setTimeout(()=>splash.remove(),800);};
 window.addEventListener("load",()=>setTimeout(finish,2100),{once:true});
 // Safety fallback in case a slow asset prevents the load event.
 setTimeout(finish,4500);
})();

const $ = s => document.querySelector(s);
const now = new Date();
let shownYear = now.getFullYear(), shownMonth = now.getMonth();
let selected = new Date(now.getFullYear(), now.getMonth(), now.getDate());
let festivals = [];

const views = ["calendar","calculator","clock","games","planner","stopwatch","converter","quiz","colorstudio","appinfo","developer"];
function showView(name){
  views.forEach(v => $("#"+v+"View").classList.toggle("hidden",v!==name));
  $("#menu").classList.add("hidden");
  if(name==="clock") updateClock();
}
const menu = document.querySelector("#menu");
const menuBtn = document.querySelector("#menuBtn");
if (menu && menuBtn) {
  document.body.appendChild(menu);
  menu.style.position = "fixed";
  menu.style.zIndex = "2147483647";
  function updateMenuPosition() {
    const rect = menuBtn.getBoundingClientRect();
    const width = Math.min(300, window.innerWidth - 20);
    menu.style.width = width + "px";
    menu.style.top = Math.min(rect.bottom + 8, window.innerHeight - 120) + "px";
    menu.style.right = Math.max(10, window.innerWidth - rect.right) + "px";
    menu.style.maxHeight = Math.max(140, window.innerHeight - Math.min(rect.bottom + 8, window.innerHeight - 120) - 12) + "px";
  }
  menuBtn.addEventListener("click", () => {
    const opening = menu.classList.contains("hidden");
    if (opening) updateMenuPosition();
    menu.classList.toggle("hidden");
    menuBtn.setAttribute("aria-expanded", String(opening));
  });
  window.addEventListener("resize", () => {
    if (!menu.classList.contains("hidden")) updateMenuPosition();
  });
  window.addEventListener("scroll", () => {
    if (!menu.classList.contains("hidden")) updateMenuPosition();
  }, { passive: true });
  document.addEventListener("click", e => {
    if (!e.target.closest(".topbar") && !e.target.closest("#menu")) {
      menu.classList.add("hidden");
      menuBtn.setAttribute("aria-expanded", "false");
    }
  });
}
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));

// Theme preference, sharing and PWA installation
function applyTheme(mode){
  document.body.classList.toggle("light-theme",mode==="light");
  $("#themeQuick").textContent=mode==="light"?"🌙":"☀️";
  $("#themeQuick").setAttribute("aria-label",mode==="light"?"Switch to dark mode":"Switch to light mode");
  localStorage.setItem("kaushalji-theme",mode);
}
function toggleTheme(){applyTheme(document.body.classList.contains("light-theme")?"dark":"light");}
applyTheme(localStorage.getItem("kaushalji-theme")||"dark");
$("#themeQuick").addEventListener("click",toggleTheme);
let deferredInstallPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault();deferredInstallPrompt=e;$("#installMenuItem").classList.remove("hidden");
});
window.addEventListener("appinstalled",()=>{$("#installMenuItem").classList.add("hidden");deferredInstallPrompt=null;});
async function shareApp(){
  const shareData={title:"kaushalji Calendar",text:"Try kaushalji Calendar – Indian festivals, calendar, calculator and neon clock.",url:location.href};
  try{
    if(navigator.share) await navigator.share(shareData);
    else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(location.href);alert("App link copied. Share it with your friends!");}
    else alert("Please copy this app's address from your browser and share it.");
  }catch(err){if(err.name!=="AbortError")alert("Sharing is not available here. Copy the website address and share it.");}
}
async function installApp(){
  if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$("#installMenuItem").classList.add("hidden");}
  else alert("To install: open this app in Chrome after hosting it on HTTPS, then choose ⋮ > Install app / Add to Home screen.");
}
document.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>{
  const action=b.dataset.action;$("#menu").classList.add("hidden");
  if(action==="theme")toggleTheme();
  if(action==="share")shareApp();
  if(action==="install")installApp();
  if(action==="today"){selected=new Date();shownYear=selected.getFullYear();shownMonth=selected.getMonth();showView("calendar");renderCalendar();renderSelected();renderUpcoming();}
}));

function dateKey(y,m,d){return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;}
function getEvents(y,m,d){return festivals.filter(f=>f.date===dateKey(y,m,d));}
function formatDate(d){return d.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});}

function renderCalendar(){
  $("#monthTitle").textContent=new Date(shownYear,shownMonth,1).toLocaleDateString("en-IN",{month:"long",year:"numeric"});
  $("#heroYear").textContent=shownYear;
  $("#monthSub").textContent="Tap any date to explore";
  $("#todayText").textContent=now.toLocaleDateString("en-IN",{day:"numeric",month:"short"});
  const first=new Date(shownYear,shownMonth,1).getDay(), days=new Date(shownYear,shownMonth+1,0).getDate();
  const prevDays=new Date(shownYear,shownMonth,0).getDate();
  const grid=$("#calendarGrid");grid.innerHTML="";
  for(let i=0;i<42;i++){
    let y=shownYear,m=shownMonth,d,muted=false;
    if(i<first){d=prevDays-first+i+1;m=shownMonth-1;muted=true;if(m<0){m=11;y--;}}
    else if(i>=first+days){d=i-first-days+1;m=shownMonth+1;muted=true;if(m>11){m=0;y++;}}
    else d=i-first+1;
    const date=new Date(y,m,d), ev=getEvents(y,m,d), key=dateKey(y,m,d);
    const btn=document.createElement("button");btn.className="day"+(muted?" muted-day":"")+(key===dateKey(now.getFullYear(),now.getMonth(),now.getDate())?" today":"")+(key===dateKey(selected.getFullYear(),selected.getMonth(),selected.getDate())?" selected":"");
    btn.textContent=d;if(ev.length){const dot=document.createElement("i");dot.className="event-dot";btn.append(dot);}
    btn.addEventListener("click",()=>{selected=date;shownYear=y;shownMonth=m;renderCalendar();renderSelected();renderUpcoming();});
    grid.append(btn);
  }
}

function renderSelected(){
  $("#selectedDate").textContent=formatDate(selected);
  const noteKey="kaushalji-note-"+dateKey(selected.getFullYear(),selected.getMonth(),selected.getDate());
  $("#dayNote").value=localStorage.getItem(noteKey)||"";
  $("#noteStatus").textContent="";
  const ev=getEvents(selected.getFullYear(),selected.getMonth(),selected.getDate());
  const box=$("#dayEvents");box.innerHTML="";
  if(!ev.length){box.innerHTML='<p class="muted">No festival listed for this date. Enjoy your day! ✨</p>';return;}
  ev.forEach(f=>{const div=document.createElement("div");div.className="event";div.innerHTML=`<b>${f.emoji||"🎉"} ${escapeHtml(f.name)}</b><small>${escapeHtml(f.type||"Festival")}${f.note?" · "+escapeHtml(f.note):""}</small>`;box.append(div);});
}

function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

// Upgraded to show festivals strictly for the currently active/switched month & year
function renderUpcoming(){
 const term=($("#festivalSearch")?.value||"").trim().toLowerCase();
 const targetMonthStr = `${shownYear}-${String(shownMonth+1).padStart(2,"0")}`;
 
 const monthFestivals=festivals.filter(f=>{
   const matchesMonth = f.date.startsWith(targetMonthStr);
   const matchesSearch = !term || `${f.name} ${f.type||""}`.toLowerCase().includes(term);
   return matchesMonth && matchesSearch;
 }).sort((a,b)=>a.date.localeCompare(b.date));

 const box=$("#upcomingList");box.innerHTML="";
 if(!monthFestivals.length){
   box.innerHTML=`<p class="muted">No festivals listed for ${new Date(shownYear, shownMonth, 1).toLocaleDateString("en-IN",{month:"long", year:"numeric"})}.</p>`;
   return;
 }
 monthFestivals.forEach(f=>{
   const d=new Date(f.date+"T00:00:00");
   const el=document.createElement("div");
   el.className="upcoming-card";
   el.innerHTML=`<b>${f.emoji||"🎉"} ${escapeHtml(f.name)}</b><small>${d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</small>`;
   box.append(el);
 });
}

$("#prevMonth").onclick=()=>{shownMonth--;if(shownMonth<0){shownMonth=11;shownYear--;}renderCalendar();renderUpcoming();};
$("#nextMonth").onclick=()=>{shownMonth++;if(shownMonth>11){shownMonth=0;shownYear++;}renderCalendar();renderUpcoming();};
$("#festivalSearch").addEventListener("input",renderUpcoming);

$("#saveNote").addEventListener("click",()=>{
 const key="kaushalji-note-"+dateKey(selected.getFullYear(),selected.getMonth(),selected.getDate());
 const value=$("#dayNote").value.trim();
 if(value)localStorage.setItem(key,value);else localStorage.removeItem(key);
 $("#noteStatus").textContent="Saved on this device ✓";
});

async function loadFestivals(){
 try{const r=await fetch("festival.json");if(!r.ok)throw Error("festival.json not found");const data=await r.json();festivals=Array.isArray(data)?data:(data.festivals||[]);}
 catch(e){console.warn(e);festivals=[];$("#dayEvents").innerHTML='<p class="muted">festival.json could not load. Run this app from a local server or install it after hosting.</p>';}
 renderCalendar();renderSelected();renderUpcoming();
}
loadFestivals();

// Calculator: restricted arithmetic parser; no eval().
let expression="",justSolved=false;
function showCalc(){ $("#calcDisplay").textContent=expression||"0"; }
function calculate(expr){
 const clean=expr.replace(/×/g,"*").replace(/÷/g,"/").replace(/−/g,"-").replace(/%/g,"/100");
 if(!/^[0-9+\-*/().\s]+$/.test(clean))throw Error("Invalid");
 const tokens=clean.match(/\d*\.?\d+|[()+\-*/]/g)||[];
 let pos=0;
 function factor(){let t=tokens[pos++];if(t==="("){let v=term();if(tokens[pos++]!==")")throw Error();return v;}if(t==="-")return -factor();if(t==="+")return factor();if(t===undefined||!/^(\d+\.?\d*|\.\d+)$/.test(t))throw Error();return Number(t);}
 function term(){let v=factor();while(tokens[pos]==="*"||tokens[pos]==="/"){let op=tokens[pos++],n=factor();v=op==="*"?v*n:v/n;}return v;}
 function sum(){let v=term();while(tokens[pos]==="+"||tokens[pos]==="-"){let op=tokens[pos++],n=term();v=op==="+"?v+n:v-n;}return v;}
 const result=sum();if(pos!==tokens.length||!Number.isFinite(result))throw Error();return Number(result.toPrecision(12));
}
document.querySelectorAll("[data-key]").forEach(b=>b.addEventListener("click",()=>{
 const k=b.dataset.key;
 if(k==="AC"){expression="";$("#calcHistory").textContent="";showCalc();return;}
 if(k==="DEL"){expression=expression.slice(0,-1);showCalc();return;}
 if(k==="="){try{const result=calculate(expression);$("#calcHistory").textContent=expression+" =";expression=String(result);justSolved=true;showCalc();}catch{$("#calcDisplay").textContent="Error";expression="";}return;}
 if(justSolved&&!"+-×÷%".includes(k))expression="";
 justSolved=false;expression+=k;showCalc();
}));
document.addEventListener("keydown",e=>{if(!$("#calculatorView").classList.contains("hidden")){if(/[0-9.+\-*/()%]/.test(e.key)&&e.key.length===1){expression+=e.key;showCalc();}else if(e.key==="Enter"){try{expression=String(calculate(expression));showCalc();}catch{$("#calcDisplay").textContent="Error";}}else if(e.key==="Backspace"){expression=expression.slice(0,-1);showCalc();}}});

// Live neon clock
let clockMode="analog";
function updateClock(){
 const d=new Date(),h=d.getHours(),m=d.getMinutes(),s=d.getSeconds();
 $(".hour-hand").style.transform=`translateX(-50%) rotate(${(h%12)*30+m*.5}deg)`;
 $(".minute-hand").style.transform=`translateX(-50%) rotate(${m*6+s*.1}deg)`;
 $(".second-hand").style.transform=`translateX(-50%) rotate(${s*6}deg)`;
 $("#digitalTime").textContent=d.toLocaleTimeString("en-IN",{hour12:false});
 $("#digitalDate").textContent=d.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
}
document.querySelectorAll("[data-clock]").forEach(b=>b.addEventListener("click",()=>{
 clockMode=b.dataset.clock;document.querySelectorAll("[data-clock]").forEach(x=>x.classList.toggle("active",x===b));
 $("#analogClock").classList.toggle("hidden",clockMode!=="analog");$("#digitalClock").classList.toggle("hidden",clockMode!=="digital");
}));
setInterval(updateClock,1000);updateClock();
if("serviceWorker" in navigator && location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js").catch(console.warn));}


// KAUSHALJI ARCADE — six self-contained games, no external libraries.
const gameArea = document.getElementById("gameArea");
let activeGame = "";
let gameCleanup = null;
const gameTitles = {
  tictactoe:"Tic Tac Toe", memory:"Memory Match", snake:"Neon Snake",
  rps:"Rock Paper Scissors", guess:"Number Guess", reaction:"Reaction Test"
};
function setGame(title, markup) {
  if (gameCleanup) { gameCleanup(); gameCleanup = null; }
  $("#gameTitle").textContent = title;
  gameArea.innerHTML = markup;
}
function chooseGame(name) {
  activeGame = name;
  document.querySelectorAll(".game-card").forEach(c => c.classList.toggle("active", c.dataset.game === name));
  if (name === "tictactoe") startTicTacToe();
  if (name === "memory") startMemory();
  if (name === "snake") startSnake();
  if (name === "rps") startRPS();
  if (name === "guess") startGuess();
  if (name === "reaction") startReaction();
}
document.querySelectorAll("[data-game]").forEach(b => b.addEventListener("click", () => chooseGame(b.dataset.game)));
$("#gameReset")?.addEventListener("click", () => { if (activeGame) chooseGame(activeGame); });

function startTicTacToe() {
  setGame(gameTitles.tictactoe, '<p class="game-status" id="ttStatus">Your turn — you are X</p><div class="tt-board" id="ttBoard"></div><p class="game-hint">Get three in a row. The computer plays O.</p>');
  const board = Array(9).fill("");
  const el = $("#ttBoard"), status = $("#ttStatus");
  let over = false;
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  function result(mark) { return wins.some(line => line.every(i => board[i] === mark)); }
  function finish() { if (result("X")) {status.textContent="You win! 🎉";over=true;} else if(result("O")){status.textContent="Computer wins — try again!";over=true;} else if(board.every(Boolean)){status.textContent="It's a draw!";over=true;} }
  function draw() {
    el.innerHTML="";
    board.forEach((v,i)=>{const b=document.createElement("button");b.className="tt-cell "+(v==="X"?"x":"o");b.textContent=v;b.disabled=!!v||over;b.onclick=()=>{if(over)return;board[i]="X";draw();finish();if(!over){status.textContent="Computer is thinking…";setTimeout(cpu,300);}};el.append(b);});
  }
  function cpu() {
    const empty=board.map((v,i)=>v?null:i).filter(v=>v!==null);
    // Take a winning move, block the player, otherwise prefer center/corners.
    function tactical(mark){for(const i of empty){board[i]=mark;const won=result(mark);board[i]="";if(won)return i;}return -1;}
    let move=tactical("O");if(move<0)move=tactical("X");
    if(move<0 && !board[4])move=4;
    if(move<0){const corners=[0,2,6,8].filter(i=>!board[i]);if(corners.length)move=corners[Math.floor(Math.random()*corners.length)];}
    if(move<0)move=empty[Math.floor(Math.random()*empty.length)];
    if(move!==undefined)board[move]="O";draw();finish();if(!over)status.textContent="Your turn — you are X";
  }
  draw();
}

function startMemory() {
  const icons=["🐉","🌟","💎","🔥","🦄","🚀","🎯","👑"];
  const deck=[...icons,...icons].sort(()=>Math.random()-.5);
  setGame(gameTitles.memory, '<p class="game-status" id="memStatus">Find all 8 matching pairs · Moves: 0</p><div class="memory-board" id="memoryBoard"></div>');
  const board=$("#memoryBoard");let first=null,lock=false,moves=0,matched=0;
  deck.forEach((icon,i)=>{const b=document.createElement("button");b.className="memory-card";b.textContent="?";b.setAttribute("aria-label","Hidden card");b.onclick=()=>{if(lock||b.classList.contains("matched")||b===first)return;b.textContent=icon;b.classList.add("revealed");if(!first){first=b;return;}moves++;lock=true;if(first.textContent===b.textContent){first.classList.add("matched");b.classList.add("matched");matched+=2;first=null;lock=false;$("#memStatus").textContent=`Pairs: ${matched/2}/8 · Moves: ${moves}`;if(matched===16)$("#memStatus").textContent=`Arcade champion! Completed in ${moves} moves 🏆`;}else{const old=first;first=null;setTimeout(()=>{old.textContent="?";b.textContent="?";old.classList.remove("revealed");b.classList.remove("revealed");lock=false;},750);}$("#memStatus").textContent=matched===16?`Arcade champion! Completed in ${moves} moves 🏆`:`Find all 8 matching pairs · Moves: ${moves}`;};board.append(b);});
}

function startSnake() {
  setGame(gameTitles.snake, '<p class="game-status" id="snakeStatus">Score: 0 · Use arrow keys or buttons</p><canvas id="snakeCanvas" width="360" height="360" class="snake-canvas"></canvas><div class="snake-controls"><button data-dir="up">▲</button><div><button data-dir="left">◀</button><button data-dir="down">▼</button><button data-dir="right">▶</button></div></div>');
  const canvas=$("#snakeCanvas"),ctx=canvas.getContext("2d"),size=18,cols=20;
  let snake=[{x:9,y:10},{x:8,y:10},{x:7,y:10}],dir={x:1,y:0},next={x:1,y:0},food={x:14,y:10},score=0,alive=true;
  function setDir(x,y){if(x!==-dir.x||y!==-dir.y)next={x,y};}
  const key=e=>{const m={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};if(m[e.key]){e.preventDefault();setDir(...m[e.key]);}};
  document.addEventListener("keydown",key);
  document.querySelectorAll("[data-dir]").forEach(b=>b.onclick=()=>{const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[b.dataset.dir];setDir(...d);});
  function tick(){
    if(!alive)return;dir=next;const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
    if(head.x<0||head.y<0||head.x>=cols||head.y>=cols||snake.some((p,i)=>i>0&&p.x===head.x&&p.y===head.y)){alive=false;$("#snakeStatus").textContent=`Game over · Final score: ${score} · Restart to play again`;return;}
    snake.unshift(head);if(head.x===food.x&&head.y===food.y){score+=10;do{food={x:Math.floor(Math.random()*cols),y:Math.floor(Math.random()*cols)}}while(snake.some(p=>p.x===food.x&&p.y===food.y));}else snake.pop();
    ctx.clearRect(0,0,360,360);ctx.fillStyle="#101632";ctx.fillRect(0,0,360,360);ctx.fillStyle="#ff8b35";ctx.fillRect(food.x*size+3,food.y*size+3,12,12);snake.forEach((p,i)=>{ctx.fillStyle=i?"#42d9e8":"#a6ff70";ctx.fillRect(p.x*size+1,p.y*size+1,16,16);});$("#snakeStatus").textContent=`Score: ${score} · Use arrow keys or buttons`;
  }
  const timer=setInterval(tick,125);gameCleanup=()=>{clearInterval(timer);document.removeEventListener("keydown",key);};
  tick();
}

function startRPS() {
  setGame(gameTitles.rps, '<p class="game-status" id="rpsStatus">Choose your move</p><div class="rps-actions"><button data-rps="rock">✊<small>Rock</small></button><button data-rps="paper">✋<small>Paper</small></button><button data-rps="scissors">✌️<small>Scissors</small></button></div><p id="rpsScore" class="game-hint">You 0 — 0 Computer</p>');
  let you=0,cpu=0;
  document.querySelectorAll("[data-rps]").forEach(b=>b.onclick=()=>{const a=b.dataset.rps,opts=["rock","paper","scissors"],c=opts[Math.floor(Math.random()*3)];let msg=a===c?"Draw!":((a==="rock"&&c==="scissors")||(a==="paper"&&c==="rock")||(a==="scissors"&&c==="paper"))?"You win this round!":"Computer wins this round!";if(msg.startsWith("You win"))you++;if(msg.startsWith("Computer"))cpu++;$("#rpsStatus").textContent=`You: ${a} · Computer: ${c} — ${msg}`;$("#rpsScore").textContent=`You ${you} — ${cpu} Computer`;});
}

function startGuess() {
  const secret=Math.floor(Math.random()*100)+1;let tries=0;
  setGame(gameTitles.guess, '<p class="game-status">I have picked a number from 1 to 100.</p><form id="guessForm" class="guess-form"><input id="guessInput" type="number" min="1" max="100" placeholder="Enter your guess" required><button class="save-note">Guess</button></form><p id="guessStatus" class="game-hint">You have unlimited tries. Can you find it?</p>');
  $("#guessForm").onsubmit=e=>{e.preventDefault();const n=Number($("#guessInput").value);if(!Number.isInteger(n)||n<1||n>100){$("#guessStatus").textContent="Enter a whole number from 1 to 100.";return;}tries++;$("#guessStatus").textContent=n===secret?`Correct! You found it in ${tries} tries 🏆`:n<secret?"Too low — try a higher number.":"Too high — try a lower number.";if(n===secret)$("#guessForm").querySelector("button").disabled=true;$("#guessInput").value="";};
}

function startReaction() {
  setGame(gameTitles.reaction, '<p class="game-status" id="reactionStatus">Tap start, wait for green, then tap as quickly as you can.</p><button id="reactionPad" class="reaction-pad">START</button>');
  const pad=$("#reactionPad"),status=$("#reactionStatus");let phase="ready",started=0,timer=null;
  pad.onclick=()=>{if(phase==="ready"){phase="wait";pad.textContent="WAIT…";pad.className="reaction-pad waiting";status.textContent="Wait for the green signal.";timer=setTimeout(()=>{phase="go";started=performance.now();pad.textContent="TAP NOW!";pad.className="reaction-pad go";},1200+Math.random()*2600);}else if(phase==="wait"){clearTimeout(timer);phase="ready";pad.textContent="Too soon! Try again";pad.className="reaction-pad";status.textContent="Early tap. Press to start a new round.";}else{const ms=Math.round(performance.now()-started);phase="ready";pad.textContent=""+ms+" ms · PLAY AGAIN";pad.className="reaction-pad";status.textContent=`Your reaction time: ${ms} milliseconds.`;}};
  gameCleanup=()=>clearTimeout(timer);
}


// DAILY PLANNER — saved locally in this browser/device.
let tasks = [];
try { tasks = JSON.parse(localStorage.getItem("kaushalji-tasks") || "[]"); if(!Array.isArray(tasks)) tasks=[]; } catch { tasks=[]; }
function saveTasks(){localStorage.setItem("kaushalji-tasks",JSON.stringify(tasks));renderTasks();}
function renderTasks(){const box=$("#taskList");box.innerHTML="";$("#taskCount").textContent=`${tasks.filter(t=>!t.done).length} active · ${tasks.length} total`;if(!tasks.length){box.innerHTML='<p class="muted">No tasks yet. Add your first task above.</p>';return;}tasks.forEach(t=>{const row=document.createElement("div");row.className="task-row"+(t.done?" task-done":"");const check=document.createElement("input");check.type="checkbox";check.checked=t.done;check.setAttribute("aria-label","Mark task complete");check.onchange=()=>{t.done=check.checked;saveTasks();};const label=document.createElement("span");label.textContent=t.text;const del=document.createElement("button");del.textContent="✕";del.className="task-delete";del.setAttribute("aria-label","Delete task");del.onclick=()=>{tasks=tasks.filter(x=>x.id!==t.id);saveTasks();};row.append(check,label,del);box.append(row);});}
$("#taskForm").addEventListener("submit",e=>{e.preventDefault();const input=$("#taskInput"),text=input.value.trim();if(!text)return;tasks.unshift({id:Date.now()+Math.random(),text,done:false});input.value="";saveTasks();});
$("#clearDone").onclick=()=>{tasks=tasks.filter(t=>!t.done);saveTasks();};renderTasks();

// STOPWATCH + COUNTDOWN TIMER
let swElapsed=0,swStarted=0,swRunning=false,swInterval=null;
function fmtStop(ms){const t=Math.floor(ms/100),mins=Math.floor(t/600),secs=Math.floor(t/10)%60,tenths=t%10;return `${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}.${tenths}`;}
function updateSW(){const value=swElapsed+(swRunning?performance.now()-swStarted:0);$("#stopwatchDisplay").textContent=fmtStop(value);}
$("#swStart").onclick=()=>{if(swRunning){swElapsed+=performance.now()-swStarted;swRunning=false;clearInterval(swInterval);$("#swStart").textContent="Resume";}else{swStarted=performance.now();swRunning=true;swInterval=setInterval(updateSW,50);$("#swStart").textContent="Pause";}updateSW();};
$("#swLap").onclick=()=>{const li=document.createElement("li");li.textContent=`Lap ${$("#lapList").children.length+1}: ${$("#stopwatchDisplay").textContent}`;$("#lapList").prepend(li);};
$("#swReset").onclick=()=>{swElapsed=0;swRunning=false;clearInterval(swInterval);$("#swStart").textContent="Start";$("#lapList").innerHTML="";updateSW();};
let timerRemaining=60,timerInterval=null;
function updateTimer(){const m=Math.floor(timerRemaining/60),s=timerRemaining%60;$("#timerDisplay").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;}
$("#timerStart").onclick=()=>{if(timerInterval){clearInterval(timerInterval);timerInterval=null;$("#timerStart").textContent="Resume Timer";return;}if(timerRemaining<=0)timerRemaining=Math.max(0,Number($("#timerMinutes").value)*60+Number($("#timerSeconds").value));if(timerRemaining<=0){$("#timerStatus").textContent="Set a duration greater than zero.";return;}$("#timerStatus").textContent="Timer running…";$("#timerStart").textContent="Pause Timer";timerInterval=setInterval(()=>{timerRemaining--;updateTimer();if(timerRemaining<=0){clearInterval(timerInterval);timerInterval=null;$("#timerStart").textContent="Start Timer";$("#timerStatus").textContent="Time is up! ⏰";try{if("vibrate" in navigator)navigator.vibrate([180,80,180]);}catch{}}},1000);};
$("#timerReset").onclick=()=>{clearInterval(timerInterval);timerInterval=null;timerRemaining=Math.max(0,Number($("#timerMinutes").value)*60+Number($("#timerSeconds").value));$("#timerStart").textContent="Start Timer";$("#timerStatus").textContent="";updateTimer();};
["timerMinutes","timerSeconds"].forEach(id=>$("#"+id).addEventListener("change",()=>{if(!timerInterval){timerRemaining=Math.max(0,Number($("#timerMinutes").value)*60+Number($("#timerSeconds").value));updateTimer();}}));

// UNIT CONVERTER
const unitSets={length:{m:1,km:1000,cm:.01,mm:.001,mi:1609.344,ft:.3048,in:.0254},weight:{kg:1,g:.001,mg:.000001,lb:.45359237,oz:.028349523125},temperature:{C:"C",F:"F",K:"K"}};
function fillUnits(){const type=$("#convertType").value,units=Object.keys(unitSets[type]);["convertFrom","convertTo"].forEach(id=>{const el=$("#"+id),old=el.value;el.innerHTML="";units.forEach(u=>{const op=document.createElement("option");op.value=u;op.textContent=u;el.append(op);});if(units.includes(old))el.value=old;});if(type==="length"){$("#convertFrom").value="m";$("#convertTo").value="cm";}else if(type==="weight"){$("#convertFrom").value="kg";$("#convertTo").value="g";}else{$("#convertFrom").value="C";$("#convertTo").value="F";}convertUnits();}
function convertUnits(){const type=$("#convertType").value,value=Number($("#convertValue").value),from=$("#convertFrom").value,to=$("#convertTo").value;if(!Number.isFinite(value)){$("#convertResult").textContent="Enter a number";return;}let result;if(type==="temperature"){const c=from==="C"?value:from==="F"?(value-32)*5/9:value-273.15;result=to==="C"?c:to==="F"?c*9/5+32:c+273.15;}else result=value*unitSets[type][from]/unitSets[type][to];$("#convertResult").textContent=`${Number(result.toPrecision(10))} ${to}`;}
$("#convertType").addEventListener("change",fillUnits);["convertValue","convertFrom","convertTo"].forEach(id=>$("#"+id).addEventListener("input",convertUnits));$("#convertFrom").addEventListener("change",convertUnits);$("#convertTo").addEventListener("change",convertUnits);fillUnits();


// Offline GK Quiz module
const quizBank = [
 {q:"भारत का संविधान कब लागू हुआ?",o:["15 अगस्त 1947","26 जनवरी 1950","26 नवंबर 1949","2 अक्टूबर 1950"],a:1,e:"भारतीय संविधान 26 जनवरी 1950 को लागू हुआ।"},
 {q:"भारत की राजधानी क्या है?",o:["मुंबई","कोलकाता","नई दिल्ली","चेन्नई"],a:2,e:"भारत की राजधानी नई दिल्ली है।"},
 {q:"सौरमंडल का सबसे बड़ा ग्रह कौन-सा है?",o:["पृथ्वी","बृहस्पति","मंगल","शुक्र"],a:1,e:"बृहस्पति सौरमंडल का सबसे बड़ा ग्रह है।"},
 {q:"'जय जवान, जय किसान' का नारा किसने दिया?",o:["महात्मा गांधी","जवाहरलाल नेहरू","लाल बहादुर शास्त्री","सरदार पटेल"],a:2,e:"यह नारा प्रधानमंत्री लाल बहादुर शास्त्री ने दिया था।"},
 {q:"भारत का राष्ट्रीय जलीय जीव कौन है?",o:["मगरमच्छ","गंगा नदी डॉल्फिन","कछुआ","नीली व्हेल"],a:1,e:"गंगा नदी डॉल्फिन भारत का राष्ट्रीय जलीय जीव है।"},
 {q:"पौधे अपना भोजन किस प्रक्रिया से बनाते हैं?",o:["श्वसन","वाष्पोत्सर्जन","प्रकाश संश्लेषण","अंकुरण"],a:2,e:"प्रकाश संश्लेषण में पौधे सूर्य के प्रकाश की मदद से भोजन बनाते हैं।"},
 {q:"कंप्यूटर का 'मस्तिष्क' किसे कहा जाता है?",o:["RAM","CPU","Monitor","Keyboard"],a:1,e:"CPU निर्देशों को प्रोसेस करता है, इसलिए इसे कंप्यूटर का मस्तिष्क कहते हैं।"},
 {q:"भारत का सबसे बड़ा राज्य क्षेत्रफल के अनुसार कौन-सा है?",o:["उत्तर प्रदेश","मध्य प्रदेश","महाराष्ट्र","राजस्थान"],a:3,e:"क्षेत्रफल के अनुसार राजस्थान भारत का सबसे बड़ा राज्य है।"},
 {q:"पानी का रासायनिक सूत्र क्या है?",o:["CO₂","H₂O","O₂","NaCl"],a:1,e:"पानी के एक अणु में दो हाइड्रोजन और एक ऑक्सीजन परमाणु होता है।"},
 {q:"विश्व पर्यावरण दिवस कब मनाया जाता है?",o:["5 जून","22 अप्रैल","1 मई","16 सितंबर"],a:0,e:"विश्व पर्यावरण दिवस हर साल 5 जून को मनाया जाता है।"}
];
let quizOrder=[], quizIndex=0, quizPoints=0, quizLocked=false;
function resetQuiz(){
 quizOrder=[...quizBank.keys()].sort(()=>Math.random()-.5);quizIndex=0;quizPoints=0;quizLocked=false;
 $("#quizNext").textContent="Next Question →";renderQuizQuestion();
}
function renderQuizQuestion(){
 const item=quizBank[quizOrder[quizIndex]];
 $("#quizProgress").textContent=`Question ${quizIndex+1} / ${quizOrder.length}`;
 $("#quizScore").textContent=`Score: ${quizPoints}`;
 $("#quizProgressBar").style.width=`${quizIndex/quizOrder.length*100}%`;
 $("#quizQuestion").textContent=item.q;$("#quizFeedback").textContent="Choose the correct answer.";
 $("#quizOptions").innerHTML="";quizLocked=false;$("#quizNext").disabled=true;
 item.o.forEach((option,i)=>{const b=document.createElement("button");b.className="quiz-option";b.textContent=option;b.onclick=()=>{
   if(quizLocked)return;quizLocked=true;
   [...$("#quizOptions").children].forEach((el,j)=>{el.disabled=true;if(j===item.a)el.classList.add("correct");else if(j===i)el.classList.add("incorrect");});
   if(i===item.a){quizPoints++;$("#quizFeedback").textContent="सही जवाब! "+item.e;}else $("#quizFeedback").textContent="सही उत्तर: "+item.o[item.a]+". "+item.e;
   $("#quizScore").textContent=`Score: ${quizPoints}`;$("#quizNext").disabled=false;
 };$("#quizOptions").append(b);});
}
$("#quizNext")?.addEventListener("click",()=>{
 if(!quizLocked)return;
 if(quizIndex<quizOrder.length-1){quizIndex++;renderQuizQuestion();}
 else{$("#quizQuestion").textContent=`Quiz complete! ${quizPoints} / ${quizOrder.length}`;$("#quizOptions").innerHTML="";$("#quizFeedback").textContent=quizPoints>=8?"Excellent work! 🌟": "Good effort — restart and improve your score.";$("#quizProgressBar").style.width="100%";$("#quizNext").disabled=true;$("#quizNext").textContent="Completed ✓";}
});
$("#quizRestart")?.addEventListener("click",resetQuiz);
resetQuiz();

// Offline Color Studio
let currentPalette=[];
function makePalette(){
 currentPalette=Array.from({length:5},()=>`#${Math.floor(Math.random()*0xffffff).toString(16).padStart(6,"0")}`);
 const preview=$("#palettePreview"),codes=$("#paletteCodes");
 preview.innerHTML="";codes.innerHTML="";
 currentPalette.forEach(color=>{
   const tile=document.createElement("button");tile.className="palette-tile";tile.style.background=color;tile.title=`Copy ${color}`;tile.setAttribute("aria-label",`Copy ${color}`);tile.onclick=async()=>{try{await navigator.clipboard.writeText(color);tile.classList.add("copied");setTimeout(()=>tile.classList.remove("copied"),650);}catch{alert(color);}};preview.append(tile);
   const code=document.createElement("button");code.className="palette-code";code.textContent=color;code.onclick=async()=>{try{await navigator.clipboard.writeText(color);code.textContent="Copied!";setTimeout(()=>code.textContent=color,800);}catch{alert(color);}};codes.append(code);
 });
 $("#gradientPreview").style.background=`linear-gradient(115deg,${currentPalette.join(",")})`;
}
$("#newPalette")?.addEventListener("click",makePalette);
$("#copyPalette")?.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(currentPalette.join(", "));$("#copyPalette").textContent="✓ Copied";setTimeout(()=>$("#copyPalette").textContent="📋 Copy All Codes",1000);}catch{alert(currentPalette.join(", "));}});
makePalette();
