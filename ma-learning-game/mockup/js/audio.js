'use strict';
/* サウンド（効果音）。SFX.play(name) で鳴らす。実装は Web Audio の合成音（音声ファイルなし）。
   name: tap / ok / ng / select / coin / up / place / open / close / step / win / start */
const SFX={muted:false,play(name){},toggle(){this.muted=!this.muted;return this.muted}};
