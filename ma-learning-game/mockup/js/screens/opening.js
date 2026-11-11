'use strict';
/* ---------- 1. オープニング ---------- */
S.opening=function(){
  let i=0, pick=null;
  const scenes=[
    {art:()=>'<div style="text-align:center;animation:pop .8s both"><div class="logo" style="font-size:3em">Deal<br>Tamers</div><p class="small" style="color:#ffd29a;margin-top:.6em;letter-spacing:.2em">ディール・テイマーズ</p></div>',text:'',hint:'TAP TO START'},
    {art:()=>continent(),text:'ここは<em>マーケット大陸</em>。<br>工業、物流、商店、テック。いくつもの地区が広がっている。'},
    {art:()=>'<div class="row" style="gap:0;width:90%;justify-content:center">'+['machi','hayate','misemori','it'].map((k,j)=>'<div style="width:24%;animation:pop .5s '+(j*120)+'ms both, bob 3s '+(j*300)+'ms infinite">'+beast(B[k])+'</div>').join('')+'</div>',text:'この大陸には<em>企業獣（カンパニー・ビースト）</em>が棲んでいる。<br>売上で大きくなり、利益で強くなる。'},
    {art:()=>'<div style="width:46%;animation:bob 3s infinite">'+beast(Object.assign({},B.machi,{mood:'worry'}))+'</div>',text:'けれど、どんな企業獣にも<em>寿命と悩み</em>がある。<br>後継ぎがいない。資金が足りない。仲間がほしい。'},
    {art:()=>'<div style="width:44%;animation:pop .6s both">'+minato()+'</div>',text:'「はじめまして、ディールメーカー。<br>わたしは<em>ミナト</em>。あなた専属のアドバイザーです」'},
    {art:()=>'',text:'',custom:true}
  ];
  function continent(){
    return '<svg viewBox="0 0 300 260" style="width:92%;animation:fade .8s both"><path d="M40 140 C30 70 110 30 170 50 C250 40 290 110 260 170 C240 230 140 240 90 215 C50 200 45 175 40 140Z" fill="#2f5e4f" stroke="#ffd29a" stroke-width="2"/>'+
    '<path d="M150 50 L140 130 L60 150 M140 130 L240 160 M140 130 L130 225" stroke="#ffd29a" stroke-width="1.5" stroke-dasharray="4 4" fill="none" opacity=".7"/>'+
    [['工業地区',85,100,'#f0a14a'],['物流港',205,95,'#8fb5ff'],['商店街',95,185,'#ef6b5b'],['テック高原',200,195,'#b48cff']].map(a=>'<circle cx="'+a[1]+'" cy="'+a[2]+'" r="9" fill="'+a[3]+'"/><text x="'+a[1]+'" y="'+(a[2]+24)+'" text-anchor="middle" font-size="12" font-weight="700" fill="#f6efe2" font-family="Zen Kaku Gothic New,sans-serif">'+a[0]+'</text>').join('')+
    '<circle cx="140" cy="130" r="6" fill="#fff"/><text x="140" y="120" text-anchor="middle" font-size="10" fill="#fff" font-family="IBM Plex Mono,monospace">YOU</text></svg>';
  }
  function draw(){
    const sc=scenes[i];
    let html='<div class="op" id="op">';
    if(sc.custom){
      const opts=[['pan','ベーカリー本舗','食品 · 堅実な黒字。地元に愛される'],['hayate','ハヤテ物流','物流 · 販路が広い。成長中'],['it','ピクセル工房','IT · 小さいが急成長']];
      html+=topbar('オープニング')+'<div class="body fade">'+tip('どの会社で<b>起業</b>しますか？')+
        opts.map(o=>'<button class="choice'+(pick===o[0]?' on':'')+'" data-p="'+o[0]+'"><span class="ic">'+beast(B[o[0]])+'</span><span class="grow"><b style="display:block">'+o[1]+'</b><span class="xs muted">'+o[2]+'</span></span></button>').join('')+
        '</div><div class="foot"><button class="btn" id="next" '+(pick?'':'disabled')+'>🏢 この会社で起業する</button></div>';
    }else if(sc.home){
      const nm={pan:'ベーカリー本舗',hayate:'ハヤテ物流',it:'ピクセル工房'}[pick]||'ベーカリー本舗';
      html+='<div class="topbar"><button class="back" data-go="" aria-label="目次へ戻る">←</button><div class="ttl">'+nm+' ホールディングス</div><span class="chip ember">アナリスト</span></div>'+
        '<div class="city" style="height:45%">'+skyline({})+'<div style="position:absolute;left:41%;bottom:16%;width:18%;animation:drop .8s both">'+beast(B[pick||'pan'])+'</div></div>'+
        '<div class="body" style="background:var(--night)"><div class="row sp"><div><p class="label">グループ企業価値</p><p class="big mono">¥3.0<span class="small">億</span></p></div><div style="text-align:right"><p class="label">所属企業獣</p><p class="big">1</p></div></div>'+
        '<div class="pcard fade" style="animation-delay:.3s"><div class="row"><span class="chip ember">NEW 案件</span><span class="xs" style="color:#5b6b64">工業地区から</span></div><p style="font-weight:900;margin-top:.4em">後継者を探している町工場があるようです</p><p class="xs" style="color:#5b6b64">高い精密加工技術を持つ「マチコウバ」</p></div>'+
        tip('準備は整いました。<b>最初の案件</b>に出かけましょう！')+'</div>'+
        '<div class="foot" style="background:var(--night)"><button class="btn" data-go="deal">最初の案件へ（買収フロー体験）</button><button class="btn ghost" data-go="">目次へ戻る</button></div>';
    }else{
      html+='<div class="op-art">'+sc.art()+'</div><div class="op-text fade"><p>'+sc.text+'</p></div><div class="taphint">'+(sc.hint||'TAP')+'</div>';
      html+='<button class="back" data-go="" aria-label="目次へ戻る" style="position:absolute;top:.9em;left:1em">←</button>';
    }
    html+='</div>';
    const el=mount(html,sc.custom||sc.home?'dark':'');
    bind(el);
    if(!sc.custom&&!sc.home){
      el.querySelector('#op').addEventListener('click',e=>{if(e.target.closest('[data-go]'))return;i++;draw()});
    }
    if(sc.custom){
      el.querySelectorAll('[data-p]').forEach(b=>b.addEventListener('click',()=>{pick=b.dataset.p;draw()}));
      el.querySelector('#next').addEventListener('click',()=>{G=freshG(pick);saveG();go('town')});
    }
  }
  draw();
};
