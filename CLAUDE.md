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
- 武器6種（連珠銃・散華砲・氷魄砲・祓い刀・火消しの大槌・焙烙火矢）: 元データ `blender/weapons.blend`（武器ごとに別シーン）→ `assets/weapon_*.glb`（+ `.glb.js`）。作り方は `tools/weapons/`（`kbw_lib.py` と `common.py` を読んでから `wpn_*.py` を Blender で実行）。原点は持ち手側、先端が +Y、上が +Z（GLB では先端が -Z）。刀の刃は -Y 側。
  - ゲーム側は `js/weapons.js`（性能表 `WPN`、通常攻撃・必殺、1人称の持ち方 `wpView`、主人公の持ち方と振り `wpHeroBody` / `wpHeroArms`、装備画面 `drawEquip` と立体プレビュー `wpPreview`）。妖弾銃は今まで通りコードの箱の銃。装備は1つだけで、メインメニュー／ロビーの「装備」から選ぶ（localStorage の `koma_wpn`）。6種は武器ガチャで排出（所持は `WS.own[武器ID]`、ガチャは `wsGive(id)` で付与。ステージクリアでは手に入らない）、開発者メニューの「超強化」(DEV) が ON の間は全部選べる。対戦でも装備した武器を使う。
  - 弾数・装填・連射の数値は `skApply()` の最後で `wpApply()` が SK に掛ける（弾を使う武器だけ）。必殺の長さは `spDur()`。主人公の動作は `pl.ak`（1・2=刀の斬り、3=大槌の溜め、4=振り下ろし、5=投げ、6=大玉の投げ、7=一閃、8=駒砕き）と `pl.at`（経過秒）で、通信では `pl.an`（動作の通し番号）と一緒に送り、他の人の画面で同じ振りを再生する。爆弾・斬撃の波・大槌の衝撃は `net.q.wx` の見た目だけのイベント、凍結・怯み・ボスの鈍化は `net.q.ef` でホストに送る。
  - `?hero=1&wp=N&act=1` で、武器 N（`WPN` の番号）を持った主人公4人が攻撃を繰り返す（持ち方の確認用）。
- **武器ガチャ**: `js/gacha.js`（weapons.js の後に読む）。モード選択画面の右のガチャ機のボタン（`gaMenuBtn`）→ `G.menu='gacha'`（`drawGacha`）。
  - 通貨「コマ札」と進行は localStorage の `koma_gacha`（`GA.f` 枚数、`GA.paid[ステージ]` 受け取った回数、`GA.pick` ピックアップ）。ステージクリアで `skReward` → `gaReward` が「ステージ番号×1枚」を各ステージ2回まで足す（`G.fuda`、リザルト右上のカード `gaRewardCard`）。
  - 抽選は `gaRates()`（ピックアップ `GA_PU`=40%、ほかは均等。必殺Lv3（強化待ち込み）の武器は除く）。1回=1枚、6回=5枚。結果は引いた瞬間に保存し、そのあと演出（`gaA`: 封じられたコマが割れる → 武器の絵 → 6回なら一覧）。
  - 必殺レベル: `WS.lv[id]`（使っているLv）と `WS.up[id]`（強化待ち）。重複は `wsGive` が強化待ちを増やすだけで、装備画面の「詳細」の隣の「強化」（`wpUpBtn`）で `wpLvUp` を押して上げる。効果は `SPLV`（`wpApply` が `SK.spw`・`SK.beam` に掛ける）。
  - 画面の絵は `assets/gacha/cut_*.webp`（元絵 `weapon_*.webp` を切り詰めて640pxにしたもの。作り直しは `python3 tools/gacha/cutout.py`、Pillow が必要）。右側の背景は `gaD`：まず武器が回る（`wpPreviewIn`、装備画面と同じ描き方）→ 3.5秒後にステージ1のデモプレイ（`gaDemoStart`。`G.demoOn` のまま `G.state='menu'`、タイトルのデモと同じ AI、`SET.view` を一時的に3人称にし、`tpsSide<0` で左肩カメラにして主人公を画面右に置く）。7秒までは「通常攻撃」、そこで必殺を出させて「必殺技！」の見出し、16秒で回転に戻る。ガチャ演出・設定を開いている間は止まり、ガチャを出るときは `gaDemoEnd` で元に戻す（`SET.view` も戻す）。
