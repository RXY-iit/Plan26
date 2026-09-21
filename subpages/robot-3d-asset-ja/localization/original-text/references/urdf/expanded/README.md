# 可移植展开 URDF

- `robot_runtime_simplified.urdf`：当前移动机器人运行 xacro 的展开结果；包含简化底盘、轮、MID360 和 D435。
- `so_arm101.urdf`：SO101 展开结果，包含腕部相机占位几何。

网格 URI 已改成相对本目录的路径，因此复制整个 `robot-3d-asset` 后无需 ROS package index 即可找到已包含的 D435/SO101 mesh。

注意：`robot_runtime_simplified.urdf` 的底盘是旧运行占位 box，不是最新实测结构。Blender 中底盘尺寸应使用：

- `../../../MEASUREMENTS.md`
- `../../../data/physical-measurements.json`

SO101 与 Lift/底盘是分开的 URDF 树。装配位置使用 `physical-measurements.json` 与 runtime-config 中的 `arm_mount_tf_publisher.py`；Lift 行程为 200 mm。
