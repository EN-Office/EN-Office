'use strict';
/* ---------- 2. ミニゲーム「DDスキャン」 ----------
   3×3の部屋に隠れたリスク3つを、手がかり（資料）と数字から推理して指摘する。
   調べる：回数に限りあり。問題のない部屋は「上下左右の部屋にあるリスクの数」を表示（マインスイーパー式）。 */
S.minigame=function(){
  const ROOMS=[['🏭','工場'],['📒','経理'],['📜','契約書'],['👥','人事'],['🚪','社長室'],['🏦','銀行'],['📦','倉庫'],['🧾','税務'],['🗂','顧客台帳']];
  const PUZ=[
    {risks:{1:'簿外債務',6:'在庫の水増し',8:'売掛金の焦げつき'},open:[4],
     clues:['帳簿の在庫が、実物より多い','社長室の隣に、帳簿にない借入の噂','大口先の入金が、半年止まっている']},
    {risks:{2:'訴訟リスク',3:'キーマン依存',5:'保証債務'},open:[0],
     clues:['取引先から内容証明郵便が届いた','技術の要・工場長に転職の噂','社長が知人の借金を保証している']},
    {risks:{0:'設備の老朽化',5:'簿外債務',7:'追徴課税'},open:[4],
     clues:['3年前の税務調査の指摘が未解決','工場の主力機械は、30年前のもの','銀行に、決算書にない借入がある']}
  ];
  const SCANS=4;
  const NB=i=>{const r=Math.floor(i/3),c=i%3,o=[];if(r>0)o.push(i-3);if(r<2)o.push(i+3);if(c>0)o.push(i-1);if(c<2)o.push(i+1);return o};
  let st;

  /* この画面だけの見た目（:root のトークンのみ使用） */
  if(!document.getElementById('mg-style')){
    const s=document.createElement('style');s.id='mg-style';
    s.textContent=
      '.mg .hero{width:52%;margin:0 auto;animation:bob 3s infinite}'+
      '.mg .hero>[data-beast3d]{width:100%;aspect-ratio:1/1}'+
      '.mg .lead{font-size:var(--fs-s);color:var(--mist);text-align:center}'+
      '.mg .lead b{color:var(--ember)}'+
      '.mg .clues{padding:.6em .8em;display:flex;flex-direction:column;gap:.3em}'+
      '.mg .clues p{display:flex;gap:.45em;align-items:baseline;font-size:var(--fs-s);line-height:1.4;font-weight:700}'+
      '.mg .clues i{font-style:normal;flex:none;font-size:.9em}'+
      '.mg .tabs{margin:0}'+
      '.mg .tabs button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.1em;line-height:1.2;padding:.45em .4em}'+
      '.mg .pips{display:flex;gap:.22em;font-size:.82em;letter-spacing:0;line-height:1}'+
      '.mg .pips .off{opacity:.3}'+
      '.mg .grid{gap:.6em}'+
      '.mg .tile{font-size:.9em;--edge:.38em;aspect-ratio:6/5}'+
      '.mg .tile .ico{font-size:1.9em}'+
      '.mg .tile .nm{font-size:.82em;line-height:1.2}'+
      '.mg .tile.safe,.mg .tile.risk,.mg .tile.missed{animation:none}'+
      '.mg .tile.new{animation:pop .35s both}'+
      '.mg .tile.risk.new{animation:pop .35s both,shake .35s .35s}'+
      '.mg .tile .n{font-family:var(--font-display);font-size:2.6em;line-height:1;color:var(--ember)}'+
      '.mg .tile .n.z{color:var(--leaf)}'+
      '.mg .tile.safe .nm{color:var(--mist)}'+
      '.mg .tile.risk .res{font-weight:900;font-size:.82em}'+
      '.mg .tile.flagged .ico{animation:pop .25s both}'+
      '.mg .tile.wrongf{outline:.15em dashed var(--ember);outline-offset:-.35em}'+
      '.mg .tile.wrongf .ico{color:var(--ember)}'+
      '.mg .legend-row{display:flex;align-items:center;justify-content:center;gap:.4em;font-size:var(--fs-xs);color:var(--mist)}'+
      '.mg .legend-row svg{width:1.9em;height:1.9em}'+
      '.mg .judging{text-align:center;font-weight:900;color:var(--ember);min-height:var(--tap-min);display:grid;place-items:center;animation:glow 1s infinite}'+
      '.mg .rank{font-size:6em;margin-top:.1em}'+
      '.mg .verdict{text-align:center;font-weight:900;font-size:.95em}'+
      '.mg .hud .label{letter-spacing:.06em}'+
      '.mg .hud .v small{font-size:.55em;margin-left:.1em;color:var(--mist)}'+
      '.mg .wrong{text-align:center;font-size:var(--fs-xs);color:var(--rose)}'+
      '.mg .merit .mv{font-size:1.5em;color:var(--ember)}'+
      '.mg .foot .row .btn{flex:1}';
    document.head.appendChild(s);
  }

  /* ---------- 導入 ---------- */
  function intro(){
    const el=mount(topbar('ミニゲーム','','town')+
      '<div class="body mg" style="justify-content:center;gap:1.1em">'+
      '<div class="hero"><div data-beast3d="misemori" data-mood="smile">'+beast(B.misemori)+'</div></div>'+
      '<div style="text-align:center"><p class="label">BRAIN GAME</p><h2 class="disp" style="font-size:2.1em;line-height:1.2">DDスキャン</h2></div>'+
      '<p class="lead">9つの部屋に隠れた<b>リスク3つ</b>を見抜け</p>'+
      '<div class="steps3"><div><i>🔍</i><b>調べる</b></div><div><i>🔢</i><b>数字で推理</b></div><div><i>🚩</i><b>3つ指摘</b></div></div>'+
      '</div><div class="foot"><button class="btn" id="start" data-sfx="start">🔍 調査開始</button></div>','dark');
    el.classList.add('mg');
    bind(el);el.querySelector('#start').addEventListener('click',()=>play(Math.floor(Math.random()*PUZ.length)));
  }
  function play(pi){
    st={p:PUZ[pi],pi,left:SCANS,bonus:0,mode:'scan',open:{},flag:{},done:false,rev:{}};
    st.p.open.forEach(i=>st.open[i]=1);
    draw();
  }

  /* ---------- 盤面 ---------- */
  function cellHTML(i,isNew){
    const P=st.p,r=P.risks[i],id=' id="mt'+i+'"',nw=isNew?' new':'';
    if(st.done&&st.rev[i]){
      if(r){const hit=st.flag[i]||st.open[i];
        return '<button class="tile '+(hit?'risk':'missed')+nw+'" disabled'+id+'><span class="ico">'+(hit?'🎯':'？')+'</span><span class="res">'+r+(hit?'':'<br>見逃し')+'</span></button>';}
      if(st.flag[i])return '<button class="tile safe wrongf'+nw+'" disabled'+id+'><span class="ico">✕</span><span class="res">誤指摘</span></button>';
    }
    if(st.open[i]){
      if(r)return '<button class="tile risk'+nw+'" disabled'+id+'><span class="ico">⚠</span><span class="res">'+r+'</span></button>';
      const n=NB(i).filter(j=>P.risks[j]).length;
      return '<button class="tile safe'+nw+'" disabled'+id+' aria-label="'+ROOMS[i][1]+' 問題なし。隣のリスク'+n+'"><span class="n'+(n?'':' z')+'">'+n+'</span><span class="nm">'+ROOMS[i][1]+'</span></button>';
    }
    const fl=st.flag[i];
    return '<button class="tile'+(fl?' flagged':'')+'"'+id+(st.done?' disabled':' data-i="'+i+'"')+' data-sfx="none"><span class="ico">'+(fl?'🚩':ROOMS[i][0])+'</span><span class="nm">'+ROOMS[i][1]+'</span></button>';
  }
  function found(){return Object.keys(st.p.risks).filter(i=>st.open[i]||st.flag[i]).length}
  function marks(){return Object.keys(st.flag).length+Object.keys(st.p.risks).filter(i=>st.open[i]).length}
  function pips(on,total,ch){let s='';for(let k=0;k<total;k++)s+='<span'+(k<on?'':' class="off"')+'>'+ch+'</span>';return '<span class="pips" aria-hidden="true">'+s+'</span>'}
  const LEGEND='<svg viewBox="0 0 30 30" aria-hidden="true">'+
    '<rect x="10" y="0" width="10" height="9" rx="2" style="fill:var(--rose)" opacity=".75"/>'+
    '<rect x="0" y="10.5" width="9" height="9" rx="2" style="fill:var(--flat-bg);stroke:var(--mist)" stroke-width=".8"/>'+
    '<rect x="21" y="10.5" width="9" height="9" rx="2" style="fill:var(--rose)" opacity=".75"/>'+
    '<rect x="10" y="21" width="10" height="9" rx="2" style="fill:var(--flat-bg);stroke:var(--mist)" stroke-width=".8"/>'+
    '<text x="15" y="18.6" text-anchor="middle" font-size="9" font-weight="900" style="fill:var(--ember)">2</text></svg>';
  function draw(newIdx){
    const m=marks(),scan=st.mode==='scan';
    const el=mount(topbar('DDスキャン','<span class="chip">ケース '+(st.pi+1)+'</span>','town')+
      '<div class="body">'+
      '<div class="panel clues"><p class="label">手がかり</p>'+st.p.clues.map(c=>'<p><i>📁</i><span>'+c+'</span></p>').join('')+'</div>'+
      '<div class="tabs" role="group" aria-label="モード">'+
        '<button class="'+(scan?'on':'')+'" data-m="scan" data-sfx="select" aria-pressed="'+scan+'" aria-label="調べる 残り'+st.left+'回"'+(st.done?' disabled':'')+'><span>🔍 調べる</span>'+pips(st.left,SCANS+st.bonus,'●')+'</button>'+
        '<button class="'+(scan?'':'on')+'" data-m="flag" data-sfx="select" aria-pressed="'+!scan+'" aria-label="指摘する '+m+'/3"'+(st.done?' disabled':'')+'><span>🚩 指摘する</span>'+pips(m,3,'⚑')+'</button>'+
      '</div>'+
      '<div class="grid" id="grid">'+ROOMS.map((r,i)=>cellHTML(i,i===newIdx)).join('')+'</div>'+
      '<p class="legend-row">'+LEGEND+'<span>数字＝上下左右のリスク数</span></p>'+
      '</div><div class="foot">'+(st.done?'<p class="judging">🔎 判定中…</p>':'<button class="btn" id="rep" data-sfx="none" '+(m===3?'':'disabled')+'>📣 報告する</button>')+'</div>','dark');
    el.classList.add('mg');
    bind(el);
    if(st.done)return;
    el.querySelectorAll('[data-m]').forEach(b=>b.addEventListener('click',()=>{if(st.mode!==b.dataset.m){st.mode=b.dataset.m;draw()}}));
    el.querySelectorAll('.tile[data-i]').forEach(t=>t.addEventListener('click',()=>act(+t.dataset.i)));
    el.querySelector('#rep').addEventListener('click',report);
  }
  function act(i){
    if(st.done)return;
    if(st.mode==='scan'){
      if(st.left<=0){SFX.play('ng');toast('調べる回数がありません','');return}
      if(st.flag[i])delete st.flag[i];
      st.left--;st.open[i]=1;
      const hit=!!st.p.risks[i];
      SFX.play(hit?'ok':'select');
      draw(i);
      if(hit)toast('🎯 リスク発見！','g');
      if(st.left===0&&marks()<3)later(()=>{st.mode='flag';draw()},800);
    }else{
      if(st.flag[i])delete st.flag[i];
      else if(marks()<3)st.flag[i]=1;
      else{SFX.play('ng');toast('指摘は3つまで','');return}
      SFX.play('select');
      draw();
    }
  }
  function toast(msg,cls){const d=document.createElement('div');d.className='toast '+cls;d.textContent=msg;$stage.firstChild.appendChild(d);later(()=>d.remove(),900)}

  /* 報告：リスクの部屋を1つずつ明かしてから結果へ */
  function report(){
    st.done=true;st.rev={};draw();
    const seq=Object.keys(st.p.risks).map(Number).concat(Object.keys(st.flag).map(Number).filter(i=>!st.p.risks[i])).sort((a,b)=>a-b);
    const T0=350,GAP=280;
    seq.forEach((i,k)=>later(()=>{
      st.rev[i]=1;const t=$stage.querySelector('#mt'+i);
      if(t)t.outerHTML=cellHTML(i,true);
      SFX.play('step');
    },T0+k*GAP));
    later(result,T0+seq.length*GAP+900);
  }

  /* ---------- 結果 ---------- */
  function result(){
    const f=found(),wrong=Object.keys(st.flag).filter(i=>!st.p.risks[i]).length,scans=SCANS+st.bonus-st.left;
    const r=f===3&&scans<=3?'S':f===3?'A':f===2?'B':'C';
    const cut=[0.8,0.6,0.5].slice(0,f).reduce((a,b)=>a+b,0);
    const verdict={S:'少ない調査で全リスクを特定！',A:'全リスク特定！次は調査を減らそう',B:'見逃しは自社の負担に。表明保証で備えよう',C:'見逃しが多め。手がかりを読み直そう'}[r];
    const gain={S:300,A:200,B:120,C:60}[r];loadG();G.coins+=gain;saveG();
    const el=mount(topbar('結果','','town')+
      '<div class="body" style="justify-content:center;gap:.9em">'+
      '<div><p class="label" style="text-align:center">目利きランク</p><div class="rank">'+r+'</div></div>'+
      '<p class="verdict fade" style="animation-delay:.25s">'+verdict+'</p>'+
      '<div class="hud fade" style="animation-delay:.4s">'+
        '<div class="card"><p class="label">特定</p><p class="v">'+f+'<small>/3</small></p></div>'+
        '<div class="card"><p class="label">調査</p><p class="v">'+scans+'<small>回</small></p></div>'+
        '<div class="card"><p class="label">価格</p><p class="v" style="color:var(--leaf)">−'+cut.toFixed(1)+'<small>億</small></p></div>'+
      '</div>'+
      (wrong?'<p class="wrong">✕ 誤指摘 '+wrong+'件：根拠のない指摘は信頼を下げる</p>':'')+
      '<div class="merit" style="animation-delay:.55s"><span class="mi" style="background:var(--ember)">🪙</span><span class="grow"><span class="mt" style="display:block">ディールコイン</span></span><span class="mv" id="gain">+0</span></div>'+
      '<div class="fade" style="animation-delay:.7s">'+tip('本物のDDも、仮説を立てて<b>調べる所を絞る</b>よ')+'</div>'+
      '</div>'+
      '<div class="foot"><div class="row"><button class="btn sub" id="again" data-sfx="start">🔁 別のケース</button><button class="btn" data-go="town">🏙 街へ戻る</button></div></div>','dark');
    el.classList.add('mg');
    bind(el);el.querySelector('#again').addEventListener('click',()=>play((st.pi+1)%PUZ.length));
    SFX.play(r==='S'||r==='A'?'win':'ok');
    const g=el.querySelector('#gain');
    later(()=>{
      SFX.play('coin');
      const t0=Date.now(),D=600;
      const iv=every(()=>{const p=Math.min(1,(Date.now()-t0)/D);g.textContent='+'+Math.round(gain*(1-Math.pow(1-p,3)));if(p>=1)clearInterval(iv)},30);
    },750);
  }
  intro();
};
