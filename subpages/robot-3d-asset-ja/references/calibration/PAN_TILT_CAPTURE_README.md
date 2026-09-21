# カメラ Pan/Tilt + SO101 手首カメラの ChArUco 撮影ツール

このツールは、次のものだけを起動する。

- Intel RealSense D435 のカラー、生深度、位置合わせ済み深度ストリーム。
- 配備済み SO101 Sonix 手首カメラ（640 x 480 / 15 FPS）。
- 配備済み OpenRB-150 Pan/Tilt シリアルブリッジ。
- トルクを切った `real2sim` モードの SO101 follower リーダー。実測の `/joint_states` を配信する（Leader アームは起動しない）。
- `joy_node` と既存のカメラ専用 Joy コントローラ。
- 読み取り専用の撮影ノード。
- 専用の `ChArUco Capture` パネルを備えた RViz。

走行/操舵モータ、teleop twist、`/cmd_vel`、Nav2、LiDAR、Agent、Lift は起動**しない**。起動時には Pan/Tilt に基準姿勢 `267 deg / 102 deg` を指令するため、機構の周囲を空けておく。SO101 リーダーは起動時に follower の全トルクが OFF であることを要求し、意図的な動作は行わない。この起動構成は D435 を専有する必要があるため、断続的に観測された古い深度ストリーム状態を解消する目的で、RealSense ドライバの起動時デバイスリセットを要求する。別の RealSense プロセスと同時に実行してはならない。

## 1. ボードの仕様

既定の検出器設定は次のとおり。

| 項目 | 値 |
|---|---:|
| 種類 | ChArUco |
| マス数 | 7 x 5 |
| マスの一辺 | 実測 33.8 mm |
| マーカの一辺 | 実測 16.5 mm |
| 辞書 | `DICT_5X5_100` |

対応する画像を生成する。

```bash
cd /home/matsunaga-h/robot_ws
python3 tools/camera_pan_tilt_calibration/generate_charuco_board.py
```

使用中の印刷物は、マス全体の一辺が 33.8 mm、符号化マーカの一辺が 16.5 mm と実測されている。撮影の既定値には PNG の公称スケールではなく、この実測値を使用する。印刷物を交換した場合は再測定し、起動時に値を明示する。

OpenCV の `square_length_m` はチェスボードのマス全体の一辺、`marker_length_m` は白いマス内部にある小さい ArUco マーカの一辺を表す。マーカはマスより小さくなければならない。両方の実寸を測定し、内部マーカの幅を黒いマスの幅で代用しない。

## 2. ビルド

```bash
cd /home/matsunaga-h/robot_ws
set +u
source /opt/ros/humble/setup.bash
source install/setup.bash

colcon build --packages-select camera_pan_tilt_calibration --symlink-install
source install/setup.bash
```

## 3. 起動

通常の全機能 bringup と同時に実行しない。RealSense、手首カメラ、Joy デバイス、OpenRB シリアルポートが競合する。

```bash
cd /home/matsunaga-h/robot_ws
export ROS_DOMAIN_ID=13
tools/camera_pan_tilt_calibration/start.sh
```

別の Joy デバイスや実測したボード寸法を指定する場合：

```bash
tools/camera_pan_tilt_calibration/start.sh \
  joy_dev:=/dev/input/js1 \
  square_length_m:=0.0338 \
  marker_length_m:=0.0165
```

手首カメラの既定値には、個体識別を確認済みの次の固定パスを使用する。

```text
/dev/v4l/by-id/usb-Sonix_Technology_Co.__Ltd._USB2.0_CAM1_USB2.0_CAM1-video-index0
```

交換デバイスを確認した場合にのみ上書きする。

```bash
tools/camera_pan_tilt_calibration/start.sh \
  arm_camera_device:=/dev/v4l/by-id/VERIFIED_CAPTURE_DEVICE
```

`base_link` に対するボード姿勢を別途測定している場合は、後段の校正コードに推測させず、明示的に記録する。

```bash
tools/camera_pan_tilt_calibration/start.sh \
  board_pose_reference:="laser/ruler survey 2026-09-02" \
  board_base_x_m:=1.500 board_base_y_m:=0.000 board_base_z_m:=0.800 \
  board_base_roll_rad:=0.000 board_base_pitch_rad:=0.000 board_base_yaw_rad:=3.141593
```

上記の数値は引数の構文例であり、実測値として流用しては**ならない**。省略した場合、出力には `NOT_PROVIDED` と記録する。

## 4. 撮影

1. サンプル取得中に動かないよう、ロボット台座と ChArUco ボードを固定する。D435 と手首カメラの両方からボードが見えるように配置する。
2. 既存システムと同様、`L1/LB` を押しながら十字キーで Pan/Tilt を操作する。
3. Lift が物理下限で固定されていることを確認する。操作をすべて離し、RViz パネルが `READY` を表示するまで待つ。
4. 必要に応じて `middle_center` などの姿勢ラベルを入力する。
5. **安定姿勢を保存（Capture stable sample）** を押す。
6. パネルに `SAVED` と表示された場合にのみ、サンプルを採用する。状態欄には RealSense/手首カメラのコーナー数が表示される。`REJECTED` はサンプルが保存されなかったことを意味する。表示されたデータ上の問題を修正して再試行する。
7. 重要な姿勢には両方向から接近する。`middle_center_from_pan_inc`、`middle_center_from_pan_dec` などのラベルを使用する。

