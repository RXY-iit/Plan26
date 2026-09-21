# Pan/Tilt、Lift、SO101 与双相机 TF 基线

更新时间：2026-09-04

## 已确认的物理事实

- Pan 转动时，Lift 与 SO101 Arm 完全不转。
- Lift 在本轮标定期间固定于机械最低位置，不执行 Lift 运动。
- Pan/Tilt 的参考姿态是 Pan `267 deg`、Tilt `102 deg`。
- Lift 最低时 `arm/base_link` 中心离地高度实测为 `100.5 cm`。
- `arm/base_link` 与 `camera_bottom_screw_frame` 的 `22.3–24.2 cm` 是
  `base_link` Z 方向高度差，不是欧氏距离。
- 实际 ChArUco 尺寸为：完整棋盘格 `33.5 mm`，内部编码 marker
  `16.5 mm`，字典为 `DICT_5X5_100`，棋盘为 `7 x 5`。
- 实物照片确认 Arm Camera 固定在夹爪主体侧面，不随夹爪开合的活动 jaw
  单独运动。`gripper_link` 是当前最合理的刚性父 link 候选；最终写入前仍需
  用单关节数据验证相机是否完整跟随 wrist-roll/夹爪主体。

这些事实来自操作者的实机观察和实物测量，不是从软件状态推断得到。

## 必须遵守的树结构

目标结构为：

```text
base_link
├── camera_pan_mount_base               D435 机构固定根
│   └── camera_pan_yaw_link              Pan 动态轴
│       └── camera_tilt_link             Tilt 动态轴
│           └── realsense_holder_link
│               └── camera_bottom_screw_frame -> D435 内部 frames
└── arm/world                            独立 Lift/Arm 动态安装 TF
    └── SO101 kinematic chain
        └── arm/gripper_link
            └── arm_camera_mount_link
                └── arm_camera_color_optical_frame
```

硬约束：

1. Lift/Arm 分支必须直接从 `base_link` 分出。
2. Lift/Arm 不得成为 `camera_pan_yaw_link` 或 `camera_tilt_link` 的子树。
3. 每个 TF child 只能有一个 parent，不得同时发布第二条安装 TF。
4. D435 内部的 color/depth/optical frame 保持 RealSense 驱动定义；机器人
   自制支架误差放在 `realsense_holder_link`。
5. Arm 相机的自制支架误差放在 `arm_camera_holder_link`，不得混入 Arm 关节
   零位或相机内参。

## 当前已经实施的过渡结构

- `camera_pan_mount_base` 已加入移动机器人 URDF，目前暂与 `base_link` 重合。
- `realsense_holder_link` 已加入，参考姿态下保持旧的
  `base_link -> camera_link` 数值不变。
- SO101/Lift mount TF publisher 的 parent 为 `base_link`。实测离地高度为
  `1.005 m`；由于 `base_link` 本身离地 `0.1125 m`，发布的最低点 Z 是
  `0.8925 m`。D435 Pan/Tilt 对它没有任何影响。

这是保持现有运行结果不变的拓扑迁移，不代表 Pan 轴心、Tilt 轴心或 holder
外参已经完成标定。

## 2026-09-03 求解状态

- 130 个有效视图已完成 Arm Camera 内参标定，默认启动路径已使用测量内参。
- 90 个样本包含 `/arm/hardware_status.raw_position`。
- 按“满足真实拓扑、精度大致合理、剩余误差由上层算法补偿”的目标，Pan/Tilt
  正交偏置轴、Arm mount、Arm Camera holder 和只用于显示的 Arm 关节比例修正
  已写入运行路径。
- RealSense driver 的 `publish_tf` 已在完整 bringup 中关闭，避免它与校准 URDF
  重复发布相同 camera child frame。
- 详细输入、数值、误差和适用范围见
  `CALIBRATION-RESULT-20260903.md`。

## 2026-09-04 受约束联合重求解

