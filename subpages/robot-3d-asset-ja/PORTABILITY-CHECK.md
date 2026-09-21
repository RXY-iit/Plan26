# 独立複製チェック

v003 の補足：Blender 主ファイル、2 段階の GLB、ローカルの Three.js 依存ファイル、Web ページを同梱済みで、`serve.py` による独立プレビューが可能。XC330/XH540/MID-360 の公式 CAD、走行モータと Lift の寸法図、Pan/Tilt の型式、新しいカメラ測定図を `references-v2/` に追加済み。以下の「不足項目」は初期スナップショットとして残したもので、現在の不足状況を示すものではない。元の校正画像、自作部品の正確な穴位置、個別に実測していない取り付け寸法は未取得。

目標：`robot-3d-asset/` 全体を別のマシンにコピーするだけで、Blender モデリングと Web アセットの整理を始められるようにする。

## 含まれているもの

- 最新の実機寸法：`MEASUREMENTS.md` と `data/physical-measurements.json`；
- ハードウェアドキュメント、Lift/AZD-KD マニュアル、ABZO キャリブレーションと USB 識別；
- 3 枚の機体全体写真、6 枚のドライバー/減速機写真；
- SO101 の既存 STL 一式、関節 URDF とライセンス；
- D435 DAE、plug STL、URDF と NOTICE；
- MID360 パラメータ化された外形、現在の構成と自己位置推定構成；
- Pan/Tilt、D435、Arm、腕部カメラのキャリブレーションドキュメント、計算 JSON とカメラ内部パラメータ；
- 現在の camera scan poses、Nav2/D435 local costmap 構成；
- 現在の Lift → Arm 動的高さマッピング構成；
- 展開され、相対 mesh パスを使用した移動ロボット/SO101 URDF；
- Blender/Web の命名、階層、分解図と component ID 規則。

## 元の robot_ws に依存しない入口

- 構造寸法：`MEASUREMENTS.md`
- 機械可読寸法：`data/physical-measurements.json`
- 部品表：`data/components.json`
- 移動ロボット展開：URDF `references/urdf/expanded/robot_runtime_simplified.urdf`
- SO101 展開 URDF：`references/urdf/expanded/so_arm101.urdf`
- メッシュ：`references/meshes/`

展開済み URDF に `/home/...`、`package://`、`file://` の mesh URI は含まれない。

## 未取得で、ディレクトリのコピーだけでは補えないもの

- 本回のオレンジ/ブルーサイズ注記図の元のバイナリファイル；サイズは完全に転写されていますが、元の図は手動で指定されたディレクトリに配置する必要があります。
- 最初の2枚の分解図スタイル参照の元のファイルとライセンス情報。
- 車体、取付板、車輪ユニットブラケット、Lift/Armアダプタ、Pan/TiltブラケットのSTEP/STL/CAD。
- BLV-Rモーター/減速ギア、XH540、EASM2スライダー、AZD-KDなどのメーカーCAD。
- Pan/Tiltモーターの具体的な型番と外形。
- 4040/2020 各部材の切断長と接続表。
- 配線全体、コントローラー、電源とNUC取付座標。
- 130 組の元のデュアルカメラキャリブレーション画像。計算結果はコピーされています。通常のBlenderモデリングには元の画像は不要です。外部パラメータを再計算する場合にのみ必要です。

## 外部ソフトウェアはディレクトリと共にコピーされません。

- Blender と URDF/glTF インポートプラグイン；
- Node.js、Three.js、React などの Web ビルドツール；
- 任意の Draco/meshopt 圧縮ツール。

これらは実行環境に属し、ロボットエビデンス資産ではありません。具体的なバージョンは、実際に Blender/Web 工程を開始する際に確定します。
