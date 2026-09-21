# 2026-09-03 デュアルカメラ TF 求解結果

> 2026-09-20 現在の機械修正：Lift 実機型番と ABZO 端点について再度機械ストロークを
> `200 mm` と確認しました。本稿で直接測定した下端 `arm/base_link` 地上高 `1.005 m`
> （相対 `base_link` Z=`0.8925 m`）を保持し、現在の上端は地上高 `1.205 m`
> （相対 `base_link` Z=`1.0925 m`）であるべきです。本稿に記載されている `230 mm`、`1.1225 m` および
> 地上高 `1.235 m` は過去の値であり、現在の運用または 3D モデリングには使用されません。

> 2026-09-04 修正：原文は履歴監査のために保持します。運用値は本稿末尾の「2026-09-04
> 物理制約再検討」を基準とします。古い `arm_mount Z=0.8625 m` と見積もりの wrist-camera
> 外部パラメータは廃止されました。

> 2026-09-04 最終更新：制約付きの結合求解結果は
> `JOINT-EXTRINSIC-SOLVE-20260904.json` にあります。運用 TF はこの結果を採用しました。下方の旧結果および
> 却下された候補は監査のみに使用され、運用数値のソースとしては使用されません。

## 2026-09-04 物理制約の再検討（未配備・却下済みの候補）

今回、混同されていた 2 つの高さを明確にした。Lift 機械最低端での `arm/base_link` 中心の地上高は、直接測定した `1.005 m`。各 Touch Prepare 姿勢の `22.3–24.2 cm` は、`arm/base_link` と `camera_bottom_screw_frame` の **base_link Z 方向の高さ差**であり、3 次元直線距離ではない。Arm/Lift TF は独立した `base_link -> arm/world` 分岐へ変更し、Pan/Tilt は D435 分岐だけを動かす。移動ロボットの `base_link` は地上 `0.1125 m` にあるため、地上 `1.005 m` は `base_link` Z=`0.8925 m` として配信する。230 mm のソフトウェアストロークを保持する場合、配信範囲は `0.8925–1.1225 m`（地上 `1.005–1.235 m`）となる。

同じ 130 個の 2 カメラサンプルと、元のボード設定（square `33.5 mm`、marker `16.5 mm`）を使って再計算する。新しい物理構造は次のとおり。

```yaml
pan_axis_origin_base_m: [0.263023, -0.005841, 0.622500]
tilt_axis_origin_at_reference_base_m: [0.288023, -0.005841, 0.657500]
pan_joint_origin_rpy_rad: [-0.261666, 0.490371, -0.376365]
pan_to_tilt_origin_pan_frame_m: [0.004027, -0.001944, 0.042779]
tilt_joint_origin_rpy_rad: [-1.555945, 0.491941, 0.306151]
tilt_to_realsense_holder_xyz_m: [0.010867, -0.033387, -0.000309]
tilt_to_realsense_holder_rpy_rad: [1.537099, -0.026729, -0.308047]
```

この候補の残差は、並進 RMS `16.14 mm`（median `13.10 mm`、max `40.74 mm`）、回転 RMS `2.35 deg`（median `1.85 deg`、max `6.72 deg`）。旧モデルの cm 単位の精度と整合し、誤った D435 の静的高さから Arm 高さを導出することもなくなる。完全な機械可読結果は `REVISED-TF-AUDIT-20260904.json`、再現用スクリプトは `tools/camera_pan_tilt_calibration/audit_revised_tf.py` を参照。

Arm 手首カメラの機械原点には、公開 `so-frame` モデルを採用する。

```yaml
gripper_link_to_wrist_camera_mount:
  xyz_m: [-0.0150, 0.0240, -0.0315]
  rpy_rad: [-1.5708, -0.0008, -1.5708]
gripper_link_to_public_camera_optical:
  xyz_m: [0.0025, 0.0675, -0.0062]
  rpy_rad: [3.141593, 1.136305, -1.570797]
```

