'use strict';
/* ---------- ゲーム状態（チュートリアル通しで共有） ---------- */
const CO={pan:{n:'ベーカリー本舗',ic:'🥐',wall:'#ffe2b8',side:'#e8b878',roof:'#ef6b5b',inc:2},
  hayate:{n:'ハヤテ物流',ic:'🚚',wall:'#d9e6ff',side:'#9fb8ea',roof:'#4f78c9',inc:2},
  it:{n:'ピクセル工房',ic:'💻',wall:'#eadcff',side:'#b9a0e8',roof:'#7b55c9',inc:2},
  machi:{n:'マチコウバ',ic:'⚙️',wall:'#ffd9a8',side:'#e0a35e',roof:'#c76d14',inc:3}};
const PLOTS=[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]];
const HQ=4, ADJ=[1,3,5,7], LOCKED=[0,8];
const QUESTS=[
  {ic:'🪙',t:'コインを3回回収',need:3},
  {ic:'⬆️',t:'本社をLv2にする',need:1},
  {ic:'🤝',t:'M&Aで仲間を迎える',need:1},
  {ic:'📍',t:'新しい仲間を街に配置',need:1},
  {ic:'🎮',t:'ミニゲームで遊ぶ',need:1},
  {ic:'🎉',t:'チュートリアル完了！',need:0}];
let G=null;
function freshG(co){return {company:co||'pan',coins:120,gems:30,rank:0,q:0,qn:0,last:Date.now(),
  b:{[HQ]:{k:co||'pan',lv:1,st:0,hq:true}},pending:null,grade:'A',syn:false,welcome:true}}
function loadG(){if(G)return G;try{const s=sessionStorage.getItem('dt-g');if(s)G=JSON.parse(s)}catch(e){}if(!G)G=freshG('pan');return G}
function saveG(){try{sessionStorage.setItem('dt-g',JSON.stringify(G))}catch(e){}}
function income(i){const b=G.b[i];if(!b)return 0;let v=CO[b.k].inc*b.lv;if(b.syn)v*=1.5;return v}
function totalInc(){return Object.keys(G.b).reduce((a,i)=>a+income(i),0)}
function upCost(b){return Math.round(40*Math.pow(b.lv,1.6))}
function cap(i){return income(i)*30}
function accrue(){const now=Date.now(),dt=Math.min(3600,(now-G.last)/1000);G.last=now;Object.keys(G.b).forEach(i=>{const b=G.b[i];b.st=Math.min(cap(i),b.st+income(i)*dt)});return dt}
function questDone(step){if(G.q===step){G.qn++;if(G.qn>=QUESTS[step].need){G.q++;G.qn=0;G.coins+=50;return true}}return false}
function fmt(n){return Math.floor(n).toLocaleString('ja-JP')}
const RANKS=['アナリスト','アソシエイト','VP'];

/* 建物（アイソメトリック箱） */
function building(k,lv){
  const c=CO[k],h=10+lv*5,N=[30,30],E=[52,41],S=[30,52],W=[8,41];
  const up=p=>[p[0],p[1]-h];const pts=a=>a.map(p=>p.join(',')).join(' ');
  let win='';
  for(let f=0;f<Math.min(lv+1,5);f++){const y=-(f*5)-6;
    [[.25,.5],[.6,.85]].forEach(([a,b2])=>{const p=t=>[W[0]+(S[0]-W[0])*t,W[1]+(S[1]-W[1])*t+y];const q=t=>[S[0]+(E[0]-S[0])*t,S[1]+(E[1]-S[1])*t+y];
      const l1=p(a),l2=p(b2),r1=q(a),r2=q(b2);
      win+='<polygon points="'+pts([l1,l2,[l2[0],l2[1]-3],[l1[0],l1[1]-3]])+'" fill="#ffe7a3" opacity=".9"/>';
      win+='<polygon points="'+pts([r1,r2,[r2[0],r2[1]-3],[r1[0],r1[1]-3]])+'" fill="#ffe7a3" opacity=".75"/>';});}
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" aria-hidden="true" style="overflow:visible">'+
    '<polygon points="'+pts([W,S,up(S),up(W)])+'" fill="'+c.wall+'"/>'+
    '<polygon points="'+pts([S,E,up(E),up(S)])+'" fill="'+c.side+'"/>'+win+
    '<polygon points="'+pts([up(N),up(E),up(S),up(W)])+'" fill="'+c.roof+'"/>'+
    '<polygon points="'+pts([up(W),up(S),[S[0],S[1]-h+3],[W[0],W[1]-h+3]])+'" fill="rgba(0,0,0,.18)"/>'+
    '</svg>';
}
function isoPos(i){const [x,y]=PLOTS[i];return {cx:50+(x-y)*15,ty:6+(x+y)*7.5}}
