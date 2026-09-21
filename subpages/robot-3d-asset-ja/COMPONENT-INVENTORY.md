# 現在の部品と 3D 根拠資料の棚卸し

v003 更新：本表は初期棚卸しを保持する。現在の 37 部品、メーカー CAD、Evidence / Reference の分類は `data/components.json` を参照。

本表は 2026-09-20 時点の初期棚卸しである。`利用可能`は、メッシュがあるか規則的な形状を生成できる情報があることを示し、取り付け寸法の検証済みを意味しない。

| component_id | 部品 | 数量 | 既存の形状/根拠資料 | 利用可能な情報 | 主な不足情報 |
|---|---|---:|---|---|---|
| `robot.root` | 機体全体 | 1 | 簡略 URDF、実機写真 3 枚、実測注記 | ROS 座標方向、主要構成、底部の水平外形 `700×600 mm` | 六面写真、最大動作範囲、機体バージョンの定義 |
| `base.frame` | アルミフレームの車体/門形フレーム | 1 | 写真、実測寸法、URDF box | X=`700 mm`、Y=`600 mm`、上面 `300/515/620/1330 mm`、4040/2020 | 各高さの名称、部材長、接続部品とパネルの CAD |
| `base.panel` | 底板/取り付け板 | 複数 | 写真 | 複数段の取り付け板を確認 | 材料、厚さ、外形、穴位置 |
| `mobility.wheel.front_left` | 左前輪 | 1 | URDF cylinder、写真 | 位置は約 `(206.4, 248.9) mm`、R=112.5 mm | タイヤ/ホイールの実物 CAD と軸方向 |
| `mobility.wheel.front_right` | 右前輪 | 1 | URDF cylinder、写真 | 位置は約 `(206.4, -248.9) mm`、R=112.5 mm | 同上 |
| `mobility.wheel.rear` | 後輪 | 1 | URDF cylinder、写真 | 位置は約 `(-385, 0) mm`、R=112.5 mm | 同上 |
| `mobility.drive` | BLV-R 走行モータ | 3 | 型式資料、銘板写真 | `BLMR5100K-GFV-B` の配備記録 | モータ銘板とメーカー CAD/寸法図 |
| `mobility.gearhead` | ギヤヘッド | 3 | 銘板写真 | 実物で `GFS5G30FR` を確認済み | CAD、出力フランジとホイールの接続 |
| `mobility.drive_driver` | ドライバ | 3 | 銘板写真、詳細記録 | `BLVD-KRD`、ID 1/2/3 | 車体内の正確な位置と取り付け方向 |
| `mobility.steer` | 操舵サーボ | 3 | 通信実測と型式対応 | `XH540-W270`、ID 11/12/13 | 実物の外形、取り付けブラケット、軸中心 |
| `perception.lidar.mid360` | 3D LiDAR | 1 | パラメトリック URDF 形状 | Φ70.4 × 65 mm、265 g、FOV | 取り付け座標/傾斜角の不一致、ブラケット寸法 |
| `perception.camera.d435` | 深度カメラ | 1 | DAE、メーカー URDF、校正記録 | Intel RealSense D435 | 実機シリアル番号、holder CAD、最終的な軸中心の関係 |
| `perception.camera.pan_tilt` | Pan/Tilt 機構 | 1 | 動的 URDF/校正、写真の一部 | 2 軸の TF、運用 pose/scan pose | モータ型式、ブラケット CAD、実際のリミット、設計根拠 |
| `lift.stage.eas` | 電動スライダ | 1 | 型式、マニュアル、写真、校正 | `EASM2XF020AZAK`、200 mm、リード 3 mm | メーカー STEP/寸法図、機体への取り付け基準 |
| `lift.driver.azd_kd` | Lift ドライバ | 1 | マニュアル、配線、部分写真 | `AZD-KD`、24 V、ABZO | 車体内の位置、外形メッシュ、放熱スペース |
| `lift.control.arduino` | Lift Arduino | 1 | USB 個体識別/配線記録 | Arduino UNO、固定 USB ID | 取り付け位置、筐体、端子配置 |
| `lift.monitor.rs485` | Lift RS485 変換器 | 1 | 型式/USB 個体識別/配線記録 | Waveshare USB TO RS485、FT232RL | 取り付け位置、基板/筐体の外形 |
| `arm.so101` | SO-ARM101 | 1 | 完全な STL、URDF、写真 | 6 × STS3215、関節階層 | Lift に対する最終取り付け transform |
| `arm.camera.wrist` | 手首カメラ | 1 | URDF box、校正記録、写真 | Sonix USB2.0 CAM1、校正済み内部パラメータ | 筐体 CAD、正確な型式/基板寸法 |
| `arm.mount` | Arm/Lift 接続部 | 1 | 実機写真 | Lift スライダに取り付け、台座は地面と平行 | 全印刷部品/フレームの寸法と CAD |
| `safety.estop` | 赤い停止ボタン | 1 | 機体写真、運用ロジック資料 | 3 台の BLVD の DIN3/FREE に作用 | ボタン型式、取り付け穴、完全な安全回路 |
| `electrical.openrb150` | OpenRB-150 | 1 | USB 個体識別/システム記録 | Pan/Tilt/直動機構の制御基板 | 取り付け位置、筐体、配線の外観 |
| `electrical.nuc` | 制御用コンピュータ | 1 | ホスト名と写真 | NUC13ANH-B のホスト環境 | 正確な SKU、取り付け位置、外形、ポート方向 |
| `electrical.power` | 電源と配電 | 複数 | 機体写真 | 24 V システムの存在 | 型式、容量、位置、配電構成 |
| `cables.main` | 主配線 | 複数 | 実機写真 | USB、モータ、センサの配線を確認 | 経路、端点、コネクタ、正式な固定方法 |