出典は `livekit-examples/so-frame` の commit `657fb4a0bf65bac8f7b336deed2631a4932311c2` にある `simulation/urdf/so101_on_frame.urdf` に固定し、写真からの並進推定は使用しない。再検討では、公開モデルの optical 規約と本機 UVC 画像ストリームに約 `119.53 deg` の固定軸方向差があることも判明した。推定では rotation-only image-axis correction のみを許可し、公開モデルのカメラ中心は移動しない。実機確認により、公開 frame は SAPIEN/MuJoCo camera convention であり、そのまま ROS REP-103 optical frame にできないと判明した。また元データには `base_link` に対するボード面の絶対実測 pose がなく、絶対取り付け TF を独立に証明できない。この候補では Touch 目標が旧運用 TF から約 `[-29.5, -4.5, +20.4] mm` ずれたため、元に戻し、運用 D435 TF には使用しない。

現在の運用方針：D435 は 2026-09-03 に実機 Touch 検証済みの Pan/Tilt 運動モデルに戻す。Arm/Lift は Pan/Tilt から独立させ、Lift 最低位置の `arm/base_link` の地上高を `1.005 m` とする直接実測の補正を保持する。Arm Camera の機械中心の並進は公開モデルを使うが、ROS optical の向きは ChArUco/UVC 実測方向を使用し、SAPIEN frame を ROS TF として配信しない。

## 結論

操作者が「追加データは取得せず、cm 単位の残差は上位アルゴリズムで補償する」という受入条件を確認した後、全既存データを使って幾何制約付きの同時最適化を完了し、運用 TF に反映した。この結果は妥当な空間初期値、RViz 表示、後段の視覚閉ループに用いるもので、計量精度を備えた機械校正とは解釈しない。

## 実際に使用したデータ

- `session_20260903_010858_115137`：有効な 2 カメラサンプル 40 個。Arm raw tick はない。
- `session_20260903_014710_255810`：有効サンプル 26 個。すべて `/arm/hardware_status.raw_position` を含む。
- `session_20260903_020201_959088`：有効サンプル 22 個。すべて `/arm/hardware_status.raw_position` を含む。
- `session_20260903_023525_587586`：有効サンプル 42 個。すべて raw position を含む。
- 合計 130 個の 2 カメラ ChArUco 視点。90 個は 6 軸の直接取得 raw position を持つ。
- 校正ボード設定：`7 x 5`、`DICT_5X5_100`、square `33.5 mm`、marker `16.5 mm`。
- Lift は機械最低位置。各取得グループ内ではロボットと校正ボードを動かさない。

## 検証済み・有効化済み：Arm Camera の内部パラメータ

Arm Camera の ChArUco 画像 130 枚すべてに対して `cv2.calibrateCamera` を実行する。

- OpenCV RMS 再投影誤差：`0.314985 px`
- `fx=342.492801`、`fy=342.252614`
- `cx=344.242443`、`cy=269.760782`
- 歪み係数：`[0.0809068, -0.1254090, 0.00281121, -0.00075865,
  0.0421668]`

次のファイルに保存済み：

`src/robot_bringup/config/arm_camera_calibrated.yaml`

実機と校正ツールの Arm Camera の `camera_info_url` を、ともにこのファイルへ変更した。旧 `arm_camera_uncalibrated.yaml` は、内部パラメータがゼロであることを明示する代用設定として保持するが、既定の起動経路では使用しない。

## 最終採用した制約付き同時推定モデル

同時推定モデルは、次の実物の条件を厳密に満たす。

- Arm 台座は地面と平行。
- Arm/Lift は Pan に追従しない。
- Arm Camera はグリッパ本体に固定し、親 frame は `arm/gripper_link`。jaw の開閉には追従しない。
- Pan/Tilt の 2 軸は厳密に直交するが、どちらの軸も地面と平行または垂直であるとは仮定しない。
- 2 軸には実際の軸中心オフセットがあり、カメラは近似的な球面軌道上を動く。
- `267.1/101.8` をゼロ角度の基準とし、旧基準カメラ TF を厳密に保持する。

同時最適化の結果：

