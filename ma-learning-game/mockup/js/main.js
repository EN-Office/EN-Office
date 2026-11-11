'use strict';
/* ---------- ルーティング ---------- */
function route(){const h=location.hash.slice(1);(S[h]||S.index)()}
window.addEventListener('hashchange',route);
route();
