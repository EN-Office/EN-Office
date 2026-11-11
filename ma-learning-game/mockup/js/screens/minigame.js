'use strict';
/* ---------- 2. ミニゲーム ---------- */
S.minigame=function(){
  const ROOMS=[['🏭','工場'],['📒','経理'],['📜','契約書'],['👥','人事'],['🚪','社長室'],['🏦','銀行'],['📦','倉庫'],['🧾','税務'],['🗂','顧客台帳']];
  const PUZ=[
    {risks:{1:'簿外債務',6:'在庫の水増し',8:'売掛金の焦げつき'},open:[4],
     clues:['棚卸しの数が、帳簿よりはっきり多い。','社長室の隣のどこかに、帳簿にない借入の書類があるらしい。','大口の取引先からの入金が、半年止まっている。']},
    {risks:{2:'訴訟リスク',3:'キーマン依存',5:'保証債務'},open:[0],
     clues:['最近、取引先から内容証明郵便が届いた。','技術の要の工場長が、転職を考えているという噂。','社長が知人の会社の借金を保証しているらしい。']},
    {risks:{0:'設備の老朽化',5:'簿外債務',7:'追徴課税'},open:[4],
     clues:['3年前の税務調査の指摘が、まだ片づいていない。','工場の主力機械は、30年前のもの。','金融機関に、決算書に載っていない借入がある。']}
  ];
  const NB=i=>{const r=Math.floor(i/3),c=i%3,o=[];if(r>0)o.push(i-3);if(r<2)o.push(i+3);if(c>0)o.push(i-1);if(c<2)o.push(i+1);return o};
  let st;
  function intro(){
    const el=mount(topbar('ミニゲーム','','town')+
      '<div class="body" style="justify-content:center;text-align:center;gap:.9em">'+
      '<div style="width:40%;margin:0 auto;animation:bob 3s infinite">'+beast(B.misemori)+'</div>'+
      '<div><p class="label">BRAIN GAME</p><h2 class="disp" style="font-size:2em;line-height:1.2">DDスキャン</h2></div>'+
      '<div class="card small" style="text-align:left;display:flex;flex-direction:column;gap:.4em">'+
      '<p>会社の9つの部屋のどこかに、<b style="color:var(--ember)">3つのリスク</b>が隠れている。</p>'+
      '<p>🔍 <b>調べる</b>：部屋を調査（回数に限りあり）。問題がなければ、<b style="color:var(--ember)">上下左右の部屋にあるリスクの数</b>がわかる。</p>'+
      '<p>🚩 <b>指摘する</b>：リスクがあると考えた部屋に印をつける。</p>'+
      '<p>手がかり（資料）と数字から推理して、3つ指摘したら報告！</p></div>'+
      '</div><div class="foot"><button class="btn" id="start">調査開始</button></div>','dark');
    bind(el);el.querySelector('#start').addEventListener('click',()=>play(Math.floor(Math.random()*PUZ.length)));
  }
  function play(pi){
    st={p:PUZ[pi],pi,left:4,bonus:0,mode:'scan',open:{},flag:{},done:false};
    st.p.open.forEach(i=>st.open[i]=1);
    draw();
  }
  function cellHTML(i){
    const P=st.p,r=P.risks[i];
    if(st.done){
      if(r)return '<button class="tile '+(st.flag[i]||st.open[i]?'risk':'missed')+'" disabled><span class="ico">'+(st.flag[i]||st.open[i]?'⚠':'?')+'</span><span class="res">'+r+(st.flag[i]||st.open[i]?'':'<br>見逃し')+'</span></button>';
      if(st.flag[i])return '<button class="tile safe" disabled style="outline:.15em dashed var(--ember);outline-offset:-.3em"><span class="ico">✕</span><span class="res">誤指摘</span></button>';
    }
    if(st.open[i]){
      if(r)return '<button class="tile risk" disabled><span class="ico">⚠</span><span class="res">'+r+'</span></button>';
      const n=NB(i).filter(j=>P.risks[j]).length;
      return '<button class="tile safe" disabled><span class="ico" style="font-family:var(--font-display);color:'+(n?'var(--ember)':'var(--leaf)')+'">'+n+'</span><span class="res">'+ROOMS[i][1]+'<br>問題なし</span></button>';
    }
    return '<button class="tile'+(st.flag[i]?' flagged':'')+'" data-i="'+i+'"><span class="ico">'+(st.flag[i]?'🚩':ROOMS[i][0])+'</span>'+ROOMS[i][1]+'</button>';
  }
  function found(){return Object.keys(st.p.risks).filter(i=>st.open[i]||st.flag[i]).length}
  function marks(){return Object.keys(st.flag).length+Object.keys(st.p.risks).filter(i=>st.open[i]).length}
  function draw(){
    const el=mount(topbar('DDスキャン','<span class="chip">ケース '+(st.pi+1)+'</span>','town')+
      '<div class="body">'+
      '<div class="pcard" style="padding:.7em .8em"><p class="label" style="color:#5b6b64">📁 手がかり（事前資料）</p>'+st.p.clues.map(c=>'<p class="small" style="line-height:1.5">・'+c+'</p>').join('')+'</div>'+
      '<div class="tabs" style="margin:0"><button class="'+(st.mode==='scan'?'on':'')+'" data-m="scan">🔍 調べる（残り'+st.left+'）</button><button class="'+(st.mode==='flag'?'on':'')+'" data-m="flag">🚩 指摘する（'+marks()+'/3）</button></div>'+
      '<div class="grid" id="grid">'+ROOMS.map((r,i)=>cellHTML(i)).join('')+'</div>'+
      '<p class="xs muted" style="text-align:center">数字＝上下左右の部屋にあるリスクの数</p>'+
      '</div><div class="foot"><button class="btn" id="rep" '+(marks()===3?'':'disabled')+'>報告する</button></div>','dark');
    bind(el);
    el.querySelectorAll('[data-m]').forEach(b=>b.addEventListener('click',()=>{st.mode=b.dataset.m;draw()}));
    el.querySelectorAll('.tile[data-i]').forEach(t=>t.addEventListener('click',()=>act(+t.dataset.i)));
    el.querySelector('#rep').addEventListener('click',report);
  }
  function act(i){
    if(st.mode==='scan'){
      if(st.left<=0){toast('調べる回数がありません','');return}
      if(st.flag[i])delete st.flag[i];
      st.left--;st.open[i]=1;draw();
      toast(st.p.risks[i]?'リスク発見！':'問題なし',st.p.risks[i]?'':'g');
      if(st.left===0&&!st.done&&marks()<3)later(()=>{st.mode='flag';draw()},700);
    }else{
      if(st.flag[i])delete st.flag[i];else if(marks()<3)st.flag[i]=1;else{toast('指摘は3つまで','');return}
      draw();
    }
  }
  function toast(msg,cls){const d=document.createElement('div');d.className='toast '+cls;d.textContent=msg;$stage.firstChild.appendChild(d);later(()=>d.remove(),900)}
  function report(){st.done=true;draw();$stage.querySelector('.foot').innerHTML='';later(result,1600)}
  function result(){
    const f=found(),wrong=Object.keys(st.flag).filter(i=>!st.p.risks[i]).length,scans=4+st.bonus-st.left;
    const r=f===3&&scans<=3?'S':f===3?'A':f===2?'B':'C';
    const cut=[0.8,0.6,0.5].slice(0,f).reduce((a,b)=>a+b,0);
    const msg={S:'少ない調査で全てのリスクを特定！ 推理が冴えています。',A:'全てのリスクを特定できました。次は調べる回数を減らせるかも。',B:'見逃したリスクは買収後に自社が背負います。契約の表明保証で備えましょう。',C:'手がかりと数字を組み合わせて、仮説を立ててから調べてみましょう。'}[r];
    const gain={S:300,A:200,B:120,C:60}[r];loadG();G.coins+=gain;saveG();
    const el=mount(topbar('結果','','town')+
      '<div class="body" style="justify-content:center;gap:1em"><p class="label" style="text-align:center">あなたの目利きランク</p><div class="rank">'+r+'</div>'+
      '<div class="hud"><div class="card"><p class="label">特定リスク</p><p class="v">'+f+'/3</p></div><div class="card"><p class="label">調査回数</p><p class="v">'+scans+'</p></div><div class="card"><p class="label">価格削減</p><p class="v mono" style="color:var(--leaf)">'+cut.toFixed(1)+'億</p></div></div>'+
      (wrong?'<p class="xs" style="text-align:center;color:var(--rose)">誤指摘 '+wrong+'件：根拠のない指摘は、売り手の信頼を下げます</p>':'')+
      '<p class="small" style="text-align:center">'+msg+'</p>'+
      '<div class="merit"><span class="mi" style="background:#f0a14a">🪙</span><span class="grow"><span class="mt" style="display:block">報酬 ディールコイン</span></span><span class="mv">+'+gain+'</span></div>'+
      tip('本物のDDも同じ。資料から<b>仮説</b>を立て、限られた時間で<b>調べる場所を絞る</b>のがプロの仕事です。')+
      '<div class="terms" style="justify-content:center"><span>📘 デューデリジェンス</span><span>📘 簿外債務</span><span>📘 キーマン依存</span></div></div>'+
      '<div class="foot"><button class="btn" id="again">別のケースに挑戦</button><button class="btn ghost" data-go="town">🏙 街へ戻る</button></div>','dark');
    bind(el);el.querySelector('#again').addEventListener('click',()=>play((st.pi+1)%PUZ.length));
  }
  intro();
};
