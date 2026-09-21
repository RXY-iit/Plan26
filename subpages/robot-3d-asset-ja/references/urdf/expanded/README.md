# 単独で利用できる展開済み URDF

- `robot_runtime_simplified.urdf`：現在の移動ロボット運用 xacro の展開結果。簡略車体、車輪、MID360、D435 を含みます。
- `so_arm101.urdf`：SO101 の展開結果。手首カメラの仮形状を含みます。

メッシュ URI はこのフォルダーを基準とした相対パスに変更済みです。`robot-3d-asset` 全体をコピーすれば、ROS package index がなくても同梱の D435/SO101 mesh を参照できます。

注意：`robot_runtime_simplified.urdf` の車体は過去の運用用 box であり、最新の実測構造ではありません。Blender の車体寸法には次を使用してください。

- `../../../MEASUREMENTS.md`
- `../../../data/physical-measurements.json`

SO101 と Lift/車体は別々の URDF ツリーです。組立位置には `physical-measurements.json` と runtime-config の `arm_mount_tf_publisher.py` を使用します。Lift ストロークは200 mmです。