- **最終ボス「白抜魔王シロヌキ」第3形態（未着手）**: 元モデルは `blender/src/komabure_chara_last_boss3.glb`（本体。14部品・テクスチャ付き）と `..._sword_right.glb` / `..._sword_left.glb`（両手の剣）。出どころ・ライセンスは未確認（`ASSETS.md`）。
  - 作業は Blender MCP を使うので**手元（Mac）のセッションで行う**（クラウドでは Blender を動かせない）。
  - 方式は未決定。案A: 鐘の僧と同じ「部品ごとに別ノード・単色の材質・コードで動かす」（`blender/boss_monk.blend` → `tools/blender_export_stage.py` → `js/boss4.js` の作り方を参考に。輪郭線・トーンになじみやすく早い）。案B: 主人公と同じ「テクスチャ＋骨（CPU スキニング）」（`js/hero.js`、スキル `add-character` の手順を参考に）。決める前にユーザーに確認する。
  - 5面の最終ボスは今は旧魔王の代役（`players.js` の `spawnBoss`、`G.stage>=4`）。第1・第2形態のモデルはまだ無い。STORY.md 5 の「5面の3段階（案）」が設計の元。
- **新しい操作キャラを入れるときは先にスキル `add-character`（`.claude/skills/add-character/SKILL.md`）を読む**（手順・つまずき・確認の仕方・複数キャラにするときの注意）。
- 主人公カケル: Tripo で生成した `blender/src/komabure_chara_kakeru.glb` → `blender/hero_kakeru.blend` → `tools/blender_export_hero.py` で `assets/hero_kakeru.glb`（+ `.glb.js`）。**主人公だけはテクスチャと骨（スキニング）を使う**（ほかのモデルは今まで通り単色・骨なし）。
  - .blend の中身: `KK_Source`（Tripo の12部品をつないだもの。焼き付けの元、非表示）、`KK_Hero`（厚み付け＋ボクセル再構成で穴のない1つの形にして約8,000三角面に減面。UV は新しく作り、顔の部分を大きめに取ってある）、`KK_Rig`（16本の骨: hips / spine / chest / head、upperarm・forearm・hand、thigh・shin・foot の左右。自動の重み付け）。身長2.0、前が -Y、キャラの右が -X。
  - テクスチャ: Tripo のテクスチャを `KK_Hero` の UV に焼き付けた `kk_tex`（1024px）。上着のテカリ（薄いピンク）は赤に塗り直してある。`blender/hero_kakeru_tex.png` に保存し、書き出しはこの PNG を JPEG にして GLB に入れる（macOS の sips を使う）。テクスチャを直したら PNG を保存してから書き出す。
  - 書き出し: `exec(open('tools/blender_export_hero.py').read(), {'OUT': '.../assets/hero_kakeru.glb'})`。頂点（位置・法線・UV・骨番号・重み）は1組で、索引が2つ（頭 = `kb_mat` 10、体 = 11）。骨は `extras.kb_bones`（名前・親・休みの姿勢の関節位置）。
  - ゲーム側: `js/hero.js` が毎フレーム骨の角度をコードで決め（歩き = 太もも・膝・足首・腰のひねり・上下の揺れ、構え = 腕は2本の骨の IK で両手を銃に、上半身と頭は視線の上下に付いていく）、頂点を CPU で曲げて、小さな頂点バッファの組（`addIdxPrim`、gfx.js）に書き込んで描く。テクスチャはテクスチャユニット3（`uHT`、`setModelTex`）。`kb_mat` 11 はテクスチャの赤い所（上着）をプレイヤー色 `PCOL[slot]` に差し替える（肌は緑が青より強いので除く）。テクスチャには陰影が入っているので、トーンの点は濃い影だけに出るよう明るさを持ち上げてある。銃はコードの箱で、`HERO_AIM` / `HERO_GUN_X` が位置。読めなければ players.js の箱の主人公（`drawHeroBox`）に戻る。`?hero=1` でカメラの前に4人並べて確認できる。
- コード版から Blender への移行は `node tools/dump_stage.js <1-5> out.json` → `tools/blender_build_stage.py`（空のファイルで実行）。stage345.js では `//#名前` のコメントがコレクション名になる。
  - Blender 側の約束: 座標は Blender Z-up（書き出しで Y-up に変換）。色はマテリアルの Base Color（ゲームの値をそのまま）。マテリアルのカスタムプロパティ `kb_mat`（模様: 1=石畳, 2/3=板目, 4=草, 5=瓦, 6=藁・縄・提灯の骨, 7=水面の波紋(動く), 8=葉のうろこ線, 9=木の皮）, `kb_gloss`, `kb_flags`（足し算で組み合わせ。1=陰影なし, 2=輪郭なし, 4=影を落とさない, 8=風で揺れる(高いほど大きく), 16=旗のはためき(布の中心から +Z 方向へ揺れが大きくなる), 32=雲の流れ(ステージ中心を回る), 64=炎のゆらめき）, `kb_rim`。動きは頂点シェーダー（`js/gfx.js` の `ANIM`）で計算するので CPU 負荷・描画回数は増えない。当たり判定は Empty にカスタムプロパティ `kb_col`（`cyl`=円の Empty、スケール r,r,高さ / `box`=立方体の Empty、半サイズ、地面に接地）。
  - コード版に足した小物や模様・フラグの変更を Blender に反映するとき: `node tools/dump_stage.js <1|2> out.json` → `tools/blender_sync_from_code.py`（開いている .blend に対して実行。既存オブジェクトは名前・コレクションを保ったまま材質を更新し、新しい部品だけを追加する）。
  - 同じメッシュを使うオブジェクト（リンク複製）は1回の描画にまとまる。新しい形を増やすほど描画回数が増えるので注意。
  - 見た目の一致確認: `node tools/check_stage_parity.js [1-5]`（Blender 版がコード版と同一であることの検査。Blender で意図的に作り変えた後は差が出て当然）。
