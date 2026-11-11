'use strict';
/* サウンド（効果音）。Web Audio の合成音のみ（音声ファイルなし）。ui-guidelines §3.4
   使い方: SFX.play(name) / SFX.toggle() / SFX.setMuted(b) / SFX.muted / SFX.haptic(ms)
   name: tap select ok ng coin up place open close step win start
   ・<button> / [role=button] のクリックで自動的に tap。data-sfx="名前" で差し替え、"none" で無音。
   ・同じクリック中に画面側が SFX.play を呼んだら自動 tap は鳴らさない（二重防止）。
   ・[data-mute] の要素は 🔊/🔇 表示と消音切り替えボタンになる。設定は localStorage 'dt-muted'。 */
const SFX=(()=>{
  const AC=window.AudioContext||window.webkitAudioContext;
  const KEY='dt-muted', MAX_VOICES=6, THROTTLE_MS=40;
  let ctx=null, bus=null, explicitCount=0;
  const last={}, voiceEnds=[];

  /* ---- 出力経路: 音色 → マスター音量 → ローパス（角を丸める）→ コンプレッサー → 出力 ---- */
  function chain(c){
    const g=c.createGain(); g.gain.value=0.3;
    const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=5200; lp.Q.value=0.5;
    const cp=c.createDynamicsCompressor();
    cp.threshold.value=-12; cp.knee.value=8; cp.ratio.value=8; cp.attack.value=0.003; cp.release.value=0.15;
    g.connect(lp); lp.connect(cp); cp.connect(c.destination);
    return g;
  }

  /* ---- 音の部品 ---- */
  // マリンバ風の1音: 基音（サイン）＋ 4倍音（すぐ減衰）
  function note(c,o,t,f,dur,vol,type){
    vol=vol||0.6;
    tone(c,o,t,f,dur,vol,type||'sine');
    tone(c,o,t,f*4,Math.min(dur,0.06),vol*0.12,'sine');
  }
  function tone(c,o,t,f,dur,vol,type,f2){
    const osc=c.createOscillator(), g=c.createGain();
    osc.type=type; osc.frequency.setValueAtTime(f,t);
    if(f2) osc.frequency.exponentialRampToValueAtTime(f2,t+dur);
    g.gain.setValueAtTime(0.0001,t);
    g.gain.linearRampToValueAtTime(vol,t+0.006);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    osc.connect(g); g.connect(o); osc.start(t); osc.stop(t+dur+0.02);
  }
  // やわらかい低音のドン（音程が下がるサイン）
  const thump=(c,o,t,f0,f1,dur,vol)=>tone(c,o,t,f0,dur,vol,'sine',f1);
  const chord=(c,o,t,fs,dur,vol)=>fs.forEach(f=>note(c,o,t,f,dur,vol));

  /* ---- 音のレシピ: [長さ(秒), 合成関数(c,出力,開始時刻,ゆらぎ)] ---- */
  const R={
    tap:   [0.07,(c,o,t,r)=>note(c,o,t,880*r,0.065,0.85)],
    select:[0.16,(c,o,t)=>{note(c,o,t,659,0.08,0.45);note(c,o,t+0.06,988,0.1,0.45)}],
    ok:    [0.36,(c,o,t)=>{note(c,o,t,659,0.12,0.5);note(c,o,t+0.08,880,0.14,0.5);note(c,o,t+0.16,1319,0.2,0.4)}],
    ng:    [0.32,(c,o,t)=>{thump(c,o,t,200,120,0.13,0.7);thump(c,o,t+0.15,170,95,0.16,0.7)}],
    coin:  [0.38,(c,o,t,r)=>{note(c,o,t,988*r,0.09,0.4,'triangle');note(c,o,t+0.07,1319*r,0.3,0.45,'triangle')}],
    up:    [0.62,(c,o,t)=>{tone(c,o,t,320,0.36,0.32,'triangle',1250);
             [1568,2093,2637].forEach((f,i)=>note(c,o,t+0.3+i*0.07,f,0.22,0.3))}],
    place: [0.36,(c,o,t)=>{thump(c,o,t,150,55,0.16,0.8);note(c,o,t+0.05,1047,0.3,0.35)}],
    open:  [0.22,(c,o,t)=>{tone(c,o,t,523,0.2,0.6,'sine',784);note(c,o,t+0.06,1047,0.14,0.2)}],
    close: [0.2, (c,o,t)=>{tone(c,o,t,784,0.18,0.7,'sine',494)}],
    step:  [0.16,(c,o,t)=>{note(c,o,t,740,0.15,0.75);note(c,o,t,1109,0.1,0.25)}],
    win:   [0.95,(c,o,t)=>{[523,659,784,1047].forEach((f,i)=>note(c,o,t+i*0.09,f,0.22,0.45));
             chord(c,o,t+0.4,[1047,1319,1568],0.52,0.28);note(c,o,t+0.4,523,0.5,0.3,'triangle')}],
    start: [0.6, (c,o,t)=>{[392,523,659].forEach((f,i)=>note(c,o,t+i*0.08,f,0.14,0.45));
             chord(c,o,t+0.25,[784,988],0.34,0.35)}],
  };
  const HAPTIC={ok:12,ng:[18,50,18],win:30};

  /* ---- AudioContext は最初の操作で作る・再開する（自動再生ポリシー対応） ---- */
  function unlock(){
    try{
      if(!AC) return;
      if(!ctx){ctx=new AC();bus=chain(ctx)}
      if(ctx.state==='suspended') ctx.resume();
    }catch(e){ctx=null}
  }
  ['pointerdown','keydown','touchend'].forEach(ev=>document.addEventListener(ev,unlock,true));

  function render(name,c,out,t){
    const rec=R[name]; if(!rec) return 0;
    const r=(name==='tap'||name==='coin')?1+(Math.random()-0.5)*0.06:1; // 繰り返しで疲れないよう微妙に音程をゆらす
    rec[1](c,out,t,r); return rec[0];
  }
  function playRaw(name){
    try{
      if(api.muted||!ctx||!R[name]) return;
      const now=performance.now();
      if(now-(last[name]||0)<THROTTLE_MS) return; // 同じ音の連打を間引く
      const t=ctx.currentTime;
      for(let i=voiceEnds.length-1;i>=0;i--) if(voiceEnds[i]<=t) voiceEnds.splice(i,1);
      if(voiceEnds.length>=MAX_VOICES) return;     // 同時発音の上限
      last[name]=now;
      voiceEnds.push(t+render(name,ctx,bus,t+0.005));
      if(HAPTIC[name]) api.haptic(HAPTIC[name]);
    }catch(e){}
  }

  /* ---- 消音（保存・[data-mute] の表示同期） ---- */
  function load(){try{return localStorage.getItem(KEY)==='1'}catch(e){return false}}
  function sync(){
    document.querySelectorAll('[data-mute]').forEach(b=>{
      const ic=api.muted?'🔇':'🔊', p=String(api.muted);
      if(b.textContent!==ic) b.textContent=ic;
      if(b.getAttribute('aria-pressed')!==p) b.setAttribute('aria-pressed',p);
    });
  }

  const api={
    muted:load(),
    play(name,opts){explicitCount++;playRaw(name)},
    setMuted(m){
      api.muted=!!m;
      try{localStorage.setItem(KEY,api.muted?'1':'0')}catch(e){}
      sync();
      if(!api.muted){unlock();playRaw('tap')} // 解除の確認音
      return api.muted;
    },
    toggle(){return api.setMuted(!api.muted)},
    haptic(ms){try{if(!api.muted&&navigator.vibrate) navigator.vibrate(ms)}catch(e){}},
    names:Object.keys(R),
    _render:render, _chain:chain, _dur:n=>R[n]&&R[n][0], // テスト用（OfflineAudioContext で書き出す）
  };

  /* ---- ボタンの自動 tap（capture でクリックを拾う） ---- */
  document.addEventListener('click',e=>{
    try{
      const el=e.target&&e.target.closest&&e.target.closest('button,[role=button]');
      if(!el||el.disabled||el.getAttribute('aria-disabled')==='true') return;
      if(el.closest('[data-mute]')){api.toggle();return}
      const tag=el.closest('[data-sfx]'), name=tag?tag.getAttribute('data-sfx'):'tap';
      if(name==='none') return;
      const mark=explicitCount;
      // 画面側のハンドラが SFX.play を呼んだら自動音は鳴らさない
      setTimeout(()=>{if(explicitCount===mark) playRaw(name)},0);
    }catch(err){}
  },true);

  // 後から描画された [data-mute] も同期する
  function watch(){
    sync();
    let queued=false;
    try{new MutationObserver(()=>{if(queued)return;queued=true;
      queueMicrotask(()=>{queued=false;sync()})}).observe(document.body,{childList:true,subtree:true})}catch(e){}
  }
  if(document.body) watch(); else document.addEventListener('DOMContentLoaded',watch);

  return api;
})();