```yaml
arm_mount_at_lift_lower_limit:
  xyz_m: [0.32084, 0.01262, 0.86250]
  rpy_rad: [0.0, 0.0, -0.01532]
arm_gripper_link_to_camera_optical:
  xyz_m: [0.02980, 0.04821, -0.04671]
  rpy_rad: [2.54576, 0.04301, -0.50527]
pan_axis_in_camera_pan_mount_base:
  unit_vector: [0.54594, 0.03278, 0.83719]
  point_m: [-0.10311, -0.01623, 0.04847]
tilt_axis_at_reference:
  unit_vector: [0.04085, 0.99700, -0.06568]
  point_m: [0.29004, 0.02104, 0.66326]
axis_dot_product: 1.4e-17
```

2026-09-03 の実機再測定により、Lift が機械最低端のとき、SO101 の `arm/base_link` は基準姿勢の RealSense 取り付け基準点（現在の TF の `realsense_holder_link` / `camera_bottom_screw_frame`）より `225 mm` 高いと確認された。初期記録ではこの取り付け基準点を `camera_link` と略記したが、厳密には D435 のメーカー URDF マクロが基準点の後に機器内部の外部パラメータを追加する。既存の取り付け基準点 `Z=0.6375 m` を保持し、運用用 Arm mount Z を `0.6375 + 0.2250 = 0.8625 m` に修正した。初期の同時視覚推定値 `0.90682 m` から `44.32 mm` 下方となる。Lift のソフトウェアストロークは引き続き `230 mm` なので、上端推定値は `1.0925 m`。直接測定した物理的高さの差に基づく値のため、残差の大きい同時視覚推定 Z より優先する。

raw feedback から関節角への変換には、ゼロ点を固定した二次写像を使用する。

```text
pan_rad  = 0.0170137853 * (pan_raw - 267.1)
         - 0.00000617291927 * (pan_raw - 267.1)^2
tilt_rad = 0.0160077655 * (tilt_raw - 101.8)
         - 0.00000578161438 * (tilt_raw - 101.8)^2
```

130 サンプル全体の同時推定モデルの RMS は約 `15.5 mm / 2.83 deg`。session ごとの並進 RMS は約 `10.1–21.3 mm`。現在の 2 カメラの可視範囲と機構のバックラッシュ条件における最善の折衷であり、「概ね妥当な初期値」という新目標を満たす。ただし把持では、対象の再観測、視覚サーボ、または末端誤差表による閉ループ補償が必要である。

## 運用実装

- URDF：`camera_pan_mount_base -> camera_pan_yaw_link -> camera_tilt_link ->
  realsense_holder_link`。
- `camera_pan_tilt_joint_state_node` は 2 つの実フィードバックのみを読み取り、10 Hz で 2 つのカメラ関節を配信する。指令インターフェースは持たず、フィードバック欠落または 1 秒超の経過で配信を停止する。
- Arm の表示角度比の補正は `/arm/visual_joint_states` に配信し、Arm の `robot_state_publisher` だけが使用する。実機の軌道制御、ソフトリミット、保護には元の安全校正を引き続き使用する。
- 全機能 bringup では RealSense driver は TF を配信せず、camera TF の owner は URDF/RSP に一本化する。

## 初期の制約なし候補（監査記録としてのみ保持）

Pan=`267.1`、Tilt=`約 101.8–101.95` の 14 個の Arm 姿勢について、既存の `base_link -> camera_color_optical_frame` を絶対基準とし、次を同時推定する。

- 回転しない mount から SO101 `base_link` への変換。
- `gripper_link -> arm_camera_color_optical_frame`。
- 5 つの Arm 関節の表示角度比。

mount の roll/pitch を自由にした候補は次のとおり。

```yaml
camera_pan_mount_base_to_arm_base_candidate:
  xyz_m: [0.31377, -0.00228, 0.90836]
  rpy_rad: [0.05793, -0.03742, -0.06329]
gripper_link_to_arm_camera_optical_candidate:
  xyz_m: [0.01781, 0.04331, -0.06044]
  rpy_rad: [2.52339, 0.04110, -0.48729]
joint_visual_scale_candidate:
  shoulder_pan: 1.08577
  shoulder_lift: 0.92727
  elbow_flex: 0.90158
  wrist_flex: 1.04837
  wrist_roll: 1.35565
```

