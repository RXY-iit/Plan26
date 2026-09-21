# 出典一覧

スナップショット日付：2026-09-20

`references/` のファイルは現在の `robot_ws` からコピーされ、Blender/Web 資産プロジェクトが散在するディレクトリに依存しないようにするためです。これらはエビデンスのスナップショットであり、元のファイルとの自動同期は行われません。

スナップショットドキュメント内の相対リンクは原文のまま保持され、一部のリンクは元のディレクトリ構造で解析されるため、このスナップショットディレクトリでは直接クリックできない場合があります。これらのリンクを使用する際は、このファイルに記載されている「元の出典」を基準とし、スナップショット本文を修正して独立したドキュメントとして偽装しないでください。

## Hardware 文書

| スナップショットディレクトリ | 元の出典 |
|---|---|
| `references/hardware-docs/*.md` | `hardware/*.md` |
| `references/hardware-docs/lift_mechanism/*.md` | `hardware/lift_mechanism/*.md` |
| `references/hardware-docs/lift_mechanism/HM-60313J.pdf` | `hardware/lift_mechanism/HM-60313J.pdf` |

内容範囲：BLV-R、XH540、MID360、D435、Pan/Tilt/直動制御、SO101、非常停止、Lift/AZD-KD/ABZO。

`references/hardware-docs/robot_frame_dimensions.md` には、2026-09-20 の最新実機寸法を別途記録：水平 `700 × 600 mm`、4つの高さ平面、4040/2020 フレーム材、および Lift 200 mm ストローク。

## URDF とメッシュ

| スナップショットディレクトリ | 元の出典 |
|---|---|
| `references/urdf/robot_description/` | `src/robot_description/urdf/` |
| `references/urdf/so_arm101_description/` | `src/so_arm101_description/urdf/` と `src/so101_arm_control/urdf/so_arm101_mock.urdf.xacro` |
| `references/urdf/realsense2_description/` | `src/realsense-ros/realsense2_description/urdf/` のうち D435 に必要なファイル |
| `references/urdf/expanded/` | 現在の xacro から生成され、プロジェクト内の相対 mesh パスに変更され、無 ROS 環境でのインポートを容易にする |
| `references/meshes/so_arm101/` | `src/so_arm101_description/meshes/` 中の全ての STL と LICENSE |
| `references/meshes/realsense/` | `src/realsense-ros/realsense2_description/meshes/` 中の D435 と plug メッシュ |

## 実物写真

| スナップショットディレクトリ | 元の出典 |
|---|---|
| `references/photos/real-robot/` | `hardware/real-bot-figure/`、3 枚 |
| `references/photos/drive-motors/` | `hardware/motor-image/`、6 枚 |

2026-09-20 に、`700/600/300/515/620/1330 mm` 橙色と青色のマーキングが付いた添付ファイルはローカルファイルパスを公開していません。
そのため、現時点では `MEASUREMENTS.md`、`data/physical-measurements.json`、および
`references/hardware-docs/robot_frame_dimensions.md` に寸法を完全に転記しています。元画像は後ほど
`references/photos/measurements/IMG_0179_measurements_20260920.png` に配置する必要があります。

## キャリブレーションと設計記録

| スナップショットファイル | 元の出典 |
|---|---|
| `references/calibration/ARM_TF_README.md` | `todo-my/arm-baseline/tf-updata/README.md` |
| `references/calibration/CAMERA_ARM_TF_CALIBRATION.md` | `todo-my/arm-baseline/tf-updata/CALIBRATION-RESULT-20260903.md` |
| `references/calibration/PAN_TILT_CAPTURE_README.md` | `tools/camera_pan_tilt_calibration/README.md` |
| `references/calibration/ARM_DEVELOPMENT_GUIDELINE.md` | `todo-my/arm-baseline/ARM-DEVELOPMENT-GUIDELINE-20260825.md` |

これらの記録には、過去の値と却下候補が含まれており、参照する際は状態説明を確認する必要があり、単一の数値を切り取ることはできません。

## 現在の運用構成スナップショット

| スナップショットファイル | 元の出典 |
|---|---|
| `references/runtime-config/test_all.launch.py` | `src/robot_bringup/launch/test_all.launch.py` |
| `references/runtime-config/arm_mount_tf_publisher.py` | `src/so101_arm_control/so101_arm_control/arm_mount_tf_publisher.py` |
| `references/runtime-config/arm_real_dashboard_test.yaml` | `src/so101_arm_control/config/arm_real_dashboard_test.yaml` |
| `references/runtime-config/real_camera_poses.yaml` | `src/robot_skills/config/real_camera_poses.yaml` |
| `references/runtime-config/camera_scan_profiles.yaml` | `src/robot_skills/config/camera_scan_profiles.yaml` |
| `references/runtime-config/arm_camera_calibrated.yaml` | `src/robot_bringup/config/arm_camera_calibrated.yaml` |
| `references/runtime-config/MID360_config.json` | `src/livox_ros_driver2/config/MID360_config.json` |
| `references/runtime-config/nav2_params.yaml` | `src/nav_pkg/config/nav2_params.yaml`、D435 local costmap 範囲を含む |
| `references/runtime-config/navigation.launch.py` | `src/nav_pkg/launch/navigation.launch.py` |
| `references/runtime-config/fast_lio_mid360.yaml` | `src/localization_pkg/config/fast_lio_mid360.yaml` |

`references/calibration/JOINT-EXTRINSIC-SOLVE-20260904.json` と
`REVISED-TF-AUDIT-20260904.json` は、キャリブレーションドキュメントで参照される機械可読な解結果を保存します。

## ライセンスと attribution

| スナップショットファイル | 元の出典 |
|---|---|
| `references/meshes/so_arm101/LICENSE` | SO101 mesh ソースディレクトリ |
| `references/licenses/SO_ARM101_ATTRIBUTION.md` | `src/so_arm101_description/ATTRIBUTION.md` |
| `references/licenses/REALSENSE_ROS_NOTICE.md` | `src/realsense-ros/NOTICE.md` |

公開ウェブページでモデルを使用する前に、メッシュのライセンス、attribution の要求、および最適化された GLB の再配布が許可されているか再度確認する必要があります。

## コピーされなかった内容

- 本回の会話で2つの分解図スタイル参考資料に利用可能なローカルファイルパスがないため、画像の本体はコピーされていません。その視覚方向は `GUIDELINE.md` に記録されており、後ほど元の画像を `references/concept/` に入れてください。
- ROS bag、キャリブレーションのオリジナル画像と運用ログの容量が大きいため、コピーされていません。既存のドキュメントにはその出典の説明を保持しています。
- 第三者の完全なソースコードパッケージはコピーされておらず、D435 メッシュの使用と NOTICE に関するファイルのみが保存されています。
- Dashboard、コントロールノードとテストコードは3Dモデリングの入力ではないため、現在の取付 transform/pose 設定以外はコピーされていません。

## 更新スナップショットの方法

更新前に、元のファイルの差異を比較してください。再コピー後、必ず以下の作業を行ってください。

1. 本ファイルのスナップショット日付を更新します。
2. トップレベルのドキュメントで新規の競合を処理します。
3. `components.json` のソースパスを確認します。
4. 第三者のライセンスを再確認します。
5. Blender 内で手動でクリーンアップされた derived mesh を上書きしないでください。
