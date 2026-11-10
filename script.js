const $=id=>document.getElementById(id);
const toast=m=>{const el=$("toast");el.textContent=m;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),2600)};
function updateClock(){
  const now=new Date();
  const time=now.toLocaleTimeString([],{hour12:false});
  const date=now.toLocaleDateString([],{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  $("heroTime").textContent=time;$("digitalTime").textContent=time;
  $("heroDate").textContent=date;$("digitalDate").textContent=date;
  $("todayLabel").textContent=now.toLocaleDateString([],{weekday:"long",month:"long",day:"numeric",year:"numeric"});
  const s=now.getSeconds(),m=now.getMinutes(),h=now.getHours()%12;
  $("analogClock").querySelector(".second").style.transform=`translateX(-50%) rotate(${s*6}deg)`;
  $("analogClock").querySelector(".minute").style.transform=`translateX(-50%) rotate(${m*6+s*.1}deg)`;
  $("analogClock").querySelector(".hour").style.transform=`translateX(-50%) rotate(${h*30+m*.5}deg)`;
}
updateClock();setInterval(updateClock,1000);
setTimeout(()=>$("intro").classList.add("hide"),2300);

$("themeToggle").onclick=()=>{document.body.classList.toggle("light");localStorage.setItem("kj-theme",document.body.classList.contains("light")?"light":"dark");};
if(localStorage.getItem("kj-theme")==="light")document.body.classList.add("light");

document.querySelectorAll(".dot").forEach(btn=>{
  btn.onclick=()=>{
    const acc=btn.dataset.accent;
    document.body.dataset.accent=acc;
    localStorage.setItem("kj-accent",acc);
    toast(`Accent switched to ${acc}!`);
  };
});
const savedAcc=localStorage.getItem("kj-accent");
if(savedAcc)document.body.dataset.accent=savedAcc;

$("shareAppBtn").onclick=async()=>{
  if(navigator.share){
    try{await navigator.share({title:"Kaushal Ji System Pro",text:"Check out my neon personal dashboard!",url:location.href});}catch(e){}
  }else{
    navigator.clipboard.writeText(location.href);
    toast("🔗 App link copied to clipboard!");
  }
};

const quotes=["brighter.","faster.","limitless.","cybernetic.","neon-charged."];
let qIdx=0;setInterval(()=>{qIdx=(qIdx+1)%quotes.length;$("tickerText").textContent=quotes[qIdx];},3500);

document.querySelectorAll(".card-fs-btn").forEach(btn=>{
  btn.onclick=e=>{
    e.stopPropagation();
    const card=btn.closest(".tool-card");
    const isExp=card.classList.contains("card-expanded");
    document.querySelectorAll(".tool-card").forEach(c=>c.classList.remove("card-expanded"));
    if(!isExp){card.classList.add("card-expanded");btn.textContent="✕";toast("Expanded full screen.");}
    else{btn.textContent="⛶";}
  };
});

const indianFestivals={"1-1":"New Year","1-14":"Makar Sankranti","1-26":"Republic Day","3-8":"Maha Shivratri","3-25":"Holi","4-11":"Eid-ul-Fitr","4-17":"Ram Navami","8-15":"Independence Day","8-19":"Raksha Bandhan","9-7":"Ganesh Chaturthi","10-2":"Gandhi Jayanti","10-12":"Dussehra","11-1":"Diwali","11-15":"Guru Nanak Jayanti","12-25":"Christmas"};
let calendarDate=new Date();
function renderCalendar(){
  const year=calendarDate.getFullYear(),month=calendarDate.getMonth();
  $("monthYear").textContent=calendarDate.toLocaleDateString([],[{month:"long",year:"numeric"}]);
  const first=new Date(year,month,1).getDay(),days=new Date(year,month+1,0).getDate(),prevDays=new Date(year,month,0).getDate();
  const today=new Date();let html="";let curFest=[];
  for(let i=0;i<42;i++){
    let day,cls="",actM=month;
    if(i<first){day=prevDays-first+i+1;cls="muted-day";actM=month-1;}
    else if(i>=first+days){day=i-first-days+1;cls="muted-day";actM=month+1;}
    else{day=i-first+1;}
    const fKey=`${actM+1}-${day}`;
    if(indianFestivals[fKey]&&actM===month){cls+=" festival-day";curFest.push({day,name:indianFestivals[fKey]});}
    if(actM===today.getMonth()&&year===today.getFullYear()&&day===today.getDate())cls+=" today";
    html+=`<button class="${cls}" type="button" data-day="${day}" data-fest="${indianFestivals[fKey]||''}">${day}</button>`;
  }
  $("calendarDays").innerHTML=html;
  if(curFest.length>0){$("festTitle").textContent=curFest[0].name;$("festDate").textContent=`Upcoming on day ${curFest[0].day}`;}
  else{$("festTitle").textContent="No festival listed";$("festDate").textContent="Regular month";}
  document.querySelectorAll("#calendarDays button").forEach(b=>{
    b.onclick=()=>{if(b.dataset.fest)toast(`🎉 ${b.dataset.fest}`);};
  });
}
$("prevMonth").onclick=()=>{calendarDate.setMonth(calendarDate.getMonth()-1);renderCalendar();};
$("nextMonth").onclick=()=>{calendarDate.setMonth(calendarDate.getMonth()+1);renderCalendar();};
renderCalendar();

let alarmTarget=null,alarmKey="";
$("setAlarm").onclick=()=>{
  const val=$("alarmTime").value;if(!val){toast("Choose time.");return;}
  const [h,m]=val.split(":").map(Number);const now=new Date();alarmTarget=new Date();alarmTarget.setHours(h,m,0,0);
  if(alarmTarget<=now)alarmTarget.setDate(alarmTarget.getDate()+1);
  alarmKey="";$("alarmStatus").textContent=`Set for ${val}`;toast("Alarm set!");
};
setInterval(()=>{
  if(!alarmTarget)return;const now=new Date();
  if(now>=alarmTarget&&alarmKey!==alarmTarget.toString()){
    alarmKey=alarmTarget.toString();$("alarmStatus").textContent="Ringing!";toast("⏰ Alarm ringing!");
    try{const ctx=new (window.AudioContext||window.webkitAudioContext)();const osc=ctx.createOscillator();const g=ctx.createGain();osc.connect(g);g.connect(ctx.destination);osc.frequency.value=880;g.gain.value=.1;osc.start();setTimeout(()=>{osc.stop();ctx.close();},2000);}catch(e){}
    alarmTarget=null;
  }
},1000);

let swRun=false,swStart=0,swElap=0,swInt=null;
function drawSW(){
  const t=swElap+(swRun?Date.now()-swStart:0),cs=Math.floor(t/10)%100,sec=Math.floor(t/1000)%60,min=Math.floor(t/60000);
  $("stopwatchDisplay").textContent=`${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}.${String(cs).padStart(2,"0")}`;
}
$("swStart").onclick=()=>{
  if(swRun){swElap+=Date.now()-swStart;swRun=false;clearInterval(swInt);$("swStart").textContent="Start";}
  else{swStart=Date.now();swRun=true;swInt=setInterval(drawSW,30);$("swStart").textContent="Pause";}
  drawSW();
};
$("swLap").onclick=()=>{if(!swRun&&!swElap){toast("Start first.");return;}const li=document.createElement("li");li.textContent=$("stopwatchDisplay").textContent;$("laps").prepend(li);};
$("swReset").onclick=()=>{swRun=false;clearInterval(swInt);swElap=0;$("swStart").textContent="Start";$("laps").innerHTML="";drawSW();};

let tInt=null,tRem=0;
function showT(){const m=Math.floor(tRem/60),s=tRem%60;$("timerDisplay").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;}
$("timerStart").onclick=()=>{
  if(tInt){clearInterval(tInt);tInt=null;$("timerStart").textContent="Start";return;}
  if(tRem<=0){const mins=Number($("timerMinutes").value);if(!Number.isFinite(mins)||mins<1){toast("Enter mins.");return;}tRem=Math.floor(mins*60);}
  $("timerStart").textContent="Pause";showT();
  tInt=setInterval(()=>{tRem--;showT();if(tRem<=0){clearInterval(tInt);tInt=null;$("timerStart").textContent="Start";toast("⏳ Timer finished!");}},1000);
};
$("timerReset").onclick=()=>{clearInterval(tInt);tInt=null;tRem=0;$("timerStart").textContent="Start";showT();};
showT();

$("notes").value=localStorage.getItem("kj-notes")||"";
function updateNCount(){const t=$("notes").value.trim();$("notesCount").textContent=`${t?t.split(/\s+/).length:0} words`;}
updateNCount();
$("notes").oninput=()=>{localStorage.setItem("kj-notes",$("notes").value);$("notesStatus").textContent="Saved ✓";updateNCount();};

let playlistFiles=[];
$("audioFolder").onchange=e=>{
  const files=Array.from(e.target.files).filter(f=>f.type.startsWith("audio/"));
  if(!files.length){toast("No audio files found.");return;}
  playlistFiles=files;
  $("audioName").textContent=`Loaded ${files.length} tracks`;
  let listHtml="";
  files.forEach((f,idx)=>{listHtml+=`<li data-idx="${idx}">${idx+1}. ${f.name}</li>`;});
  $("playlist").innerHTML=listHtml;
  playTrack(0);
  toast(`Loaded ${files.length} tracks from folder!`);
};
function playTrack(idx){
  if(!playlistFiles[idx])return;
  const file=playlistFiles[idx];
  const url=URL.createObjectURL(file);
  const player=$("audioPlayer");
  player.src=url;
  player.play();
  $("audioName").textContent=file.name;
  document.querySelectorAll("#playlist li").forEach(li=>li.style.color="var(--muted)");
  const activeLi=document.querySelector(`#playlist li[data-idx="${idx}"]`);
  if(activeLi)activeLi.style.color="var(--accent)";
}
document.addEventListener("click",e=>{
  if(e.target.matches("#playlist li")){
    const idx=Number(e.target.dataset.idx);
    playTrack(idx);
  }
});

let calcExpr="";
document.querySelectorAll("[data-calc]").forEach(b=>b.onclick=()=>{
  const k=b.dataset.calc;
  if(k==="clear"){calcExpr="";$("calcDisplay").value="";return;}
  if(k==="="){
    try{if(!/^[0-9+*/.() -]+$/.test(calcExpr))throw Error();const res=Function('"use strict";return ('+calcExpr+')')();calcExpr=String(res);$("calcDisplay").value=calcExpr;}
    catch(e){$("calcDisplay").value="Error";calcExpr="";}
    return;
  }
  calcExpr+=k;$("calcDisplay").value=calcExpr;
});

$("generatePassBtn").onclick=()=>{
  const chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$*!";
  let pass="";for(let i=0;i<12;i++)pass+=chars.charAt(Math.floor(Math.random()*chars.length));
  $("genPassResult").value=pass;toast("Password generated!");
};
$("copyPassBtn").onclick=()=>{
  const val=$("genPassResult").value;
  if(!val){toast("Generate first.");return;}
  navigator.clipboard.writeText(val);toast("🔒 Password copied!");
};

function convertUnits(){
  const val=Number($("unitVal").value||0);
  const type=$("unitType").value;
  let res="";
  if(type==="kg_g")res=`${val*1000} Grams`;
  else if(type==="km_m")res=`${val*1000} Meters`;
  else if(type==="c_f")res=`${(val*9/5)+32} °Fahrenheit`;
  $("unitResult").textContent=`Result: ${res}`;
}
$("unitVal").oninput=convertUnits;
$("unitType").onchange=convertUnits;

// UPI QR GENERATOR (Inside App Info)
$("genUpiBtn").onclick=()=>{
  const amt=$("upiAmount").value||100;
  const upiUrl=`upi://pay?pa=mandavikaushal913@okaxis&pn=Kaushal%20Ji&am=${amt}&cu=INR`;
  $("qrPlaceholder").innerHTML=`UPI Link Ready:<br><a href="${upiUrl}" style="color:var(--accent);font-size:10px;" target="_blank">Pay ₹${amt} via UPI App</a>`;
  toast("UPI payment link generated!");
};

$("toolSearch").oninput=e=>{
  const q=e.target.value.toLowerCase().trim();
  document.querySelectorAll(".tool-card").forEach(c=>c.hidden=!c.dataset.tool.includes(q)&&q!=="");
};

async function updateBattery(){
  if(!navigator.getBattery)return;
  try{const b=await navigator.getBattery();const r=()=>{const l=Math.round(b.level*100);$("batteryLevel").textContent=l+"%";$("batteryBar").style.width=l+"%";$("batteryStatus").textContent=b.charging?"⚡ Charging":"🔋 On battery";};r();b.onlevelchange=r;b.onchargingchange=r;}catch(e){}
}
updateBattery();

$("weatherSearch").onclick=async()=>{
  const city=$("weatherCity").value.trim();if(!city){toast("Enter city.");return;}
  $("weatherResult").textContent="Loading weather…";
  try{
    const geo=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`).then(r=>r.json());
    if(!geo.results?.length)throw Error("City not found.");
    const p=geo.results[0];
    const d=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`).then(r=>r.json());
    $("weatherResult").textContent=`${p.name}: ${Math.round(d.current.temperature_2m)}°C · Humidity ${d.current.relative_humidity_2m}%`;
  }catch(e){$("weatherResult").textContent="Weather fetch failed.";}
};

$("appInfoBtn").onclick=()=>$("infoModal").classList.add("show");
$("closeInfoModal").onclick=()=>$("infoModal").classList.remove("show");
$("infoModal").onclick=e=>{if(e.target===$("infoModal"))$("infoModal").classList.remove("show");};

if("serviceWorker" in navigator&&(location.protocol==="https:"||location.hostname==="localhost")){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(e=>console.log(e)));
}
