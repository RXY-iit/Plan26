# 来源清单

快照日期：2026-09-20

`references/` 中的文件从当前 `robot_ws` 复制，用于让 Blender/Web 资产项目不依赖散落目录。它们是证据快照，不会随原文件自动同步。

快照文档中的相对链接保持原文状态，部分链接仍按原始目录结构解析，因此在本快照目录中可能不能直接点击。使用这些链接时以本文件记录的“原始来源”为基准，不修改快照正文来伪装成独立文档。

## Hardware 文档

| 快照目录 | 原始来源 |
|---|---|
| `references/hardware-docs/*.md` | `hardware/*.md` |
| `references/hardware-docs/lift_mechanism/*.md` | `hardware/lift_mechanism/*.md` |
| `references/hardware-docs/lift_mechanism/HM-60313J.pdf` | `hardware/lift_mechanism/HM-60313J.pdf` |

内容覆盖 BLV-R、XH540、MID360、D435、Pan/Tilt/直动控制、SO101、急停、Lift/AZD-KD/ABZO。

`references/hardware-docs/robot_frame_dimensions.md` 另外保存 2026-09-20 最新实机尺寸：水平 `700 × 600 mm`、四个高度平面、4040/2020 型材以及 Lift 200 mm 行程。

## URDF 与网格

| 快照目录 | 原始来源 |
|---|---|
| `references/urdf/robot_description/` | `src/robot_description/urdf/` |
| `references/urdf/so_arm101_description/` | `src/so_arm101_description/urdf/` 和 `src/so101_arm_control/urdf/so_arm101_mock.urdf.xacro` |
| `references/urdf/realsense2_description/` | `src/realsense-ros/realsense2_description/urdf/` 中 D435 所需文件 |
| `references/urdf/expanded/` | 由当前 xacro 生成并改为项目内相对 mesh 路径，便于无 ROS 环境导入 |
| `references/meshes/so_arm101/` | `src/so_arm101_description/meshes/` 中全部 STL 与 LICENSE |
| `references/meshes/realsense/` | `src/realsense-ros/realsense2_description/meshes/` 中 D435 与 plug 网格 |

## 实物照片

| 快照目录 | 原始来源 |
|---|---|
| `references/photos/real-robot/` | `hardware/real-bot-figure/`，3 张 |
| `references/photos/drive-motors/` | `hardware/motor-image/`，6 张 |

2026-09-20 带 `700/600/300/515/620/1330 mm` 橙蓝标注的附件没有暴露本地文件路径，
因此目前用 `MEASUREMENTS.md`、`data/physical-measurements.json` 和
`references/hardware-docs/robot_frame_dimensions.md` 完整转录。图片本体待放入
`references/photos/measurements/IMG_0179_measurements_20260920.png`。

## 标定和设计记录

| 快照文件 | 原始来源 |
|---|---|
| `references/calibration/ARM_TF_README.md` | `todo-my/arm-baseline/tf-updata/README.md` |
| `references/calibration/CAMERA_ARM_TF_CALIBRATION.md` | `todo-my/arm-baseline/tf-updata/CALIBRATION-RESULT-20260903.md` |
| `references/calibration/PAN_TILT_CAPTURE_README.md` | `tools/camera_pan_tilt_calibration/README.md` |
| `references/calibration/ARM_DEVELOPMENT_GUIDELINE.md` | `todo-my/arm-baseline/ARM-DEVELOPMENT-GUIDELINE-20260825.md` |

这些记录包含历史值和被拒绝候选，引用时必须查看其状态说明，不可只摘取一个数值。

## 当前运行配置快照

| 快照文件 | 原始来源 |
|---|---|
| `references/runtime-config/test_all.launch.py` | `src/robot_bringup/launch/test_all.launch.py` |
| `references/runtime-config/arm_mount_tf_publisher.py` | `src/so101_arm_control/so101_arm_control/arm_mount_tf_publisher.py` |
| `references/runtime-config/arm_real_dashboard_test.yaml` | `src/so101_arm_control/config/arm_real_dashboard_test.yaml` |
| `references/runtime-config/real_camera_poses.yaml` | `src/robot_skills/config/real_camera_poses.yaml` |
| `references/runtime-config/camera_scan_profiles.yaml` | `src/robot_skills/config/camera_scan_profiles.yaml` |
| `references/runtime-config/arm_camera_calibrated.yaml` | `src/robot_bringup/config/arm_camera_calibrated.yaml` |
| `references/runtime-config/MID360_config.json` | `src/livox_ros_driver2/config/MID360_config.json` |
| `references/runtime-config/nav2_params.yaml` | `src/nav_pkg/config/nav2_params.yaml`，包含 D435 local costmap 范围 |
| `references/runtime-config/navigation.launch.py` | `src/nav_pkg/launch/navigation.launch.py` |
| `references/runtime-config/fast_lio_mid360.yaml` | `src/localization_pkg/config/fast_lio_mid360.yaml` |

`references/calibration/JOINT-EXTRINSIC-SOLVE-20260904.json` 与
`REVISED-TF-AUDIT-20260904.json` 保存标定文档引用的机器可读求解结果。

## 许可证与 attribution

| 快照文件 | 原始来源 |
|---|---|
| `references/meshes/so_arm101/LICENSE` | SO101 mesh 源目录 |
| `references/licenses/SO_ARM101_ATTRIBUTION.md` | `src/so_arm101_description/ATTRIBUTION.md` |
| `references/licenses/REALSENSE_ROS_NOTICE.md` | `src/realsense-ros/NOTICE.md` |

公开网页使用模型前，应再次核对网格许可证、attribution 要求以及是否允许再分发优化后的 GLB。

## 未复制的内容

- 本次对话中两张爆炸图风格参考没有可用的本地文件路径，因此未复制图片本体；其视觉方向已记录在 `GUIDELINE.md`，后续请把原图放入 `references/concept/`。
- ROS bag、标定原始图片和运行日志体积较大，未复制；现有文档保留其来源说明。
- 第三方完整源码包未复制，只保存与 D435 网格使用有关的文件和 NOTICE。
- Dashboard、控制节点和测试代码不是 3D 建模输入，除当前安装 transform/pose 配置外未复制。

## 更新快照的方法

更新前先比较原文件差异。重新复制后必须：

1. 更新本文件的快照日期；
2. 在顶层文档中处理新增冲突；
3. 检查 `components.json` 的来源路径；
4. 重新核对第三方许可证；
5. 不覆盖 Blender 内已人工清理的 derived mesh。