wrist-roll の比率は約 `1.35` で、前回のデータで独立に観測された約 `1.37` と一致する。現在の raw tick から URDF rad への wrist-roll 比率に、偶然のノイズではなく系統誤差が存在することを示す。

## D435 カラー光学中心から Arm 台座までの距離の定義

`arm_camera_color_optical_frame` と混同しないよう、Touch Prepare Pose の相対距離を次のように定義する。

```text
camera_color_optical_frame <-> arm/base_link
```

これは固定の機械寸法ではない。Pan/Tilt は D435 の光学中心を、Lift は Arm 台座を変化させる。今回の校正基準条件（Lift 機械最低位置、Pan=`267.1 deg`、Tilt=`101.8 deg`）で、現在の運用 URDF の順運動学を計算すると次のようになる。

```yaml
arm_base_position_in_base_link_m: [0.320840, 0.012620, 0.862500]
d435_color_optical_position_in_base_link_m: [0.336241, 0.032500, 0.639697]
d435_color_optical_to_arm_base_delta_m: [-0.015401, -0.019880, 0.222803]
euclidean_distance_m: 0.224218
```

以前に実測した `225 mm` は、D435 取り付け基準点に対する Arm 台座の垂直高さ差であり、上記 2 つの光学/運動 frame 原点間のユークリッド距離ではない。運用時には RViz が最新 TF から黄色の接続線を描き距離を表示する。基準姿勢を登録する際は、実際の Pan/Tilt feedback、Lift 状態、この TF を同時に保存し、`224.218 mm` を別の姿勢にコピーしてはならない。

## 2026-09-04 Touch Prepare の実機再測定に関する補足

- 操作者が `arm/gripper_frame_link` の原点を目的の接触点と確認。`arm/touch_tip` はこの原点に一致させ、STL から推定した `[2.2, 0, 6.3] mm` のオフセットは使用しない。
- 実機の wrist roll は `-0.031 rad` で中立の外観となり、旧 RViz では `-0.277 rad` の入力で同じ外観となる。`/arm/visual_joint_states` に `-0.33725009 rad` の表示オフセットを追加済み。この補正は実指令、raw tick 校正、リミット、保護ロジックには反映しない。
- 操作者が確認した 12 個の Touch Prepare 姿勢を、複数初期値の IK seed として使用する。詳細は `../skills-arm/TOUCH-PREPARE-POSE-STRATEGY-20260904.md` を参照。

新たに測定した Pan/Tilt 軸中心の地上高は、現在の運用 TF の中間 link 原点と一致しない。ただし、`arm/base_link <-> camera_bottom_screw_frame` の `22.3–24.2 cm` が X、Z、3 次元直線距離のどれかは未記載である。新しい高さをそのまま URDF Z と解釈すると、Pan=`267`、Tilt=`101.9` の bottom screw は約 `74.7 cm` となり、本文で先に確認した Arm base `86.25 cm` との差は `11.55 cm` にすぎず、`22.5 cm` ではない。そのため Pan/Tilt の並進はまだ上書きせず、距離の方向と同じ条件での Arm base 地上高を先に確認する。

ただし、当てはめた 14 サンプルの姿勢ごとの誤差は次のとおり。

- 並進：`2.7–18.7 mm`
- 回転：`0.49–3.17 deg`

操作者は Arm 台座が地面と平行であることも確認済み。mount の roll/pitch をゼロに固定すると、候補 mount は約 `xyz=[0.31632, 0.00074, 0.91256] m`、yaw=`-0.04009 rad` となり、モデル全体の残差はむしろ明らかに増える。自由な roll/pitch が Arm URDF の関節比率、軸線、holder の誤差を吸収していることを示すため、実際の台座の傾斜として記録してはならない。

## 初期の理想 2 軸モデルの限界（監査記録としてのみ保持）

`session_20260903_020201_959088` の sample 2–10 は Arm raw position がほぼ一定で、基準姿勢から 8 個の Pan/Tilt 姿勢へつながる。このため Arm mount の未知量を消去し、Pan/Tilt を単独で検証できる。

2 つの理想的な固定回転軸で当てはめた結果：

