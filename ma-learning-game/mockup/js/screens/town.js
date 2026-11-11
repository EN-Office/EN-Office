'use strict';
/* ---------- 街（経営シム・チュートリアルの中心） ----------
   3D（Kit3D.ready）：浮島のジオラマを three.js で描く。シーンは1回の訪問につき1つだけ作り、状態が変わったら sync() で差分だけ更新する。
     押せるもの（建物・コイン吹き出し・配置マス）は、3D座標を画面へ投影した位置に <button> を重ねる（キーボード操作・自動のタップ音・読み上げに対応）。
     建物のボタンは透明で、建物＋企業獣の外形（凸包）で clip-path を切ってあるので、見た目どおりの形でしか反応しない。
   2D（3Dが使えない・モデル読込に失敗）：従来のSVG/DOMの地図で同じ操作ができる。 */

/* 街の画面専用のスタイル（app.css の :root 変数を使う。id で二重挿入を防ぐ） */
(function(){
  if(document.getElementById('town3d-css'))return;
  const s=document.createElement('style');s.id='town3d-css';
  s.textContent=[
    '.t3-w{display:contents}',
    '.screen.town.t3{background:linear-gradient(180deg,#5fb4e4 0%,#93d0ef 34%,#cfeaf0 66%,#f6e2bf 100%)}',
    '.screen.town.t3 .map{position:absolute;inset:0;margin:0;z-index:0;flex:none}',
    '.screen.town .thud,.screen.town .tstat,.screen.town .quest{position:relative;z-index:2}',
    '.screen.town .tguide{z-index:3}',
    '.t3-sp{display:none}.screen.town.t3 .t3-sp{display:block;flex:1;min-height:0}',
    '.t3-host{position:absolute;inset:0;opacity:0;transition:opacity .45s}.t3-host.on{opacity:1}',
    '.t3-ov{position:absolute;inset:0;pointer-events:none}.t3-ov>*{pointer-events:auto}',
    '.t3-hit{position:absolute;left:0;top:0;background:transparent;border-radius:0;padding:0;margin:0}',
    '.t3-hit:focus-visible{outline:none;background:rgba(255,210,154,.28)}',
    '.t3-ov .coinb{margin:-13.8cqw 0 0 -5.5cqw}',
    '.t3-ov .slot{width:10.5cqw;height:10.5cqw;font-size:4.6cqw;margin:-7cqw 0 0 -5.25cqw}',
    '.coinb.nudge,.slot.nudge{animation:shake .35s 2}',
    '.t3-sky{position:absolute;inset:0;overflow:hidden;pointer-events:none}',
    '.t3-cl{position:absolute;left:0;width:24cqw;height:6.5cqw;border-radius:99em;background:rgba(255,255,255,.8);animation:t3drift 80s linear infinite}',
    '.t3-cl::before{content:"";position:absolute;left:20%;top:-60%;width:42%;height:130%;border-radius:50%;background:inherit}',
    '.t3-cl::after{content:"";position:absolute;left:52%;top:-32%;width:30%;height:95%;border-radius:50%;background:inherit}',
    '@keyframes t3drift{from{transform:translateX(-30cqw)}to{transform:translateX(112cqw)}}',
    '.t3-fg{position:absolute;z-index:6;left:0;top:0;font-size:8.5cqw;line-height:1;pointer-events:none;margin-left:-3.2cqw;filter:drop-shadow(0 .6cqw .5cqw rgba(0,0,0,.28));animation:t3pt .9s ease-in-out infinite}',
    '.t3-fg.dn{margin-top:-10cqw}',
    '@keyframes t3pt{0%,100%{transform:translateY(0)}50%{transform:translateY(-2cqw)}}',
    '.t3-fg.dn{animation-name:t3pd}@keyframes t3pd{0%,100%{transform:translateY(0)}50%{transform:translateY(2cqw)}}',
    '.t3-bump{animation:pop .35s both}',
    '.screen.town .quest.flat{--lift:0px;--hl:transparent;background:var(--flat-bg);cursor:default}',
    '.screen.town .quest.flat::after{content:none}',
    /* 建物シート */
    '.t3-sh{gap:.8em}',
    '.t3-hd{display:flex;gap:.9em;align-items:center}',
    '.t3-pv{flex:none;width:34%;aspect-ratio:1/1;position:relative;border-radius:var(--r-l);background:radial-gradient(circle at 50% 62%,rgba(255,210,154,.24),rgba(255,255,255,.03) 70%)}',
    '.t3-pv>svg{width:100%;height:100%}',
    '.t3-pips{display:flex;gap:.3em;margin:.45em 0}',
    '.t3-pips i{width:1.7em;height:.5em;border-radius:99em;background:rgba(255,255,255,.14)}.t3-pips i.on{background:var(--ember)}',
    '.t3-sh .stats{grid-template-columns:1fr 1fr}',
    '.t3-sh .stats b{font-size:1.2em;white-space:nowrap}.t3-sh .stats b small{font-size:.7em;color:var(--mist);margin:0 .2em}',
    '.t3-tag{display:inline-flex;align-items:center;gap:.25em;font-size:var(--fs-xs);font-weight:900;padding:.15em .7em;border-radius:var(--r-pill);background:var(--ember);color:var(--ember-ink);white-space:nowrap}',
    '.t3-sh .tags{gap:.45em}',
    '.t3-act{display:grid;grid-template-columns:1fr 1.7fr;gap:.55em}',
    '.t3-act .btn{margin-bottom:var(--edge)}',
    /* 3Dの企業獣（モーダル） */
    '.t3-b3{margin:0 auto;aspect-ratio:1/1;position:relative}.t3-b3>svg{width:100%;height:100%}',
    '.t3-md{text-align:center;align-items:stretch}',
    '.t3-md .mgrid b{font-size:1em;white-space:nowrap}',
    '.t3-md .t3-co{font-weight:900;font-size:1.05em}',
    '.t3-md .mgrid.two{grid-template-columns:1fr 1fr}'
  ].join('');
  document.head.appendChild(s);
})();