## そのまま再利用できる形状

- `references/meshes/so_arm101/`：SO101 の構造部品、モータ、グリッパの STL。
- `references/meshes/realsense/d435.dae`：D435 の外観メッシュ。
- `references/urdf/robot_description/livox_mid360.urdf.xacro`：Blender で MID360 の円柱/球による近似を再構築できる。
- `references/urdf/robot_description/robot.urdf.xacro`：車輪径、3 輪の位置、現在のセンサ TF の初期参考。

## 位置と関係の参考に限る資料

- `robot.urdf.xacro` の車体は単一 box であり、実際のアルミフレーム組立を表していない。
- 車輪は cylinder のみで、操舵部、モータ、ギヤヘッド、ブラケットの形状はない。
- Pan/Tilt は link/joint と校正 transform のみで、機器の外観はない。
- Lift は機体 URDF に含まれず、Arm の動的取り付け TF は独立した運用ノードで配信する。
- 実機写真には遠近と遮蔽の影響があり、正確な長さを直接読み取れない。

## 現時点の結論と残る不一致

| 項目 | 出典 A | 出典 B | 扱い |
|---|---|---|---|
| 車体寸法 | 2026-09-20 実測 `700×600 mm`、複数の高さ平面 | URDF property `670×600×580 mm` の単一 box | 実測をモデリング基準とし、URDF box は旧簡略モデルとして扱う |
| MID360 X/Z | コメント `-0.240/0.6875 m` | 運用 property `+0.240/1.38 m` | `conflict` と表示し、P0 で実測 |
| Lift/Arm span | 現行アクチュエータと ABZO `200 mm` | 旧 Arm visual mount `230 mm` | 200 mm に統一済み。上端 base_link Z=`1.0925 m` |
| Frame の高さ名称 | 青い実測注記 `300/515/620/1330 mm` | 斜視写真 1 枚では下側 3 層の名称を特定できない | 寸法は有効。下側 3 層の component 名称は操作者の確認待ち |
