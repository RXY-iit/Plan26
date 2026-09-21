# 2026-09-03 双相机 TF 求解结果

> 2026-09-20 当前机械修正：Lift 实机型号与 ABZO 端点再次确认机械行程为
> `200 mm`。保留本文直接测得的下端 `arm/base_link` 离地 `1.005 m`
> （相对 `base_link` Z=`0.8925 m`），当前上端应为离地 `1.205 m`
> （相对 `base_link` Z=`1.0925 m`）。本文出现的 `230 mm`、`1.1225 m` 和
> 离地 `1.235 m` 均为历史值，不再用于当前运行或 3D 建模。

> 2026-09-04 修订：原文保留作历史审计；运行值以本文末尾“2026-09-04
> 物理约束重审”为准。旧的 `arm_mount Z=0.8625 m` 和估算 wrist-camera
> 外参已停用。

> 2026-09-04 最终更新：新的受约束联合求解结果位于
> `JOINT-EXTRINSIC-SOLVE-20260904.json`，运行 TF 已采用该结果；下方旧结果及
> 被拒绝候选只用于审计，不再作为运行数值来源。

## 2026-09-04 物理约束重审（未部署候选，已拒绝）

本次澄清了之前混淆的两个高度定义：Lift 机械最低端时，
`arm/base_link` 中心离地高度是直接测量的 `1.005 m`；各 Touch Prepare
姿态记录的 `22.3–24.2 cm` 是 `arm/base_link` 与
`camera_bottom_screw_frame` 的 **base_link Z 方向高度差**，不是三维直线距离。
因此 Arm/Lift TF 已改为独立的 `base_link -> arm/world` 分支，Pan/Tilt 只驱动
D435 分支。移动机器人 `base_link` 位于离地 `0.1125 m`，所以离地
`1.005 m` 要发布为 `base_link` Z=`0.8925 m`；保留 230 mm 软件行程时，
发布范围为 `0.8925–1.1225 m`（对应离地 `1.005–1.235 m`）。

使用同一组 130 个双相机样本、原有棋盘参数（square `33.5 mm`、marker
`16.5 mm`）重新求解。新的物理结构为：

```yaml
pan_axis_origin_base_m: [0.263023, -0.005841, 0.622500]
tilt_axis_origin_at_reference_base_m: [0.288023, -0.005841, 0.657500]
pan_joint_origin_rpy_rad: [-0.261666, 0.490371, -0.376365]
pan_to_tilt_origin_pan_frame_m: [0.004027, -0.001944, 0.042779]
tilt_joint_origin_rpy_rad: [-1.555945, 0.491941, 0.306151]
tilt_to_realsense_holder_xyz_m: [0.010867, -0.033387, -0.000309]
tilt_to_realsense_holder_rpy_rad: [1.537099, -0.026729, -0.308047]
```

该候选残差为平移 RMS `16.14 mm`（median `13.10 mm`、max `40.74 mm`），
旋转 RMS `2.35 deg`（median `1.85 deg`、max `6.72 deg`）。这与历史模型的
厘米级能力一致，同时不再用错误的 D435 静态高度推导 Arm 高度。完整机器可读
结果见 `REVISED-TF-AUDIT-20260904.json`，可复现脚本为
`tools/camera_pan_tilt_calibration/audit_revised_tf.py`。

Arm wrist camera 的机械原点改用公开 `so-frame` 模型：

```yaml
gripper_link_to_wrist_camera_mount:
  xyz_m: [-0.0150, 0.0240, -0.0315]
  rpy_rad: [-1.5708, -0.0008, -1.5708]
gripper_link_to_public_camera_optical:
  xyz_m: [0.0025, 0.0675, -0.0062]
  rpy_rad: [3.141593, 1.136305, -1.570797]
```

