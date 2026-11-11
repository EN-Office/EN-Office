'use strict';
/* ---------- 5. 課金ポイント ---------- */
S.shop=function(){
  let tab='map', sel=0;
  // [ループ上の場所, 名前, 1行の説明, 価格（仮）]
  const P=[
    ['探索','アドバイザー雇用','専門家キャラを確定購入。調査チームが増える','¥610〜'],
    ['DD','調査ブースト','スキャン＋1回。正解と解説は無料のまま','¥120'],
    ['統合','100日プラン時短','統合期間の待ち時間をスキップ','¥160'],
    ['街','街のスキン・装飾','本社や建物の見た目、季節の装飾','¥370〜'],
    ['メタ','ケースパック','実例を参考にした架空の追加シナリオ','¥980'],
    ['メタ','ディールパス','月額。毎日コイン・限定ケース・全時短','¥980/月']];
  const ringPos=[[0,'探索'],[1,'鑑定'],[2,'交渉'],[3,'DD'],[4,'契約'],[5,'統合'],[6,'振り返り']];
  function ring(){
    const cx=150,cy=150,r=104;let s='<svg viewBox="0 0 300 300" aria-label="コアループと課金ポイント">';
    s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="14"/>';
    s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+(r-36)+'" fill="rgba(95,193,146,.12)" stroke="#5fc192" stroke-dasharray="4 5"/>';
    s+='<text x="150" y="140" text-anchor="middle" font-size="12" fill="#a9bab2" font-family="Zen Kaku Gothic New,sans-serif" font-weight="700">メタ層</text><text x="150" y="160" text-anchor="middle" font-size="15" fill="#5fc192" font-family="Dela Gothic One,sans-serif">街の発展</text>';
    const pinMap={0:[0],3:[1],5:[2]};
    const pin=(n,x,y)=>{const on=sel===n;return '<circle cx="'+x+'" cy="'+y+'" r="'+(on?11:9)+'" fill="#ef6b5b" stroke="'+(on?'#fff':'#0e1a17')+'" stroke-width="2"/><text x="'+x+'" y="'+(y+3.5)+'" text-anchor="middle" font-size="10" font-weight="900" fill="#fff">'+(n+1)+'</text>'};
    ringPos.forEach(p=>{const a=-Math.PI/2+p[0]*2*Math.PI/7;const x=cx+r*Math.cos(a),y=cy+r*Math.sin(a);
      const has=pinMap[p[0]];
      s+='<circle cx="'+x+'" cy="'+y+'" r="19" fill="'+(has?'#f0a14a':'#1d3a46')+'" stroke="#0e1a17" stroke-width="3"/>';
      s+='<text x="'+x+'" y="'+(y+4)+'" text-anchor="middle" font-size="10" font-weight="900" fill="'+(has?'#2a1604':'#f6efe2')+'" font-family="Zen Kaku Gothic New,sans-serif">'+p[1]+'</text>';
      if(has)has.forEach(n=>{s+=pin(n,x+15,y-15)});
    });
    [[3,150,110],[4,128,186],[5,172,186]].forEach(m=>{s+=pin(m[0],m[1],m[2])});
    return s+'</svg>';
  }
  function legendRow(p,i){
    return '<button class="'+(sel===i?'on':'')+'" data-i="'+i+'" data-sfx="select" aria-expanded="'+(sel===i)+'"><span class="num">'+(i+1)+'</span>'+
      '<span class="grow"><span class="row" style="gap:.4em"><b>'+p[1]+'</b><span class="chip">'+p[0]+'</span></span>'+
      '<span class="xs sh-desc">'+p[2]+'</span></span><span class="mono sh-pr">'+p[3]+'</span></button>';
  }
  // ショップ画面の商品：モックアップなので押すと「購入できません」を知らせる
  function item(n,art,nm,chips,pr){
    return '<button class="tap sh-item" data-buy data-sfx="ng"><span class="pin-n">'+n+'</span><span class="art">'+art+'</span><b class="nm">'+nm+'</b>'+
      '<span class="tags">'+chips.map(c=>'<span class="chip">'+c+'</span>').join('')+'</span><span class="price">'+pr+'</span></button>';
  }
  function draw(){
    let inner='';
    if(tab==='map'){
      inner='<div class="ring" id="ring">'+ring()+'</div>'+
      '<div class="legend">'+P.map(legendRow).join('')+'</div>'+
      '<div class="panel"><p class="label">売上構成の仮説</p><div class="mix" style="margin-top:.5em"><span style="width:38%;background:#f0a14a">パス 38%</span><span style="width:24%;background:#ffd29a">ケース 24%</span><span style="width:20%;background:#8fb5ff">スキン 20%</span><span style="width:18%;background:#5fc192">他</span></div><p class="xs muted" style="margin-top:.45em">仮置き · Phase 2 で検証</p></div>'+
      '<div class="rule"><p>🔒 <b>お金で買えないもの</b></p><div class="tags" style="margin:.45em 0 .5em"><span class="chip">✅ 正解と解説</span><span class="chip">📖 基本ストーリー</span><span class="chip">📚 用語辞典</span></div><p class="xs">課金は「時短・見た目・追加ケース」だけ。学びは公平に。</p></div>';
    }else{
      inner='<div class="row sp"><p class="disp" style="font-size:1.3em">ショップ</p><div class="wallet"><span>🪙 '+fmt(loadG().coins)+'</span><span>💎 '+G.gems+'</span></div></div>'+
      '<button class="tap pass sh-pass" data-buy data-sfx="ng"><span class="pin-n">6</span><span class="grow"><span class="label" style="color:#ffd29a;display:block">月額パス</span><span class="big" style="display:block">ディールパス</span>'+
        '<span class="tags" style="margin-top:.4em"><span class="chip">🪙 毎日コイン</span><span class="chip">📘 限定ケース</span><span class="chip">⏩ 全時短</span></span></span>'+
        '<span class="sh-passpr"><span class="xs" style="display:block;color:#ffd29a">初月 ¥480</span><span class="mono">¥980<small>/月</small></span></span></button>'+
      '<div class="shopgrid">'+
      item(1,minato(),'アドバイザー雇用',['👩‍💼 会計士','🔍 DD精度↑'],'¥610')+
      item(2,'<svg viewBox="0 0 60 60"><circle cx="26" cy="26" r="16" fill="none" stroke="#f0a14a" stroke-width="6"/><path d="M38 38 L52 52" stroke="#f0a14a" stroke-width="7" stroke-linecap="round"/><text x="26" y="31" text-anchor="middle" font-size="14" font-weight="900" fill="#f6efe2">+1</text></svg>','調査ブースト',['🔍 スキャン+1'],'¥120')+
      item(3,'<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="22" fill="#1d3a46" stroke="#5fc192" stroke-width="4"/><path d="M30 16 V30 L40 36" stroke="#f6efe2" stroke-width="4" fill="none" stroke-linecap="round"/></svg>','100日プラン時短',['⏩ 統合を時短'],'¥160')+
      item(4,'<svg viewBox="0 0 60 60"><rect x="12" y="20" width="36" height="32" rx="3" fill="#ef6b5b"/><polygon points="8,22 30,6 52,22" fill="#ffd29a"/><rect x="25" y="36" width="10" height="16" fill="#16251f"/></svg>','本社スキン「赤煉瓦」',['🎨 見た目'],'¥370')+
      item(5,'<svg viewBox="0 0 60 60"><rect x="12" y="8" width="36" height="46" rx="4" fill="#8fb5ff"/><rect x="18" y="16" width="24" height="4" fill="#0b1730"/><rect x="18" y="24" width="18" height="4" fill="#0b1730"/><text x="30" y="46" text-anchor="middle" font-size="11" font-weight="900" fill="#0b1730">TOB</text></svg>','ケースパック',['📘 大型TOB編','全5話'],'¥980')+
      '</div><p class="xs muted" style="text-align:center">価格はすべて仮置き · 購入はできません</p>';
    }
    const el=mount(topbar('課金ポイント','','town')+'<div class="tabs"><button class="'+(tab==='map'?'on':'')+'" data-t="map" data-sfx="select">🗺 課金マップ</button><button class="'+(tab==='shop'?'on':'')+'" data-t="shop" data-sfx="select">🛒 ショップ画面</button></div>'+
      '<div class="body" style="padding-top:.8em">'+inner+'</div><div class="foot"><button class="btn ghost" data-go="town">🏙 街へ戻る</button></div>','dark');
    bind(el);
    el.querySelectorAll('[data-t]').forEach(b=>b.addEventListener('click',()=>{if(tab!==b.dataset.t){tab=b.dataset.t;draw()}}));
    // 凡例：その場で開閉（スクロール位置を保つ）。リング上の番号も強調
    el.querySelectorAll('.legend button').forEach(b=>b.addEventListener('click',()=>{
      const n=+b.dataset.i;sel=sel===n?-1:n;
      el.querySelectorAll('.legend button').forEach(x=>{const on=+x.dataset.i===sel;x.classList.toggle('on',on);x.setAttribute('aria-expanded',on)});
      el.querySelector('#ring').innerHTML=ring();
    }));
    el.querySelectorAll('[data-buy]').forEach(b=>b.addEventListener('click',()=>{
      const old=el.querySelector('.sh-toast');if(old)old.remove();
      const t=document.createElement('div');t.className='toast sh-toast';t.setAttribute('role','status');t.textContent='🧪 モックアップのため購入できません';
      el.appendChild(t);later(()=>t.remove(),1600);
    }));
  }
  draw();
};
/* 課金画面だけで使う配置（:root のトークンのみ使用） */
(function(){
  if(document.getElementById('st-shop'))return;
  const s=document.createElement('style');s.id='st-shop';
  s.textContent=
    '.legend .sh-desc{display:none;margin-top:.3em;color:var(--paper);line-height:1.45}'+
    '.legend button.on .sh-desc{display:block}'+
    '.legend .chip{font-size:.62em}'+
    '.legend .sh-pr{flex:none;font-size:.82em;color:var(--ember);align-self:center}'+
    '.legend button.on .sh-pr{margin-right:.9em}'+
    '.legend button{align-items:center}'+
    '.shopgrid{padding-bottom:var(--edge)}'+
    '.sh-item{flex-direction:column;align-items:flex-start;gap:.35em;padding:.75em;border-radius:var(--r-l)}'+
    '.sh-item .art{height:3.4em;width:100%;display:grid;place-items:center}'+
    '.sh-item .art svg{height:100%;width:auto}'+
    '.sh-item .nm{font-size:.86em;line-height:1.35}'+
    '.sh-item .price{margin-top:auto}'+
    '.sh-pass{background:linear-gradient(135deg,#3a2a16,#7a4a1c 55%,#c9813a);color:var(--paper);--e:var(--ember-deep);border-radius:var(--r-l);padding:.9em;align-items:flex-end}'+
    '.sh-pass .chip{background:rgba(0,0,0,.28);color:var(--paper)}'+
    '.sh-passpr{flex:none;text-align:right;font-weight:600}'+
    '.sh-passpr small{font-size:.7em}'+
    '.sh-toast{background:var(--paper);color:var(--ink);font-size:.86em;top:44%;left:0;right:0;margin-inline:auto;width:max-content;max-width:90%;transform:none;box-shadow:0 .4em 1.2em rgba(0,0,0,.35)}'+
    '.screen .ring{width:70%}';
  document.head.appendChild(s);
})();
