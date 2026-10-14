# ローカルLLM導入提案（改訂版）

| ファイル | 内容 |
| --- | --- |
| `local_llm_proposal_v3.html` / `.pptx` | **最新版**。「完全オフラインAIによるシステム保守・エラー解析の効率化」。セキュリティルームの条件を外した汎用版 |
| `local_llm_proposal_v2.html` | セキュリティルーム向け改訂版（HTML）。`section.slide` 1つがスライド1枚。ブラウザで開けばそのまま閲覧・印刷できる |
| `build_pptx.js` | HTML を読み取り `local_llm_proposal_v2.pptx` を生成する変換スクリプト（pptxgenjs） |
| `local_llm_proposal_v2.pptx` | 変換済み PowerPoint |
| `../local_llm_proposal_review.md` | 元資料の精査結果と修正提案 |

## PPTX の再生成

```bash
cd docs/proposal
npm install            # 初回のみ（pptxgenjs, node-html-parser）
node build_pptx.js local_llm_proposal_v3.html local_llm_proposal_v3.pptx   # 引数省略時は v2 を生成
```

## HTML 編集時の規約

- `<section class="slide" data-layout="title|content">` がスライド1枚
- `content` レイアウト: `<header>`（`.kicker` / `h1` / `.sub`）+ 本文ブロック + `<p class="note">`（最下部の注記）
- 本文で使えるブロック: `table`、`.cards > .card`（横並びカード。`.navy` `.accent` で配色）、`.cols > .col`（2カラム）、`.chat > .msg.user/.ai`、`.total`、`.steps > .step`、`.effects > .effect`、`ul`、`p`
- 文中の `<b>` は太字、`<span class="ok">` は緑、`<span class="warn">` は赤として変換される
- `<th style="width:NN%">` で列幅を指定できる
