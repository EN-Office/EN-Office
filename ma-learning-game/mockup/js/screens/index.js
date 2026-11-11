'use strict';
/* ---------- 目次 ---------- */
S.index=function(){
  const main=[['opening','🌅','はじまり','#ffd29a'],['town','🏙','経営','#5fc192'],['deal','🤝','M&A','#f0a14a'],['merit','🎉','成果','#8fb5ff']];
  const sub=[['minigame','🔍','DDスキャン','#2f5e6e'],['shop','🛒','ショップ','#ef6b5b']];
  const card=(it,i,n)=>'<button class="fade" style="animation-delay:'+(i*50)+'ms" data-go="'+it[0]+'">'+(n?'<span class="no">'+n+'</span>':'')+'<span class="ci" style="background:'+it[3]+'">'+it[1]+'</span><b>'+it[2]+'</b></button>';
  const el=mount(
    '<div class="idx-hero">'+skyline({beasts:true})+'<div class="logo fade"><small>チュートリアル · モックアップ</small>Deal<br>Tamers</div></div>'+
    '<div class="idx-list" style="gap:.8em">'+
    '<button class="btn" id="startall">▶ はじめから遊ぶ</button>'+
    '<div class="flowline"><span>🏢</span><i>›</i><span>🏙</span><i>›</i><span>🤝</span><i>›</i><span>🎉</span><i>›</i><span>🎮</span></div>'+
    '<p class="label">チャプター</p><div class="chap" style="grid-template-columns:repeat(4,1fr)">'+main.map((it,i)=>card(it,i,i+1)).join('')+'</div>'+
    '<p class="label">ミニゲーム・ショップ</p><div class="chap" style="grid-template-columns:repeat(2,1fr)">'+sub.map((it,i)=>card(it,i+4)).join('')+'</div>'+
    '</div>');
  bind(el);
  el.querySelector('#startall').addEventListener('click',()=>{G=null;try{sessionStorage.removeItem('dt-g')}catch(e){}go('opening')});
};