来源固定到 `livekit-examples/so-frame` commit
`657fb4a0bf65bac8f7b336deed2631a4932311c2` 的
`simulation/urdf/so101_on_frame.urdf`，不再使用照片估算平移。重审同时发现该
公开 optical 约定与本机 UVC 图像流存在约 `119.53 deg` 的固定轴向差；求解时
只允许一个 rotation-only image-axis correction，绝不移动公开模型定义的相机
中心。实机复核发现公开 frame 是 SAPIEN/MuJoCo camera convention，不能直接
作为 ROS REP-103 optical frame；同时原始数据没有板面相对 `base_link` 的绝对
实测 pose，不能独立证明绝对安装 TF。该候选导致 Touch 目标相对旧运行 TF
偏移约 `[-29.5, -4.5, +20.4] mm`，已经回退，不再用于运行 D435 TF。

当前运行策略：D435 恢复到 2026-09-03 已完成真机 Touch 验证的 Pan/Tilt
运动模型；Arm/Lift 独立于 Pan/Tilt、Lift 最低时 `arm/base_link` 离地
`1.005 m` 的直接实测修正继续保留。Arm Camera 使用公开模型的机械中心平移，
但 ROS optical 朝向使用 ChArUco/UVC 实测朝向，不发布 SAPIEN frame 为 ROS TF。

## 结论

在操作者确认“不再追加数据，厘米级余差由上层算法补偿”的验收条件后，使用
全部现有数据完成了几何约束联合优化并接入运行 TF。该结果用于合理的空间初值、
RViz 显示和后续视觉闭环，不应被解释为计量级机械标定。

## 实际使用的数据

- `session_20260903_010858_115137`：40 个有效双相机样本；没有 Arm raw tick。
- `session_20260903_014710_255810`：26 个有效样本；全部包含
  `/arm/hardware_status.raw_position`。
- `session_20260903_020201_959088`：22 个有效样本；全部包含
  `/arm/hardware_status.raw_position`。
- `session_20260903_023525_587586`：42 个有效样本；全部包含 raw position。
- 合计 130 个双相机 ChArUco 视图；90 个样本具有六轴直接 raw position。
- 标定板参数：`7 x 5`、`DICT_5X5_100`、square `33.5 mm`、marker
  `16.5 mm`。
- Lift 在机械最低位置；机器人和标定板在每组采集过程中不动。

## 已通过并启用：Arm Camera 内参

使用全部 130 个 Arm Camera ChArUco 视图执行 `cv2.calibrateCamera`：

- OpenCV RMS 重投影误差：`0.314985 px`
- `fx=342.492801`、`fy=342.252614`
- `cx=344.242443`、`cy=269.760782`
- distortion：`[0.0809068, -0.1254090, 0.00281121, -0.00075865,
  0.0421668]`

已保存为：

`src/robot_bringup/config/arm_camera_calibrated.yaml`

实机和标定工具的 Arm Camera `camera_info_url` 均改为这份文件。旧的
`arm_camera_uncalibrated.yaml` 仍保留，作为明确的零内参占位配置，不再由默认
启动路径使用。

## 最终采用的受约束联合模型

联合模型强制遵守以下实物事实：

- Arm 底座与地面平行；
- Arm/Lift 不跟随 Pan；
- Arm Camera 固定在夹爪主体，父 frame 是 `arm/gripper_link`，不跟随 jaw 开合；
- Pan/Tilt 两轴严格正交，但不强制任一轴平行或垂直地面；
- 两轴具有真实轴心偏置，因此相机沿近似球面轨迹运动；
- `267.1/101.8` 是零角度锚点，并严格保留旧参考相机 TF。

联合优化得到：

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

2026-09-03 的物理复测确认：Lift 位于机械最低端时，SO101 `arm/base_link`
比参考姿态下的 RealSense 安装锚点（当前 TF 中的 `realsense_holder_link` / 
`camera_bottom_screw_frame`）高 `225 mm`。早期记录把该安装锚点简称为
`camera_link`；严格来说 D435 厂商 URDF 宏会在锚点之后追加设备内部外参。
保留既有安装锚点 `Z=0.6375 m`，因此运行用 Arm mount Z 修正为
`0.6375 + 0.2250 = 0.8625 m`；相对早期联合视觉拟合值 `0.90682 m`
下移 `44.32 mm`。Lift 软件行程仍为 `230 mm`，所以上端估计为
`1.0925 m`。该值来自直接物理高度差，优先于残差较大的联合视觉拟合 Z。

raw feedback 到关节角使用零点固定的二次映射：

