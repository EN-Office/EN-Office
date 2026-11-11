# 3Dモデル生成スクリプト（Blender）

`build_models.py` 1本で、モックアップ用のGLB（企業獣・建物・小物）をすべて手続き的に作ります。手作業のモデリングはありません。

## 実行方法

どちらか一方で実行します（リポジトリの `ma-learning-game/` で）。

```
pip install bpy                     # 初回のみ（Blender 5.x 相当の Python モジュール）
python3 tools/blender/build_models.py
```

```
blender --background --python tools/blender/build_models.py
```

一部だけ作り直すときは名前の先頭を渡します（例：`python3 tools/blender/build_models.py beast_pan bld_`）。

## 出力

- `mockup/assets/models/*.glb` … 1モデル150KB以下が目安（Dracoは使わない）
- `mockup/assets/models.js` … 同じGLBをbase64で埋め込んだもの（`file://` で開いても動くように）。スクリプトが毎回作り直すので手で編集しない。
- 確認用ページ：`mockup/dev/models.html`

## 決まりごと

- glTFはY軸が上で、正面は+Z。原点は地面の中心。企業獣は高さ約1、建物の敷地は約1×1。
- 色は `mockup/js/core.js` の `B` と `mockup/js/state.js` の `CO` と同じ値をスクリプト冒頭に持つ。色を変えるときは両方を直す。
- 企業獣：ルート `beast_<キー>` の下に `Body`・`Eye_L`・`Eye_R`（まばたき用、原点は目の中心）・`Mouth_smile`・`Mouth_worry`・`Mouth_o`。
- 建物：`Base`（高さ0.5）・`Floor`（高さ0.35、くり返す階）・`Roof`。それぞれ原点は底面の中心。実行時に `Kit3D.stackBuilding(obj, level)` で積む。
- 窓は発光する暖色（#ffe7a3）。
