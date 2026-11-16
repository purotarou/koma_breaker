# CLAUDE.md

## プロジェクト概要
「激弾！コマブレイカー」(英題案: Panel Breaker)。漫画の世界に入って戦う、日本の漫画風の3D FPS。
ブラウザ（特にタブレット/iPad Safari）で動く WebGL2 ゲーム。最大4人のオンライン協力/対戦に対応。
公開: GitHub Pages（リポジトリ設定に従う）。
コンセプト・世界観・ストーリー・敵やボスの設定は **`STORY.md`** が正。ステージ・敵・演出・文言を足すときはこれに合わせる。

## 制作ルール（重要）
- **「HTML1ファイルのみ」「外部素材なし」の制約は撤廃した。** 画像・音声・3Dモデル(GLB)・複数のJS/CSSファイルを使ってよい。
- 実在の漫画・ゲームのキャラクターや名前は使わない（すべてオリジナル）。
- 見た目は「カラーの日本の漫画そのもの」。太い輪郭線・スクリーントーン・集中線・描き文字（「ドン！」等）を維持する。
- iPad Safari での動作を最優先する（タッチ操作、メモリ、読み込み時間）。モデルは軽量に保つ。
- 公開物に使う素材は、ライセンス（商用利用可否・表記義務）を確認してから使う。素材の出どころを `ASSETS.md` に記録する。

## 3Dモデルの制作フロー（予定）
- キャラ・武器: Meshy AI で生成 → Blender に取り込み、ポリゴン削減・向き/スケール調整・リグ/アニメ追加 → GLB で書き出して `assets/` に配置。
- 地形・ステージ: **全5ステージ Blender 化済み**（1 朱の神社 / 2 月下の天守 / 3 黄昏の町 / 4 雪の古寺 / 5 墨の池）。3面と5面のボスはまだ無く、最終話は既存の魔王を代役にしている（名前・台詞だけ STORY.md のもの）。4面は専用ボス「鐘の僧」（下記）。
  - 元データ: `blender/stage_{shrine,castle,town,temple,inkpond}.blend` → `tools/blender_export_stage.py` で `assets/stage_*.glb`（同名）に書き出す（Blender MCP から `exec`。ファイルを開いた呼び出しとは別の呼び出しで書き出すこと。同じ呼び出しだと書き出しが context エラーになる）。
  - ゲーム側は `js/glb.js` が起動時に5つの GLB を読み、既存のインスタンス描画（輪郭線・トーン）にそのまま流す。読めなかったステージだけコード版（`buildStage1Code()` は stage.js、`buildStage2Code()` は players.js、`buildStage3Code()`〜`buildStage5Code()` は stage345.js）で起動。`?stage1=code` 〜 `?stage5=code` でコード版を強制表示できる（見比べ用）。
  - ステージごとの空・霧・影の色・太陽の向き・粒子・難しさは `STG`（players.js）にまとめてある（`hard` `bom` `ink` `line` `cut` `pfx` `sun` `shade` `fogR`）。遊べる範囲は標準で x ±21.6、z -25.6〜21.6 で、`STG[n].arena`（[半幅, 北端z, 南端z]）でステージごとに変えられる（雪の古寺は x ±31.6、z -37〜33.6 で、本堂の石段の前まで歩ける）。魔王型のボスは z -21.5 から出て、体は z -35 あたりまで占めるので、ボスがいる間は北端が z -25.6 に戻る（`collide()`）。4面の鐘の僧は動き回るので、北端は戻さない。当たり判定は高さを見ない（ジャンプしても越えられない）が、弾は `kb_col` の高さより上を通る（雪の古寺の池は高さ 0.12 の判定で、人は入れず弾は通る）。雪の古寺の本堂の中央の扉は GLB ではなくコードで毎フレーム描く（`drawTempleDoor`、stage345.js）。`templeDoor.target=1` で開き、0 で閉じる（ボスが本堂から出てくる演出用。ステージを切り替えると閉じた状態に戻る）。
  - 4面ボス「鐘の僧」: 元データ `blender/boss_monk.blend` → `tools/blender_export_stage.py`（OUT を `assets/boss_monk.glb` にして実行）。部品ごとに別ノード（Monk_Body / Monk_Head / Monk_Head2（第二形態の顔）/ Monk_Jaw・Monk_Jaw2（開いた口。縦に縮めて開き具合を出す）/ Monk_Arm_L・R / Monk_Leg_L・R / Bell / Striker / Striker_L（第二形態の左手））で、`js/boss4.js` が毎フレーム部品ごとに動かして描く。第二形態の黒い肌と赤い目はゲーム側の色の差し替え（`boss4_skin`→鬼面の紺、`boss4_eye`→赤）。動き・攻撃・鐘・息切れ・変身の演出とカメラ（`monkCam`、変身中は `monkCine()` が真で入力・被ダメージが止まる）・ネット同期（`m.k`）もすべて boss4.js。鐘の僧の時間は boss4.js の `monkAnim` だけが進める（entities.js では足さない）。`STG[n].monk` が立っているステージで `spawnBoss()` が鐘の僧を出す。
