'use strict';
/* 3D表示キット（three.js + GLB）。
   - GLBは assets/models.js の MODELS_B64（base64）から読む（file:// でも動く）。
   - WebGLの文脈は1つだけ作り、各ビューへは2Dキャンバスに drawImage で写す（ブラウザの上限対策）。
   - 使えない環境では ready=false のまま。各画面は中のSVG表示にフォールバックする。例外は外に出さない。
   API:
     Kit3D.ready                      … 3Dが使えるか
     Kit3D.load(name)                 … Promise<THREE.Object3D>（毎回クローン。例 'beast_pan','bld_it','coin'）
     Kit3D.addLights(scene)           … 標準ライト（半球光＋暖色キー＋補助光＋環境マップ）
     Kit3D.setMood(obj, mood)         … 'smile'|'worry'|'o'
     Kit3D.stackBuilding(bld, level)  … Base＋Floor×(level-1, 最大4)＋Roof を積んだ Group
     Kit3D.view(host, {scene, camera, tick(dt,t), onTap(ev)}) … 共有レンダラーで描くビューを作る（戻り値 {dispose, render}）
     Kit3D.scan(root)                 … [data-beast3d] を3D表示に置き換える（何度呼んでもよい） */
const Kit3D=(()=>{
  const K={ready:false,H:{base:.5,floor:.35},
    load(){return Promise.reject(new Error('3D unavailable'))},
    addLights(){},setMood(){},stackBuilding(o){return o},view(){return null},scan(){},
    beastName(k){return k==='owl'?'owl':'beast_'+k}};
  let R=null;
  try{
    if(typeof THREE!=='undefined'&&THREE.GLTFLoader&&typeof MODELS_B64!=='undefined'&&Object.keys(MODELS_B64).length){
      const cv=document.createElement('canvas');
      R=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true,powerPreference:'low-power'});
      if(!R.getContext())R=null;
    }
  }catch(e){R=null}
  if(!R)return K;

  R.setPixelRatio(1);
  R.outputColorSpace=THREE.SRGBColorSpace;
  R.toneMapping=THREE.NeutralToneMapping;
  R.toneMappingExposure=1.05;
  R.setClearColor(0x000000,0);
  R.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();K.ready=false});

  const reduced=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)')}catch(e){return {matches:false}}})();
  const DPR=()=>Math.min(2,window.devicePixelRatio||1);

  /* ---------- モデル読み込み ---------- */
  const loader=new THREE.GLTFLoader();
  const src={};
  function b64buf(s){const bin=atob(s),n=bin.length,u=new Uint8Array(n);for(let i=0;i<n;i++)u[i]=bin.charCodeAt(i);return u.buffer}
  function parse(name){
    if(!src[name])src[name]=new Promise((res,rej)=>{
      const b=MODELS_B64[name];if(!b){rej(new Error('no model '+name));return}
      try{loader.parse(b64buf(b),'',g=>{
        const s=g.scene;s.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false}});res(s)},rej)}catch(e){rej(e)}
    });
    return src[name];
  }
  K.load=function(name){
    return parse(name).then(s=>{const o=s.clone(true);o.name=name;if(o.getObjectByName('Mouth_smile'))K.setMood(o,'smile');return o});
  };
  K.setMood=function(obj,mood){
    try{['smile','worry','o'].forEach(m=>{const n=obj.getObjectByName('Mouth_'+m);if(n)n.visible=(m===(mood||'smile'))})}catch(e){}
  };
  K.stackBuilding=function(bld,level){
    const g=new THREE.Group();
    try{
      const b=bld.getObjectByName('Base'),f=bld.getObjectByName('Floor'),r=bld.getObjectByName('Roof');
      const n=Math.max(0,Math.min(4,(level|0)-1));
      if(b){const c=b.clone(true);c.position.set(b.position.x,0,b.position.z);g.add(c)}
      for(let i=0;f&&i<n;i++){const c=f.clone(true);c.position.set(f.position.x,K.H.base+K.H.floor*i,f.position.z);g.add(c)}
      if(r){const c=r.clone(true);c.position.set(r.position.x,K.H.base+K.H.floor*n,r.position.z);g.add(c)}
      g.userData.height=K.H.base+K.H.floor*n;
    }catch(e){}
    return g;
  };

  /* ---------- ライト ---------- */
  let env=null;
  function envMap(){
    if(env!==null)return env;
    try{
      const s=new THREE.Scene(),geo=new THREE.SphereGeometry(10,32,16),cols=[],p=geo.attributes.position;
      const top=new THREE.Color('#fff1d6'),mid=new THREE.Color('#f2b27a'),bot=new THREE.Color('#3a2a3a'),c=new THREE.Color();
      for(let i=0;i<p.count;i++){const y=p.getY(i)/10;if(y>0)c.copy(mid).lerp(top,Math.pow(y,.6));else c.copy(mid).lerp(bot,Math.min(1,-y*1.6));cols.push(c.r,c.g,c.b)}
      geo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
      s.add(new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));
      const panel=(x,y,z,w,h,col,int)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(int),side:THREE.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);s.add(m)};
      panel(5,7,6,6,4,'#fff0d0',3);panel(-7,3,-3,4,4,'#bcd0ff',1.2);
      const pm=new THREE.PMREMGenerator(R);env=pm.fromScene(s,.04).texture;pm.dispose();
    }catch(e){env=false}
    return env;
  }
  K.addLights=function(scene){
    try{
      const hemi=new THREE.HemisphereLight(0xfff2dc,0x5a4038,1.25);scene.add(hemi);
      const key=new THREE.DirectionalLight(0xffdcae,2.3);key.position.set(2.2,4,3.2);scene.add(key);
      const fill=new THREE.DirectionalLight(0xa9c2ff,.55);fill.position.set(-3.5,1.6,1.2);scene.add(fill);
      const rim=new THREE.DirectionalLight(0xffc98a,.9);rim.position.set(-1,2.5,-3.5);scene.add(rim);
      const e=envMap();if(e){scene.environment=e;scene.environmentIntensity=.45}
      return {hemi,key,fill,rim};
    }catch(e){return null}
  };

  /* ---------- 共有レンダラーのビュー ---------- */
  const views=new Set();
  let raf=0,last=0;
  function View(host,o){
    this.host=host;this.scene=o.scene;this.camera=o.camera;this.tick=o.tick||null;this.onTap=o.onTap||null;
    this.t=0;this.dirty=true;this.shown=false;this.visible=true;
    const cv=this.canvas=document.createElement('canvas');
    cv.className='k3d-canvas';
    cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:manipulation;';
    if(getComputedStyle(host).position==='static')host.style.position='relative';
    const inBtn=!!host.closest('button,a,[role=button]');
    if(inBtn||!this.onTap)cv.style.pointerEvents='none';
    else cv.addEventListener('pointerdown',ev=>{try{this.onTap(ev)}catch(e){}});
    host.appendChild(cv);
    this.ctx=cv.getContext('2d');
    if('IntersectionObserver' in window){
      this.io=new IntersectionObserver(es=>{es.forEach(e=>{this.visible=e.isIntersecting;if(this.visible){this.dirty=true;kick()}})});
      this.io.observe(host);
    }
  }
  View.prototype.dispose=function(){
    views.delete(this);try{this.io&&this.io.disconnect()}catch(e){}
    try{this.canvas.remove()}catch(e){}
    try{this.host.__k3d=null;if(this.host.dataset)delete this.host.dataset.k3d;showFallback(this.host,true)}catch(e){}
    if(this.scene&&this.ownScene)this.scene.traverse(o=>{if(o.geometry&&o.userData.k3dOwn)o.geometry.dispose()});
  };
  View.prototype.render=function(){this.dirty=true;kick()};
  View.prototype.draw=function(dt){
    const host=this.host,w=host.clientWidth,h=host.clientHeight;
    if(!w||!h)return;
    const d=DPR(),pw=Math.min(1024,Math.round(w*d)),ph=Math.min(1024,Math.round(h*d));
    if(this.canvas.width!==pw||this.canvas.height!==ph){this.canvas.width=pw;this.canvas.height=ph;this.dirty=true}
    if(this.camera.isPerspectiveCamera&&Math.abs(this.camera.aspect-w/h)>1e-3){this.camera.aspect=w/h;this.camera.updateProjectionMatrix()}
    if(this.tick&&!reduced.matches){try{this.tick(dt,this.t+=dt)}catch(e){}this.dirty=true}
    else if(this.tick&&!this.shown){try{this.tick(0,0)}catch(e){}}
    if(!this.dirty)return;
    const s=R.getSize(tmpV);
    if(s.x<pw||s.y<ph)R.setSize(Math.max(s.x,pw),Math.max(s.y,ph),false);
    const S=R.getSize(tmpV);
    R.setViewport(0,S.y-ph,pw,ph);R.setScissor(0,S.y-ph,pw,ph);R.setScissorTest(true);
    R.clear();R.render(this.scene,this.camera);
    this.ctx.clearRect(0,0,pw,ph);
    this.ctx.drawImage(R.domElement,0,0,pw,ph,0,0,pw,ph);
    this.dirty=false;
    if(!this.shown){this.shown=true;showFallback(host,false)}
  };
  const tmpV=new THREE.Vector2();
  function showFallback(host,show){
    Array.from(host.children).forEach(c=>{if(c.classList&&c.classList.contains('k3d-canvas'))return;c.style.visibility=show?'':'hidden'});
  }
  function loop(now){
    raf=0;
    if(document.hidden||!K.ready)return;
    const dt=Math.min(.05,last?(now-last)/1000:0);last=now;
    let any=false;
    views.forEach(v=>{
      if(!v.host.isConnected){v.dispose();return}
      if(!v.visible)return;
      try{v.draw(dt)}catch(e){}
      if(v.tick&&!reduced.matches)any=true;
    });
    if(any)raf=requestAnimationFrame(loop);else last=0;
  }
  function kick(){if(!raf&&!document.hidden)raf=requestAnimationFrame(loop)}
  document.addEventListener('visibilitychange',()=>{last=0;if(!document.hidden){views.forEach(v=>v.dirty=true);kick()}});
  window.addEventListener('resize',()=>{views.forEach(v=>v.dirty=true);kick()});
  try{reduced.addEventListener('change',()=>{views.forEach(v=>v.dirty=true);kick()})}catch(e){}

  K.view=function(host,o){
    try{const v=new View(host,o||{});views.add(v);kick();return v}catch(e){return null}
  };

  /* ---------- 企業獣の3D表示（data-beast3d） ---------- */
  let shadowTex=null;
  function blobShadow(r){
    if(!shadowTex){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');
      const g=x.createRadialGradient(32,32,2,32,32,31);g.addColorStop(0,'rgba(30,15,10,.42)');g.addColorStop(.6,'rgba(30,15,10,.18)');g.addColorStop(1,'rgba(30,15,10,0)');
      x.fillStyle=g;x.fillRect(0,0,64,64);shadowTex=new THREE.CanvasTexture(c);shadowTex.colorSpace=THREE.SRGBColorSpace}
    const m=new THREE.Mesh(new THREE.PlaneGeometry(r*2,r*2),new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false}));
    m.rotation.x=-Math.PI/2;m.position.y=.002;m.renderOrder=-1;return m;
  }
  K.shadow=blobShadow;

  function beastView(host){
    const key=host.dataset.beast3d,name=K.beastName(key);
    if(!MODELS_B64[name])return;
    host.dataset.k3d='1';
    const scene=new THREE.Scene();K.addLights(scene);
    const cam=new THREE.PerspectiveCamera(28,1,.1,20);
    cam.position.set(0,.78,2.75);cam.lookAt(0,.5,0);
    const pivot=new THREE.Group();scene.add(pivot);scene.add(blobShadow(.48));
    const spin=host.dataset.spin||'auto';
    let model=null,eyes=[],hop=-1,blink=2+Math.random()*3,yaw=0,vel=0,drag=null;
    const st={};
    const v=K.view(host,{scene,camera:cam,
      onTap:ev=>{if(spin==='drag'){drag={x:ev.clientX,y0:yaw,moved:false};return}doHop()},
      tick:(dt,t)=>{
        if(!model)return;
        const ph=st.ph||(st.ph=Math.random()*6);
        let y=0,sx=1,sy=1,rz=Math.sin(t*1.7+ph)*.035;
        sy=1+Math.sin(t*3.2+ph)*.018;sx=1-(sy-1)*.6;
        if(hop>=0){hop+=dt;const k=hop/.5;
          if(k>=1)hop=-1;else{
            if(k<.15){const q=k/.15;sy=1-.16*Math.sin(q*Math.PI/2);sx=1+.12*Math.sin(q*Math.PI/2)}
            else if(k<.8){const q=(k-.15)/.65;y=Math.sin(q*Math.PI)*.22;sy=1+.08*Math.sin(q*Math.PI);sx=1-.05*Math.sin(q*Math.PI)}
            else{const q=(k-.8)/.2;sy=1-.1*Math.sin(q*Math.PI);sx=1+.08*Math.sin(q*Math.PI)}}}
        if(spin==='auto')yaw=Math.sin(t*.45+ph)*.55;
        else if(spin==='drag'&&!drag){yaw+=vel*dt;vel*=Math.pow(.04,dt)}
        pivot.position.y=y;pivot.scale.set(sx,sy,sx);pivot.rotation.set(0,yaw,rz);
        blink-=dt;const bl=blink<0&&blink>-.13?.12:1;if(blink<-.13)blink=2.5+Math.random()*3.5;
        eyes.forEach(e=>e.scale.y=bl);
      }});
    if(!v)return;
    host.__k3d=v;
    function doHop(){hop=0;v.render();try{if(typeof SFX!=='undefined')SFX.play('tap')}catch(e){}}
    if(spin==='drag'){
      v.canvas.style.touchAction='pan-y';
      v.canvas.addEventListener('pointermove',ev=>{if(!drag)return;const dx=ev.clientX-drag.x;if(Math.abs(dx)>4)drag.moved=true;const ny=drag.y0+dx*.012;vel=(ny-yaw)/.016;yaw=ny});
      const up=()=>{if(drag&&!drag.moved)doHop();drag=null};
      v.canvas.addEventListener('pointerup',up);v.canvas.addEventListener('pointercancel',()=>{drag=null});v.canvas.addEventListener('pointerleave',()=>{drag=null});
    }
    K.load(name).then(o=>{
      model=o;pivot.add(o);K.setMood(o,host.dataset.mood||'smile');
      eyes=['Eye_L','Eye_R'].map(n=>o.getObjectByName(n)).filter(Boolean);
      if(spin==='none'||reduced.matches)pivot.rotation.y=0;
      v.render();
    }).catch(()=>{v.dispose()});
    // data-mood の変更に追従
    try{new MutationObserver(()=>{if(model){K.setMood(model,host.dataset.mood||'smile');v.render()}}).observe(host,{attributes:true,attributeFilter:['data-mood']})}catch(e){}
  }

  K.scan=function(root){
    if(!K.ready)return;
    try{
      root=root||document.body;if(!root)return;
      const list=[];
      if(root.matches&&root.matches('[data-beast3d]'))list.push(root);
      if(root.querySelectorAll)list.push(...root.querySelectorAll('[data-beast3d]'));
      list.forEach(h=>{if(h.__k3d||h.dataset.k3d)return;try{beastView(h)}catch(e){}});
    }catch(e){}
  };

  K.ready=true;
  K.renderer=R;

  // 自動スキャン（DOMContentLoaded + 追加ノードの監視。安価に、1フレームにまとめる）
  let pend=[],sched=false;
  function flush(){sched=false;const p=pend;pend=[];p.forEach(n=>{if(n.isConnected)K.scan(n)})}
  function start(){
    K.scan(document.body);
    try{new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes){if(n.nodeType===1&&(n.hasAttribute('data-beast3d')||n.firstElementChild)){pend.push(n)}}
      if(pend.length&&!sched){sched=true;requestAnimationFrame(flush)}}).observe(document.body,{childList:true,subtree:true})}catch(e){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  return K;
})();