現在の撮影ゲートでは、最新の D435 カラー/生深度/位置合わせ済み深度、最新の手首 RGB と全 4 系統の CameraInfo、最新の Pan/Tilt フィードバック、少なくとも 0.8 s にわたり変動幅が 0.15 raw-unit 以下の数値的安定性、同じ時間窓で安定した完全な実機 SO101 `/joint_states`（既定の各関節最大変動幅は `0.01 rad`）、取得後 1.5 s 以内の完全な直接取得 `/arm/hardware_status`、および**両方**の RGB カメラで少なくとも 8 個の ChArUco コーナーを要求する。これらは明示的なデータ品質条件であり、機構が物理的に静止したことを保証するものではない。

カメラ間の共通ハードウェアクロックやトリガは確認されていないため、ROS ヘッダ時刻をカメラ間の採否条件には用いない。ホストで全ストリームの最新データを観測し、装置が静止している場合にのみ撮影を許可する。ヘッダ時刻差とホスト受信時刻差は監査用に正確に保存し、同一露光時刻の証拠としては扱わない。

## 5. 出力

実行ごとに次のものを作成する。

```text
output/session_YYYYMMDD_HHMMSS_microseconds/
  session.json
  manifest.jsonl
  sample_0001_optional_label/
    metadata.json
    charuco.json
    color.png
    color_charuco.png
    arm_color.png
    arm_color_charuco.png
    arm_charuco.json
    depth_raw.png
    depth_raw.npy
    depth_aligned_to_color.png
    depth_aligned_to_color.npy
```

`metadata.json` には、Pan/Tilt の生フィードバック、直近 5 秒間の生フィードバック履歴、最新目標値、生値の到達方向、安定性の時間窓と判定、ROS 画像の時刻/エンコーディング/frame ID、カメラ間の時刻差、カラー/深度/位置合わせ/手首の完全な CameraInfo、RealSense ドライバの最新 `/tf` と `/tf_static`（内部ストリーム frame の幾何を含む）、現在の Joy 状態、必須の実機 `/joint_states`、操作者が確認した固定 Lift 基準、完全な `/arm/hardware_status` JSON を記録する。6 個のサーボから直接取得した `raw_position` は、換算後の関節 rad 値とは別に抽出する。UTC 撮影時刻、各データの経過時間と時刻差も監査用に保持する。`charuco.json` と `arm_charuco.json` には、各カメラで検出した全コーナーの ID、画素座標、既知のボード座標（m）を記録する。

RViz 撮影パネルは Pan/Tilt の生フィードバックをリアルタイム表示する。デバイスが報告する値は再現可能な姿勢の選択に有用だが、運動モデルが求まるまでは校正済みの物理角度として表示しない。

到達方向は意図的に `INCREASING` / `DECREASING` と命名している。生フィードバックの増減を表し、物理的な左右上下は推定しない。深度 PNG/NPY は元画像のエンコーディングと単位を保持する。この撮影ツールでは、校正済み角度、URDF 変換、メートル単位の base-frame 姿勢を推定しない。

## 6. 手首カメラの内部パラメータ

現在の既定の手首 CameraInfo は、実測した `robot_bringup/config/arm_camera_calibrated.yaml` である。2026-09-03 に取得した 130 個の有効な ChArUco 画像から求めた（OpenCV RMS 再投影誤差 `0.314985 px`）。全ゼロの `arm_camera_uncalibrated.yaml` は、明示的な代替用プレースホルダとしてのみ残す。

カメラ/レンズまたは解像度を変更して再校正する場合は、画像内の位置、距離、傾きを変え、少なくとも 10-20 枚の手首カメラ画像を取得する。ほぼ同じ視点の繰り返しでは、安定した内部パラメータ校正に必要な条件がそろわない。その後、次を実行する。

```bash
cd /home/matsunaga-h/robot_ws
python3 tools/camera_pan_tilt_calibration/solve_arm_camera_intrinsics.py \
  tools/camera_pan_tilt_calibration/output/session_YYYYMMDD_HHMMSS_microseconds
```

セッション内に `arm_camera_calibrated.yaml` と画像ごとの再投影誤差レポートを書き出す。配備済みの実測ファイルを置き換える前に誤差を確認する。ソルバは `--force` が明示されない限り既存結果を上書きしない。

ここで求めるのは**内部パラメータのみ**である。`base_link -> arm/world` の改善には、最新の実機 `/joint_states` を伴う複数のアーム姿勢と、手首カメラからグリッパへの hand-eye 変換が別途必要になる。同時撮影画像だけでは、台座の取り付け誤差と手首カメラの取り付け誤差を分離できない。`/joint_states` のないサンプルも手首カメラの内部パラメータ校正には使用できる。メタデータにはアーム姿勢を推測して記入せず、`NOT_AVAILABLE` と記録する。

`Ctrl-C` で停止し、全プロセスの終了を待ってから通常のロボット bringup を再開する。