- 武器6種（連珠銃・散華砲・迅雷砲・祓い刀・火消しの大槌・焙烙火矢）: 元データ `blender/weapons.blend`（武器ごとに別シーン）→ `assets/weapon_*.glb`（+ `.glb.js`）。作り方は `tools/weapons/`（`kbw_lib.py` と `common.py` を読んでから `wpn_*.py` を Blender で実行）。原点は持ち手側、先端が +Y、上が +Z。**まだゲームには組み込んでいない**（モデルだけ）。
- 主人公カケル: Tripo で生成（部品分割・三角メッシュ）した `blender/src/komabure_chara_kakeru.glb` → `blender/hero_kakeru.blend`（6部品 Body / Head / Arm_R・Arm_L / Leg_R・Leg_L に統合、減面、テクスチャの色を面ごとに拾って単色マテリアル `kbh_*` に置換、原点は首・肩・股、身長約2.0、前が -Y、キャラの右が -X）→ `assets/hero_kakeru.glb`。ゲームはテクスチャ・UV・ボーンを読まないので、色は単色マテリアルで付ける。`js/hero.js` が部品ごとに動かして描き（`drawHeroGlb`）、読めなければ players.js の箱の主人公（`drawHeroBox`）に戻る。`kbh_team`（上着）はプレイヤー色 `PCOL[slot]` に差し替える。`?hero=1` でカメラの前に4人並べて確認できる。
- コード版から Blender への移行は `node tools/dump_stage.js <1-5> out.json` → `tools/blender_build_stage.py`（空のファイルで実行）。stage345.js では `//#名前` のコメントがコレクション名になる。
  - Blender 側の約束: 座標は Blender Z-up（書き出しで Y-up に変換）。色はマテリアルの Base Color（ゲームの値をそのまま）。マテリアルのカスタムプロパティ `kb_mat`（模様: 1=石畳, 2/3=板目, 4=草, 5=瓦, 6=藁・縄・提灯の骨, 7=水面の波紋(動く), 8=葉のうろこ線, 9=木の皮）, `kb_gloss`, `kb_flags`（足し算で組み合わせ。1=陰影なし, 2=輪郭なし, 4=影を落とさない, 8=風で揺れる(高いほど大きく), 16=旗のはためき(布の中心から +Z 方向へ揺れが大きくなる), 32=雲の流れ(ステージ中心を回る), 64=炎のゆらめき）, `kb_rim`。動きは頂点シェーダー（`js/gfx.js` の `ANIM`）で計算するので CPU 負荷・描画回数は増えない。当たり判定は Empty にカスタムプロパティ `kb_col`（`cyl`=円の Empty、スケール r,r,高さ / `box`=立方体の Empty、半サイズ、地面に接地）。
  - コード版に足した小物や模様・フラグの変更を Blender に反映するとき: `node tools/dump_stage.js <1|2> out.json` → `tools/blender_sync_from_code.py`（開いている .blend に対して実行。既存オブジェクトは名前・コレクションを保ったまま材質を更新し、新しい部品だけを追加する）。
  - 同じメッシュを使うオブジェクト（リンク複製）は1回の描画にまとまる。新しい形を増やすほど描画回数が増えるので注意。
  - 見た目の一致確認: `node tools/check_stage_parity.js [1-5]`（Blender 版がコード版と同一であることの検査。Blender で意図的に作り変えた後は差が出て当然）。
