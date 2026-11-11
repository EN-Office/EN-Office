'use strict';
/* ---------- 3. 買収フロー（探索 → 鑑定 → 交渉 → DD → 契約 → 統合 → 振り返り） ----------
   ui-guidelines §3：押せる＝.btn/.tap（立体）、情報＝.panel/.chip/.find（平面）。
   ミナトの吹き出しは各ステップ1文。判断の理由は .find の1行で残す。 */
(function(){
  if(document.getElementById('dl-css'))return;
  const st=document.createElement('style');st.id='dl-css';
  st.textContent=[
    /* ステップのアイコン列（押せない） */
    '.dl-steps{position:relative;display:flex;align-items:center;justify-content:space-between;padding:.25em 1.1em .35em;flex:none}',
    '.dl-steps::before,.dl-steps b{content:"";position:absolute;left:2em;right:2em;top:50%;height:.2em;margin-top:-.05em;border-radius:99em;background:rgba(255,255,255,.12)}',
    '.dl-steps b{right:auto;background:var(--leaf);opacity:.7}',
    '.dl-steps i{position:relative;z-index:1;font-style:normal;width:1.9em;height:1.9em;border-radius:50%;display:grid;place-items:center;font-size:.82em;line-height:1;background:#1b322d;opacity:.55;filter:grayscale(.7)}',
    '.dl-steps i.done{background:#24533f;opacity:1;filter:none}',
    '.dl-steps i.on{width:2.5em;height:2.5em;font-size:1em;background:var(--ember);opacity:1;filter:none;box-shadow:0 0 0 .22em rgba(240,161,74,.28);animation:pop .35s both}',
    '.dl .stepname{align-items:baseline;padding:.1em 1.1em .15em}',
    '.dl .stepname .disp{font-size:1.75em;line-height:1.2}',
    '.dl .stepname .mono{letter-spacing:.06em}',
    /* 共通 */
    '.dl .tip .bubble{font-size:.92em;font-weight:700}',
    '.dl .tip .face{width:2.6em;height:2.6em}',
    '.dl-num{font-family:var(--font-display);font-size:2.4em;line-height:1.05;white-space:nowrap}',
    '.dl-num small{font-family:var(--font-body);font-size:.4em;font-weight:900;margin-left:.15em;color:var(--mist)}',
    '.dl-pips{display:flex;align-items:center;gap:.35em;font-size:.78em;font-weight:900;color:var(--mist)}',
    '.dl-pips i{width:.75em;height:.75em;border-radius:50%;background:rgba(255,255,255,.16);transition:background .2s}',
    '.dl-pips i.on{background:var(--ember);animation:pop .25s both}',
    '.dl .find{font-weight:700}',
    /* 探索 */
    '.dl-want{display:flex;align-items:center;gap:.7em;background:rgba(240,161,74,.14)}',
    '.dl-want .label{color:#ffd29a}',
    '.dl-want .disp{font-size:1.35em;line-height:1.2}',
    '.dl .cand b{display:block;font-size:1.02em;margin-bottom:.2em}',
    '.dl .cand .tags{gap:.35em}',
    /* 鑑定：貸借対照表の箱 */
    '.dl-bs{display:flex;gap:.35em;height:11.5em}',
    '.dl-bs .col{flex:1;display:flex;flex-direction:column;gap:.3em;min-width:0}',
    '.dl-bs .blk{min-height:0;border-radius:var(--r-m);padding:.45em .7em;display:flex;flex-direction:column;justify-content:center;transition:flex-grow .7s ease}',
    '.dl-bs .k{font-size:.72em;font-weight:900;letter-spacing:.06em;opacity:.85}',
    '.dl-bs .v{font-family:var(--font-display);font-size:1.55em;line-height:1.15;white-space:nowrap}',
    '.dl-bs .v small{font-family:var(--font-body);font-size:.45em;font-weight:900;margin-left:.1em}',
    '.dl-bs .as{background:rgba(95,193,146,.2);color:#c9f0dc}',
    '.dl-bs .gain{background:var(--leaf);color:#0b2117;padding:0;flex:0 1 0;background-image:repeating-linear-gradient(135deg,rgba(255,255,255,.25) 0 .3em,transparent .3em .6em)}',
    '.dl-bs .li{background:rgba(239,107,91,.2);color:#ffd0c8}',
    '.dl-bs .eq{background:rgba(240,161,74,.26);color:#ffe0b5}',
    '.dl-bs .eq .v.pop{animation:pop .45s both}',
    '.dl-adj{font-size:.7em;font-weight:900;color:#9fe3bf;margin-top:.2em}',
    '.dl-eqn{text-align:center;font-family:var(--font-data);font-size:.72em;color:var(--mist);letter-spacing:.04em}',
    '.dl .btn.sub{font-size:.95em}',
    /* 鑑定：価格スライダー */
    '.dl-sl{--th:2.5em;position:relative;padding-bottom:1.5em;margin-top:.3em}',
    '.dl-sl .trk{position:absolute;left:calc(var(--th)/2);right:calc(var(--th)/2);top:calc(var(--th)/2 - .5em);height:1em;border-radius:99em;background:rgba(255,255,255,.12);pointer-events:none}',
    '.dl-sl .zone{position:absolute;top:0;bottom:0;left:33.333%;width:33.333%;border-radius:99em;background:var(--leaf);opacity:.8}',
    '.dl-sl .ticks{position:absolute;left:calc(var(--th)/2);right:calc(var(--th)/2);bottom:0;height:1.3em;font:500 .66em/1 var(--font-data);color:var(--mist);pointer-events:none}',
    '.dl-sl .ticks span{position:absolute;top:.4em;transform:translateX(-50%);white-space:nowrap}',
    '.dl-sl input[type=range]{position:relative;z-index:1;display:block;width:100%;height:var(--th);min-height:0;margin:0;background:transparent;-webkit-appearance:none;appearance:none;cursor:pointer;touch-action:pan-y}',
    '.dl-sl input[type=range]::-webkit-slider-runnable-track{height:var(--th);background:transparent;border:0}',
    '.dl-sl input[type=range]::-moz-range-track{height:var(--th);background:transparent;border:0}',
    '.dl-sl input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:var(--th);height:var(--th);border-radius:50%;border:0;cursor:grab;'+
      'background:linear-gradient(90deg,transparent 38%,rgba(42,22,4,.4) 38% 44%,transparent 44% 56%,rgba(42,22,4,.4) 56% 62%,transparent 62%) center/56% 36% no-repeat,linear-gradient(180deg,#ffc477,var(--ember));'+
      'box-shadow:0 .24em 0 var(--ember-deep),0 0 0 .3em rgba(240,161,74,.22)}',
    '.dl-sl input[type=range]::-moz-range-thumb{width:var(--th);height:var(--th);border-radius:50%;border:0;cursor:grab;'+
      'background:linear-gradient(90deg,transparent 38%,rgba(42,22,4,.4) 38% 44%,transparent 44% 56%,rgba(42,22,4,.4) 56% 62%,transparent 62%) center/56% 36% no-repeat,linear-gradient(180deg,#ffc477,var(--ember));'+
      'box-shadow:0 .24em 0 var(--ember-deep),0 0 0 .3em rgba(240,161,74,.22)}',
    '.dl-sl input[type=range]:active::-webkit-slider-thumb{cursor:grabbing;transform:scale(1.08)}',
    '.dl-sl input[type=range]:focus-visible{outline:none}',
    '.dl-sl input[type=range]:focus-visible::-webkit-slider-thumb{outline:.16em solid #fff;outline-offset:.14em}',
    /* 交渉 */
    '.dl-seller{display:flex;align-items:flex-end;gap:.4em}',
    '.dl-seller .bubble{border-radius:1em 1em 1em .2em;font-size:.95em;font-weight:700;margin-bottom:1.2em}',
    '.dl .tap .ic{flex:none;font-size:1.35em;line-height:1;width:1.4em;text-align:center}',
    '.dl .tap .t{font-weight:900;font-size:.98em;line-height:1.35}',
    '.dl .talk .bubble{align-self:flex-start;max-width:88%;border-radius:.2em 1em 1em 1em}',
    '.dl-deal{display:flex;align-items:center;justify-content:space-between;gap:.6em}',
    /* DD */
    '.dl-dd{display:grid;grid-template-columns:1fr 1fr;gap:.55em}',
    '.dl-dd .tap{flex-direction:column;align-items:center;justify-content:center;gap:.25em;padding:.75em .4em .7em;text-align:center;margin-bottom:var(--edge)}',
    '.dl-dd .ic{font-size:1.9em;line-height:1.1;width:auto}',
    '.dl-dd b{font-size:1em;font-weight:900}',
    '.dl-res{display:flex;flex-direction:column;gap:.4em}',
    '.dl-res .find{display:flex;align-items:center;gap:.5em}',
    '.dl-res .find .chip{flex:none}',
    /* 契約 */
    '.dl-risk{display:flex;flex-direction:column;gap:.55em}',
    '.dl-rt{display:flex;align-items:center;gap:.5em;font-size:.9em;font-weight:900}',
    '.dl-cl{display:flex;gap:.35em;padding-bottom:var(--edge)}',
    '.dl-cl .tap{flex:1;width:auto;min-width:0;justify-content:center;text-align:center;min-height:10cqw;padding:.35em .2em;border-radius:var(--r-pill);font-size:.74em;font-weight:900;line-height:1.25;margin-bottom:0;--edge:.22em}',
    '.dl-cl .tap.on::after{top:-.55em;right:-.3em}',
    '.dl-fb{font-size:.8em;font-weight:700;line-height:1.4}',
    '.dl-fb.ok{color:#9fe3bf}.dl-fb.ng{color:#ffb3a6}',
    '.dl-rw{display:flex;align-items:center;gap:.5em;font-size:.84em;color:var(--mist)}',
    '.dl-fp{display:flex;align-items:center;justify-content:space-between;gap:.6em}',
    /* 統合 */
    '.dl-pmi-hd{display:flex;align-items:center;gap:.8em}',
    '.dl-pmi-hd .mt{flex:1;min-width:0;display:flex;flex-direction:column;gap:.55em}',
    '.dl-mtr .row{font-size:.78em;font-weight:900;margin-bottom:.2em}',
    '.dl-mtr .mono{font-size:1.25em;font-weight:600}',
    '.dl-mtr .meter{height:.7em}',
    '.dl-mood{font-size:.76em;font-weight:900;color:var(--mist)}',
    '.dl-acts{display:flex;flex-direction:column;gap:.15em}',
    '.dl-acts .tap{padding:.5em .75em;min-height:var(--tap-min)}',
    '.dl-acts .t{flex:1;min-width:0;font-size:.92em}',
    '.dl-acts .tags{flex:none;gap:.25em}',
    '.dl-acts .tap.on .tags{margin-right:.7em}',
    /* 振り返り */
    '.dl-grade{display:flex;align-items:center;justify-content:center;gap:.9em;padding:.2em 0}',
    '.dl-grade .rank{font-size:4.6em;animation:pop .6s .45s both}',
    '.dl-grade .label{display:block;margin-bottom:.15em}',
    '.dl .chain{gap:.1em}',
    '.dl .chain div{align-items:center;padding:.32em .2em;font-size:.88em;border-bottom:1px solid rgba(255,255,255,.06)}',
    '.dl .chain div:last-child{border-bottom:0}',
    '.dl .chain b{flex:none;width:3.6em;font-weight:900;color:var(--mist)}',
    '.dl .chain .mk{font-size:.85em;width:1.7em;height:1.7em}',
    '.dl-terms{display:flex;flex-wrap:wrap;gap:.35em}',
    '.dl-terms .chip{background:rgba(246,239,226,.14)}'
  ].join('\n');
  document.head.appendChild(st);
})();