- 当てはめたサンプルの最大並進誤差は約 `23.0 mm`。
- 当てはめたサンプルの最大回転誤差は約 `2.04 deg`。
- 別の Arm 固定グループで相対運動を検証した場合、並進誤差は約 `3.2–37.6 mm`、回転誤差は約 `0.34–3.39 deg`。

最終実装では「地面に直交する原点上の 2 軸と線形角度」という仮定を採用せず、傾斜し、相互に直交し、軸中心オフセットと二次角度写像を持つ URDF 関節モデルを採用した。

## 将来さらに精度を高める場合に必要なデータ（現時点では追加要求しない）

### Pan/Tilt（優先）

Arm の姿勢、校正ボード、ロボットを固定し、全シーケンス中に Arm を変更しない。

1. まず基準点 `267/102` を保存する。
2. Tilt を `102` に固定し、Pan を約 `210, 230, 250, 267, 285, 300, 320` の順に保存する。
3. Pan を `267` に固定し、Tilt を約 `35, 50, 65, 80, 102` の順に保存する。
4. 実際の 9 個の名前付き姿勢をそれぞれ 1 回保存する。
5. 少なくとも `267/102`、`267/65`、左右 2 姿勢について、増加方向と減少方向からそれぞれ 1 回到達し、バックラッシュを定量化する。

各 sweep の開始と終了で `267/102` を再度保存することが最も重要である。これにより、全データが絶対基準と同じ連結成分に属する。

### Arm

Pan/Tilt は常に `267/102` に固定する。安全な中間姿勢を選び、毎回 1 関節だけを変更する。肩 pan、肩 lift、elbow、wrist flex、wrist roll について、それぞれ明確に異なる角度を少なくとも 5 個保存する。各 sweep の開始と終了で同じ中間姿勢を保存する。これにより、mount の傾きで誤差を吸収させず、raw-rad 比、関節軸の誤差、カメラ holder の外部パラメータを区別できる。

## 将来、計量精度の把持用外部パラメータへ移行する条件

現在の TF は「概ね妥当な初期値」として有効化済み。将来、上位の視覚補償をなくし、TF 自体を計量精度の把持基準として使うには、少なくとも次の条件を満たす必要がある。

- 検証用に取り置いた姿勢の RMS 並進誤差が `10 mm` 以下。
- 同じ姿勢の RMS 回転誤差が `1 deg` 以下。
- 固定された Agent Camera の全名前付き姿勢が表内またはその近傍にある。
- 同一目標へ増加/減少方向から到達した差を記録する。基準を超える場合は方向別に 2 つの表を使い、根拠なく 1 つの表に平均しない。


追加参考：
現在の目的に近いプロジェクトが見つかった。STL だけでなく、**SO-ARM101 + 手首カメラブラケット + camera frame** を URDF に記述済みである。ROS2 / RViz 用の SO-ARM101 URDF を構築する際、優先的な参照を推奨する。

特に有用なのは `livekit-examples/so-frame` である。完全な `so101_on_frame.urdf` を提供し、手首には **SO-101 32×32 UVC wrist camera mount** を使用して、`wrist_camera_mount_joint` と `frame_wrist_camera` を定義済み。カメラは `gripper_link` に固定され、wrist roll には追従するが、グリッパの開閉には追従しない。([GitHub][1])

