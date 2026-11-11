'use strict';
/* ---------- 5. 課金ポイント ---------- */
S.shop=function(){
  let tab='map', sel=0;
  const P=[
    ['探索','アドバイザー雇用','弁護士・会計士などの専門家キャラを確定購入。DDで使える調査チームが増える','¥610〜'],
    ['DD','調査ブースト','DDスキャンの回数＋1。ただし正解・解説は無料で見られる','¥120'],
    ['統合','100日プラン時短','統合期間の待ち時間をスキップ','¥160'],
    ['街','街のスキン・装飾','本社や建物の見た目、季節イベントの装飾','¥370〜'],
    ['メタ','ケースパック','実例を参考にした架空の追加シナリオ（例：大型TOB編）','¥980'],
    ['メタ','ディールパス','月額。毎日のコイン、限定ケース、全時短','¥980/月']];
  const ringPos=[[0,'探索'],[1,'鑑定'],[2,'交渉'],[3,'DD'],[4,'契約'],[5,'統合'],[6,'振り返り']];
  function ring(){
    const cx=150,cy=150,r=104;let s='<svg viewBox="0 0 300 300" aria-label="コアループと課金ポイント">';
    s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="14"/>';
    s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+(r-36)+'" fill="rgba(95,193,146,.12)" stroke="#5fc192" stroke-dasharray="4 5"/>';
    s+='<text x="150" y="140" text-anchor="middle" font-size="12" fill="#a9bab2" font-family="Zen Kaku Gothic New,sans-serif" font-weight="700">メタ層</text><text x="150" y="160" text-anchor="middle" font-size="15" fill="#5fc192" font-family="Dela Gothic One,sans-serif">街の発展</text>';
    const pinMap={0:[0],3:[1],5:[2]};
    ringPos.forEach(p=>{const a=-Math.PI/2+p[0]*2*Math.PI/7;const x=cx+r*Math.cos(a),y=cy+r*Math.sin(a);
      const has=pinMap[p[0]];
      s+='<circle cx="'+x+'" cy="'+y+'" r="19" fill="'+(has?'#f0a14a':'#1d3a46')+'" stroke="#0e1a17" stroke-width="3"/>';
      s+='<text x="'+x+'" y="'+(y+4)+'" text-anchor="middle" font-size="10" font-weight="900" fill="'+(has?'#2a1604':'#f6efe2')+'" font-family="Zen Kaku Gothic New,sans-serif">'+p[1]+'</text>';
      if(has)has.forEach(n=>{s+='<circle cx="'+(x+15)+'" cy="'+(y-15)+'" r="9" fill="#ef6b5b" stroke="'+(sel===n?'#fff':'#0e1a17')+'" stroke-width="2"/><text x="'+(x+15)+'" y="'+(y-11.5)+'" text-anchor="middle" font-size="10" font-weight="900" fill="#fff">'+(n+1)+'</text>'});
    });
    [[3,150,110],[4,128,186],[5,172,186]].forEach(m=>{s+='<circle cx="'+m[1]+'" cy="'+m[2]+'" r="9" fill="#ef6b5b" stroke="'+(sel===m[0]?'#fff':'#0e1a17')+'" stroke-width="2"/><text x="'+m[1]+'" y="'+(m[2]+3.5)+'" text-anchor="middle" font-size="10" font-weight="900" fill="#fff">'+(m[0]+1)+'</text>'});
    return s+'</svg>';
  }
  function draw(){
    let inner='';
    if(tab==='map'){
      inner='<div class="ring">'+ring()+'</div>'+
      '<div class="legend">'+P.map((p,i)=>'<button class="'+(sel===i?'on':'')+'" data-i="'+i+'"><span class="num">'+(i+1)+'</span><span class="grow"><b>'+p[1]+'</b> <span class="xs muted">'+p[0]+'</span>'+(sel===i?'<span class="xs" style="display:block;color:#f6efe2;margin-top:.2em">'+p[2]+'</span>':'')+'</span><span class="mono xs" style="color:var(--ember)">'+p[3]+'</span></button>').join('')+'</div>'+
      '<div class="card"><p class="label">売上構成の仮説</p><div class="mix" style="margin-top:.4em"><span style="width:38%;background:#f0a14a">パス 38%</span><span style="width:24%;background:#ffd29a">ケース 24%</span><span style="width:20%;background:#8fb5ff">スキン 20%</span><span style="width:18%;background:#5fc192">他</span></div><p class="xs muted" style="margin-top:.4em">数値は仮置き。Phase 2 で検証</p></div>'+
      '<div class="rule">🔒 <b>お金で買えないもの</b>：学習の正解と解説、全章の基本ストーリー、用語辞典。<br>課金は「時短・見た目・追加ケース」に限定し、学びの公平さを守ります。</div>';
    }else{
      inner='<div class="row sp"><p class="disp" style="font-size:1.3em">ショップ</p><div class="wallet"><span>🪙 '+fmt(loadG().coins)+'</span><span>💎 '+G.gems+'</span></div></div>'+
      '<div class="pass" style="position:relative"><span class="pin-n">6</span><p class="label" style="color:#ffd29a">月額パス</p><p class="big">ディールパス</p><p class="xs" style="opacity:.9">毎日コイン ・ 限定ケース ・ 全時短</p><div class="row sp" style="margin-top:.5em"><span class="chip">初月 ¥480</span><span class="mono" style="font-weight:600">¥980/月</span></div></div>'+
      '<div class="shopgrid">'+
      item(1,minato(),'アドバイザー雇用','会計士「カズエ」。財務DDの精度アップ','¥610')+
      item(2,'<svg viewBox="0 0 60 60"><circle cx="26" cy="26" r="16" fill="none" stroke="#f0a14a" stroke-width="6"/><path d="M38 38 L52 52" stroke="#f0a14a" stroke-width="7" stroke-linecap="round"/><text x="26" y="31" text-anchor="middle" font-size="14" font-weight="900" fill="#f6efe2">+1</text></svg>','調査ブースト','DDスキャン ＋1回','¥120')+
      item(3,'<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="22" fill="#1d3a46" stroke="#5fc192" stroke-width="4"/><path d="M30 16 V30 L40 36" stroke="#f6efe2" stroke-width="4" fill="none" stroke-linecap="round"/></svg>','100日プラン時短','統合期間をスキップ','¥160')+
      item(4,'<svg viewBox="0 0 60 60"><rect x="12" y="20" width="36" height="32" rx="3" fill="#ef6b5b"/><polygon points="8,22 30,6 52,22" fill="#ffd29a"/><rect x="25" y="36" width="10" height="16" fill="#16251f"/></svg>','本社スキン「赤煉瓦」','街の見た目を変える','¥370')+
      item(5,'<svg viewBox="0 0 60 60"><rect x="12" y="8" width="36" height="46" rx="4" fill="#8fb5ff"/><rect x="18" y="16" width="24" height="4" fill="#0b1730"/><rect x="18" y="24" width="18" height="4" fill="#0b1730"/><text x="30" y="46" text-anchor="middle" font-size="11" font-weight="900" fill="#0b1730">TOB</text></svg>','ケースパック','大型TOB編・全5話','¥980')+
      '</div><p class="xs muted" style="text-align:center">価格はすべて仮置きです</p>';
    }
    const el=mount(topbar('課金ポイント','','town')+'<div class="tabs"><button class="'+(tab==='map'?'on':'')+'" data-t="map">課金マップ</button><button class="'+(tab==='shop'?'on':'')+'" data-t="shop">ショップ画面</button></div>'+
      '<div class="body" style="padding-top:.8em">'+inner+'</div><div class="foot"><button class="btn ghost" data-go="town">🏙 街へ戻る</button></div>','dark');
    bind(el);
    el.querySelectorAll('[data-t]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.t;draw()}));
    el.querySelectorAll('.legend button').forEach(b=>b.addEventListener('click',()=>{sel=+b.dataset.i;draw()}));
  }
  function item(n,art,nm,ds,pr){return '<div class="item"><span class="pin-n">'+n+'</span><div class="art">'+art+'</div><p class="nm">'+nm+'</p><p class="ds">'+ds+'</p><p class="price">'+pr+'</p></div>'}
  draw();
};