- Blender は Blender MCP 経由で操作する。

## 技術メモ
- `index.html`（骨組みのみ）+ `css/style.css` + `js/*.js` に分割済み。WebGL2、独自シェーダーで輪郭線・トーン描画。
- JS は ES Modules ではなく**通常の `<script>` を順番に読み込む**方式（元は1つの IIFE だったため、全ファイルでグローバルのスコープを共有している）。読み込み順は `index.html` の `<script>` の並び（core → gfx → glb → stage → fx → audio → entities → skills → players → stage345 → boss4 → foes → boss123 → hero → weapons → gacha → net → game-v2 → stagesel → settings → game）で、**順序を変えると壊れる**。
- ファイルをまたぐトップレベルの処理は、呼び出す関数が先のファイルで定義済みであることが必要（別ファイルの後ろの関数はトップレベルでは呼べない。関数の中からなら可）。
- ローカル確認は `file://` ではなく簡易サーバー（`python3 -m http.server`）を使う。
- GLB は `loadGlbBuf()`（glb.js）で読む。`index.html` を直接開いた（`file://`）ときは fetch が使えないので、隣の `assets/*.glb.js`（同じ GLB を base64 にしたもの）を `<script>` で読む。`tools/blender_export_stage.py` が .glb と一緒に書き出すので、**GLB を書き出したら .glb.js も一緒に commit する**（古いままだと直接開いたときだけ古い形になる）。
- GLB読み込みを入れる際は、既存の輪郭線/トーン描画（法線とIDバッファを使う方式）と整合させる。
- オンラインは公開MQTT(WebSocket)を中継に使う。ホストがゲーム進行を計算し、ゲストへスナップショットを配信する方式。
- 設定（感度・音量・ボタン配置）は localStorage に保存。
- 視点は1人称/3人称を切り替えられる（`SET.view`、設定画面・HUD のポーズ横の小ボタン・V キー）。3人称カメラは game-v2.js の `tpsCam()`：右肩越し、壁・小物・地面に当たるとすぐ寄り（`rayWorld`）ゆっくり戻る、見上げると地面に沿って近づく、近すぎると主人公を描かない。射撃の起点は `aimOrigin()`（カメラの中心線上で主人公の位置から。主人公より後ろの物には当たらない）。2人称（`SET.view=2`）はカメラを主人公の正面に置いて振り返る視点（壁には同様に寄る、照準の十字は出さず、射撃は主人公の目の位置から向いている方へ）。2人称のカメラの位置は `cam.*` ではなく `pl.yaw` と弱めた `pl.pitch` から決める（反動・揺れで3m先のカメラが振られないように。揺れは向きにだけ足す）。ボス登場の演出（`G.cine`）中は3人称のカメラになる。設定画面の並びは 1人称 / 2人称 / 3人称、HUD ボタンと V キーは 1人称→3人称→2人称 の順。演出カメラ（ボス撃破・鐘の僧の変身）中は1人称と同じ扱い。
- スキルツリーは `js/skills.js`（`SKD` が名前と説明、`SKN` が節の一覧、`skApply()` が効果の数値表 `SK` を作る）。十字型で、上=攻・右=速・下=守・左=技。各系統は 一段→二段→A線/B線（三〜五段＋極み）/中央の短い枝（2つ）に分かれ、同じ系統では1本しか選べない。極みは5面すべてクリアで解放。ポイントは上限29（初クリア+3、2回目+1、ボス無傷+1、全面クリア+4）。進行は localStorage の `koma_skill`（`v:2`。旧形式は習得をリセットしてポイントを作り直す）。スキルは自分の数値（与ダメ・体力・ジャンプ等）だけを変えるので通信は増やさない。対戦とデモでは無効。

## 作業ルール
- 開発ブランチ: `main`。
- 変更後は動作確認し、問題なければ commit して push する。
- 確認できていないことは、できたと言わずに報告する。
