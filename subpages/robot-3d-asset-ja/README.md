> **v003 更新済み**：`启动预览.command` をダブルクリックして閲覧できます。Blender マスターファイルは `blender/robot_master_v003.blend` です。今回の修正、出典、制限は [IMPLEMENTATION.md](IMPLEMENTATION.md) を参照してください。v001 / v002 は保存しています。

> 成果物、使用方法、検証結果、形状の制限は [IMPLEMENTATION.md](IMPLEMENTATION.md) に記載しています。以下は元の作業パッケージの説明です。

# ロボット3Dアセットとインタラクティブなハードウェア説明資料

作成日：2026-09-20

このフォルダーでは現在の実機を次の形に整理します。

1. Blender で保守できる機体の組立モデル
2. 組立図と分解図を切り替えられる Web 3D アセット
3. 部品をクリックして型番、寸法、取付関係、設計理由、根拠を確認できるハードウェア説明資料

## 現在の資料は十分か

結論：**構造の初期モデルを作り始めるには十分ですが、寸法の信頼性を確保した機体全体のデジタルアセットを完成させるには不足しています。**

現在、次の資料があります。

- 機体の簡略 URDF と主要な TF 関係
- SO-ARM101 の STL 一式と関節 URDF
- RealSense D435 のメッシュ
- Livox MID360 の公式外形寸法に基づく簡略モデル
- Lift、駆動モーター、操舵モーター、カメラ、LiDAR、停止ボタンなどのハードウェア記録
- Lift の具体的な型番、200 mm ストローク、ABZO 校正、取付後の運用データ
- SO-ARM101、Lift、機体の斜視写真、およびドライバー・ギヤヘッドの銘板写真
- Pan/Tilt と Arm/Camera TF のキャリブレーション記録
- 実測した frame の水平外形 `700 × 600 mm` と構造上面の高さ `300/515/620/1330 mm`
- 主構造 4040、前方の Arm/Camera/LiDAR 垂直支持部 2020 のフレーム材仕様

主な不足資料は次のとおりです。

- 各 4040/2020 部材の切断長・接続方法、および取付板、Lift ブラケット、Pan/Tilt ブラケットの完全な寸法・CAD
- 機体の六方向の正投影写真、スケール付きの部分写真、隠れた部分の写真
- 各モーター、車輪ユニット、コントローラー、電源、コンピューター、コネクター、配線の正確な取付位置
- すべての自作・3Dプリント部品の元CAD、造形条件、版
- 一部ハードウェアの具体的型番、Pan/Tilt 軸心・可動限界・視野範囲の設計根拠
- MID360 の正確な取付原点・傾斜角、および各 frame 実測高さと構造段名称の対応

不足項目の詳細は [MISSING-INFORMATION.md](MISSING-INFORMATION.md) を参照してください。

## 作業の概要

1. **根拠の固定**：既存の文書、URDF、メッシュ、写真、校正記録を読み取り専用スナップショットとして保存します。
2. **P0 寸法の追加測定**：機体座標系、外形、車軸、Lift、Pan/Tilt、Arm の取付基準を優先して測定します。
3. **Blender の階層モデル作成**：寸法の正しいブロックモデルを先に作り、機器メッシュや自作部品の詳細モデルへ置き換えます。
4. **組立情報の定義**：選択・分解可能な各部品に、固定の `component_id`、原点、親子関係を設定します。
5. **分解図の作成**：組立姿勢と分解表示姿勢を保存します。分解は表示用 transform のみを変え、実際の組立データは変更しません。
6. **Web エクスポート**：最適化した GLB を出力し、`data/components.json` で選択箇所、説明、根拠、設計理由を関連付けます。

## フォルダー構成

```text
robot-3d-asset/
├── README.md                       このファイル
├── GUIDELINE.md                    モデル・分解図・Web操作の規則
├── COMPONENT-INVENTORY.md          現在の部品と根拠の一覧
├── MISSING-INFORMATION.md          今後補完する項目
├── MEASUREMENTS.md                 現在の実機寸法基準
├── PORTABILITY-CHECK.md            単独コピーに含む資料・不足資料
├── DESIGN-NOTE-TEMPLATE.md         部品ごとの設計記録テンプレート
├── SOURCE-MANIFEST.md              コピー元とスナップショットの範囲
├── data/
│   ├── README.md                   構造化データの規約
│   ├── components.json             Web/Blender 共通の初期部品一覧
│   └── physical-measurements.json  機械可読の寸法
├── blender/
│   └── README.md                   Blender ファイルと命名規約
├── web/
│   └── README.md                   GLB と操作データの出力規約
└── references/                     既存プロジェクトの読み取り専用根拠スナップショット
    ├── hardware-docs/
    ├── urdf/
    ├── meshes/
    ├── photos/
    ├── calibration/
    ├── runtime-config/
    └── licenses/
```

## 最初に行うこと

1. [GUIDELINE.md](GUIDELINE.md) の「事実・推定・設計説明の区別」を読みます。
2. [MISSING-INFORMATION.md](MISSING-INFORMATION.md) の P0 項目に従って、追加撮影・測定を行います。
3. データが得られるたびに [COMPONENT-INVENTORY.md](COMPONENT-INVENTORY.md) と `data/components.json` を更新します。
4. Blender の初版ファイル名は `blender/robot_master_v001.blend` を推奨します。

## データの原則

- `references/` は 2026-09-20 の根拠スナップショットであり、その中で内容を直接修正しません。
- 修正後の結論は、このフォルダーのトップレベル文書と `data/components.json` に、出典・日付を添えて記録します。
- 実機測定は写真による推定より、現在の運用設定は廃止済みの過去値より優先します。URDF は自動的に実CADと同等になるわけではありません。
- 未確認のデータは `unknown`、`estimated`、`conflict` と明示し、モデルを完成させるために精密値を作りません。
- 分解距離とWebアニメーションのパラメータは表示用データであり、機械の組立寸法として書き戻してはいけません。