S.deal=function(){
  const NAMES=['探索','鑑定','交渉','DD','契約','統合','振り返り'];
  const EN=['Sourcing','Valuation','Negotiation','Due Diligence','SPA','PMI','Debrief'];
  const ICONS=['🔭','💰','🤝','🔍','📜','🌱','🏁'];
  const D={step:0,fitFirst:null,tries:0,revalued:false,offer:7,agreed:null,price:null,dd:[],cover:{},pmi:[]};
  const FINDS={
    fin:{a:'財務',ic:'💴',c:'📊 決算書',s:'未払い残業代 0.4億',r:'未払い残業代 0.4億円が見つかった',fix:'価格調整',hint:'お金の問題は価格に反映する',risk:true},
    law:{a:'法務',ic:'⚖️',c:'📄 契約書',s:'経営者交代で取引先が解約可',r:'主要取引先との契約に「経営者が変わったら解約できる」条項',fix:'クロージング条件',hint:'取引先の同意を実行の条件にする',risk:true},
    hr:{a:'人事',ic:'👥',c:'🧑‍🏭 人材',s:'工場長が退職を検討中',r:'技術の要である工場長が退職を考えている',fix:'キーマン条項',hint:'要の人が残ることを約束させる',risk:true},
    tax:{a:'税務',ic:'🧾',c:'🏛 申告',s:'大きな問題なし',r:'大きな問題は見つからなかった',fix:null,risk:false}};
  const CLAUSES=['価格調整','クロージング条件','キーマン条項'];
  const oku=v=>v.toFixed(1);
  const num=(v,id)=>'<span class="dl-num"><b'+(id?' id="'+id+'"':'')+' style="font-weight:400">'+oku(v)+'</b><small>億</small></span>';
  const pips=(n,max)=>'<span class="dl-pips">選択 '+Array.from({length:max},(_,i)=>'<i class="'+(i<n?'on':'')+'"></i>').join('')+'</span>';
  const host3d=(key,mood,w)=>'<div data-beast3d="'+key+'" data-mood="'+mood+'" style="flex:none;width:'+w+';aspect-ratio:1/1">'+beast(Object.assign({},B[key],{mood}))+'</div>';
  /* 3Dホストの表情を変える：属性を更新（3Dはkitが追従）＋SVGの代替表示を描き直す */
  function setMood(h,key,mood){
    if(!h||h.dataset.mood===mood)return;
    h.dataset.mood=mood;
    const old=h.querySelector('svg');
    if(old){const vis=old.style.visibility;const t=document.createElement('div');t.innerHTML=beast(Object.assign({},B[key],{mood}));
      const sv=t.firstChild;sv.style.visibility=vis;old.replaceWith(sv)}
    try{if(typeof Kit3D!=='undefined'&&Kit3D&&Kit3D.scan)Kit3D.scan(h)}catch(e){}
  }

  function frame(inner,foot){
    const icons='<div class="dl-steps" aria-label="ステップ '+(D.step+1)+' / 7"><b style="width:calc((100% - 4em) * '+(D.step/6)+')"></b>'+
      ICONS.map((ic,i)=>'<i class="'+(i<D.step?'done':i===D.step?'on':'')+'" title="'+NAMES[i]+'">'+ic+'</i>').join('')+'</div>';
    const el=mount(topbar('🤝 M&A','<span class="chip">'+(D.step+1)+' / 7</span>','town')+icons+
      '<div class="stepname"><span class="disp">'+NAMES[D.step]+'</span><span class="mono xs muted">'+EN[D.step]+'</span></div>'+
      '<div class="body fade">'+inner+'</div><div class="foot">'+foot+'</div>','dark dl');
    bind(el);return el;
  }
  function next(sfx){D.step++;if(sfx!=='none')SFX.play(sfx||'step');render()}
  function render(){[s0,s1,s2,s3,s4,s5,s6][D.step]()}

  /* 0. 探索 */
  function s0(){
    const c=[['machi','マチコウバ',['🔧 精密加工','👴 後継者なし']],['hayate','ハヤテ便',['🚚 物流','🗾 全国配送']],['misemori','ミセモリ',['🏪 小売','🚉 駅前の店']]];
    const el=frame(
      '<div class="panel dl-want"><span style="font-size:1.8em;line-height:1">🎯</span><div><p class="label">ほしいもの</p><p class="disp">🔧 技術力</p></div></div>'+
      tip('戦略に合う企業獣を選ぼう')+
      c.map(x=>'<button class="cand" data-k="'+x[0]+'" data-sfx="none"><span class="ic">'+beast(B[x[0]])+'</span><span class="grow"><b>'+x[1]+'</b><span class="tags">'+x[2].map(t=>'<span class="chip">'+t+'</span>').join('')+'</span></span></button>').join('')+
      '<div id="fb"></div>','<button class="btn" id="nx" disabled>🤝 この企業獣に決定</button>');
    el.querySelectorAll('.cand').forEach(b=>b.addEventListener('click',()=>{
      D.tries++;
      el.querySelectorAll('.cand').forEach(x=>x.classList.remove('on','ng'));void b.offsetWidth;
      if(b.dataset.k==='machi'){b.classList.add('on');if(D.fitFirst===null)D.fitFirst=true;SFX.play('ok');
        el.querySelector('#fb').innerHTML='<div class="find ok">✓ 精密加工の技術が戦略にぴったり</div>';el.querySelector('#nx').disabled=false}
      else{b.classList.add('ng');D.fitFirst=false;SFX.play('ng');
        el.querySelector('#fb').innerHTML='<div class="find">✕ 戦略に合わないとシナジーが出ない</div>';el.querySelector('#nx').disabled=true}
    }));
    el.querySelector('#nx').addEventListener('click',()=>next());
  }

  /* 1. 鑑定 */
  function s1(){
    const el=frame(
      tip('純資産法で価値を見よう')+
      '<div class="dl-bs" aria-label="資産12.0億、負債7.0億、純資産5.0億">'+
        '<div class="col"><div class="blk as" style="flex-grow:12"><p class="k">🏭 資産</p><p class="v"><span id="av">12.0</span><small>億</small></p><p class="dl-adj" id="adj" hidden>🏞 土地の含み益 <span class="mono">+1.0億</span></p></div>'+
          '<div class="blk gain" id="gain"></div></div>'+
        '<div class="col"><div class="blk li" style="flex-grow:7"><p class="k">🧾 負債</p><p class="v">7.0<small>億</small></p></div>'+
          '<div class="blk eq" id="eqb" style="flex-grow:5"><p class="k">💎 純資産</p><p class="v" id="eqv">5.0<small>億</small></p></div></div>'+
      '</div>'+
      '<p class="dl-eqn">資産 − 負債 ＝ 純資産</p>'+
      '<button class="btn sub" id="rv" data-sfx="none">🔍 土地を時価で見直す</button>'+
      '<div id="offer" hidden><div class="panel">'+
        '<div class="row sp"><div><p class="label">提示価格</p>'+num(D.offer,'ov')+'</div><span class="chip leaf" id="ost">✓ 適正レンジ</span></div>'+
        '<div class="dl-sl"><div class="trk"><div class="zone"></div></div>'+
        '<input type="range" id="sl" min="4" max="10" step="0.5" value="7" aria-label="提示価格（億円）">'+
        '<div class="ticks"><span style="left:0">4億</span><span style="left:33.333%">6億</span><span style="left:66.667%">8億</span><span style="left:100%">10億</span></div></div>'+
        '<p class="xs muted" style="margin-top:.5em">🟩 緑＝適正レンジ（時価純資産＋稼ぐ力）</p>'+
      '</div></div>',
      '<button class="btn" id="nx" disabled>🤝 この価格で交渉へ</button>');
    el.querySelector('#rv').addEventListener('click',e=>{
      D.revalued=true;SFX.play('ok');e.currentTarget.remove();
      el.querySelector('#gain').style.flexGrow=1;
      el.querySelector('#eqb').style.flexGrow=6;
      el.querySelector('#av').textContent='13.0';
      el.querySelector('#adj').hidden=false;
      const ev=el.querySelector('#eqv');ev.innerHTML='6.0<small>億</small>';ev.classList.add('pop');
      el.querySelector('#offer').hidden=false;el.querySelector('#nx').disabled=false;
      el.querySelector('.tip .bubble').innerHTML='時価で<b>6億</b>＋稼ぐ力＝<b>6〜8億</b>が目安';
      later(()=>{const o=el.querySelector('#offer');if(o)o.scrollIntoView({behavior:'smooth',block:'nearest'})},350);
    });
    const sl=el.querySelector('#sl'),ost=el.querySelector('#ost');let lastTick=0;
    const inBand=v=>v>=6&&v<=8;
    sl.addEventListener('input',()=>{
      const v=+sl.value;if(v===D.offer)return;D.offer=v;
      el.querySelector('#ov').textContent=oku(v);
      const ok=inBand(v);ost.className='chip '+(ok?'leaf':'rose');ost.textContent=ok?'✓ 適正レンジ':'レンジの外';
      const now=performance.now();if(now-lastTick>140){lastTick=now;SFX.play('select')}
    });
    el.querySelector('#nx').addEventListener('click',()=>next(inBand(D.offer)?'ok':'step'));
  }

  /* 2. 交渉 */
  function s2(){
    const opts=[['a','💰','1億円上乗せします'],['b','🤝','30名の雇用を守ります'],['c','⏱','今週中に決めて']];
    const el=frame(
      '<div class="dl-seller">'+host3d('oyaji','o','42%')+'<div class="bubble grow">40年育てた会社だ。<br><span style="white-space:nowrap"><b class="mono">'+oku(D.offer)+'億</b>か…</span><span style="white-space:nowrap">気がかりは別にある。</span></div></div>'+
      '<div id="mt">'+tip('社長が本当に気にしているのは？')+'</div>'+
      '<div class="talk" id="talk"></div>'+
      '<div id="opts" style="display:flex;flex-direction:column;gap:.15em">'+
      opts.map(o=>'<button class="tap" data-o="'+o[0]+'" data-sfx="none"><span class="ic">'+o[1]+'</span><span class="t">「'+o[2]+'」</span></button>').join('')+'</div>',
      '<button class="btn" id="nx" hidden>📝 基本合意へ進む</button>');
    el.querySelectorAll('#opts .tap').forEach(b=>b.addEventListener('click',()=>{
      const o=b.dataset.o;el.querySelector('#opts').remove();
      let me,re;
      if(o==='b'){me='30名の雇用を守ります';re='…それが聞きたかった。あんたに任せよう。';D.agreed='good';D.price=Math.max(D.offer,6.0)}
      else if(o==='a'){me='1億円上乗せします';re='ありがたいが、雇用はどうなる？ まあ考えよう。';D.agreed='costly';D.price=D.offer+1}
      else{me='今週中に決めて';re='急かすのか。せめて'+oku(Math.max(D.offer,7.5))+'億は出してもらう。';D.agreed='hard';D.price=Math.max(D.offer,7.5)}
      const good=D.agreed==='good';
      SFX.play(good?'ok':'ng');
      setMood(el.querySelector('[data-beast3d]'),'oyaji',good?'smile':'worry');
      el.querySelector('#mt').remove();
      el.querySelector('#talk').innerHTML='<div class="me">'+me+'</div><div class="bubble" style="animation:fade .4s .25s both">'+re+'</div>'+
        '<div class="find '+(good?'ok':'')+'" style="animation-delay:.5s">'+(good?'✓ 売り手の本当の動機（雇用）を読んだ':'△ 本当の関心は「従業員の雇用」だった')+'</div>'+
        '<div class="panel dl-deal fade" style="animation-delay:.7s"><span class="label">合意価格</span>'+num(D.price)+'</div>'+
        '<div class="fade" style="animation-delay:.9s">'+tip('合意したら基本合意書を結んでDDへ')+'</div>';
      el.querySelector('#nx').hidden=false;
    }));
    el.querySelector('#nx').addEventListener('click',()=>next());
  }

  /* 3. DD */
  function s3(){
    const el=frame(
      tip('デューデリジェンスで調べる所を3つ選ぼう')+
      '<div class="dl-dd">'+Object.keys(FINDS).map(k=>'<button class="tap" data-k="'+k+'" data-sfx="select"><span class="ic">'+FINDS[k].ic+'</span><b>'+FINDS[k].a+'DD</b><span class="chip">'+FINDS[k].c+'</span></button>').join('')+'</div>'+
      '<div class="row sp" id="cnt">'+pips(0,3)+'</div><div class="dl-res" id="res"></div>',
      '<button class="btn" id="go" disabled>🔍 調査を実行</button>');
    const sel=new Set();
    el.querySelectorAll('.dl-dd .tap').forEach(b=>b.addEventListener('click',()=>{
      const k=b.dataset.k;if(sel.has(k))sel.delete(k);else if(sel.size<3)sel.add(k);
      el.querySelectorAll('.dl-dd .tap').forEach(x=>x.classList.toggle('on',sel.has(x.dataset.k)));
      el.querySelector('#cnt').innerHTML=pips(sel.size,3);el.querySelector('#go').disabled=sel.size!==3;
    }));
    el.querySelector('#go').addEventListener('click',function(){
      if(this.dataset.done){next();return}
      D.dd=[...sel];this.dataset.done=1;this.textContent='📜 契約へ進む';SFX.play('ok');
      el.querySelectorAll('.dl-dd .tap').forEach(x=>x.disabled=true);
      el.querySelector('#cnt').hidden=true;
      el.querySelector('#res').innerHTML=Object.keys(FINDS).map((k,j)=>{const f=FINDS[k],d='animation-delay:'+(j*.15)+'s';
        if(!sel.has(k))return '<div class="find unk" style="'+d+'"><span class="chip">？ '+f.a+'</span><span>未調査＝リスクは見えない</span></div>';
        return '<div class="find '+(f.risk?'':'ok')+'" style="'+d+'"><span class="chip '+(f.risk?'rose':'leaf')+'">'+(f.risk?'⚠':'✓')+' '+f.a+'</span><span>'+f.s+'</span></div>'}).join('');
      later(()=>{const r=el.querySelector('#res');if(r)r.scrollIntoView({behavior:'smooth',block:'end'})},200);
    });
  }

  /* 4. 契約 */
  function s4(){
    const found=D.dd.filter(k=>FINDS[k].risk);
    const missed=Object.keys(FINDS).filter(k=>FINDS[k].risk&&!D.dd.includes(k));
    const el=frame(
      tip('リスクに合う条項を株式譲渡契約に入れよう')+
      found.map(k=>'<div class="panel dl-risk" data-k="'+k+'"><p class="dl-rt"><span class="chip rose">⚠ '+FINDS[k].a+'</span><span>'+FINDS[k].s+'</span></p>'+
        '<div class="dl-cl">'+CLAUSES.map(c=>'<button class="tap" data-c="'+c+'" data-sfx="none">'+c+'</button>').join('')+'</div><p class="dl-fb" hidden></p></div>').join('')+
      missed.map(k=>'<div class="find unk"><span class="chip">？ '+FINDS[k].a+'</span> 未調査のため契約で備えられない</div>').join('')+
      '<div class="dl-rw"><span>🛡</span><span class="grow">表明保証・補償は標準で入る</span><span class="chip leaf">自動</span></div>'+
      '<div class="panel dl-fp"><span class="label">最終価格</span><span class="row" style="gap:.5em"><span class="chip leaf" id="adj" hidden>価格調整 −0.4</span>'+num(D.price,'fp')+'</span></div>',
      '<button class="btn" id="nx" '+(found.length?'disabled':'')+'>✍️ 契約を締結する</button>');
    el.querySelectorAll('.dl-risk').forEach(g=>g.querySelectorAll('.tap').forEach(b=>b.addEventListener('click',()=>{
      const k=g.dataset.k,c=b.dataset.c,ok=c===FINDS[k].fix;D.cover[k]=c;
      g.querySelectorAll('.tap').forEach(x=>x.classList.remove('on','ng'));void b.offsetWidth;b.classList.add(ok?'on':'ng');
      SFX.play(ok?'ok':'ng');
      const fb=g.querySelector('.dl-fb');fb.hidden=false;fb.className='dl-fb '+(ok?'ok':'ng');fb.textContent=(ok?'✓ ':'✕ 合わない。')+FINDS[k].hint;
      const adj=D.cover.fin==='価格調整';
      el.querySelector('#fp').textContent=oku(D.price-(adj?0.4:0));el.querySelector('#adj').hidden=!adj;
      el.querySelector('#nx').disabled=found.some(f=>!D.cover[f]);
    })));
    el.querySelector('#nx').addEventListener('click',()=>{D.final=D.price-(D.cover.fin==='価格調整'?0.4:0);next()});
  }

  /* 5. 統合（PMI） */
  function s5(){
    const A=[['walk','🚶','社長と現場を回る',20,0],['chief','🧑‍🔧','工場長を技術責任者に',15,5],['sell','🛒','自社の販路で売る',0,30],
      ['sys','💻','経理システムを統一',-5,10],['pay','💴','給与制度をすぐ統一',-20,5],['none','⏸','しばらく様子見',-10,0]];
    let base=D.agreed==='good'?55:40;
    const mood=n=>n>=60?'smile':n>=40?'o':'worry';
    const fx=a=>(a[3]?'<span class="chip '+(a[3]>0?'leaf':'rose')+'">♥'+(a[3]>0?'+':'')+a[3]+'</span>':'')+(a[4]?'<span class="chip ember">⚡+'+a[4]+'</span>':'');
    const el=frame(
      '<div class="dl-pmi-hd">'+host3d('machi',mood(base),'38%')+'<div class="mt">'+
      '<div class="dl-mtr"><div class="row sp"><span>♥ なつき度</span><span class="mono" id="nv">'+base+'</span></div><div class="meter"><i id="nm" style="width:'+base+'%"></i></div></div>'+
      '<div class="dl-mtr"><div class="row sp"><span>⚡ シナジー</span><span class="mono" id="sv">0</span></div><div class="meter"><i id="sm" style="width:0%;background:var(--ember)"></i></div></div>'+
      '<p class="dl-mood" id="md"></p></div></div>'+
      tip('買ってからが本番。100日プランで3つ選ぼう')+
      '<div class="row sp" id="cnt">'+pips(0,3)+'</div>'+
      '<div class="dl-acts">'+A.map(a=>'<button class="tap" data-a="'+a[0]+'" data-sfx="select"><span class="ic">'+a[1]+'</span><span class="t">'+a[2]+'</span><span class="tags">'+fx(a)+'</span></button>').join('')+'</div>',
      '<button class="btn" id="nx" disabled data-sfx="none">▶ プランを実行</button>');
    const sel=new Set(),face=el.querySelector('[data-beast3d]');
    function upd(){
      let n=base,s=0;sel.forEach(k=>{const a=A.find(x=>x[0]===k);n+=a[3];s+=a[4]});
      if(D.dd.includes('hr')&&D.cover.hr==='キーマン条項')n+=5;
      n=Math.max(0,Math.min(100,n));D.n=n;D.s=s;
      el.querySelector('#nv').textContent=n;el.querySelector('#nm').style.width=n+'%';el.querySelector('#sv').textContent=s;el.querySelector('#sm').style.width=Math.min(100,s*2)+'%';
      setMood(face,'machi',mood(n));
      el.querySelector('#md').textContent=n>=60?'😊 安心して働けそう':n>=40?'😐 まだ様子を見ている':'😟 不安が広がっている';
      el.querySelector('#cnt').innerHTML=pips(sel.size,3);
      el.querySelector('#nx').disabled=sel.size!==3;
    }
    el.querySelectorAll('.dl-acts .tap').forEach(b=>b.addEventListener('click',()=>{
      const k=b.dataset.a;if(sel.has(k))sel.delete(k);else if(sel.size<3)sel.add(k);
      el.querySelectorAll('.dl-acts .tap').forEach(x=>x.classList.toggle('on',sel.has(x.dataset.a)));D.pmi=[...sel];upd();
    }));
    upd();
    el.querySelector('#nx').addEventListener('click',()=>next('none')); // 振り返りで win を鳴らす（二重防止）
  }

  /* 6. 振り返り */
  function s6(){
    const keyOk=(D.dd.includes('hr')&&D.cover.hr==='キーマン条項')||D.pmi.includes('chief');
    const lawOk=D.dd.includes('law')&&D.cover.law==='クロージング条件';
    const finOk=D.dd.includes('fin')&&D.cover.fin==='価格調整';
    const inBand=D.offer>=6&&D.offer<=8;
    const rows=[
      [D.fitFirst?'g':'w','探索',D.fitFirst?'戦略に合う企業を一発で選んだ':'戦略に合わせて選び直した'],
      [inBand?'g':'w','鑑定',inBand?'適正レンジ内で提示できた':'提示が適正レンジの外だった'],
      [D.agreed==='good'?'g':'w','交渉',D.agreed==='good'?'売り手の動機（雇用）を読んだ':'動機を外し、価格が上がった'],
      [finOk?'g':'b','財務',finOk?'未払い残業代を価格に反映':'未払い残業代を自社で負担'],
      [lawOk?'g':'b','法務',lawOk?'取引先の同意を条件にし解約回避':'主要取引先が離れ売上が減少'],
      [keyOk?'g':'b','人事',keyOk?'工場長が残り技術を引き継いだ':'工場長が退職し技術の一部を失う'],
      [D.n>=60?'g':D.n>=40?'w':'b','統合','なつき度 '+D.n+'・シナジー '+D.s]];
    const score=rows.reduce((a,r)=>a+(r[0]==='g'?2:r[0]==='w'?1:0),0);
    const grade=score>=13?'S':score>=10?'A':score>=7?'B':'C';
    try{sessionStorage.setItem('dt-grade',grade)}catch(e){}
    const terms=['ソーシング','純資産法','時価','基本合意書','デューデリジェンス','株式譲渡契約','表明保証','PMI'];
    const el=frame(
      '<div class="dl-grade"><div class="rank">'+grade+'</div><div><span class="label">買収価格</span>'+num(D.final||D.price)+'</div></div>'+
      tip('判断と結果のつながりを振り返ろう')+
      '<div class="panel chain">'+rows.map(r=>'<div><span class="mk '+r[0]+'">'+(r[0]==='g'?'✓':r[0]==='w'?'△':'✕')+'</span><b>'+r[1]+'</b><span class="grow">'+r[2]+'</span></div>').join('')+'</div>'+
      '<p class="label">獲得した用語カード</p><div class="dl-terms">'+terms.map(t=>'<span class="chip">📘 '+t+'</span>').join('')+'</div>',
      '<button class="btn" id="home">🏙 街に迎える</button>');
    later(()=>SFX.play('win'),450);
    el.querySelector('#home').addEventListener('click',()=>{loadG();G.pending='machi';G.grade=grade;if(G.q<=2){G.q=3;G.qn=0;G.coins+=50}saveG();go('town')});
  }
  render();
};
