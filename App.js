const MEMES = [
  {id:"handsome", name:"красавчик", price:235000, url:"https://vt.tiktok.com/ZSpsVPhoR/", icon:"😎"},
  {id:"sad", name:"грусть", price:850, url:"https://vt.tiktok.com/ZSpsVAKo9/", icon:"🥲"},
  {id:"interesting", name:"интересно", price:35000, url:"https://vt.tiktok.com/ZSpsV96DJ/", icon:"🤔"}
];
const $ = id => document.getElementById(id);
const money = n => Number(n||0).toLocaleString("ru-RU");
const storageKey = "mellstroyrng-save-v1";
let state = loadState();
let activeIndex = 0, autoTimer, spinning = false, muted = false;
function guestId(){return Math.random().toString(36).slice(2,7).toUpperCase().padEnd(5,"X")}
function loadState(){
  try { const saved=JSON.parse(localStorage.getItem(storageKey)); if(saved?.user && Array.isArray(saved.inventory)) return saved; } catch(e){}
  return {user:"Гость-"+guestId(),inventory:[],spins:0};
}
function save(){localStorage.setItem(storageKey,JSON.stringify(state));}
function total(){return state.inventory.reduce((sum,item)=>sum+item.price,0)}
function renderRoulette(){
  const host=$("roulette");host.innerHTML="";
  [-1,0,1].forEach(offset=>{
    const index=(activeIndex+offset+MEMES.length)%MEMES.length,m=MEMES[index];
    const card=document.createElement("article");card.className="meme-card "+(offset===0?"center":"side");
    const visual=document.createElement("div");visual.className="meme-visual";
    // TikTok's official embed supplies the creator's video and first frame when available.
    const quote=document.createElement("blockquote");quote.className="tiktok-embed";quote.setAttribute("cite",m.url);quote.style.cssText="max-width:100%;min-width:0";
    const link=document.createElement("a");link.href=m.url;link.textContent="Смотреть мем в TikTok";quote.appendChild(link);visual.appendChild(quote);
    const price=document.createElement("div");price.className="meme-price";price.textContent=money(m.price);
    const name=document.createElement("div");name.className="meme-name";name.textContent=m.name;
    card.append(visual,price,name);host.appendChild(card);
  });
  $("currentPrice").innerHTML=money(MEMES[activeIndex].price)+' <span>валюты</span>';
  $("currentCaption").textContent=MEMES[activeIndex].name;
  const embedScript=document.createElement("script");embedScript.src="https://www.tiktok.com/embed.js";embedScript.async=true;document.body.appendChild(embedScript);
}
function refresh(){
  $("guestName").textContent=state.user;$("profileName").textContent=state.user;
  $("totalValue").textContent=money(total());$("inventoryWorth").textContent=money(total());$("profileWorth").textContent=money(total());
  $("profileItems").textContent=state.inventory.length;$("profileCount").textContent=state.spins;
  const grid=$("inventoryGrid");grid.innerHTML="";
  if(!state.inventory.length)grid.innerHTML='<div class="empty" style="grid-column:1/-1">Пока пусто. Крути рулетку, чтобы получить первый мем ✦</div>';
  [...state.inventory].reverse().forEach((item,i)=>{
    const el=document.createElement("div");el.className="inventory-item";
    el.innerHTML=`<div class="inventory-thumb">${item.icon}</div><b>${escapeHtml(item.name)}</b><span>${money(item.price)}</span><small>Предмет #${state.inventory.length-i}</small>`;grid.appendChild(el);
  });
  const worthByUser={};worthByUser[state.user]=total();
  const rows=$("leaderboardRows");rows.innerHTML=`<div class="leader-row"><span>1</span><span>${escapeHtml(state.user)} <small style="color:#7e9184">(ты)</small></span><strong>${money(total())}</strong></div><div class="empty">Глобальный рейтинг появится после подключения общей базы игроков.</div>`;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)}
function startAuto(){clearInterval(autoTimer);autoTimer=setInterval(()=>{if(!spinning){activeIndex=(activeIndex+1)%MEMES.length;renderRoulette()}},3300)}
function spin(){
  if(spinning)return;spinning=true;$("spinButton").disabled=true;$("spinHint").textContent="УДАЧА УЖЕ РЕШАЕТ ТВОЮ СУДЬБУ...";
  clearInterval(autoTimer);
  const winner=Math.floor(Math.random()*MEMES.length),steps=13+((winner-activeIndex+MEMES.length)%MEMES.length);
  let count=0,delay=75;
  function tick(){
    activeIndex=(activeIndex+1)%MEMES.length;renderRoulette();count++;
    if(count<steps){delay+=Math.min(20,count*1.2);setTimeout(tick,delay)}
    else{
      const item={...MEMES[activeIndex],wonAt:Date.now()};state.inventory.push(item);state.spins++;save();refresh();
      $("spinHint").textContent="МЕМ ДОБАВЛЕН В ИНВЕНТАРЬ";toast("Выпало: "+item.name+" · "+money(item.price));
      // The winner card settles and scales down to suggest its flight into inventory.
      const card=$("roulette").querySelector(".center");if(card){card.animate([{transform:"scale(1.12) translateY(0)",opacity:1},{transform:"scale(.25) translateY(130px)",opacity:0}],{duration:700,easing:"cubic-bezier(.2,.8,.2,1)"})}
      setTimeout(()=>{spinning=false;$("spinButton").disabled=false;$("spinHint").textContent="РУЛЕТКА КРУТИТСЯ АВТОМАТИЧЕСКИ";startAuto()},850);
    }
  }tick();
}
document.querySelectorAll(".nav-btn").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b===btn));
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  $(""+btn.dataset.view+"View").classList.add("active");
}));
$("spinButton").addEventListener("click",spin);
$("guestButton").addEventListener("click",()=>toast("Ты вошёл как "+state.user+" — пароль не требуется."));
$("volume").addEventListener("input",e=>{$("volumeLabel").textContent=e.target.value+"%";muted=Number(e.target.value)===0;$("muteButton").textContent=muted?"♩":"♫"});
$("muteButton").addEventListener("click",()=>{muted=!muted;$("volume").value=muted?0:35;$("volumeLabel").textContent=$("volume").value+"%";$("muteButton").textContent=muted?"♩":"♫";toast(muted?"Звук выключен":"Звук включён")});
renderRoulette();refresh();startAuto();
