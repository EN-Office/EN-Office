# ローカルで起動する（VS Code）

チュートリアル体験（`mockup/index.html`）を、自分のPCのブラウザで動かす方法です。追加のインストールは Node.js だけです。

## 準備（初回のみ）
1. Node.js（18以上）をインストールする：https://nodejs.org/
2. このリポジトリを手元に取得し、VS Code で **`ma-learning-game` フォルダ**を開く（ファイル → フォルダーを開く）。

## 起動方法
- **Windows でいちばん簡単な方法**：`ma-learning-game` フォルダの `start-windows.bat` をダブルクリック。ブラウザで http://localhost:5173 が開きます（終了は黒い画面を閉じる）。
- **Node.js なしで見るだけ**：`mockup/index.html` をダブルクリックしてブラウザで開く。
- **F5 キー**：サーバーが起動し、Chrome で http://localhost:5173 が開きます（Edge を使う場合は、実行とデバッグ画面で「チュートリアルを開く（Edge）」を選ぶ）。
- **ターミナルから**：`npm start` を実行し、表示された http://localhost:5173 をブラウザで開く。

終了するときは、ターミナルで `Ctrl + C`（F5で起動した場合はデバッグ停止ボタンも）。

## スマホ画面で確認したいとき
ブラウザの開発者ツール（F12）→ デバイスツールバー（Ctrl+Shift+M）で、iPhone などの端末を選ぶと 9:16 の画面で確認できます。

## 編集するとき
- 画面の中身は `mockup/index.html` の1ファイルです。保存してブラウザを再読み込みすると反映されます。
- ポート番号を変える場合：`PORT=3000 npm start`（Windows PowerShell は `$env:PORT=3000; npm start`）。
- フォントは Google Fonts から読み込むため、オフラインでは代わりのフォントで表示されます。