[SO-Frame GitHub リポジトリ](https://github.com/livekit-examples/so-frame?utm_source=chatgpt.com)

特に次のディレクトリを参照する。

```text
simulation/urdf/
├── so101_on_frame.urdf
│
└── components/
    ├── so101_arm/
    │   ├── so101_new_calib.urdf
    │   └── assets/
    │
    └── wrist_camera/
        └── SO-ARM101_camera_wrist_mount.stl
```

公式 README は、この手首カメラを **Hex-Nut Recess Wrist Camera、32×32 UVC module** と明記している。対応する STL は次のとおり。

```text
SO-ARM101_camera_wrist_mount.stl
```

取り付け関係も調整済みである。([GitHub][2])

おおよその構造は次のとおり。

```text
wrist_flex
    ↓
wrist_roll
    ↓
gripper_link
    ├── fixed jaw
    ├── moving jaw
    │
    └── wrist_camera_mount_joint
             ↓ fixed
       wrist_camera_mount
             ↓ fixed
       frame_wrist_camera
```

各項目の意味：

```text
parent = gripper_link
child  = wrist_camera_mount
type   = fixed
```

**手首カメラをロボット末端の固定センサ link として扱う**という現在の要件に適しており、TF はアームに追従して自動更新される。作者は、gripper に対するカメラブラケットの xyz / rpy を調整するための `wrist_camera_aligner.html` も用意している。([GitHub][2])

---

手首ブラケット自体も SO-ARM 公式リポジトリ由来のため、元の STL を直接利用できる。

[公式 SO-ARM101 wrist camera STL](https://github.com/TheRobotStudio/SO-ARM100/blob/main/Optional/SO101_Wrist_Cam_Hex-Nut_Mount_32x32_UVC_Module/stl/SO-ARM101_camera_wrist_mount.stl?utm_source=chatgpt.com)

SO-ARM 公式リポジトリには複数の wrist camera mount があり、次を含む。

* `32×32 UVC Hex Nut` — SO101
* `32×32 UVC Integrated` — SO100 / SO101
* RealSense D405
* RealSense D435 / D435I
* 一般的な Webcam

写真の小型正方形 USB camera は、公式が対応しているこの種の手首カメラ構成に該当する。([GitHub][3])

---

ただし、次の点に注意する。

写真の WowRobo キットは次の構成に見える。

```text
32×32 mm USB Camera PCB
+
SO-ARM101 wrist mount
```

既存モデルで主に提供されているのは**カメラブラケットの STL**であり、PCB、レンズ、USB ケーブルの完全な形状が含まれるとは限らない。

URDF では camera PCB を過度に精細化する必要はない。次の構成を推奨する。

```text
gripper_link
   ↓ fixed
camera_mount_link
   ├── SO-ARM101_camera_wrist_mount.stl
   ↓ fixed
camera_body_link
   ├── 32 × 32 × ~8 mm box
   ↓ fixed
camera_link
   ↓ fixed
camera_optical_frame
```

PCB 全体を高ポリゴン STL にするより標準的な方法である。

最終的な ROS TF の例：

```text
wrist_roll_follower
        │
        └── gripper_link
                │
                └── wrist_camera_mount
                        │
                        └── camera_link
                                │
                                └── camera_optical_frame
```

その後、Open-vocabulary 3D Touch pipeline で次を直接使用できる。

```text
camera image
     ↓
SAM / VLM
     ↓
depth
     ↓
camera_optical_frame
     ↓ TF
base_link
     ↓
MoveIt / visual servo
```

以前に計画した SO-ARM101 の `VLM → SAM → Depth → TF → Touch` pipeline と自然に接続できる。

### 採用を推奨する構成

WowRobo のカメラブラケットを最初から測り直す必要はない。

次をそのまま利用する。

**1. SO-ARM101 本体の URDF**

LeRobot にも公式 SO101 mesh assets があり、`wrist_roll_follower_so101_v1.stl`、`wrist_roll_pitch_so101_v2.stl`、STS3215 などの完全な部品が含まれる。([Hugging Face][4])

[LeRobot SO101 URDF Assets](https://huggingface.co/buckets/lerobot/robot-urdfs/tree/so101/assets?utm_source=chatgpt.com)

**2. 公式の wrist camera mount STL**

```text
SO-ARM101_camera_wrist_mount.stl
```

**3. `so-frame` の camera joint 定義を利用**

特に次の点：

```text
wrist_camera_mount_joint
frame_wrist_camera_joint
```

xyz / rpy を改めて推測する必要をほぼなくせる。

---

もう 1 つ重要な違いがある。

`so-frame` の `frame_wrist_camera` は **SAPIEN / ManiSkill camera convention** を使用する。

```text
+X = camera forward
-Y = image right
+Z = image up
```

ROS で一般的な REP-103 の `camera_optical_frame` とは**座標定義が異なる**。プロジェクトの README にも注意が記載されている。([GitHub][2])

したがって、目的が次の場合：

```text
ROS2
RViz
MoveIt
image_proc
depth_image_proc
TF2
```