当前运行 TF 已改用 `solve_joint_extrinsics.py` 的联合结果。求解器没有把公开
SO-frame 模型作为输入或约束，只使用：130 组真实双相机 ChArUco 观测、对应
Arm joint states、实测离地高度、Pan/Tilt 正交关系和已确认的机构拓扑。

由于没有独立测量标定板在 `base_link` 下的绝对 X/Y pose，共同 X/Y/yaw gauge
不能从图像中恢复；因此 Arm mount X/Y/yaw 沿用安装锚点，Z 使用直接测量值。
数据按每 5 个样本留出 1 个验证：训练平移/旋转 RMS 为
`10.60 mm / 1.95 deg`，留出集为 `12.44 mm / 2.15 deg`，全部 130 组为
`10.99 mm / 1.99 deg`。完整结果见
`JOINT-EXTRINSIC-SOLVE-20260904.json`。

求出的实际 Arm Camera optical 外参为：

```yaml
gripper_link_to_arm_camera_color_optical_frame:
  xyz_m: [0.005322, 0.054910, -0.051643]
  rpy_rad: [2.530848, 0.025611, -0.149163]
```

公开模型只保留作外观与数量级比较，不覆盖真实采集数据的 hand-eye 结果。

## 新数据要解出的量

利用两台相机同时观测同一 ChArUco 板，并记录真实 Pan/Tilt feedback 与六轴
`/joint_states`，拟合：

- Pan raw feedback 到物理旋转角的零点、方向与比例；
- Tilt raw feedback 到物理旋转角的零点、方向与比例；
- `camera_pan_mount_base -> camera_pan_yaw_link` 的轴心位置与轴方向；
- Pan 轴到 Tilt 轴之间的固定变换；
- `camera_tilt_link -> realsense_holder_link`；
- `camera_pan_mount_base -> lift_base_link`；
- Lift 最低位置下 `lift_carriage_link -> arm_mount_base_link`；
- SO101 末端刚性 link 到 `arm_camera_holder_link`；
- `arm_camera_holder_link -> arm_camera_color_optical_frame`。

参考姿态 `267/102` 的既有 `base_link -> camera_link` 是绝对锚点。每个同步
样本中标定板相对两个相机的姿态可用于消去未知的板面绝对位置，因此不要求
板面相对 `base_link` 的测量值；但曝光期间机器人、板、Pan/Tilt 和 Arm 必须
静止。

## 新一轮采集标准

- 每个样本必须保存新鲜、完整、有限值的六轴 `/joint_states`。
- 每个样本必须同时保存 `/arm/hardware_status` 的六轴直接
  `raw_position`，用于验证 raw tick 到 URDF rad 的比例和零点。
- Pan/Tilt 至少稳定 `0.8 s`；Arm 六关节至少稳定 `0.8 s`，单关节窗口跨度
  不超过 `0.01 rad`。
- 先采 `reference_267_102`。
- 保持 `267/102`，改变 Arm 到至少 10 个具有明显旋转差异的姿态。
- 固定一个 Arm 姿态，再覆盖 Pan/Tilt 的左、中、右、上、中、下及组合姿态。
- 关键 Pan/Tilt 姿态从递增和递减两个方向重复到达，以估计回差。
- 两台相机每次都必须识别至少 8 个 ChArUco 角点。

## 后续修改仍必须遵守的约束

- 不得根据照片猜 Pan/Tilt 轴心或 Arm Camera 的固定父 link。
- 不得将当前过渡 identity frame 描述为已测量外参。
- 不得在没有真实 `/joint_states` 的样本上重新求 Arm base/hand-eye 外参。
- 不得把 Lift 软件估算高度当成绝对编码器测量；本轮只使用操作者确认的物理
  最低限位作为离散参考。

实机已经确认 Arm Camera 不随 jaw 开合，当前刚性父节点为 `arm/gripper_link`。
后续不得把它改挂到 `jaw_link`；只有机械安装发生变化并重新标定时才能改变。