- Blender は Blender MCP 経由で操作する。

## 技術メモ
- `index.html`（骨組みのみ）+ `css/style.css` + `js/*.js` に分割済み。WebGL2、独自シェーダーで輪郭線・トーン描画。
- JS は ES Modules ではなく**通常の `<script>` を順番に読み込む**方式（元は1つの IIFE だったため、全ファイルでグローバルのスコープを共有している）。読み込み順は `index.html` の `<script>` の並び（core → gfx → glb → stage → fx → audio → entities → skills → players → stage345 → boss4 → hero → net → game-v2 → settings → game）で、**順序を変えると壊れる**。
- ファイルをまたぐトップレベルの処理は、呼び出す関数が先のファイルで定義済みであることが必要（別ファイルの後ろの関数はトップレベルでは呼べない。関数の中からなら可）。
- ローカル確認は `file://` ではなく簡易サーバー（`python3 -m http.server`）を使う。
- GLB は `loadGlbBuf()`（glb.js）で読む。`index.html` を直接開いた（`file://`）ときは fetch が使えないので、隣の `assets/*.glb.js`（同じ GLB を base64 にしたもの）を `<script>` で読む。`tools/blender_export_stage.py` が .glb と一緒に書き出すので、**GLB を書き出したら .glb.js も一緒に commit する**（古いままだと直接開いたときだけ古い形になる）。
- GLB読み込みを入れる際は、既存の輪郭線/トーン描画（法線とIDバッファを使う方式）と整合させる。
- オンラインは公開MQTT(WebSocket)を中継に使う。ホストがゲーム進行を計算し、ゲストへスナップショットを配信する方式。
- 設定（感度・音量・ボタン配置）は localStorage に保存。
- 視点は1人称/3人称を切り替えられる（`SET.view`、設定画面・HUD のポーズ横の小ボタン・V キー）。3人称カメラは game-v2.js の `tpsCam()`：右肩越し、壁・小物・地面に当たるとすぐ寄り（`rayWorld`）ゆっくり戻る、見上げると地面に沿って近づく、近すぎると主人公を描かない。射撃の起点は `aimOrigin()`（カメラの中心線上で主人公の位置から。主人公より後ろの物には当たらない）。演出カメラ（ボス撃破・鐘の僧の変身）中は1人称と同じ扱い。
- スキルツリーは `js/skills.js`（`SKD` が名前と説明、`SKN` が節の一覧、`skApply()` が効果の数値表 `SK` を作る）。十字型で、上=攻・右=速・下=守・左=技。各系統は 一段→二段→A線/B線（三〜五段＋極み）/中央の短い枝（2つ）に分かれ、同じ系統では1本しか選べない。極みは5面すべてクリアで解放。ポイントは上限29（初クリア+3、2回目+1、ボス無傷+1、全面クリア+4）。進行は localStorage の `koma_skill`（`v:2`。旧形式は習得をリセットしてポイントを作り直す）。スキルは自分の数値（与ダメ・体力・ジャンプ等）だけを変えるので通信は増やさない。対戦とデモでは無効。

## 作業ルール
- 開発ブランチ: `main`。
- 変更後は動作確認し、問題なければ commit して push する。
- 確認できていないことは、できたと言わずに報告する。