/* ---------- 3Dシーン（静的な形はページ内で1度だけ作って使い回す） ---------- */
const TOWN3D={cache:null,SP:1.45};
function town3dStatic(){
  if(TOWN3D.cache)return TOWN3D.cache;
  const M=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:new THREE.Color(c),roughness:.9,metalness:0},o||{}));
  const rr=(w,r)=>{const s=new THREE.Shape(),h=w/2;s.moveTo(-h+r,-h);s.lineTo(h-r,-h);s.quadraticCurveTo(h,-h,h,-h+r);s.lineTo(h,h-r);s.quadraticCurveTo(h,h,h-r,h);
    s.lineTo(-h+r,h);s.quadraticCurveTo(-h,h,-h,h-r);s.lineTo(-h,-h+r);s.quadraticCurveTo(-h,-h,-h+r,-h);return s};
  const ext=(w,r,d,bev,top)=>{const g=new THREE.ExtrudeGeometry(rr(w,r),{depth:d,bevelEnabled:true,bevelThickness:bev,bevelSize:bev,bevelSegments:3,curveSegments:8});
    g.rotateX(-Math.PI/2);g.translate(0,top-(d+bev),0);return g};
  const hash=(x,y,z)=>{const v=Math.sin(x*12.99+y*78.23+z*37.72)*43758.55;return v-Math.floor(v)};
  const rock=(rt,rb,h,seg,top,amp)=>{const g=new THREE.CylinderGeometry(rt,rb,h,seg,4),p=g.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(y>h/2-1e-3)continue;const n=hash(Math.round(x*100),Math.round(y*100),Math.round(z*100));
      p.setXYZ(i,x*(1+(n-.5)*amp),y+(n-.5)*.12,z*(1+(n-.5)*amp))}
    g.translate(0,top-h/2,0);g.computeVertexNormals();return g};
  const C={
    outline:rr(5.3,.95).getPoints(4).map(p=>[p.x,p.y]),
    grass:ext(5.3,.95,.2,.09,0),
    dirt:ext(5.1,.9,.36,.1,-.26),
    rock:rock(2.3,.3,3.1,11,-.62,.3),
    pebble:new THREE.IcosahedronGeometry(.32,0),
    road:ext(4.45,.45,.015,.025,.045),
    plate:ext(1.25,.24,.02,.03,.095),
    bush:new THREE.IcosahedronGeometry(.17,1),
    flower:new THREE.SphereGeometry(.05,8,6),
    box:new THREE.BoxGeometry(1,1,1),
    ring:new THREE.RingGeometry(.36,.5,28).rotateX(-Math.PI/2),
    spark:new THREE.OctahedronGeometry(.075),
    mat:{grassTop:M('#9fd97f'),grassSide:M('#77bf61'),dirtTop:M('#b8743f'),dirt:M('#d99a5e'),
      rock:M('#b08670',{flatShading:true}),rock2:M('#94705d',{flatShading:true}),road:M('#efdcb1'),
      bush:M('#5aae58',{flatShading:true}),bush2:M('#7cc764',{flatShading:true}),
      fl1:M('#ff9fb0'),fl2:M('#ffe07a'),fl3:M('#ffffff'),
      plate:M('#b3e394'),spark:new THREE.MeshBasicMaterial({color:new THREE.Color('#ffe08a')})}
  };
  C.shadow=Kit3D.shadow(1);
  TOWN3D.cache=C;return C;
}

