'use strict';
/* ---------- 3. 買収フロー ---------- */
S.deal=function(){
  const NAMES=['探索','鑑定','交渉','DD','契約','統合','振り返り'];
  const EN=['Sourcing','Valuation','Negotiation','Due Diligence','SPA','PMI','Debrief'];
  const D={step:0,fitFirst:null,tries:0,revalued:false,offer:7,agreed:null,price:null,dd:[],cover:{},pmi:[]};
  const FINDS={
    fin:{a:'財務',d:'決算書・資産・負債',r:'未払い残業代 0.4億円が見つかった',fix:'価格調整',risk:true},
    law:{a:'法務',d:'契約書・訴訟・許認可',r:'主要取引先との契約に「経営者が変わったら解約できる」条項',fix:'クロージング条件',risk:true},
    hr:{a:'人事',d:'人材・労務・組織',r:'技術の要である工場長が退職を考えている',fix:'キーマン条項',risk:true},
    tax:{a:'税務',d:'税金の申告・リスク',r:'大きな問題は見つからなかった',fix:null,risk:false}};
  const CLAUSES=['価格調整','クロージング条件','キーマン条項'];
  function frame(inner,foot){
    const prog=NAMES.map((n,i)=>'<span class="'+(i<D.step?'done':i===D.step?'on':'')+'"></span>').join('');
    const el=mount(topbar('🤝 M&A','<span class="chip">'+(D.step+1)+' / 7</span>','town')+'<div class="steps">'+prog+'</div>'+
      '<div class="stepname"><span class="disp">'+NAMES[D.step]+'</span><span class="mono xs muted">'+EN[D.step]+'</span></div>'+
      '<div class="body fade">'+inner+'</div><div class="foot">'+foot+'</div>','dark');
    bind(el);return el;
  }
  function next(){D.step++;render()}
  function render(){[s0,s1,s2,s3,s4,s5,s6][D.step]()}

  function s0(){
    const c=[['machi','マチコウバ','製造 · 精密加工の技術 · 後継者不在'],['hayate','ハヤテ便','物流 · 全国の配送網'],['misemori','ミセモリ','小売 · 駅前の店舗網']];
    const el=frame(
      '<div class="pcard"><p class="label" style="color:#5b6b64">あなたの戦略</p><p style="font-weight:900">自社製品の品質を上げる<b style="color:var(--ember-deep)">「技術力」</b>がほしい</p></div>'+
      tip('戦略に合う企業獣を選ぶのが、M&Aの第一歩。<b>何のために買うか</b>を忘れずに。')+
      c.map(x=>'<button class="cand" data-k="'+x[0]+'"><span class="ic">'+beast(B[x[0]])+'</span><span class="grow"><b style="display:block">'+x[1]+'</b><span class="xs muted">'+x[2]+'</span></span></button>').join('')+
      '<div id="fb"></div>','<button class="btn" id="nx" disabled>この企業獣に決める</button>');
    el.querySelectorAll('.cand').forEach(b=>b.addEventListener('click',()=>{
      D.tries++;
      el.querySelectorAll('.cand').forEach(x=>x.classList.remove('on','ng'));
      if(b.dataset.k==='machi'){b.classList.add('on');if(D.fitFirst===null)D.fitFirst=true;
        el.querySelector('#fb').innerHTML='<div class="find ok">✓ 精密加工の技術は、あなたの戦略にぴったり。しかも社長は後継者を探しています。</div>';el.querySelector('#nx').disabled=false}
      else{b.classList.add('ng');D.fitFirst=false;el.querySelector('#fb').innerHTML='<div class="find">✕ 良い会社ですが、ほしいのは「技術力」。戦略に合わないと<b>シナジー</b>が生まれません。</div>';el.querySelector('#nx').disabled=true}
    }));
    el.querySelector('#nx').addEventListener('click',next);
  }
  function s1(){
    const el=frame(
      tip('まずは<b>純資産法</b>。会社の持ち物から借金を引いた「正味の価値」を見ます。')+
      '<div class="bs"><div class="as"><p class="k">資産</p><p class="v">12.0億</p><p class="xs" style="color:#5b6b64">工場・土地・在庫・現金</p><p class="xs" id="adj" style="color:var(--leaf);font-weight:900"></p></div><div class="li"><p class="k">負債</p><p class="v">7.0億</p></div><div class="eq"><p class="k">純資産</p><p class="v" id="eq">5.0億</p></div></div>'+
      '<button class="btn ghost" id="rv">🔍 土地を「いまの値段（時価）」で見直す</button>'+
      '<div id="offer" hidden><div class="card"><div class="row sp"><p class="label">あなたの提示価格</p><p class="big mono" id="ov">7.0億</p></div>'+
      '<input type="range" id="sl" min="4" max="10" step="0.5" value="7" aria-label="提示価格">'+
      '<div class="band"><div class="zone" style="left:33.3%;width:33.3%"></div><div class="pin" id="pin" style="left:50%"></div><div class="ticks"><span>4億</span><span>6億</span><span>8億</span><span>10億</span></div></div>'+
      '<p class="xs muted" style="margin-top:2em">緑の帯＝適正レンジ（時価純資産 6億 ＋ 将来の稼ぐ力）</p></div></div>',
      '<button class="btn" id="nx" disabled>この価格で交渉へ</button>');
    el.querySelector('#rv').addEventListener('click',e=>{
      D.revalued=true;e.target.remove();el.querySelector('#adj').textContent='土地の含み益 +1.0億';el.querySelector('#eq').textContent='6.0億';
      el.querySelector('#offer').hidden=false;el.querySelector('#nx').disabled=false;
      el.querySelector('.tip .bubble').innerHTML='時価で見直すと<b>6.0億</b>。ここに将来の稼ぐ力を上乗せした<b>6〜8億</b>が目安です。';
    });
    const sl=el.querySelector('#sl');
    sl.addEventListener('input',()=>{D.offer=+sl.value;el.querySelector('#ov').textContent=D.offer.toFixed(1)+'億';el.querySelector('#pin').style.left=((D.offer-4)/6*100)+'%'});
    el.querySelector('#nx').addEventListener('click',next);
  }
  function s2(){
    const el=frame(
      '<div class="row" style="align-items:flex-end"><div style="width:30%">'+beast(B.oyaji)+'</div><div class="bubble grow">わしが40年育てた会社だ。<b>'+D.offer.toFixed(1)+'億</b>か…。<br>金額も大事だが、一番気になっていることがある。</div></div>'+
      '<div class="talk" id="talk"></div>'+
      '<div id="opts" style="display:flex;flex-direction:column;gap:.45em">'+
      '<button class="opt" data-o="a">💰「価格を1億円上乗せします」</button>'+
      '<button class="opt" data-o="b">🤝「従業員30名の雇用は必ず守ります」</button>'+
      '<button class="opt" data-o="c">⏱「今週中に決めてください」</button></div>',
      '<button class="btn" id="nx" hidden>基本合意へ進む</button>');
    el.querySelectorAll('.opt').forEach(b=>b.addEventListener('click',()=>{
      const o=b.dataset.o;el.querySelector('#opts').remove();
      let me,re,mood;
      if(o==='b'){me='従業員30名の雇用は必ず守ります';re='…それが聞きたかった。あんたになら任せられる。';D.agreed='good';D.price=Math.max(D.offer,6.0)}
      else if(o==='a'){me='価格を1億円上乗せします';re='ありがたいが…みんなの雇用はどうなる？ まあ、その金額なら考えよう。';D.agreed='costly';D.price=D.offer+1}
      else{me='今週中に決めてください';re='急かすのか。せめて'+Math.max(D.offer,7.5).toFixed(1)+'億は出してもらわんと。';D.agreed='hard';D.price=Math.max(D.offer,7.5)}
      el.querySelector('#talk').innerHTML='<div class="me">'+me+'</div><div class="bubble" style="animation:fade .4s .3s both">'+re+'</div>'+
        '<div class="find '+(D.agreed==='good'?'ok':'')+'" style="animation-delay:.6s">'+(D.agreed==='good'?'✓ 売り手の<b>本当の動機</b>を読み当てた！':'△ 売り手の本当の関心は「従業員の雇用」でした')+'　合意価格 <b class="mono">'+D.price.toFixed(1)+'億</b></div>'+
        tip('条件がまとまったら<b>基本合意書（MOU）</b>を結び、詳しい調査に進みます。');
      el.querySelector('#nx').hidden=false;
    }));
    el.querySelector('#nx').addEventListener('click',next);
  }
  function s3(){
    const el=frame(
      tip('調査チームは<b>3つ</b>まで。どこを調べますか？ 調べなかった場所のリスクは見えません。')+
      '<div class="dd">'+Object.keys(FINDS).map(k=>'<button data-k="'+k+'"><span class="an">'+FINDS[k].a+'DD</span><span class="ad">'+FINDS[k].d+'</span></button>').join('')+'</div>'+
      '<p class="xs muted" id="cnt">選択 0 / 3</p><div id="res" style="display:flex;flex-direction:column;gap:.4em"></div>',
      '<button class="btn" id="go" disabled>調査を実行</button>');
    const sel=new Set();
    el.querySelectorAll('.dd button').forEach(b=>b.addEventListener('click',()=>{
      const k=b.dataset.k;if(sel.has(k))sel.delete(k);else if(sel.size<3)sel.add(k);
      el.querySelectorAll('.dd button').forEach(x=>x.classList.toggle('on',sel.has(x.dataset.k)));
      el.querySelector('#cnt').textContent='選択 '+sel.size+' / 3';el.querySelector('#go').disabled=sel.size!==3;
    }));
    el.querySelector('#go').addEventListener('click',function h(){
      if(this.dataset.done){next();return}
      D.dd=[...sel];this.dataset.done=1;this.textContent='契約へ進む';
      el.querySelectorAll('.dd button').forEach(x=>x.disabled=true);
      el.querySelector('#res').innerHTML=Object.keys(FINDS).map((k,j)=>{const f=FINDS[k];
        if(!sel.has(k))return '<div class="find unk" style="animation-delay:'+(j*.15)+'s">？ '+f.a+'：未調査</div>';
        return '<div class="find '+(f.risk?'':'ok')+'" style="animation-delay:'+(j*.15)+'s">'+(f.risk?'⚠':'✓')+' <span><b>'+f.a+'</b>　'+f.r+'</span></div>'}).join('');
    });
  }
  function s4(){
    const found=D.dd.filter(k=>FINDS[k].risk);
    const missed=Object.keys(FINDS).filter(k=>FINDS[k].risk&&!D.dd.includes(k));
    const el=frame(
      tip('見つけたリスクに<b>条項カード</b>をはめて、契約（株式譲渡契約・SPA）で備えます。')+
      found.map(k=>'<div class="card"><p class="small"><b style="color:var(--rose)">⚠ '+FINDS[k].a+'</b>　'+FINDS[k].r+'</p><div class="clause" data-k="'+k+'">'+CLAUSES.map(c=>'<button data-c="'+c+'">'+c+'</button>').join('')+'</div></div>').join('')+
      missed.map(k=>'<div class="find unk">？ '+FINDS[k].a+'の領域は未調査。リスクがあっても契約で手当てできません</div>').join('')+
      '<div class="card row sp"><span class="small">＋ 表明保証・補償条項（標準）</span><span class="chip leaf">自動で付帯</span></div>'+
      '<div class="row sp card"><span class="label">最終価格</span><span class="big mono" id="fp">'+D.price.toFixed(1)+'億</span></div>',
      '<button class="btn" id="nx" '+(found.length?'disabled':'')+'>契約締結・クロージング</button>');
    el.querySelectorAll('.clause').forEach(g=>g.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
      const k=g.dataset.k,c=b.dataset.c;D.cover[k]=c;
      g.querySelectorAll('button').forEach(x=>x.className=x.dataset.c===c?(c===FINDS[k].fix?'on':'bad'):'');
      const p=D.price-(D.cover.fin==='価格調整'?0.4:0);el.querySelector('#fp').textContent=p.toFixed(1)+'億';
      el.querySelector('#nx').disabled=found.some(f=>!D.cover[f]);
    })));
    el.querySelector('#nx').addEventListener('click',()=>{D.final=D.price-(D.cover.fin==='価格調整'?0.4:0);next()});
  }
  function s5(){
    const A=[['walk','社長と一緒に現場を回る',20,0],['chief','工場長を技術責任者に任命',15,5],['sell','自社の販路で製品を売る',0,30],['sys','経理システムを統一する',-5,10],['pay','給与制度をすぐに統一',-20,5],['none','しばらく様子を見る',-10,0]];
    let base=D.agreed==='good'?55:40;
    const el=frame(
      '<div class="row"><div style="width:26%" id="face">'+beast(B.machi)+'</div><div class="grow" style="display:flex;flex-direction:column;gap:.4em">'+
      '<div><div class="row sp xs"><b>なつき度</b><span class="mono" id="nv">'+base+'</span></div><div class="meter"><i id="nm" style="width:'+base+'%"></i></div></div>'+
      '<div><div class="row sp xs"><b>シナジー</b><span class="mono" id="sv">0</span></div><div class="meter"><i id="sm" style="width:0%;background:var(--ember)"></i></div></div></div></div>'+
      tip('買ってからが本番。<b>100日プラン</b>で3つの施策を選びましょう。')+
      '<div class="pmi">'+A.map(a=>'<button data-a="'+a[0]+'"><span>'+a[1]+'</span><span class="fx">'+(a[2]?('♥'+(a[2]>0?'+':'')+a[2]):'')+(a[3]?(' ⚡+'+a[3]):'')+'</span></button>').join('')+'</div>',
      '<button class="btn" id="nx" disabled>100日プランを実行</button>');
    const sel=new Set();
    function upd(){
      let n=base,s=0;sel.forEach(k=>{const a=A.find(x=>x[0]===k);n+=a[2];s+=a[3]});
      if(D.dd.includes('hr')&&D.cover.hr==='キーマン条項')n+=5;
      n=Math.max(0,Math.min(100,n));D.n=n;D.s=s;
      el.querySelector('#nv').textContent=n;el.querySelector('#nm').style.width=n+'%';el.querySelector('#sv').textContent=s;el.querySelector('#sm').style.width=Math.min(100,s*2)+'%';
      el.querySelector('#face').innerHTML=beast(Object.assign({},B.machi,{mood:n>=60?'smile':n>=40?'o':'worry'}));
      el.querySelector('#nx').disabled=sel.size!==3;
    }
    el.querySelectorAll('.pmi button').forEach(b=>b.addEventListener('click',()=>{
      const k=b.dataset.a;if(sel.has(k))sel.delete(k);else if(sel.size<3)sel.add(k);
      el.querySelectorAll('.pmi button').forEach(x=>x.classList.toggle('on',sel.has(x.dataset.a)));D.pmi=[...sel];upd();
    }));
    upd();
    el.querySelector('#nx').addEventListener('click',next);
  }
  function s6(){
    const keyOk=(D.dd.includes('hr')&&D.cover.hr==='キーマン条項')||D.pmi.includes('chief');
    const lawOk=D.dd.includes('law')&&D.cover.law==='クロージング条件';
    const finOk=D.dd.includes('fin')&&D.cover.fin==='価格調整';
    const rows=[
      [D.fitFirst?'g':'w','探索',D.fitFirst?'戦略に合う企業を一発で選べた':'戦略との適合を見直して選び直した'],
      [D.offer>=6&&D.offer<=8?'g':'w','鑑定',D.offer>=6&&D.offer<=8?'適正レンジ内で提示できた':'提示価格が適正レンジの外だった'],
      [D.agreed==='good'?'g':'w','交渉',D.agreed==='good'?'売り手の本当の動機（雇用）を読み当てた':'動機を外し、価格が上がった'],
      [finOk?'g':'b','財務',finOk?'未払い残業代を価格に反映できた':'未払い残業代を自社が負担することに'],
      [lawOk?'g':'b','法務',lawOk?'取引先の同意をクロージング条件にして解約を防いだ':'主要取引先が離れ、売上が減少'],
      [keyOk?'g':'b','人事',keyOk?'工場長が残り、技術が引き継がれた':'工場長が退職し、技術の一部が失われた'],
      [D.n>=60?'g':D.n>=40?'w':'b','統合','なつき度 '+D.n+'・シナジー '+D.s]];
    const score=rows.reduce((a,r)=>a+(r[0]==='g'?2:r[0]==='w'?1:0),0);
    const grade=score>=13?'S':score>=10?'A':score>=7?'B':'C';
    try{sessionStorage.setItem('dt-grade',grade)}catch(e){}
    const el=frame(
      '<div class="row" style="justify-content:center;gap:1em"><div class="rank" style="font-size:3.6em">'+grade+'</div><div><p class="label">案件評価</p><p class="small">買収価格 <b class="mono">'+(D.final||D.price).toFixed(1)+'億</b></p></div></div>'+
      tip('判断と結果の<b>つながり</b>を振り返りましょう。失敗した場所こそ、次の学びです。')+
      '<div class="chain">'+rows.map(r=>'<div><span class="mk '+r[0]+'">'+(r[0]==='g'?'✓':r[0]==='w'?'△':'✕')+'</span><span><b>'+r[1]+'</b>　'+r[2]+'</span></div>').join('')+'</div>'+
      '<p class="label">獲得した用語カード</p><div class="terms"><span>📘 ソーシング</span><span>📘 純資産法</span><span>📘 時価</span><span>📘 基本合意書</span><span>📘 デューデリジェンス</span><span>📘 株式譲渡契約</span><span>📘 表明保証</span><span>📘 PMI</span></div>',
      '<button class="btn" id="home">🏙 街に迎える</button>');
    el.querySelector('#home').addEventListener('click',()=>{loadG();G.pending='machi';G.grade=grade;if(G.q<=2){G.q=3;G.qn=0;G.coins+=50}saveG();go('town')});
  }
  render();
};
