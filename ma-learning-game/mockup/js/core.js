'use strict';
const $stage=document.getElementById('stage');
const S={}; // screens
let timers=[];
function clearTimers(){timers.forEach(t=>{clearTimeout(t);clearInterval(t)});timers=[]}
function later(fn,ms){const t=setTimeout(fn,ms);timers.push(t);return t}
function every(fn,ms){const t=setInterval(fn,ms);timers.push(t);return t}
function mount(html,cls){
  clearTimers();try{glSeen=new Set()}catch(e){}
  $stage.innerHTML='<div class="screen '+(cls||'')+'">'+html+'</div>';
  const el=$stage.firstChild;
  try{if(typeof Kit3D!=='undefined'&&Kit3D&&typeof Kit3D.scan==='function'){const r=Kit3D.scan(el);if(r&&typeof r.catch==='function')r.catch(()=>{})}}catch(e){}
  return el;
}
function go(name){if(location.hash.slice(1)===name){route()}else{location.hash=name}}
/* 上部バー：左に戻る（丸ボタン）、右端に音のオン・オフ（アイコンとクリックは audio.js が担当） */
function topbar(title,extra,back){return '<div class="topbar"><button class="ibtn back" data-go="'+(back||'')+'" aria-label="戻る">←</button><div class="ttl">'+title+'</div>'+(extra||'')+
  '<button class="ibtn mute" data-mute data-sfx="none" aria-label="音のオン・オフ"></button></div>'}
function bind(root){root.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)))}

/* ---------- キャラクター ---------- */
function beast(o){
  o=Object.assign({c:'#f0a14a',d:'#c76d14',horn:'spike',mood:'smile',belly:'#ffd9a8',extra:''},o);
  const horns={
    spike:'<polygon points="30,30 38,4 50,28" fill="'+o.c+'"/><polygon points="70,28 82,4 90,30" fill="'+o.c+'"/>',
    ear:'<rect x="30" y="4" width="12" height="30" rx="6" fill="'+o.c+'"/><rect x="78" y="4" width="12" height="30" rx="6" fill="'+o.c+'"/>',
    gear:'<circle cx="60" cy="14" r="12" fill="none" stroke="'+o.d+'" stroke-width="6" stroke-dasharray="5 4"/>',
    leaf:'<path d="M60 26 C50 6 70 0 66 22 Z" fill="#5fc192"/><path d="M60 26 C74 8 86 14 64 26 Z" fill="#3f9a70"/>',
    cap:'<path d="M30 34 Q60 4 90 34 Z" fill="'+o.d+'"/><rect x="26" y="30" width="68" height="6" rx="3" fill="'+o.d+'"/>',
    none:''}[o.horn];
  const mouth={smile:'<path d="M50 74 Q60 84 70 74" fill="none" stroke="#16251f" stroke-width="4" stroke-linecap="round"/>',
    worry:'<path d="M50 80 Q60 72 70 80" fill="none" stroke="#16251f" stroke-width="4" stroke-linecap="round"/>',
    o:'<ellipse cx="60" cy="78" rx="5" ry="6" fill="#16251f"/>'}[o.mood];
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" aria-hidden="true">'+
    '<ellipse cx="60" cy="112" rx="38" ry="6" fill="rgba(0,0,0,.25)"/>'+horns+
    '<path d="M18 70 Q18 28 60 28 Q102 28 102 70 Q102 108 60 108 Q18 108 18 70Z" fill="'+o.c+'"/>'+
    '<ellipse cx="60" cy="86" rx="26" ry="18" fill="'+o.belly+'" opacity=".55"/>'+
    '<rect x="26" y="98" width="16" height="12" rx="6" fill="'+o.d+'"/><rect x="78" y="98" width="16" height="12" rx="6" fill="'+o.d+'"/>'+
    '<circle cx="46" cy="60" r="10" fill="#fff"/><circle cx="74" cy="60" r="10" fill="#fff"/>'+
    '<circle cx="48" cy="62" r="5" fill="#16251f"/><circle cx="76" cy="62" r="5" fill="#16251f"/>'+
    '<circle cx="50" cy="59" r="1.8" fill="#fff"/><circle cx="78" cy="59" r="1.8" fill="#fff"/>'+mouth+o.extra+'</svg>';
}
const B={
  machi:{c:'#f0a14a',d:'#c76d14',horn:'gear',belly:'#ffe2b8'},
  hayate:{c:'#8fb5ff',d:'#4f78c9',horn:'ear',belly:'#e1ebff'},
  misemori:{c:'#ef6b5b',d:'#b8473a',horn:'cap',belly:'#ffd6cf'},
  pan:{c:'#ffd29a',d:'#d39a52',horn:'none',belly:'#fff3de'},
  it:{c:'#b48cff',d:'#7b55c9',horn:'spike',belly:'#eadcff'},
  seed:{c:'#5fc192',d:'#3f9a70',horn:'leaf',belly:'#d7f3e5'},
  oyaji:{c:'#c9a27a',d:'#8e6c48',horn:'none',belly:'#f1e2d0',extra:'<path d="M40 46 h14 M66 46 h14" stroke="#f6efe2" stroke-width="5" stroke-linecap="round"/><path d="M44 86 Q60 96 76 86" fill="#f6efe2"/>'}
};
function minato(){ // アドバイザー：フクロウ型のFA
  return '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="56" fill="#1d3a46"/>'+
  '<path d="M28 40 L38 18 L50 36 Z M92 40 L82 18 L70 36Z" fill="#2f5e6e"/>'+
  '<ellipse cx="60" cy="68" rx="36" ry="38" fill="#2f5e6e"/><ellipse cx="60" cy="80" rx="22" ry="22" fill="#f6efe2"/>'+
  '<circle cx="45" cy="56" r="13" fill="#f6efe2"/><circle cx="75" cy="56" r="13" fill="#f6efe2"/>'+
  '<circle cx="45" cy="57" r="6" fill="#16251f"/><circle cx="75" cy="57" r="6" fill="#16251f"/>'+
  '<circle cx="45" cy="56" r="14" fill="none" stroke="#f0a14a" stroke-width="3"/><circle cx="75" cy="56" r="14" fill="none" stroke="#f0a14a" stroke-width="3"/><path d="M59 56 h2" stroke="#f0a14a" stroke-width="3"/>'+
  '<path d="M54 70 L60 78 L66 70Z" fill="#f0a14a"/><path d="M50 92 l10 8 l10-8" fill="none" stroke="#c76d14" stroke-width="3"/></svg>';
}
function tip(text){return '<div class="tip"><div class="face">'+minato()+'</div><div class="bubble">'+text+'</div></div>'}