/* 街の3Dビュー。o: {safe(), bubblePx(), placing(), onTap(i), onCoin(i,btn), onSlot(i), onLand(i), fail()} */
function town3d(host,ov,o){
  const K=Kit3D,C=town3dStatic(),SP=TOWN3D.SP;
  const RM=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)')}catch(e){return {matches:false}}})();
  const scene=new THREE.Scene();K.addLights(scene);
  const cam=new THREE.OrthographicCamera(-4,4,4,-4,.1,100);
  const EL=30*Math.PI/180,AZ=Math.PI/4;
  cam.position.set(Math.cos(EL)*Math.sin(AZ)*30,Math.sin(EL)*30,Math.cos(EL)*Math.cos(AZ)*30);cam.lookAt(0,0,0);cam.updateMatrixWorld();
  const V=new THREE.Vector3();
  let dead=false,W=0,H=0,tgt=null,fitted=false,anims=[],parts=[],floaters=[],sway=[];
  const add=(geo,mat,x,y,z,parent)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x||0,y||0,z||0);(parent||scene).add(m);return m};
  const shadow=(r,x,y,z,parent)=>{const m=C.shadow.clone();m.scale.set(r,1,r);m.position.set(x,y,z);(parent||scene).add(m);return m};

  /* 浮島 */
  add(C.grass,[C.mat.grassTop,C.mat.grassSide]);
  add(C.dirt,[C.mat.dirtTop,C.mat.dirt]);
  add(C.rock,C.mat.rock);
  [[-1.9,-2.5,1.5,.3],[1.9,-3.0,-.5,.22],[.4,-3.9,1.9,.17]].forEach(([x,y,z,s],j)=>{const m=add(C.pebble,j?C.mat.rock2:C.mat.rock,x,y,z);m.scale.setScalar(s/.32);m.rotation.set(j,j*2,0);floaters.push({m,y,ph:j*2.1})});
  add(C.road,C.mat.road);
  // 縁の茂みと花
  [[2.45,-1.0],[2.43,.8],[-1.05,2.45],[.7,2.43],[-2.45,.3],[1.3,-2.43],[-2.4,-1.6],[2.02,2.02],[-2.08,2.0],[-.4,-2.45]].forEach(([x,z],j)=>{
    const m=add(C.bush,j%2?C.mat.bush:C.mat.bush2,x,.1,z);const s=.8+((j*7)%5)*.12;m.scale.set(s,s*.85,s);sway.push({m,ph:j,amp:.04})});
  [[2.45,-.1,'fl1'],[2.4,1.35,'fl2'],[-.2,2.46,'fl3'],[1.35,2.42,'fl1'],[-2.45,1.05,'fl2'],[-1.7,2.44,'fl1'],[2.46,-1.6,'fl3']].forEach(([x,z,c])=>{add(C.flower,C.mat[c],x,.05,z)});

  /* 区画 */
  const lots=PLOTS.map((pl,i)=>{
    const x=(pl[0]-1)*SP,z=(pl[1]-1)*SP,mat=C.mat.plate.clone();
    const plate=add(C.plate,mat,x,0,z);
    const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
    const L={i,x,z,mat,plate,g,b:null,top:0,hit:null,coin:null,slot:null,strip:null,mode:''};
    if(ADJ.includes(i)){
      const sm=new THREE.MeshStandardMaterial({color:new THREE.Color('#ffc46b'),emissive:new THREE.Color('#ff9a2a'),emissiveIntensity:.35,roughness:.6});
      const st=add(C.box,sm,x/2,.06,z/2);const along=Math.abs(x)>.1;st.scale.set(along?.32:.5,.04,along?.5:.32);st.visible=false;L.strip=st;
    }
    return L;
  });
  // 鍵のかかった区画の木
  const trees={0:[['tree_pine',-.28,-.22,.78],['tree_round',.3,.12,.62],['tree_pine',.18,-.42,.5],['tree_round',-.35,.38,.45]],
    8:[['tree_round',.12,.08,.66],['tree_pine',.4,.36,.72],['tree_pine',-.22,.42,.5],['tree_round',.42,-.2,.45]]};

  /* ボタン（重ねるHTML） */
  function mkBtn(cls,html,attrs,on){const b=document.createElement('button');b.type='button';b.className=cls;b.innerHTML=html;Object.keys(attrs).forEach(k=>b.setAttribute(k,attrs[k]));b.addEventListener('click',on);ov.appendChild(b);return b}

  /* 建物を建てる */
  function buildStack(L){
    if(L.stack)L.wrap.remove(L.stack);
    const s=K.stackBuilding(L.src,L.b.lv);s.scale.setScalar(1.1);s.position.set(-.04,.095,-.07);
    L.top=new THREE.Box3().setFromObject(s).max.y;
    L.wrap.add(s);L.stack=s;
  }
  function addBld(L,b){
    L.b={k:b.k,lv:b.lv,ready:false};
    const k=b.k,drop=!!b.drop;
    Promise.all([K.load('bld_'+k),K.load(K.beastName(k))]).then(([bld,bst])=>{
      if(dead||!L.b||L.b.k!==k)return;
      L.src=bld;L.wrap=new THREE.Group();L.g.add(L.wrap);
      L.lv=L.b.lv;buildStack(L);
      L.sh=shadow(.9,-.04,.1,-.07,L.g);
      L.bw=new THREE.Group();L.bw.position.set(.5,.095,.56);L.bw.rotation.y=.45;L.g.add(L.bw);
      L.bsh=shadow(.26,.5,.1,.56,L.g);
      L.beast=bst;bst.scale.setScalar(.5);L.bw.add(bst);
      L.eyes=['Eye_L','Eye_R'].map(n=>bst.getObjectByName(n)).filter(Boolean);
      L.ph=L.i*1.37;L.blink=1+Math.random()*3;L.hop=-1;L.nextHop=3+Math.random()*5;
      L.b.ready=true;
      L.hit=mkBtn('t3-hit','',{'data-b':L.i,'data-sfx':'open','aria-label':CO[k].n+' Lv'+L.b.lv},()=>o.onTap(L.i));
      L.hit.addEventListener('pointerdown',()=>press(L));
      L.hit.addEventListener('focus',()=>{L.focus=true;v&&v.render()});L.hit.addEventListener('blur',()=>{L.focus=false;v&&v.render()});
      L.coin=mkBtn('coinb','<span>🪙</span><b>0</b>',{'data-c':L.i,'data-sfx':'coin','aria-label':'コインを回収',hidden:''},function(){o.onCoin(L.i,this)});
      const gb=G.b[L.i];if(gb){const st=gb.st;L.coin.hidden=!(st>=Math.max(6,income(L.i)*3));L.coin.querySelector('b').textContent=fmt(st)}
      if(drop&&!RM.matches)dropIn(L);
      fit();layout();v&&v.render();
    }).catch(()=>{if(!dead)o.fail()});
  }
  /* 演出 */
  function anim(dur,f,done){if(RM.matches){f(1);done&&done();return}anims.push({t:0,dur,f,done});v&&v.render()}
  function press(L){if(!L.wrap)return;anim(.2,k=>{const q=Math.sin(k*Math.PI);L.wrap.scale.set(1+.05*q,1-.08*q,1+.05*q)})}
  function dropIn(L){
    L.bw.visible=false;L.bsh.visible=false;L.g.position.y=3.2;
    anim(.45,k=>{L.g.position.y=3.2*(1-k*k);L.sh.scale.setScalar(.3+.52*k*k)},()=>{
      L.g.position.y=0;o.onLand(L.i);dust(L);
      anim(.5,k=>{const d=Math.exp(-5*k)*Math.cos(13*k);L.wrap.scale.set(1+.14*d,1-.3*d,1+.14*d)});
      later(()=>{if(dead)return;L.bw.visible=true;L.bsh.visible=true;
        anim(.45,k=>{const eb=1+2.7*Math.pow(k-1,3)+1.7*Math.pow(k-1,2);L.bw.scale.setScalar(Math.max(.001,eb));L.bw.position.y=.095+Math.sin(k*Math.PI)*.35})},250);
    });
  }
  function dust(L){
    if(RM.matches)return;
    const m=new THREE.Mesh(C.ring,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.85,depthWrite:false}));m.position.set(L.x,.11,L.z);scene.add(m);
    parts.push({m,age:0,life:.6,upd:(p,k)=>{p.m.scale.setScalar(1.2+k*2.2);p.m.material.opacity=.85*(1-k)},own:true});
  }
  function upgrade(L,lv){
    L.b.lv=lv;L.lv=lv;buildStack(L);if(L.hit)L.hit.setAttribute('aria-label',CO[L.b.k].n+' Lv'+lv);
    anim(.9,k=>{const d=Math.exp(-5*k)*Math.cos(14*k);L.wrap.scale.set(1+.16*d,1-.38*d,1+.16*d)});
    sparks(L.x,L.top*.7,L.z,C.spark,C.mat.spark,12,2.2);
    fit();
  }
  let coinT=null;K.load('coin').then(c=>{coinT=c}).catch(()=>{});
  function sparks(x,y,z,geo,mat,n,sp,tpl){
    if(RM.matches)return;
    for(let j=0;j<n;j++){const m=tpl?tpl.clone():new THREE.Mesh(geo,mat);if(tpl)m.scale.setScalar(.32);m.position.set(x,y,z);scene.add(m);
      const a=j/n*Math.PI*2+Math.random()*.4;const s0=m.scale.x;
      parts.push({m,age:0,life:.7+Math.random()*.25,vx:Math.cos(a)*sp*(.5+Math.random()*.5),vz:Math.sin(a)*sp*(.5+Math.random()*.5),vy:2.6+Math.random()*1.6,
        upd:(p,k,dt)=>{p.vy-=9*dt;p.m.position.x+=p.vx*dt*.5;p.m.position.z+=p.vz*dt*.5;p.m.position.y+=p.vy*dt;p.m.rotation.y+=dt*9;p.m.scale.setScalar(s0*(k>.6?1-(k-.6)/.4:1))}})}
    v&&v.render();
  }

  /* 状態との同期（差分だけ） */
  function sync(){
    if(dead)return;
    const placing=o.placing();
    lots.forEach(L=>{
      const b=G.b[L.i];
      if(b&&(!L.b||L.b.k!==b.k))addBld(L,b);
      else if(b&&L.b&&L.b.ready&&L.lv!==b.lv)upgrade(L,b.lv);
      const lock=LOCKED.includes(L.i);
      const mode=b?(b.syn&&L.i!==HQ?'syn':'built'):lock?'lock':placing?(ADJ.includes(L.i)?'psyn':'pick'):'empty';
      if(mode!==L.mode){L.mode=mode;
        const col={built:'#fbf1dc',syn:'#ffd99a',lock:'#93cf7a',psyn:'#ffc46b',pick:'#e9f8df',empty:'#b3e394'}[mode];
        L.mat.color.set(col);L.mat.emissive.set(mode==='psyn'?'#ff9a2a':mode==='pick'?'#ffffff':'#000000');L.mat.emissiveIntensity=0;
        L.plate.position.y=mode==='psyn'||mode==='pick'?.03:0;
      }
      if(L.strip)L.strip.visible=!!((b&&b.syn)||(placing&&!b));
      const want=placing&&!b&&!lock;
      if(want&&!L.slot){const syn=ADJ.includes(L.i);
        L.slot=mkBtn('slot'+(syn?' syn':''),syn?'⚡':'＋',{'data-p':L.i,'data-sfx':'none','aria-label':syn?'ここに配置（シナジー×1.5）':'ここに配置'},()=>o.onSlot(L.i))}
      else if(!want&&L.slot){L.slot.remove();L.slot=null}
    });
    fit();layout();v&&v.render();
  }

  /* カメラの枠合わせ：島と建物（＋コイン吹き出し）が HUD とガイドの間に収まるように */
  function fit(){
    if(dead)return;
    W=host.clientWidth;H=host.clientHeight;if(!W||!H)return;
    const sf=o.safe(),inv=cam.matrixWorldInverse,P=[],Bp=[];
    const pt=(x,y,z,arr)=>{V.set(x,y,z).applyMatrix4(inv);(arr||P).push([V.x,V.y])};
    const PX=[];C.outline.forEach(([x,z])=>{pt(x,.02,z);pt(x,-.4,z);pt(x*.9,.02,z*.9,PX)});
    lots.forEach(L=>{if(!L.b||!L.top)return;[-.5,.5].forEach(a=>[-.5,.5].forEach(c=>pt(L.x+a,L.top,L.z+c)));pt(L.x-.04,L.top+.1,L.z-.07,Bp)});
    const padX=W*.03,sw=W-padX*2,sh=Math.max(40,sf.bottom-sf.top),bub=o.bubblePx();
    let k=0,mnx,mxx,mny,mxy;
    for(let it=0;it<4;it++){
      mnx=mny=1e9;mxx=mxy=-1e9;
      P.forEach(([x,y])=>{mny=Math.min(mny,y);mxy=Math.max(mxy,y)});PX.concat(P.slice(C.outline.length*2)).forEach(([x])=>{mnx=Math.min(mnx,x);mxx=Math.max(mxx,x)});
      Bp.forEach(([x,y])=>{mxy=Math.max(mxy,y+bub*k)});
      k=Math.max((mxx-mnx)/sw,(mxy-mny)/sh);
    }
    const cx=(mnx+mxx)/2,cy=(mny+mxy)/2,scy=(sf.top+sf.bottom)/2;
    const l=cx-W/2*k,t=cy+scy*k;
    tgt={l,r:l+W*k,t,b:t-H*k};
    if(!fitted||RM.matches){fitted=true;applyCam(1)}
  }
  function applyCam(a){
    if(!tgt)return;
    cam.left+=(tgt.l-cam.left)*a;cam.right+=(tgt.r-cam.right)*a;cam.top+=(tgt.t-cam.top)*a;cam.bottom+=(tgt.b-cam.bottom)*a;cam.updateProjectionMatrix();
  }

  /* 重ねたボタンの位置 */
  function proj(x,y,z){V.set(x,y,z).project(cam);return [(V.x+1)/2*W,(1-V.y)/2*H]}
  function hull(pts){pts.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o2,a,b)=>(a[0]-o2[0])*(b[1]-o2[1])-(a[1]-o2[1])*(b[0]-o2[0]);
    const lo=[],up=[];pts.forEach(p=>{while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p)});
    for(let i=pts.length-1;i>=0;i--){const p=pts[i];while(up.length>1&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p)}
    return lo.slice(0,-1).concat(up.slice(0,-1))}
  const setS=(el,css)=>{if(el._css!==css){el._css=css;el.style.cssText=css}};
  function layout(){
    if(dead||!W)return;
    lots.forEach(L=>{
      if(L.b&&L.b.ready){
        const gy=L.g.position.y,top=L.top*L.wrap.scale.y+gy,pts=[];
        [-.6,.52].forEach(a=>[-.62,.5].forEach(c=>{pts.push(proj(L.x+a,gy+.08,L.z+c));pts.push(proj(L.x+a,top,L.z+c))}));
        [[.28,.34],[.72,.34],[.28,.78],[.72,.78]].forEach(([a,c])=>{pts.push(proj(L.x+a,.1,L.z+c));pts.push(proj(L.x+a,.6,L.z+c))});
        const h=hull(pts);let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;h.forEach(p=>{x0=Math.min(x0,p[0]);y0=Math.min(y0,p[1]);x1=Math.max(x1,p[0]);y1=Math.max(y1,p[1])});
        setS(L.hit,'left:'+x0.toFixed(1)+'px;top:'+y0.toFixed(1)+'px;width:'+(x1-x0).toFixed(1)+'px;height:'+(y1-y0).toFixed(1)+'px;z-index:'+(PLOTS[L.i][0]+PLOTS[L.i][1]+1)+
          ';clip-path:polygon('+h.map(p=>(p[0]-x0).toFixed(1)+'px '+(p[1]-y0).toFixed(1)+'px').join(',')+')');
        const c=proj(L.x-.04,top+.1,L.z-.07);
        setS(L.coin,'left:'+c[0].toFixed(1)+'px;top:'+c[1].toFixed(1)+'px');
      }
      if(L.slot){const c=proj(L.x,.12,L.z);setS(L.slot,'left:'+c[0].toFixed(1)+'px;top:'+c[1].toFixed(1)+'px')}
    });
    o.layout&&o.layout();
  }

  /* 毎フレーム */
  function tick(dt,t){
    if(dead)return;
    if(tgt)applyCam(1-Math.exp(-dt*7));
    for(let j=anims.length-1;j>=0;j--){const a=anims[j];a.t+=dt;const k=Math.min(1,a.t/a.dur);a.f(k);if(k>=1){anims.splice(j,1);a.done&&a.done()}}
    for(let j=parts.length-1;j>=0;j--){const p=parts[j];p.age+=dt;const k=Math.min(1,p.age/p.life);p.upd(p,k,dt);if(k>=1){scene.remove(p.m);if(p.own)p.m.material.dispose();parts.splice(j,1)}}
    const pulse=.5+.5*Math.sin(t*4);
    lots.forEach(L=>{
      if(L.mode==='psyn')L.mat.emissiveIntensity=.15+.35*pulse;else if(L.mode==='pick')L.mat.emissiveIntensity=.1+.2*pulse;
      if(L.strip&&L.strip.visible)L.strip.material.emissiveIntensity=.25+.45*pulse;
      if(!L.beast||!L.b||!L.b.ready)return;
      // 企業獣：ゆれ・まばたき・ときどきジャンプ
      let y=0,sy=1+Math.sin(t*3.2+L.ph)*.03,rz=Math.sin(t*1.7+L.ph)*.05;
      L.nextHop-=dt;if(L.nextHop<0&&L.hop<0){L.hop=0;L.nextHop=4+Math.random()*6}
      if(L.hop>=0){L.hop+=dt;const k=L.hop/.45;if(k>=1)L.hop=-1;else{y=Math.sin(k*Math.PI)*.16;sy=1+.08*Math.sin(k*Math.PI)}}
      L.beast.position.y=y;L.beast.scale.set(.5*(1-(sy-1)*.6),.5*sy,.5*(1-(sy-1)*.6));L.beast.rotation.z=rz;
      L.blink-=dt;const bl=L.blink<0&&L.blink>-.13?.12:1;if(L.blink<-.13)L.blink=2.2+Math.random()*3.5;L.eyes.forEach(e=>e.scale.y=bl);
      if(L.wrap&&!anims.length){const f=L.focus?1.05:1;L.wrap.scale.set(f,f,f)}
    });
    sway.forEach(s=>{s.m.rotation.z=Math.sin(t*1.3+s.ph)*s.amp});
    floaters.forEach(f=>{f.m.position.y=f.y+Math.sin(t*.9+f.ph)*.12;f.m.rotation.y+=dt*.2});
    layout();
  }

  const v=K.view(host,{scene,camera:cam,tick});
  if(!v){dead=true;return null}
  const ro=('ResizeObserver' in window)?new ResizeObserver(()=>{fit();layout();v.render()}):null;ro&&ro.observe(host);
  const vd=v.dispose.bind(v);
  v.dispose=function(){dead=true;try{ro&&ro.disconnect()}catch(e){}vd();
    parts.forEach(p=>{if(p.own)p.m.material.dispose()});lots.forEach(L=>{L.mat.dispose();L.strip&&L.strip.material.dispose()})};

  /* 読み込み（建物・企業獣・木）。そろったら表示 */
  const need=new Set(['tree_pine','tree_round','coin']);
  Object.values(G.b).forEach(b=>{need.add('bld_'+b.k);need.add(K.beastName(b.k))});
  if(G.pending){need.add('bld_'+G.pending);need.add(K.beastName(G.pending))}
  const ready=Promise.all([...need].map(n=>K.load(n))).then(()=>{
    if(dead)return;
    Object.keys(trees).forEach(i=>{const L=lots[i];trees[i].forEach(([n,x,z,s],j)=>K.load(n).then(m=>{if(dead)return;m.scale.setScalar(s);m.position.set(x,.095,z);m.rotation.y=j*1.3;L.g.add(m);sway.push({m,ph:j+i*1.0,amp:.025});shadow(s*.42,x,.1,z,L.g);v.render()}))});
    sync();
    host.classList.add('on');
  }).catch(()=>{if(!dead)o.fail()});

  return {sync,fit,layout,ready,render:()=>v.render(),
    burst(i){const L=lots[i];if(!L||!L.top||!coinT)return;sparks(L.x,L.top+.15,L.z,null,null,6,2.4,coinT)},
    nudge(i){const L=lots[i];if(L)press(L)},
    dispose(){v.dispose()}};
}

