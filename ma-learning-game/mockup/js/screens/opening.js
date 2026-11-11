'use strict';
/* ---------- 1. オープニング ---------- */
S.opening=function(){
  let i=0, pick=null;
  // 主役の企業獣・ミナトは3D（使えない環境では中のSVG）。ホストは押せない（タップは画面送りへ通す）
  const b3=(k,w,mood,svg,anim)=>'<div class="op-b3" data-beast3d="'+k+'"'+(mood?' data-mood="'+mood+'"':'')+' style="width:'+w+';'+(anim||'')+'">'+svg+'</div>';
  const scenes=[
    {art:()=>'<div style="text-align:center;animation:pop .8s both"><div class="logo" style="font-size:3em">Deal<br>Tamers</div><p class="small" style="color:#ffd29a;margin-top:.6em;letter-spacing:.2em">ディール・テイマーズ</p></div>',text:'',hint:'▶ タップではじめる'},
    {art:()=>continent(),text:'ここは<em>マーケット大陸</em>。<br>いくつもの地区が広がっている。'},
    {art:()=>'<div class="row op-four">'+['machi','hayate','misemori','it'].map((k,j)=>b3(k,'24%','',beast(B[k]),'animation:pop .5s '+(j*120)+'ms both')).join('')+'</div>',text:'大陸には<em>企業獣</em>が棲んでいる。<br>売上で育ち、利益で強くなる。'},
    {art:()=>b3('machi','52%','worry',beast(Object.assign({},B.machi,{mood:'worry'})),'animation:fade .6s both'),text:'でも、どの企業獣にも<em>悩み</em>がある。<br>後継ぎ不足、資金不足、仲間探し。'},
    {art:()=>b3('owl','50%','',minato(),'animation:pop .6s both'),text:'「わたしは<em>ミナト</em>。<br>あなた専属のアドバイザーです」'}
  ];
  const STORY=scenes.length;
  // 起業する会社：名前と特徴の札（2つまで）
  const OPTS=[['pan','ベーカリー本舗',['🥐 食品','🛡 安定黒字']],['hayate','ハヤテ物流',['🚚 物流','🗺 販路が広い']],['it','ピクセル工房',['💻 IT','🚀 急成長']]];
  function continent(){
    return '<svg viewBox="0 0 300 260" style="width:92%;animation:fade .8s both"><path d="M40 140 C30 70 110 30 170 50 C250 40 290 110 260 170 C240 230 140 240 90 215 C50 200 45 175 40 140Z" fill="#2f5e4f" stroke="#ffd29a" stroke-width="2"/>'+
    '<path d="M150 50 L140 130 L60 150 M140 130 L240 160 M140 130 L130 225" stroke="#ffd29a" stroke-width="1.5" stroke-dasharray="4 4" fill="none" opacity=".7"/>'+
    [['工業地区',85,100,'#f0a14a'],['物流港',205,95,'#8fb5ff'],['商店街',95,185,'#ef6b5b'],['テック高原',200,195,'#b48cff']].map(a=>'<circle cx="'+a[1]+'" cy="'+a[2]+'" r="9" fill="'+a[3]+'"/><text x="'+a[1]+'" y="'+(a[2]+24)+'" text-anchor="middle" font-size="12" font-weight="700" fill="#f6efe2" font-family="Zen Kaku Gothic New,sans-serif">'+a[0]+'</text>').join('')+
    '<circle cx="140" cy="130" r="6" fill="#fff"/><text x="140" y="120" text-anchor="middle" font-size="10" fill="#fff" font-family="IBM Plex Mono,monospace">YOU</text></svg>';
  }
  function next(){if(i>=STORY)return;SFX.play('step');i++;draw()}
  function story(){
    const sc=scenes[i];
    const dots='<div class="op-dots" aria-label="'+(i+1)+' / '+STORY+'">'+scenes.map((_,j)=>'<i class="'+(j===i?'on':j<i?'done':'')+'"></i>').join('')+'</div>';
    const el=mount('<div class="op" id="op" tabindex="0">'+
      '<div class="op-top"><button class="ibtn back" data-go="" aria-label="目次へ戻る">←</button>'+dots+'<button class="ibtn mute" data-mute data-sfx="none" aria-label="音のオン・オフ"></button></div>'+
      '<div class="op-art">'+sc.art()+'</div>'+
      (sc.text?'<div class="op-text fade"><p>'+sc.text+'</p></div>':'')+
      '<div class="op-hint"><span>'+(sc.hint||'▶ タップで次へ')+'</span></div></div>');
    bind(el);
    const op=el.querySelector('#op');
    op.addEventListener('click',e=>{if(e.target.closest('button'))return;next()});
    op.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target===op){e.preventDefault();next()}});
    try{op.focus({preventScroll:true})}catch(e){}
  }
  function heroHTML(){
    if(!pick)return '<div class="op-pick-empty"><span>？</span></div>';
    const o=OPTS.find(x=>x[0]===pick);
    return '<div class="op-b3 op-pick-b" data-beast3d="'+pick+'" style="width:40%">'+beast(B[pick])+'</div><p class="disp op-pick-nm">'+o[1]+'</p>';
  }
  function choose(){
    const el=mount(topbar('起業する会社を選ぶ')+'<div class="body fade">'+tip('どの会社で<b>起業</b>しますか？')+
      '<div class="op-pick" id="hero">'+heroHTML()+'</div>'+
      '<div class="op-opts">'+OPTS.map(o=>'<button class="tap'+(pick===o[0]?' on':'')+'" data-p="'+o[0]+'" data-sfx="select" aria-pressed="'+(pick===o[0])+'">'+
        '<span class="ic">'+beast(B[o[0]])+'</span><span class="grow"><b class="nm">'+o[1]+'</b><span class="tags">'+o[2].map(c=>'<span class="chip">'+c+'</span>').join('')+'</span></span></button>').join('')+'</div>'+
      '</div><div class="foot"><button class="btn" id="next" data-sfx="start" '+(pick?'':'disabled')+'>🏢 この会社で起業</button></div>','dark');
    bind(el);
    const hero=el.querySelector('#hero'),btn=el.querySelector('#next');
    el.querySelectorAll('[data-p]').forEach(b=>b.addEventListener('click',()=>{
      if(pick===b.dataset.p)return;
      pick=b.dataset.p;
      el.querySelectorAll('[data-p]').forEach(x=>{const on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)});
      hero.innerHTML=heroHTML();btn.disabled=false;
    }));
    btn.addEventListener('click',()=>{G=freshG(pick);saveG();go('town')});
  }
  function draw(){if(i<STORY)story();else choose()}
  draw();
};
/* オープニングだけで使う配置（:root のトークンのみ使用） */
(function(){
  if(document.getElementById('st-opening'))return;
  const s=document.createElement('style');s.id='st-opening';
  s.textContent=
    '.op{outline:none;cursor:pointer;background:linear-gradient(180deg,transparent 50%,rgba(14,26,23,.5))}'+
    '.op-top{position:absolute;top:0;left:0;right:0;z-index:3;display:flex;align-items:center;justify-content:space-between;padding:.9em 1em 0}'+
    '.op-dots{display:flex;gap:.45em}'+
    '.op-dots i{width:.55em;height:.55em;border-radius:50%;background:rgba(255,255,255,.25)}'+
    '.op-dots i.done{background:rgba(255,210,154,.6)}'+
    '.op-dots i.on{background:var(--ember);width:1.5em;border-radius:var(--r-pill)}'+
    '.op-b3{aspect-ratio:1/1;pointer-events:none;position:relative}'+
    '.op-b3>svg{width:100%;height:100%;display:block}'+
    '.op-four{gap:0;width:94%;justify-content:center}'+
    '.op-text{min-height:5.6em;padding:1em 1.4em 0}'+
    '.op-text p{font-size:1.1em}'+
    '.op-hint{display:flex;justify-content:center;padding:.8em 0 1.6em}'+
    '.op-hint span{font-size:.8em;font-weight:900;letter-spacing:.12em;color:#ffd29a;background:rgba(14,26,23,.6);border-radius:var(--r-pill);padding:.3em 1.1em;animation:glow 1.6s infinite}'+
    '.op-pick{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;min-height:13.5em;gap:.2em}'+
    '.op-pick-b{animation:pop .45s both}'+
    '.op-pick-nm{font-size:1.25em;animation:fade .4s both}'+
    '.op-pick-empty{width:40%;aspect-ratio:1/1;border-radius:50%;background:var(--flat-bg);display:grid;place-items:center;margin-bottom:1.6em}'+
    '.op-pick-empty span{font-family:var(--font-display);font-size:3em;color:var(--mist);opacity:.6}'+
    '.op-opts{display:flex;flex-direction:column;gap:.5em}'+
    '.op-opts .ic{flex:none;width:3.2em;height:3.2em}'+
    '.op-opts .ic svg{width:100%;height:100%}'+
    '.op-opts .nm{display:block;font-size:1em;margin-bottom:.25em}';
  document.head.appendChild(s);
})();