```text
pan_rad  = 0.0170137853 * (pan_raw - 267.1)
         - 0.00000617291927 * (pan_raw - 267.1)^2
tilt_rad = 0.0160077655 * (tilt_raw - 101.8)
         - 0.00000578161438 * (tilt_raw - 101.8)^2
```

全部 130 个样本的联合模型 RMS 约为 `15.5 mm / 2.83 deg`。分 session 平移
RMS 约 `10.1–21.3 mm`。这是当前双相机可见范围和机构回差条件下的最好折中，
满足“大致合理初值”的新目标，但抓取必须使用目标重观测、视觉伺服或末端误差
表做闭环补偿。

## 运行实现

- URDF：`camera_pan_mount_base -> camera_pan_yaw_link -> camera_tilt_link ->
  realsense_holder_link`。
- `camera_pan_tilt_joint_state_node` 只读取两个真实 feedback 并以 10 Hz 发布
  两个相机关节；不具备命令接口，反馈缺失或超过 1 秒时停止发布。
- Arm 视觉比例修正发布到 `/arm/visual_joint_states`，只供 Arm 的
  `robot_state_publisher` 使用；真实轨迹控制、软限位和保护仍使用原始安全标定。
- 完整 bringup 中 RealSense driver 不再发布 TF，camera TF 只有 URDF/RSP 一个
  owner。

## 早期未约束候选（仅保留审计记录）

在 Pan=`267.1`、Tilt=`约 101.8–101.95` 的 14 个 Arm 姿态上，以既有
`base_link -> camera_color_optical_frame` 为绝对锚点，联合估计：

- 不旋转 mount 到 SO101 `base_link`；
- `gripper_link -> arm_camera_color_optical_frame`；
- 五个 Arm 关节的视觉角度比例。

允许 mount 有自由 roll/pitch 时的候选为：

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

其中 wrist-roll 比例约 `1.35`，与上一批数据独立观察到的约 `1.37` 一致，
说明当前 raw tick 到 URDF rad 的 wrist-roll 比例确有系统误差，而非偶然噪声。

## D435 彩色光学中心到 Arm 底座的距离定义

为避免与 `arm_camera_color_optical_frame` 混淆，Touch Prepare Pose 使用的
相对距离定义为：

```text
camera_color_optical_frame <-> arm/base_link
```

它不是固定机械尺寸：Pan/Tilt 会改变 D435 光学中心，Lift 会改变 Arm 底座。
在本轮标定锚点条件（Lift 机械最低、Pan=`267.1 deg`、Tilt=`101.8 deg`）下，
按当前运行 URDF 正向计算：

```yaml
arm_base_position_in_base_link_m: [0.320840, 0.012620, 0.862500]
d435_color_optical_position_in_base_link_m: [0.336241, 0.032500, 0.639697]
d435_color_optical_to_arm_base_delta_m: [-0.015401, -0.019880, 0.222803]
euclidean_distance_m: 0.224218
```

其中此前实测的 `225 mm` 是 Arm 底座相对 D435 安装锚点的垂直高度差，
不是上述两个光学/运动 frame 原点间的欧氏距离。运行时 RViz 由实时 TF 绘制黄色连接线并
显示距离；录入参考姿态时必须同时保存实际 Pan/Tilt feedback、Lift 状态和该 TF，
不得把 `224.218 mm` 复制到其他姿态。

## 2026-09-04 Touch Prepare 实物复测补充

- 操作者确认 `arm/gripper_frame_link` 原点就是需要的触摸点；
  `arm/touch_tip` 已改为与该原点重合，不再使用 STL 推测的
  `[2.2, 0, 6.3] mm` 偏移。
- 真机 wrist roll 在 `-0.031 rad` 时呈现中性外观，而旧 RViz 在
  `-0.277 rad` 输入时呈现同一外观。已在 `/arm/visual_joint_states`
  路径增加 `-0.33725009 rad` 的视觉偏移；该修正不进入真实命令、
  raw tick 标定、限位或保护逻辑。
- 12 个操作者确认的 Touch Prepare 姿态已作为多起点 IK seed，
  详见 `../skills-arm/TOUCH-PREPARE-POSE-STRATEGY-20260904.md`。

