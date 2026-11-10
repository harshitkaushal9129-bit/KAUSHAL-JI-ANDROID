const $ = s => document.querySelector(s);
const now = new Date();
let shownYear = now.getFullYear(), shownMonth = now.getMonth();
let selected = new Date(now.getFullYear(), now.getMonth(), now.getDate());
let festivals = [];

const views = ["calendar","calculator","clock","appinfo","developer"];
function showView(name){
  views.forEach(v => $("#"+v+"View").classList.toggle("hidden",v!==name));
  $("#menu").classList.add("hidden");
  if(name==="clock") updateClock();
}
$("#menuBtn").addEventListener("click",()=>$("#menu").classList.toggle("hidden"));
document.addEventListener("click",e=>{if(!e.target.closest(".topbar"))$("#menu").classList.add("hidden")});
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));

// Theme preference, sharing and PWA installation
function applyTheme(mode){
  document.body.classList.toggle("light-theme",mode==="light");
  $("#themeQuick").textContent=mode==="light"?"🌙":"☀️";
  $("#themeQuick").setAttribute("aria-label",mode==="light"?"Switch to dark mode":"Switch to light mode");
  localStorage.setItem("khushi-theme",mode);
}
function toggleTheme(){applyTheme(document.body.classList.contains("light-theme")?"dark":"light");}
applyTheme(localStorage.getItem("khushi-theme")||"dark");
$("#themeQuick").addEventListener("click",toggleTheme);
let deferredInstallPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault();deferredInstallPrompt=e;$("#installMenuItem").classList.remove("hidden");
});
window.addEventListener("appinstalled",()=>{$("#installMenuItem").classList.add("hidden");deferredInstallPrompt=null;});
async function shareApp(){
  const shareData={title:"Khushi Calendar",text:"Try Khushi Calendar – Indian festivals, calendar, calculator and neon clock.",url:location.href};
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
  if(action==="today"){selected=new Date();shownYear=selected.getFullYear();shownMonth=selected.getMonth();showView("calendar");renderCalendar();renderSelected();}
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
    btn.addEventListener("click",()=>{selected=date;shownYear=y;shownMonth=m;renderCalendar();renderSelected();});
    grid.append(btn);
  }
}
function renderSelected(){
  $("#selectedDate").textContent=formatDate(selected);
  const noteKey="khushi-note-"+dateKey(selected.getFullYear(),selected.getMonth(),selected.getDate());
  $("#dayNote").value=localStorage.getItem(noteKey)||"";
  $("#noteStatus").textContent="";
  const ev=getEvents(selected.getFullYear(),selected.getMonth(),selected.getDate());
  const box=$("#dayEvents");box.innerHTML="";
  if(!ev.length){box.innerHTML='<p class="muted">No festival listed for this date. Enjoy your day! ✨</p>';return;}
  ev.forEach(f=>{const div=document.createElement("div");div.className="event";div.innerHTML=`<b>${f.emoji||"🎉"} ${escapeHtml(f.name)}</b><small>${escapeHtml(f.type||"Festival")}${f.note?" · "+escapeHtml(f.note):""}</small>`;box.append(div);});
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function renderUpcoming(){
 const today=dateKey(now.getFullYear(),now.getMonth(),now.getDate());
 const term=($("#festivalSearch")?.value||"").trim().toLowerCase();
 const upcoming=festivals.filter(f=>f.date>=today && (!term||`${f.name} ${f.type||""}`.toLowerCase().includes(term))).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,12);
 const box=$("#upcomingList");box.innerHTML="";
 if(!upcoming.length){box.innerHTML='<p class="muted">No upcoming festivals in festival.json yet.</p>';return;}
 upcoming.forEach(f=>{const d=new Date(f.date+"T00:00:00");const el=document.createElement("div");el.className="upcoming-card";el.innerHTML=`<b>${f.emoji||"🎉"} ${escapeHtml(f.name)}</b><small>${d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</small>`;box.append(el);});
}
$("#prevMonth").onclick=()=>{shownMonth--;if(shownMonth<0){shownMonth=11;shownYear--;}renderCalendar();};
$("#nextMonth").onclick=()=>{shownMonth++;if(shownMonth>11){shownMonth=0;shownYear++;}renderCalendar();};
$("#festivalSearch").addEventListener("input",renderUpcoming);

$("#saveNote").addEventListener("click",()=>{
 const key="khushi-note-"+dateKey(selected.getFullYear(),selected.getMonth(),selected.getDate());
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
