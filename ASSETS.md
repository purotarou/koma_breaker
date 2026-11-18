# ASSETS

公開物に含まれる素材の出どころとライセンス。新しい素材を足したら必ずここに追記する。

| ファイル | 内容 | 出どころ | ライセンス / 表記 |
|---|---|---|---|
| `blender/stage_shrine.blend` | 神社ステージ（ステージ1）の元データ | 本プロジェクトで自作。旧コード版 `buildStage1Code()`（js/stage.js）の形状を `tools/dump_stage.js` + `tools/blender_build_stage.py` で Blender に移したもの | 自作（第三者素材なし） |
| `assets/stage_shrine.glb` | 上記を書き出したゲーム用モデル | `tools/blender_export_stage.py` で書き出し | 自作（第三者素材なし） |
| `blender/stage_castle.blend` | 城ステージ（ステージ2）の元データ | 本プロジェクトで自作。旧コード版 `buildStage2Code()`（js/players.js）から同じ手順で移したもの | 自作（第三者素材なし） |
| `assets/stage_castle.glb` | 上記を書き出したゲーム用モデル | `tools/blender_export_stage.py` で書き出し | 自作（第三者素材なし） |
| `blender/stage_town.blend` | 町ステージ（ステージ3 黄昏の町）の元データ | 本プロジェクトで自作。コード版 `buildStage3Code()`（js/stage345.js）から同じ手順で作ったもの | 自作（第三者素材なし） |
| `assets/stage_town.glb` | 上記を書き出したゲーム用モデル | `tools/blender_export_stage.py` で書き出し | 自作（第三者素材なし） |
| `blender/stage_temple.blend` | 寺ステージ（ステージ4 雪の古寺）の元データ | 本プロジェクトで自作。コード版 `buildStage4Code()`（js/stage345.js）から同じ手順で作ったもの | 自作（第三者素材なし） |
| `assets/stage_temple.glb` | 上記を書き出したゲーム用モデル | `tools/blender_export_stage.py` で書き出し | 自作（第三者素材なし） |
| `blender/stage_inkpond.blend` | 墨の池ステージ（ステージ5）の元データ | 本プロジェクトで自作。コード版 `buildStage5Code()`（js/stage345.js）から同じ手順で作ったもの | 自作（第三者素材なし） |
| `assets/stage_inkpond.glb` | 上記を書き出したゲーム用モデル | `tools/blender_export_stage.py` で書き出し | 自作（第三者素材なし） |
| `blender/boss_monk.blend` | 4面ボス「鐘の僧」（僧・鐘・撞木）の元データ | 本プロジェクトで自作。ユーザー提供の設定画（僧・鐘・撞木の3枚）を見ながら Blender の Python で形を組んだもの。画像そのものは使っていない | 自作（第三者素材なし） |
| `assets/boss_monk.glb` | 上記を書き出したゲーム用モデル | `tools/blender_export_stage.py` で書き出し | 自作（第三者素材なし） |
| `blender/weapons.blend` | 武器11種（連珠銃・散華砲・氷魄砲・祓い刀・火消しの大槌・焙烙火矢・鬼棘の流星鎚・雷鳴の槍・波雲の長弓・城壁の大楯・護符の錫杖）＋妖弾銃（シーン `Pistol`、`tools/weapons/wpn_pistol.py`）・グローブ（シーン `Glove`、左右一組＝子コレクション `Wpn_Glove_R` / `Wpn_Glove_L`。左手は右手を左右反転したもの。形は実物のボクシンググローブを参考にした。`tools/weapons/wpn_glove.py`）の元データ。武器ごとに別シーン | 本プロジェクトで自作。ユーザー提供の設定画を見ながら、`tools/weapons/*.py`（Blender の Python）で形を組んだもの。後半5種（流星鎚・槍・長弓・大楯・錫杖）は、設定画（`assets/gacha/weapon_*.webp`）の輪郭と色の領域を `tools/weapons/kbw_trace.py` で読み取って形にしている（画像そのものは貼っていない） | 自作。ただし後半5種は設定画の形をなぞっているので、設定画と同じく**未確認** |
| `assets/weapon_rifle.glb` | 連珠銃（アサルト） のゲーム用モデル | 上記から `tools/blender_export_stage.py` で書き出し | 自作（第三者素材なし） |
| `assets/weapon_shotgun.glb` | 散華砲（桜のショットガン） のゲーム用モデル | 上記から `tools/blender_export_stage.py` で書き出し | 自作（第三者素材なし） |
| `assets/weapon_railgun.glb` | 氷魄砲（氷のレールガン） のゲーム用モデル | 上記から `tools/blender_export_stage.py` で書き出し | 自作（第三者素材なし） |
| `assets/weapon_katana.glb` | 祓い刀 のゲーム用モデル | 上記から `tools/blender_export_stage.py` で書き出し | 自作（第三者素材なし） |
| `assets/weapon_hammer.glb` | 火消しの大槌 のゲーム用モデル | 上記から `tools/blender_export_stage.py` で書き出し | 自作（第三者素材なし） |
| `assets/weapon_bomb.glb` | 焙烙火矢（ボム） のゲーム用モデル | 上記から `tools/blender_export_stage.py` で書き出し | 自作（第三者素材なし） |
| `assets/weapon_flail.glb` | 鬼棘の流星鎚（鎖鉄球） のゲーム用モデル | 上記から `tools/blender_export_stage.py` で書き出し | 上記と同じ |
| `assets/weapon_spear.glb` | 雷鳴の槍 のゲーム用モデル | 上記から `tools/blender_export_stage.py` で書き出し | 上記と同じ |
| `assets/weapon_bow.glb` | 波雲の長弓 のゲーム用モデル | 上記から `tools/blender_export_stage.py` で書き出し | 上記と同じ |
| `assets/weapon_shield.glb` | 城壁の大楯 のゲーム用モデル | 上記から `tools/blender_export_stage.py` で書き出し | 上記と同じ |
| `assets/weapon_staff.glb` | 護符の錫杖 のゲーム用モデル | 上記から `tools/blender_export_stage.py` で書き出し | 上記と同じ |
| `assets/gacha/weapon_*.webp`（11枚） | 武器ガチャ用のサムネ画像（武器11種の設定画。対応表は `GACHA_WEAPONS.md`）。後半5枚（flail・spear・bow・shield・staff）は2026-11-17に追加（3Dモデルの仮置き画像だったものを、2026-11-18にユーザー提供の設定画へ差し替え） | ユーザー提供の画像（生成方法・ライセンスは未確認。公開前に確認する） | **未確認** |
| `assets/gacha/weapon_pistol.webp` `weapon_glove.webp` | 妖弾銃とグローブの設定画（2026-11-18 追加、グローブは2026-11-19に片手の絵へ差し替え。3Dモデルの形の元。ガチャにはまだ使っていない） | ユーザー提供の画像（生成方法・ライセンスは未確認。公開前に確認する） | **未確認** |
| `assets/gacha/cut_*.webp`（11枚） | ガチャ画面用に上の11枚を見える部分で切り詰め、長辺640pxに縮小したもの（白背景の絵は背景を透明にしてから。後半5枚は2026-11-18にユーザー提供の絵に差し替え済み。元から透明） | `tools/gacha/cutout.py`（Pillow・numpy）で作成 | 上と同じ（**未確認**） |
| `blender/src/komabure_chara_kakeru.glb` | 主人公カケルの元モデル（Tripo の出力そのまま。12部品に分割済み、テクスチャ付き） | ユーザーが Tripo AI で生成（2026-11-16、**有料プラン**で生成） | Tripo の公式ヘルプ（https://www.tripo3d.ai/help/privacy-policy/can-i-use-models-commercially ）によると、有料プランで生成したモデルは商用利用・改変・配布ができる。表記義務の記載は見当たらない。ただし利用規約の原文そのものは未確認（公式ヘルプとブログの記述に基づく）。無料プランはモデルの権利の扱いが異なるので、無料で作ったモデルは使わない |
| `blender/src/komabure_chara_last_boss3.glb`、`..._sword_right.glb`、`..._sword_left.glb` | 新ボス（最終ボス案）の元モデル。本体（14部品に分割、テクスチャ付き）と、右手・左手の剣（各1つ） | ユーザーが用意（2026-11-16 に Downloads から追加）。ファイル名の付け方が主人公カケルの元モデルと同じなので Tripo AI の出力と思われるが、生成方法・プラン（有料か無料か）は**未確認** | **未確認**（Tripo の有料プランで生成したものなら商用利用可。公開物に使う前に確認する） |
| `blender/hero_kakeru.blend` | 主人公カケルのゲーム用元データ | 上記を Blender に取り込み、穴のない1つの形に作り直して減面（約8,000三角面）・新しい UV に元のテクスチャを焼き付け・16本の骨を入れたもの | 上記と同じ（Tripo 有料プランの生成物） |
| `blender/hero_kakeru_tex.png` | 主人公カケルのテクスチャ（1024px） | 上記の元モデルのテクスチャを焼き付け直し、上着のテカリを塗り直したもの | 上記と同じ（Tripo 有料プランの生成物） |
| `assets/hero_kakeru.glb` | 主人公カケルのゲーム用モデル（骨・テクスチャ入り） | 上記から `tools/blender_export_hero.py` で書き出し | 上記と同じ（Tripo 有料プランの生成物） |
| `assets/icons/*.png`、`manifest.webmanifest` | ゲームのアイコン（タブ・ホーム画面・アプリ名）。ユーザーが用意したロゴ画像を、透明な角を残して 512/192/32px に縮小し、`apple-touch-icon.png`（180px）は角を黒で埋めたもの | ユーザーが用意（2026-11-18）。画像の生成方法は**未確認** | **未確認**（AI 生成画像なら、使ったサービスの規約で商用利用可か公開前に確認する） |

ステージ1・2の小物（しめ縄・絵馬掛け・散った花びら・草・提灯・陣幕・槍掛け・砲弾など）、手描き風の模様（葉・木の皮・水面）、揺れ・はためき・炎・雲の動きもすべて本プロジェクトで自作。外部からダウンロードした素材は使っていない。
