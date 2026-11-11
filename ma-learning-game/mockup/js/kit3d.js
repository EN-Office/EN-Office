'use strict';
/* 3D表示キット（three.js + GLB）。使えない環境では ready=false のままで、各画面はSVG表示にフォールバックする。 */
const Kit3D={ready:false,load(name){return Promise.reject(new Error('3D unavailable'))},scan(root){}};