新量得的 Pan/Tilt 轴心离地高度与当前运行 TF 中的中间 link 原点
确实不一致；但 `arm/base_link <-> camera_bottom_screw_frame`
的 `22.3–24.2 cm` 尚未标明是 X、Z 还是三维直线距离。若把新高度直接
解释为 URDF Z，Pan=`267`、Tilt=`101.9` 时 bottom screw 约为
`74.7 cm`，与本文早先确认的 Arm base `86.25 cm` 只差 `11.55 cm`，
而不是 `22.5 cm`。因此 Pan/Tilt 平移暂不覆盖，需先确认距离方向和
同一工况的 Arm base 离地高度。

但是 14 个拟合样本的逐姿态误差仍为：

- 平移：`2.7–18.7 mm`
- 旋转：`0.49–3.17 deg`

此外，操作者已确认 Arm 底座平行地面。若强制 mount roll/pitch 为零，候选
mount 约为 `xyz=[0.31632, 0.00074, 0.91256] m`、yaw=`-0.04009 rad`，模型
总体残差反而明显增大。这证明自由 roll/pitch 正在吸收 Arm URDF 关节比例、
轴线或 holder 误差，不应把它误写成真实底座倾斜。

## 早期理想双轴模型的局限（仅保留审计记录）

`session_20260903_020201_959088` 的 sample 2–10 保持 Arm raw position
基本不变，并从参考姿态连接到 8 个 Pan/Tilt 姿态，因而可以消去 Arm mount
未知量，单独验证 Pan/Tilt。

用两个理想固定旋转轴拟合后：

- 拟合样本平移误差最高约 `23.0 mm`
- 拟合样本旋转误差最高约 `2.04 deg`
- 用其他固定 Arm 小组做相对运动验证时，平移误差约 `3.2–37.6 mm`，旋转
  误差约 `0.34–3.39 deg`

因此最终实现没有采用“与地面正交的原点双轴 + 线性角度”假设，而采用倾斜、
互相正交、带轴心偏置和二次角度映射的 URDF 关节模型。

## 若未来追求更高精度时所需的数据（当前不再要求）

### Pan/Tilt（优先）

保持同一个 Arm 姿态、标定板和机器人不动，整个序列不可改变 Arm：

1. 先保存锚点 `267/102`。
2. Tilt 固定 `102`，Pan 依次保存约 `210, 230, 250, 267, 285, 300, 320`。
3. Pan 固定 `267`，Tilt 依次保存约 `35, 50, 65, 80, 102`。
4. 对实际九个命名姿态各保存一次。
5. 至少对 `267/102`、`267/65` 和左右两个姿态分别从递增、递减方向各到达
   一次，用于量化回差。

最关键的是：每个 sweep 开头和结尾都再次保存 `267/102`，这样全部数据都与
绝对锚点处于同一个连通分量。

### Arm

Pan/Tilt 始终固定 `267/102`。选一个安全中间姿态后，每次只改变一个关节，
肩 pan、肩 lift、elbow、wrist flex、wrist roll 各保存至少 5 个明显不同角度；
每条 sweep 的开头和结尾保存相同中间姿态。这样才能区分 raw-rad 比例、关节
轴线误差和相机 holder 外参，而不是让 mount 倾角代偿它们。

## 未来升级为计量级抓取外参的门槛

当前 TF 已按“大致合理初值”启用。如果未来要取消上层视觉补偿，并把 TF 本身
作为计量级抓取依据，则至少满足：

- 留出姿态 RMS 平移误差不高于 `10 mm`；
- 留出姿态 RMS 旋转误差不高于 `1 deg`；
- 所有固定的 Agent Camera 命名姿态都在表内或其邻近范围内；
- 同一目标从递增/递减方向到达的差异被记录，超出门槛则按方向使用两张表，
  不做无依据的单表平均。


追加ref：
找到了，而且有一个项目非常接近你现在要做的东西：它不是只有 STL，而是已经把 **SO-ARM101 + 手腕相机支架 + camera frame** 真正写进 URDF 里了。对你现在构建 ROS2 / RViz 的 SO-ARM101 URDF 来说，我建议优先参考这个。

