// M&A学習ゲーム チュートリアル体験をローカルで起動する簡易サーバー（外部依存なし）
// 実体は ../mockup/index.html。ここで HTML の骨組み（doctype・viewport）を付けて配信する。
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 5173;
const MOCKUP = path.join(__dirname, '..', 'mockup', 'index.html');

function page() {
  const body = fs.readFileSync(MOCKUP, 'utf8');
  return '<!doctype html>\n<html lang="ja">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
    '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}</style>\n' +
    '</head>\n<body>\n' + body + '\n</body>\n</html>\n';
}

http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
  if (url === '/' || url === '/index.html') {
    try {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(page());
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('mockup/index.html を読み込めませんでした: ' + e.message);
    }
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
}).listen(PORT, () => {
  console.log('Deal Tamers チュートリアルを起動しました → http://localhost:' + PORT);
  console.log('mockup/index.html を保存したら、ブラウザを再読み込みすると反映されます。終了は Ctrl+C');
});