/* ---------- 街並み ---------- */
function skyline(opts){
  opts=opts||{};
  const win=(x,y)=>'<rect x="'+x+'" y="'+y+'" width="7" height="7" fill="#ffd29a" opacity=".9"/>';
  let s='<svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">';
  s+='<circle cx="282" cy="96" r="34" fill="#ffd29a" opacity=".75"/>';
  s+='<path d="M0 150 Q90 120 180 140 T360 128 V200 H0Z" fill="#2a4a43" opacity=".7"/>';
  s+='<g fill="#15241d"><rect x="0" y="168" width="360" height="32"/>';
  s+='<rect x="18" y="128" width="40" height="44" rx="3"/><rect x="66" y="104" width="34" height="68" rx="3"/>';
  s+='<rect x="150" y="70" width="58" height="102" rx="4"/><polygon points="150,70 179,48 208,70"/>';
  s+='<rect x="300" y="122" width="44" height="50" rx="3"/>';
  if(opts.extra) s+='<rect x="222" y="112" width="62" height="60" rx="3"/>';
  s+='</g>';
  s+=win(26,138)+win(42,150)+win(74,114)+win(86,132)+win(74,150)+win(160,84)+win(176,84)+win(192,84)+win(160,106)+win(192,106)+win(176,128)+win(310,134)+win(326,150);
  if(opts.extra) s+=win(232,124)+win(248,124)+win(264,140)+win(232,150);
  s+='<text x="179" y="164" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9" fill="#ffd29a">HQ</text>';
  if(opts.beasts){s+='<g transform="translate(110,138) scale(.32)">'+beast(B.machi).replace(/<\/?svg[^>]*>/g,'')+'</g>';
    s+='<g transform="translate(262,146) scale(.24)">'+beast(B.seed).replace(/<\/?svg[^>]*>/g,'')+'</g>';}
  return s+'</svg>';
}