最有用的是 `livekit-examples/so-frame`。它提供完整的 `so101_on_frame.urdf`，其中手腕部分使用的正是 **SO-101 32×32 UVC wrist camera mount**，并且已经定义好了 `wrist_camera_mount_joint` 和 `frame_wrist_camera`。相机固定在 `gripper_link` 上，因此会跟随 wrist roll 转动，但不会跟随夹爪开合。([GitHub][1])

[SO-Frame GitHub 仓库](https://github.com/livekit-examples/so-frame?utm_source=chatgpt.com)

你重点看这个目录：

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

官方 README 明确说明，这里的 wrist camera 是 **Hex-Nut Recess Wrist Camera，32×32 UVC module**；对应的 STL 就是：

```text
SO-ARM101_camera_wrist_mount.stl
```

而且已经把安装关系调好了。([GitHub][2])

它的结构大致就是：

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

其中：

```text
parent = gripper_link
child  = wrist_camera_mount
type   = fixed
```

所以这正适合你现在的需求：**把 wrist camera 当成机器人末端的一个固定传感器 link**，然后 TF 会自动随着机械臂一起更新。项目作者甚至专门做了一个 `wrist_camera_aligner.html`，用来调相机支架相对于 gripper 的 xyz / rpy。([GitHub][2])

---

另外，手腕支架本身其实来自 SO-ARM 官方仓库，你也可以直接拿原始 STL：

[官方 SO-ARM101 wrist camera STL](https://github.com/TheRobotStudio/SO-ARM100/blob/main/Optional/SO101_Wrist_Cam_Hex-Nut_Mount_32x32_UVC_Module/stl/SO-ARM101_camera_wrist_mount.stl?utm_source=chatgpt.com)

官方 SO-ARM 仓库现在列出了多种 wrist camera mount，包括：

* `32×32 UVC Hex Nut` — SO101
* `32×32 UVC Integrated` — SO100 / SO101
* RealSense D405
* RealSense D435 / D435I
* 普通 Webcam

也就是说你照片里这种小方形 USB camera，本质上就是官方支持的这一类 wrist camera 方案。([GitHub][3])

---

不过有一个点要注意。

你图片里的 WowRobo 套件看起来是这种：

```text
32×32 mm USB Camera PCB
+
SO-ARM101 wrist mount
```

现成模型目前主要给了 **相机支架 STL**，并不一定包含 PCB、镜头、USB 线这些完整几何体。

但对于 URDF 来说，其实完全没必要把实际 camera PCB 做得特别精细。我反而建议你这样建：

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

这样比把整个 PCB 做成高面数 STL 更标准。

例如最终 ROS TF：

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

之后你的 Open-vocabulary 3D Touch pipeline 就可以直接使用：

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

这和你之前准备做的 SO-ARM101 `VLM → SAM → Depth → TF → Touch` pipeline 会非常自然地接起来。

### 我建议你直接采用的方案

不要从零重新量 WowRobo 相机支架。

直接拿：

**1. SO-ARM101 主体 URDF**

LeRobot 目前也已经有官方的 SO101 mesh assets，包括 `wrist_roll_follower_so101_v1.stl`、`wrist_roll_pitch_so101_v2.stl`、STS3215 等完整零件。([Hugging Face][4])

[LeRobot SO101 URDF Assets](https://huggingface.co/buckets/lerobot/robot-urdfs/tree/so101/assets?utm_source=chatgpt.com)

**2. 官方 wrist camera mount STL**

```text
SO-ARM101_camera_wrist_mount.stl
```

**3. 抄 `so-frame` 里的 camera joint 定义**

尤其是：

```text
wrist_camera_mount_joint
frame_wrist_camera_joint
```

这样你基本不用重新猜 xyz / rpy。

---

还有一个很重要的小区别。

`so-frame` 里面的 `frame_wrist_camera` 使用的是 **SAPIEN / ManiSkill camera convention**：

```text
+X = camera forward
-Y = image right
+Z = image up
```

这和 ROS 常用的 REP-103 `camera_optical_frame` **不是一个坐标定义**。项目 README 也专门提醒了这一点。([GitHub][2])

所以如果你的目标是：

```text
ROS2
RViz
MoveIt
image_proc
depth_image_proc
TF2
```