/* 建物シートの3Dプレビュー（共有レンダラーのビュー1つ） */
function town3dPreview(host,k,lv){
  if(!Kit3D.ready)return;
  try{
    const K=Kit3D,scene=new THREE.Scene();K.addLights(scene);
    const cam=new THREE.PerspectiveCamera(24,1,.1,60);
    const g=new THREE.Group();scene.add(g);
    Promise.all([K.load('bld_'+k),K.load(K.beastName(k))]).then(([bld,bst])=>{
      const s=K.stackBuilding(bld,lv);g.add(s);const top=new THREE.Box3().setFromObject(s).max.y;
      const sh=K.shadow(.8);g.add(sh);
      bst.scale.setScalar(.5);bst.position.set(.5,0,.58);bst.rotation.y=.45;g.add(bst);
      const h=Math.max(1.1,top),d=(h+.9)/(2*Math.tan(12*Math.PI/180));
      cam.position.set(d*.5,h*.42+d*.36,d*.79);cam.lookAt(0,h*.42,.15);
      const v=K.view(host,{scene,camera:cam,tick:(dt,t)=>{g.rotation.y=-.35+Math.sin(t*.7)*.3}});
      v&&v.render();
    }).catch(()=>{});
  }catch(e){}
}

S.town=function(){
  loadG();const away=accrue();
  let placing=!!G.pending;
  let mode=(typeof Kit3D!=='undefined'&&Kit3D.ready)?'3d':'dom';
  let T=null,dispCoins=G.coins,lastGuide=null,cuId=0;
  const el=mount(
    '<div class="t3-w" id="hudw"></div>'+
    '<div class="map" id="map"></div>'+
    '<div class="t3-sp"></div>'+
    '<span class="t3-fg" id="fg" hidden aria-hidden="true">👆</span>'+
    '<div class="tguide" id="guide"></div>'+
    '<div class="t3-w" id="navw"></div>','town'+(mode==='3d'?' t3':''));
  const mapEl=el.querySelector('#map');

  /* ---- HUD・クエスト・ナビ ---- */
  function hudHTML(){
    const q=QUESTS[G.q],flat=!questAct();
    return '<div class="thud"><div class="cp">'+beast(B[G.company])+'<div><b>'+CO[G.company].n+'</b><span class="rk">'+RANKS[G.rank]+'</span></div></div>'+
      '<div class="wal"><span class="coin" id="cw">🪙 <b id="cn">'+fmt(dispCoins)+'</b></span><span class="gem">💎 '+G.gems+'</span></div></div>'+
      '<div class="tstat"><span>📈 <b id="inc">'+num(totalInc())+'</b>/秒</span><span>🏢 '+Object.keys(G.b).length+'社</span></div>'+
      (flat?'<div class="quest flat done" id="quest">':'<button class="quest'+(G.q>=5?' done':'')+'" id="quest">')+
      '<span class="qi">'+(placing?'📍':q.ic)+'</span><span class="grow"><span class="qt">'+(placing?'⚡マスに配置しよう':q.t)+'</span>'+(q.need>1?'<span class="qb"><i style="width:'+(G.qn/q.need*100)+'%"></i></span>':'')+'</span>'+(q.need?'<span class="qr">🪙50</span>':'')+
      (flat?'</div>':'</button>');
  }
  function navHTML(){
    const items=[['town','🏙','街',0],['deal','🤝','M&A',2],['games','🎮','ミニゲーム',4],['shop','🛒','ショップ',5],['','☰','目次',0]];
    return '<nav class="tnav">'+items.map(it=>{const lock=G.q<it[3],hot=(it[3]===G.q&&it[3]>0&&it[0]!=='town');
      return '<button class="'+(it[0]==='town'?'on':'')+(hot?' hot':'')+(lock?' lock':'')+'" data-nav="'+it[0]+'"'+(lock?' data-sfx="ng" aria-label="'+it[2]+'（ロック中）"':'')+(it[0]==='town'?' aria-current="page"':'')+'><span class="ni">'+it[1]+(lock?'<i>🔒</i>':'')+'</span><span>'+it[2]+'</span></button>'}).join('')+'</nav>';
  }
  function num(v){return v.toFixed(1).replace('.0','')}
  function guide(){
    const g=el.querySelector('#guide');
    const msg=placing?'<b>⚡</b>はシナジーで収入×1.5！':
      ['コインを<b>タップで回収</b>！','<b>本社</b>をタップして強化しよう','<b>🤝M&A</b>で仲間を増やそう','','<b>🎮ミニゲーム</b>に挑戦！','おめでとう！自由に遊ぼう'][G.q];
    if(msg===lastGuide)return;lastGuide=msg;
    g.innerHTML=msg?tip(msg):'';
  }
  function draw(){
    placing=!!G.pending;
    const hw=el.querySelector('#hudw');hw.innerHTML=hudHTML();
    const qb=hw.querySelector('button#quest');if(qb)qb.addEventListener('click',questGo);
    const nw=el.querySelector('#navw');nw.innerHTML=navHTML();
    nw.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>navTo(b.dataset.nav)));
    guide();
    if(mode==='dom')drawDom();else if(T)T.sync();
    hint();
  }

  /* ---- 2D（フォールバック）の地図 ---- */
  function plotHTML(i){
    const p=isoPos(i),b=G.b[i];
    let s='';
    if(b){
      const h=10+b.lv*5,top=p.ty+7.5-28;
      s+='<button class="bld'+(b.drop?' drop':'')+'" data-b="'+i+'" data-sfx="open" style="z-index:'+(PLOTS[i][0]+PLOTS[i][1]+1)+';left:'+(p.cx-20.5)+'cqw;top:'+top+'cqw" aria-label="'+CO[b.k].n+' Lv'+b.lv+'">'+building(b.k,b.lv)+
        '<span class="mon" style="top:'+((41-h)*41/60-10.5)+'cqw">'+beast(B[b.k])+'</span>'+
        '<span class="lvl">Lv'+b.lv+'</span>'+(b.syn?'<span class="synb">⚡</span>':'')+'</button>';
      s+='<button class="coinb" data-c="'+i+'" data-sfx="coin" aria-label="コインを回収" style="left:'+(p.cx-5)+'cqw;top:'+(top+(41-h)*41/60-19)+'cqw"'+(b.st>=Math.max(6,income(i)*3)?'':' hidden')+'><span>🪙</span><b>'+fmt(b.st)+'</b></button>';
    }else if(LOCKED.includes(i)){
      s+='<span class="deco" style="left:'+(p.cx-6)+'cqw;top:'+(p.ty-4)+'cqw">🌲</span><span class="deco s" style="left:'+(p.cx+1)+'cqw;top:'+(p.ty+1)+'cqw">🌳</span>';
    }else if(placing){
      s+='<button class="slot'+(ADJ.includes(i)?' syn':'')+'" data-p="'+i+'" data-sfx="none" style="left:'+(p.cx-6)+'cqw;top:'+(p.ty+1.5)+'cqw" aria-label="ここに配置">'+(ADJ.includes(i)?'⚡':'＋')+'</button>';
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
  function drawDom(){
    mapEl.innerHTML=tiles()+PLOTS.map((_,i)=>plotHTML(i)).join('');
    mapEl.querySelectorAll('.coinb').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();collect(+b.dataset.c,b)}));
    mapEl.querySelectorAll('.bld').forEach(b=>b.addEventListener('click',()=>openB(+b.dataset.b)));
    mapEl.querySelectorAll('.slot').forEach(b=>b.addEventListener('click',()=>place(+b.dataset.p)));
  }
  function toDom(){
    if(mode==='dom')return;mode='dom';
    try{T&&T.dispose()}catch(e){}T=null;
    el.classList.remove('t3');mapEl.innerHTML='';draw();
  }

  /* ---- 3D ---- */
  if(mode==='3d'){
    mapEl.innerHTML='<div class="t3-sky" aria-hidden="true"><i class="t3-cl" style="top:27%;animation-delay:-20s"></i><i class="t3-cl" style="top:80%;width:16cqw;animation-duration:110s;animation-delay:-75s;opacity:.7"></i><i class="t3-cl" style="top:64%;width:20cqw;animation-duration:95s;animation-delay:-40s;opacity:.75"></i></div>'+
      '<div class="t3-host" id="m3"></div><div class="t3-ov" id="ov"></div>';
    T=town3d(mapEl.querySelector('#m3'),mapEl.querySelector('#ov'),{
      safe(){const sr=el.getBoundingClientRect(),q=el.querySelector('#quest'),g=el.querySelector('#guide .tip'),n=el.querySelector('.tnav');
        const top=(q?q.getBoundingClientRect().bottom:sr.top)-sr.top+sr.width*.02;
        const bot=((g?g.getBoundingClientRect().top:(n?n.getBoundingClientRect().top:sr.bottom)))-sr.top-sr.width*.02;
        return {top,bottom:bot}},
      bubblePx(){return el.getBoundingClientRect().width*.15},
      placing(){return placing},
      onTap(i){openB(i)},
      onCoin(i,btn){collect(i,btn)},
      onSlot(i){place(i)},
      onLand(){SFX.play('place')},
      layout(){hint(true)},
      fail(){toDom()}
    });
    if(!T)mode='dom',el.classList.remove('t3');
  }

  /* ---- 指アイコン：今のクエストで押す場所を示す ---- */
  function hintTarget(){
    if(G.q>=5)return null;
    if(placing)return [el.querySelector('.slot.syn'),0];
    if(G.q===0)return [el.querySelector('.coinb:not([hidden])'),0];
    if(G.q===1){const b=el.querySelector('.t3-hit[data-b="'+HQ+'"],.bld[data-b="'+HQ+'"]');return [b,0]}
    if(G.q===2||G.q===4)return [el.querySelector('.tnav .hot'),1];
    return null;
  }
  function hint(fast){
    const f=el.querySelector('#fg');if(!f)return;
    const t=hintTarget();
    if(!t||!t[0]||t[0].hidden||el.querySelector('.modal')){if(!f.hidden)f.hidden=true;return}
    const sr=el.getBoundingClientRect(),r=t[0].getBoundingClientRect();
    let x,y;
    if(t[0].classList.contains('t3-hit')){x=r.left+r.width*.45;y=r.top+r.height*.62}
    else if(t[0].classList.contains('bld')){x=r.left+r.width*.5;y=r.top+r.height*.6}
    else{x=r.left+r.width/2;y=t[1]?r.top:r.bottom-r.height*.12}
    const css='left:'+(x-sr.left).toFixed(1)+'px;top:'+(y-sr.top).toFixed(1)+'px';
    if(f._css!==css){f._css=css;f.style.cssText=css}
    const dn=!!t[1];if(f.classList.contains('dn')!==dn){f.classList.toggle('dn',dn);f.textContent=dn?'👇':'👆'}
    if(f.hidden)f.hidden=false;
  }

  /* ---- 時間経過 ---- */
  function tick(){
    accrue();
    Object.keys(G.b).forEach(i=>{const b=G.b[i],c=el.querySelector('.coinb[data-c="'+i+'"]');if(!c)return;
      const show=b.st>=Math.max(6,income(i)*3);if(c.hidden===show)c.hidden=!show;c.querySelector('b').textContent=fmt(b.st)});
    saveG();hint();
  }
  /* コイン表示のカウントアップ */
  function countUp(){
    const from=dispCoins,to=G.coins;if(from===to)return;
    const w=el.querySelector('#cw');if(w){w.classList.remove('t3-bump');void w.offsetWidth;w.classList.add('t3-bump')}
    const t0=performance.now(),id=++cuId;
    const step=now=>{if(id!==cuId)return;if(!el.isConnected){dispCoins=G.coins;return}const k=Math.min(1,(now-t0)/550);dispCoins=Math.round(from+(to-from)*(1-Math.pow(1-k,3)));
      const n=el.querySelector('#cn');if(n)n.textContent=fmt(dispCoins);if(k<1)requestAnimationFrame(step);else dispCoins=G.coins};
    requestAnimationFrame(step);
  }
  function collect(i,btn){
    const b=G.b[i];const v=Math.floor(b.st);if(v<=0)return;b.st=0;G.coins+=v;
    const r=btn.getBoundingClientRect(),sr=el.getBoundingClientRect();
    const f=document.createElement('div');f.className='fly';f.textContent='+'+v;f.style.left=(r.left-sr.left)+'px';f.style.top=(r.top-sr.top)+'px';el.appendChild(f);later(()=>f.remove(),900);
    btn.hidden=true;
    if(T)T.burst(i);
    const adv=questDone(0);saveG();
    countUp();
    if(adv)reward('🪙','クエスト達成！','+50 コイン');else if(G.q===0)draw();else hint();
  }
  function closeModal(m,snd){if(!m.isConnected)return;if(snd)SFX.play('close');m.remove();hint()}
  function openB(i){
    const b=G.b[i],c=CO[b.k],cost=upCost(b),max=b.lv>=5,can=G.coins>=cost&&!max;
    const nxt=max?0:c.inc*(b.lv+1)*(b.syn?1.5:1);
    const m=document.createElement('div');m.className='modal';
    m.innerHTML='<div class="sheet dark-sheet t3-sh" role="dialog" aria-modal="true" aria-label="'+c.n+'">'+
      '<div class="t3-hd"><div class="t3-pv" id="pv">'+building(b.k,b.lv)+'</div><div class="grow">'+
        '<p class="tn">'+c.ic+' '+c.n+'</p>'+
        '<div class="t3-pips" aria-label="レベル '+b.lv+' / 5">'+[1,2,3,4,5].map(n=>'<i class="'+(n<=b.lv?'on':'')+'"></i>').join('')+'</div>'+
        '<div class="tags"><b class="mono">Lv'+b.lv+'</b>'+(b.hq?'<span class="t3-tag">🏢 本社</span>':'')+(b.syn?'<span class="t3-tag">⚡ ×1.5</span>':'')+'</div></div></div>'+
      '<div class="stats">'+
        '<div><span>📈</span><b>'+num(income(i))+(max?'':'<small>→</small>'+num(nxt))+'</b><i>収入 /秒</i></div>'+
        '<div><span>📦</span><b>'+fmt(cap(i))+(max?'':'<small>→</small>'+fmt(nxt*30))+'</b><i>貯蔵上限</i></div></div>'+
      '<div class="t3-act"><button class="btn sub" data-close data-sfx="close">閉じる</button>'+
        '<button class="btn" id="up" data-sfx="up" '+(can?'':'disabled')+'>'+(max?'MAX':'⬆️ 🪙'+fmt(cost))+'</button></div></div>';
    el.appendChild(m);SFX.play('open');hint();
    town3dPreview(m.querySelector('#pv'),b.k,b.lv);
    m.addEventListener('click',e=>{if(e.target===m)closeModal(m,true);else if(e.target.closest('[data-close]'))closeModal(m)});
    const ub=m.querySelector('#up');
    try{(can?ub:m.querySelector('[data-close]')).focus({preventScroll:true})}catch(e){}
    ub.addEventListener('click',()=>{
      if(G.coins<cost||b.lv>=5)return;
      G.coins-=cost;b.lv++;const adv=b.hq&&b.lv>=2?questDone(1):false;saveG();m.remove();
      countUp();draw();
      if(mode==='dom'){const e=el.querySelector('.bld[data-b="'+i+'"]');if(e)e.classList.add('pulse')}
      if(adv)later(()=>reward('⬆️','クエスト達成！','+50 コイン'),450);
    });
  }
  function place(i){
    if(!G.pending||G.b[i])return;
    const k=G.pending;G.pending=null;placing=false;
    const syn=ADJ.includes(i);G.b[i]={k,lv:1,st:0,syn,drop:true};G.b[HQ].syn=G.b[HQ].syn||syn;G.syn=syn;
    questDone(3);G.rank=1;saveG();
    draw();
    if(mode==='dom')later(()=>SFX.play('place'),480);
    later(()=>{if(G.b[i])delete G.b[i].drop;saveG();merits(syn,k)},1250);
  }
  function merits(syn,k){
    const gv={S:9.6,A:8.0,B:6.2,C:4.0}[G.grade]||8;
    const m=document.createElement('div');m.className='modal center';
    m.innerHTML='<div class="sheet dark-sheet pop t3-md" role="dialog" aria-modal="true" aria-label="M&A成功">'+
      '<div class="t3-b3" data-beast3d="'+k+'" data-mood="smile" style="width:36%">'+beast(B[k])+'</div>'+
      '<p class="disp" style="font-size:1.6em;line-height:1.2">🎉 M&A成功！</p>'+
      '<div class="mgrid">'+
      '<div><span>🏢</span><b>+1社</b><i>グループ</i></div>'+
      '<div><span>📈</span><b>'+num(totalInc())+'/秒</b><i>収入</i></div>'+
      '<div><span>⚡</span><b>'+(syn?'×1.5':'—')+'</b><i>シナジー</i></div>'+
      '<div><span>💰</span><b>+'+(gv*(syn?1.5:1)).toFixed(1)+'億</b><i>企業価値</i></div>'+
      '<div><span>🎖</span><b>昇格</b><i>'+RANKS[G.rank]+'</i></div>'+
      '<div><span>🎮</span><b>解放</b><i>ミニゲーム</i></div></div>'+
      (syn?'':'<p class="xs muted">⚡マスに置くと収入×1.5</p>')+
      '<button class="btn" data-close data-sfx="close">🏙 街へ</button></div>';
    el.appendChild(m);SFX.play('win');hint();
    try{m.querySelector('[data-close]').focus({preventScroll:true})}catch(e){}
    m.addEventListener('click',e=>{if(e.target.closest('[data-close]')){m.remove();draw()}});
  }
  function reward(ic,t,v){
    const m=document.createElement('div');m.className='rwd';m.innerHTML='<span>'+ic+'</span><b>'+t+'</b><i>'+v+'</i>';
    el.appendChild(m);SFX.play('ok');countUp();draw();
    later(()=>m.remove(),1300);
  }
  function toast(t){const f=document.createElement('div');f.className='toast';f.textContent=t;el.appendChild(f);later(()=>f.remove(),1100)}
  function navTo(t){
    const lock={deal:2,games:4,shop:5}[t];
    if(t==='town')return;
    if(lock!==undefined&&G.q<lock)return toast('🔒 クエストを進めると解放');
    if(t==='games'){questDone(4);saveG();return go('minigame')}
    go(t);
  }
  /* クエスト札：開けるものがあれば開く。ステップ0は回収するコインを揺らして示す */
  function questAct(){
    if(G.q===0||G.q===3)return true;
    return !!{1:1,2:1,4:1,5:1}[G.q];
  }
  function questGo(){
    if(G.q===0||(G.q===3&&placing)){
      const sel=G.q===0?'.coinb:not([hidden])':'.slot';
      const els=el.querySelectorAll(sel);
      if(els.length)els.forEach(b=>{b.classList.remove('nudge');void b.offsetWidth;b.classList.add('nudge');later(()=>b.classList.remove('nudge'),800)});
      else if(T)T.nudge(HQ);
      return;
    }
    ({1:()=>openB(HQ),2:()=>go('deal'),3:()=>go('deal'),4:()=>navTo('games'),5:()=>go('shop')}[G.q]||(()=>{}))();
  }

  draw();
  every(tick,500);
  if(G.welcome){G.welcome=false;saveG();
    const m=document.createElement('div');m.className='modal center';
    m.innerHTML='<div class="sheet dark-sheet pop t3-md" role="dialog" aria-modal="true" aria-label="起業">'+
      '<p class="disp" style="font-size:1.7em;line-height:1.2">'+CO[G.company].ic+' 起業！</p>'+
      '<div class="t3-b3" data-beast3d="'+G.company+'" data-mood="smile" style="width:44%">'+beast(B[G.company])+'</div>'+
      '<p class="t3-co">'+CO[G.company].n+'</p>'+
      '<div class="mgrid two"><div><span>🪙</span><b>'+fmt(G.coins)+'</b><i>資本金</i></div><div><span>📈</span><b>'+num(totalInc())+'/秒</b><i>収入</i></div></div>'+
      '<button class="btn" data-close data-sfx="start">▶ スタート</button></div>';
    el.appendChild(m);hint();
    try{m.querySelector('[data-close]').focus({preventScroll:true})}catch(e){}
    m.addEventListener('click',e=>{if(e.target.closest('[data-close]')){m.remove();hint()}});
  }else if(away>20&&!G.pending){
    const v=Math.floor(Object.keys(G.b).reduce((a,i)=>a+G.b[i].st,0));
    if(v>0){const f=document.createElement('div');f.className='rwd';f.innerHTML='<span>💤</span><b>留守中も稼いだ！</b><i>🪙 '+fmt(v)+'</i>';el.appendChild(f);later(()=>f.remove(),1600)}
  }
};

/* ---------- 成功メリット：街へ配置 ---------- */
S.merit=function(){
  loadG();
  if(!Object.values(G.b).some(b=>b.k==='machi')&&!G.pending){G.pending='machi';if(G.q<3){G.q=3;G.qn=0}}
  saveG();go('town');
};
