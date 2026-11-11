'use strict';
/* ---------- 街（経営シム・チュートリアルの中心） ---------- */
S.town=function(){
  loadG();const away=accrue();
  let placing=!!G.pending;
  function nav(){
    const items=[['town','🏙','街',0],['deal','🤝','M&A',2],['games','🎮','ゲーム',4],['shop','🛒','ショップ',5],['','☰','目次',0]];
    return '<nav class="tnav">'+items.map(it=>{const lock=G.q<it[3],hot=(it[3]===G.q&&it[3]>0&&it[0]!=='town');
      return '<button class="'+(it[0]==='town'?'on':'')+(hot?' hot':'')+(lock?' lock':'')+'" data-nav="'+it[0]+'"><span class="ni">'+it[1]+(lock?'<i>🔒</i>':'')+'</span><span>'+it[2]+'</span></button>'}).join('')+'</nav>';
  }
  function plotHTML(i){
    const p=isoPos(i),b=G.b[i];
    let s='';
    if(b){
      const h=10+b.lv*5,top=p.ty+7.5-28;
      s+='<button class="bld'+(b.drop?' drop':'')+'" data-b="'+i+'" style="z-index:'+(PLOTS[i][0]+PLOTS[i][1]+1)+';left:'+(p.cx-20.5)+'cqw;top:'+top+'cqw" aria-label="'+CO[b.k].n+'">'+building(b.k,b.lv)+
        '<span class="mon" style="top:'+((41-h)*41/60-10.5)+'cqw">'+beast(B[b.k])+'</span>'+
        '<span class="lvl">Lv'+b.lv+'</span>'+(b.syn?'<span class="synb">⚡</span>':'')+'</button>';
      s+='<button class="coinb" data-c="'+i+'" style="left:'+(p.cx-5)+'cqw;top:'+(top+(41-h)*41/60-19)+'cqw"'+(b.st>=Math.max(6,income(i)*3)?'':' hidden')+'><span>🪙</span><b>'+fmt(b.st)+'</b></button>';
    }else if(LOCKED.includes(i)){
      s+='<span class="deco" style="left:'+(p.cx-6)+'cqw;top:'+(p.ty-4)+'cqw">🌲</span><span class="deco s" style="left:'+(p.cx+1)+'cqw;top:'+(p.ty+1)+'cqw">🌳</span>';
    }else if(placing){
      s+='<button class="slot'+(ADJ.includes(i)?' syn':'')+'" data-p="'+i+'" style="left:'+(p.cx-6)+'cqw;top:'+(p.ty+1.5)+'cqw">'+(ADJ.includes(i)?'⚡':'＋')+'</button>';
    }
    return s;
  }
  function tiles(){
    let s='<svg class="ground" viewBox="0 0 100 62" aria-hidden="true"><defs><linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fcf8f"/><stop offset="1" stop-color="#5aa874"/></linearGradient></defs>';
    s+='<polygon points="50,2 98,26 50,50 2,26" transform="translate(0,4)" fill="#3c7a57"/>';
    s+='<polygon points="50,2 98,26 50,50 2,26" fill="url(#gg)"/>';
    PLOTS.forEach((pl,i)=>{const p=isoPos(i);const c=G.b[i]?'#d9c9a3':(placing&&!LOCKED.includes(i))?(ADJ.includes(i)?'#ffd29a':'#cfe9c9'):'#8fd39b';
      s+='<polygon points="'+p.cx+','+(p.ty+1)+' '+(p.cx+13)+','+(p.ty+7.5)+' '+p.cx+','+(p.ty+14)+' '+(p.cx-13)+','+(p.ty+7.5)+'" fill="'+c+'" stroke="rgba(255,255,255,.35)" stroke-width=".4"/>'});
    return s+'</svg>';
  }
  function draw(extra){
    const q=QUESTS[G.q],qn=G.qn;
    const el=mount(
      '<div class="thud"><div class="cp">'+beast(B[G.company])+'<div><b>'+CO[G.company].n+'</b><span class="rk">'+RANKS[G.rank]+'</span></div></div>'+
      '<div class="wal"><span class="coin">🪙 <b id="cn">'+fmt(G.coins)+'</b></span><span class="gem">💎 '+G.gems+'</span></div></div>'+
      '<div class="tstat"><span>📈 <b id="inc">'+totalInc().toFixed(1).replace('.0','')+'</b>/秒</span><span>🏢 '+Object.keys(G.b).length+'社</span></div>'+
      '<button class="quest'+(G.q>=5?' done':'')+'" id="quest"><span class="qi">'+q.ic+'</span><span class="grow"><span class="qt">'+(placing?'場所をタップして配置':q.t)+'</span>'+(q.need>1?'<span class="qb"><i style="width:'+(qn/q.need*100)+'%"></i></span>':'')+'</span>'+(q.need?'<span class="qr">🪙50</span>':'')+'</button>'+
      '<div class="map" id="map">'+tiles()+PLOTS.map((_,i)=>plotHTML(i)).join('')+'</div>'+
      '<div class="tguide" id="guide"></div>'+nav(),'town');
    bind(el);
    el.querySelectorAll('.coinb').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();collect(+b.dataset.c,b)}));
    el.querySelectorAll('.bld').forEach(b=>b.addEventListener('click',()=>openB(+b.dataset.b)));
    el.querySelectorAll('.slot').forEach(b=>b.addEventListener('click',()=>place(+b.dataset.p)));
    el.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>navTo(b.dataset.nav)));
    el.querySelector('#quest').addEventListener('click',()=>questGo());
    guide();
    every(tick,500);
    if(extra)extra();
  }
  function guide(){
    const g=$stage.querySelector('#guide');if(!g)return;
    const msg=placing?'<b>⚡</b>の場所は本社のとなり。シナジーで収入アップ！':
      [ 'コインがたまったら<b>タップで回収</b>！','建物をタップして<b>アップグレード</b>','次は<b>M&A</b>で仲間を増やそう','','<b>🎮</b>でミニゲームに挑戦！','おめでとう！ 自由に遊んでみよう'][G.q];
    g.innerHTML=msg?'<div class="tip"><div class="face">'+minato()+'</div><div class="bubble">'+msg+'</div></div>':'';
  }
  function tick(){
    accrue();
    Object.keys(G.b).forEach(i=>{const b=G.b[i],el=$stage.querySelector('.coinb[data-c="'+i+'"]');if(!el)return;
      el.hidden=!(b.st>=Math.max(6,income(i)*3));el.querySelector('b').textContent=fmt(b.st)});
    saveG();
  }
  function collect(i,btn){
    const b=G.b[i];const v=Math.floor(b.st);if(v<=0)return;b.st=0;G.coins+=v;
    const r=btn.getBoundingClientRect(),sr=$stage.getBoundingClientRect();
    const f=document.createElement('div');f.className='fly';f.textContent='+'+v;f.style.left=(r.left-sr.left)+'px';f.style.top=(r.top-sr.top)+'px';$stage.firstChild.appendChild(f);later(()=>f.remove(),900);
    btn.hidden=true;
    const adv=questDone(0);saveG();
    $stage.querySelector('#cn').textContent=fmt(G.coins);
    if(adv){reward('🪙','クエスト達成！','+50 コイン')} else if(G.q===0)draw();
  }
  function openB(i){
    const b=G.b[i],c=CO[b.k],cost=upCost(b),can=G.coins>=cost&&b.lv<5;
    const m=document.createElement('div');m.className='modal';
    m.innerHTML='<div class="sheet dark-sheet"><div class="row" style="gap:.8em"><div style="width:26%">'+building(b.k,b.lv)+'</div><div class="grow"><p class="tn">'+c.ic+' '+c.n+'</p><p class="small">Lv'+b.lv+(b.hq?' · 本社':'')+(b.syn?' · ⚡シナジー':'')+'</p></div></div>'+
      '<div class="stats"><div><span>📈</span><b>'+income(i).toFixed(1).replace('.0','')+'</b><i>/秒</i></div><div><span>⬆️</span><b>'+(b.lv<5?(c.inc*(b.lv+1)*(b.syn?1.5:1)).toFixed(1).replace('.0',''):'MAX')+'</b><i>次のLv</i></div><div><span>📦</span><b>'+fmt(cap(i))+'</b><i>貯蔵上限</i></div></div>'+
      '<button class="btn" id="up" '+(can?'':'disabled')+'>'+(b.lv<5?'アップグレード　🪙'+fmt(cost):'最大レベル')+'</button><button class="btn ghost" data-close>閉じる</button></div>';
    $stage.firstChild.appendChild(m);
    m.addEventListener('click',e=>{if(e.target===m||e.target.closest('[data-close]'))m.remove()});
    m.querySelector('#up').addEventListener('click',()=>{G.coins-=cost;b.lv++;const adv=b.hq&&b.lv>=2?questDone(1):false;saveG();m.remove();draw(()=>{const e=$stage.querySelector('.bld[data-b="'+i+'"]');if(e)e.classList.add('pulse')});if(adv)reward('⬆️','クエスト達成！','+50 コイン')});
  }
  function place(i){
    const k=G.pending;G.pending=null;placing=false;
    const syn=ADJ.includes(i);G.b[i]={k,lv:1,st:0,syn,drop:true};G.b[HQ].syn=G.b[HQ].syn||syn;G.syn=syn;
    questDone(3);G.rank=1;saveG();
    draw(()=>{later(()=>{delete G.b[i].drop;saveG();merits(syn)},900)});
  }
  function merits(syn){
    const gv={S:9.6,A:8.0,B:6.2,C:4.0}[G.grade]||8;
    const m=document.createElement('div');m.className='modal center';
    m.innerHTML='<div class="sheet dark-sheet pop"><p class="disp" style="font-size:1.6em;text-align:center">🎉 M&A成功！</p>'+
      '<div class="mgrid">'+
      '<div><span>🏢</span><b>+1社</b><i>グループ拡大</i></div>'+
      '<div><span>📈</span><b>'+totalInc().toFixed(1).replace('.0','')+'/秒</b><i>収入アップ</i></div>'+
      '<div><span>⚡</span><b>'+(syn?'×1.5':'—')+'</b><i>シナジー</i></div>'+
      '<div><span>💰</span><b>+'+(gv*(syn?1.5:1)).toFixed(1)+'億</b><i>企業価値</i></div>'+
      '<div><span>🎖</span><b>UP</b><i>アソシエイト</i></div>'+
      '<div><span>🎮</span><b>解放</b><i>ミニゲーム</i></div></div>'+
      (syn?'':'<p class="xs" style="text-align:center;opacity:.8">⚡の場所に置くと、シナジーで収入が1.5倍に</p>')+
      '<button class="btn" data-close>街へ</button></div>';
    $stage.firstChild.appendChild(m);
    m.addEventListener('click',e=>{if(e.target.closest('[data-close]')){m.remove();draw()}});
  }
  function reward(ic,t,v){
    const m=document.createElement('div');m.className='rwd';m.innerHTML='<span>'+ic+'</span><b>'+t+'</b><i>'+v+'</i>';
    $stage.firstChild.appendChild(m);later(()=>{m.remove();draw()},1300);
  }
  function navTo(t){
    const lock={deal:2,games:4,shop:5}[t];
    if(t==='town')return;
    if(lock!==undefined&&G.q<lock){const f=document.createElement('div');f.className='toast';f.textContent='🔒 クエストを進めると解放';$stage.firstChild.appendChild(f);later(()=>f.remove(),1000);return}
    if(t==='games')return gamesSheet();
    go(t);
  }
  function questGo(){({0:()=>{},1:()=>openB(HQ),2:()=>go('deal'),4:gamesSheet,5:()=>go('shop')}[G.q]||(()=>{}))()}
  function gamesSheet(){questDone(4);saveG();go('minigame')}
  draw(()=>{
    if(G.welcome){G.welcome=false;saveG();
      const m=document.createElement('div');m.className='modal center';
      m.innerHTML='<div class="sheet dark-sheet pop" style="text-align:center"><p class="label">FOUNDED</p><p class="disp" style="font-size:1.7em">'+CO[G.company].ic+' 起業！</p><div style="width:34%;margin:0 auto">'+beast(B[G.company])+'</div><p class="small">'+CO[G.company].n+'</p><div class="mgrid" style="grid-template-columns:1fr 1fr"><div><span>🪙</span><b>'+G.coins+'</b><i>資本金</i></div><div><span>📈</span><b>'+totalInc()+'/秒</b><i>収入</i></div></div><button class="btn" data-close>経営スタート</button></div>';
      $stage.firstChild.appendChild(m);m.addEventListener('click',e=>{if(e.target.closest('[data-close]'))m.remove()});
    }else if(away>20&&!G.pending){
      const v=Math.floor(Object.keys(G.b).reduce((a,i)=>a+G.b[i].st,0));
      if(v>0){const f=document.createElement('div');f.className='rwd';f.innerHTML='<span>💤</span><b>留守中も稼いだ！</b><i>🪙 '+fmt(v)+' たまっています</i>';$stage.firstChild.appendChild(f);later(()=>f.remove(),1600)}
    }
  });
};

/* ---------- 成功メリット：街へ配置 ---------- */
S.merit=function(){
  loadG();
  if(!Object.values(G.b).some(b=>b.k==='machi')&&!G.pending){G.pending='machi';if(G.q<3){G.q=3;G.qn=0}}
  saveG();go('town');
};
