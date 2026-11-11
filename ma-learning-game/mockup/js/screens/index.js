'use strict';
/* ---------- 目次（入口） ---------- */
S.index=function(){
  // [ルート, アイコン, 名前, アイコンの地色（パレット変数）]
  const main=[['opening','🌅','はじまり','var(--ember)'],['town','🏙','経営','var(--leaf)'],['deal','🤝','M&A','var(--ember-deep)'],['merit','🎉','成果','var(--rose-deep)']];
  const sub=[['minigame','🔍','DDスキャン','var(--leaf-deep)'],['shop','🛒','ショップ','var(--rose)']];
  const chap=(it,i)=>'<button class="fade" style="animation-delay:'+(120+i*60)+'ms" data-go="'+it[0]+'"><span class="no">'+(i+1)+'</span>'+
    '<span class="ci" style="background:'+it[3]+'">'+it[1]+'</span><b>'+it[2]+'</b></button>';
  const extra=(it,i)=>'<button class="tap fade" style="animation-delay:'+(360+i*60)+'ms" data-go="'+it[0]+'">'+
    '<span class="ci" style="background:'+it[3]+'">'+it[1]+'</span><b class="grow">'+it[2]+'</b><span class="go" aria-hidden="true">›</span></button>';
  // 夕景の上に立つ主役の企業獣（3D。使えない環境では中のSVGのまま）
  const hero=(k,cls)=>'<div class="idx-beast '+cls+'" data-beast3d="'+k+'">'+beast(B[k])+'</div>';
  const el=mount(
    '<div class="idx-hero">'+skyline({})+hero('machi','l')+hero('seed','r')+
      '<div class="logo fade"><small>M&A × 街づくり</small>Deal<br>Tamers</div>'+
      '<p class="idx-tag fade">企業獣を仲間にして、街を育てよう</p>'+
      '<button class="ibtn mute" data-mute data-sfx="none" aria-label="音のオン・オフ"></button></div>'+
    '<div class="idx-list">'+
      '<button class="btn idx-start" id="startall" data-sfx="start">▶ はじめから遊ぶ</button>'+
      '<div class="flowline" aria-label="遊びの流れ"><span>🏢</span><i>›</i><span>🏙</span><i>›</i><span>🤝</span><i>›</i><span>🎉</span><i>›</i><span>🎮</span></div>'+
      '<p class="label">チャプター</p><div class="chap idx-chap">'+main.map(chap).join('')+'</div>'+
      '<p class="label">おまけ</p><div class="idx-extra">'+sub.map(extra).join('')+'</div>'+
      '<p class="xs muted idx-note">チュートリアル · モックアップ</p>'+
    '</div>');
  bind(el);
  el.querySelector('#startall').addEventListener('click',()=>{G=null;try{sessionStorage.removeItem('dt-g')}catch(e){}go('opening')});
};
/* 目次だけで使う配置（:root のトークンのみ使用） */
(function(){
  if(document.getElementById('st-index'))return;
  const s=document.createElement('style');s.id='st-index';
  s.textContent=
    '.idx-hero{height:44%;padding:1.5em 1.2em 0}'+
    '.idx-hero .mute{position:absolute;top:.9em;right:1em;z-index:3}'+
    '.idx-hero .logo{position:relative;z-index:2;font-size:2.7em}'+
    '.idx-tag{position:relative;z-index:2;margin-top:.55em;font-size:.82em;font-weight:700;color:var(--paper);opacity:.92;text-shadow:0 .06em .3em rgba(0,0,0,.35)}'+
    '.idx-beast{position:absolute;bottom:4%;aspect-ratio:1/1;z-index:1;pointer-events:auto}'+
    '.idx-hero .idx-beast>svg{position:static;width:100%;height:100%;display:block}'+
    '.idx-beast.l{left:23%;width:24cqw;animation:pop .6s .2s both}'+
    '.idx-beast.r{right:4%;width:19cqw;animation:pop .6s .35s both}'+
    '.idx-list{gap:.7em;padding:1em 1em 1.1em}'+
    '.idx-start{font-size:1.15em;min-height:15cqw}'+
    '.idx-list .flowline{margin:-.1em 0 .1em}'+
    '.idx-list .label{margin-bottom:-.3em}'+
    '.idx-chap{grid-template-columns:repeat(4,1fr)}'+
    '.idx-extra{display:grid;grid-template-columns:1fr 1fr;gap:.5em}'+
    '.idx-extra .tap{gap:.55em;padding:.55em .7em}'+
    '.idx-extra .ci{flex:none;width:2.2em;height:2.2em;border-radius:.7em;display:grid;place-items:center;font-size:1.15em}'+
    '.idx-extra b{font-size:.86em;font-weight:900}'+
    '.idx-extra .go{flex:none;color:var(--ember);font-weight:900;font-size:1.2em}'+
    '.idx-note{margin-top:auto;text-align:center;letter-spacing:.2em}';
  document.head.appendChild(s);
})();
