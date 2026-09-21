# SO-ARM101 接入现有移动机器人：调查结论与开发 Guideline

> 日期：2026-08-25<br>
> 阶段：调查与方案设计，尚未实施<br>
> 近期目标：① 按需按下指定按钮；② 使用机械臂前端相机主动观察四周，为机器人补充信息<br>
> 本文是 [`ARM-plan.md`](./ARM-plan.md) 的面向当前两个目标的细化，不表示相关功能已经实现或通过真机验收。

## 1. 结论摘要

推荐把 SO-ARM101 作为现有系统中的一个独立、受安全门禁约束的 ROS 2 子系统接入，而不是让 LeRobot/VLA 直接拥有整台机器人：

```text
自然语言 / Mission Agent
        ↓ 只调用有边界的复合 Skill
robot_skills
  ├── observe_region / inspect_with_arm_camera
  └── press_button
        ↓ ROS Action（建议）+ 结构化 SkillResult
arm task servers
  ├── viewpoint executor
  └── button press state machine
        ↓
MoveIt / MoveIt Servo / ros2_control
        ↓
SO-ARM101 Feetech driver + wrist camera
```

LeRobot 保留以下职责：

- follower/leader 遥操作与重新标定；
- 示教数据采集、回放与离线评估；
- 后期 ACT、Diffusion Policy、SmolVLA 等 learned skill 的执行适配；
- 与确定性 `press_button` / `observe_region` baseline 做 A/B 对比。

近期不推荐：

- 让 Agent 或 VLA 直接持续写 6 个关节目标；
- 未建立机械臂停机链、动态 TF、软限位和命令仲裁就接入整机；
- 一开始就用腕部相机点云修改 Nav2 costmap；
- 在未知按钮上用纯位置开环“向前多走 3 cm”；
- 把“相机看到了画面”当作“可以得到可靠 3D 按钮位姿”。

## 2. 调查边界

本次只做了以下只读调查，并新增本文：

- 阅读 `todo-my/arm-baseline/ARM-plan.md`；
- 阅读当前 `robot_ws` 的 Agent、Skill、相机、URDF、bringup、lift 与 safety 代码/文档；
- 检查 `/home/matsunaga-h/lerobot`、相关 shell history、LeRobot 输出图像与 conda 环境；
- 对照 LeRobot、MoveIt Servo、ros2_control 与现有 SO-ARM ROS 2 项目的公开资料；
- 没有连接、使能或移动机械臂，没有更改 ROS 2 功能代码，也没有安装外部依赖。

## 3. 已确认的现状

### 3.1 现有移动机器人架构

当前默认移动机器人基线是：

```text
FAST-LIO2 + GICP localization
        ↓
Nav2 MPPI
        ↓
mode switch
        ↓
cmd_vel safety layer
        ↓
omni base
```

依据见仓库根目录 [`README.md`](../../README.md)。当前系统已经具有适合扩展机械臂的上层骨架：

- [`robot_agent`](../../src/robot_agent/) 已有 `MissionIntent → SkillCall → SkillResult` 执行链；
- [`skill_registry.yaml`](../../src/robot_skills/config/skill_registry.yaml) 对 skill 的 mode、timeout、safety level、前置条件做声明；
- [`mission_agent.py`](../../src/robot_agent/robot_agent/agents/mission_agent.py) 已实现静止门禁、健康检查、执行事件和失败处理；
- [`health_monitor.py`](../../src/robot_agent/robot_agent/nodes/health_monitor.py) 使用“没有直接证据就不能报告 OK”的健康模型；
- 当前 `mission_policy.yaml` 已把 `press_button`、`grasp_object`、`place_object` 明确列在 `blocked_until_implemented`，因此不存在误以为已经能按按钮的问题。

这些接口应扩展，不应另建一套与现有 Agent 平行的任务系统。

### 3.2 现有 RealSense 主相机能力

现有 RealSense D435 通过 pan/tilt 机构提供：

- `/camera/camera/color/image_raw`；
- `/camera/camera/depth/image_rect_raw`；
- 相机内参和 RealSense 自己的 optical frames；
- `set_camera_pose → 等待角度反馈 → 获取命令后的新帧 → 检测 → 回中位` 流程；
- 九视角的真机标定姿态和扫描 profile。

关键实现：

- [`camera.py`](../../src/robot_skills/robot_skills/executors/camera.py)
- [`perception.py`](../../src/robot_skills/robot_skills/executors/perception.py)
- [`camera_scan_profiles.yaml`](../../src/robot_skills/config/camera_scan_profiles.yaml)
- [`real_camera_poses.yaml`](../../src/robot_skills/config/real_camera_poses.yaml)
- [`perception_agent.py`](../../src/robot_agent/robot_agent/agents/perception_agent.py)

这是一套可以复用的“主动观察编排”经验，但有一个重要限制：当前 [`robot.urdf.xacro`](../../src/robot_description/urdf/robot.urdf.xacro) 把 RealSense 以导航中位姿态固定在 `base_link`，没有用 pan/tilt joint feedback 动态更新相机 TF。因此：

- 当前 2D 图像搜索、OCR、人工查看仍然可用；
- 相机离开导航中位后，不应把该固定 TF 用于精确 3D 定位或机械臂接触任务；
- SO-ARM101 腕部相机必须从一开始就进入动态关节 TF 链，不能复制这个限制。

### 3.3 lift 与机械臂安装关系

现有文档把 lift 定义为“raises/lowers arm support bracket”，行程约 0–200 mm，见 [`lift_mechanism.md`](../../hardware/lift_mechanism/lift_mechanism.md)。但当前 ROS 位置仍主要是速度×时间的积分估计：

- 未建立可靠物理参考时状态为 `UNREFERENCED_SOFTWARE_ESTIMATE`；
- ABZO/上下限/HOME complete 尚未完整进入控制闭环；
- Dashboard 当前将 lift 能力视为 `SUPERVISED_ONLY`。

如果 SO-ARM101 实际安装在 lift 滑台上，则 `lift_carriage_link → arm_base_link` 会直接影响按钮高度和腕部相机位姿。没有可信 lift 位置时，不能宣称 `base_link → tool0` 是精确的动态 TF。第一版应固定 lift 在人工确认的机械位置，或先完成可靠位置回读，再允许多高度按键任务。

### 3.4 安全链现状

当前 [`cmd_vel_safety_node.py`](../../src/safety_layer/safety_layer/cmd_vel_safety_node.py) 的 watchdog、限速和 `/emergency_stop` 主要作用于底盘 `/cmd_vel_raw → /cmd_vel`。物理红色停止按钮已通过 BLVD DIN3 观察并验证底盘 inhibit，但这并不自动证明 SO-ARM101 电源或 Feetech torque 会被切断。

所以机械臂接入前必须明确区分：

1. 底盘软件停止；
2. 底盘物理 inhibit；
3. 机械臂软件 stop/torque disable；
4. 机械臂供电或硬件 enable 的物理切断。

近期最低条件是 1–3 都有直接证据；进行无人接触动作前，建议让物理急停也能可靠阻断机械臂能量。不能只增加一个 ROS topic 就称为机械臂 E-stop。

### 3.5 本机 LeRobot/SO-ARM101 历史证据

`/home/matsunaga-h/lerobot` 存在，且不是空目录：

| 项目 | 调查结果 |
|---|---|
| 源码 | Seeed-Projects fork，当前 checkout `0f39248` |
| conda env | `lerobot`，Python 3.10.20，LeRobot 0.4.4，PyTorch 2.7.1+cu126 |
| follower | 历史命令使用 `so101_follower`、`/dev/ttyACM0` |
| leader | 历史命令使用 `so101_leader`、`/dev/ttyACM1`，也试过端口互换 |
| 遥操作 | 多次执行 `lerobot-teleoperate` |
| 相机 | 执行过 `lerobot-find-cameras opencv`，并逐个尝试 `/dev/video2/4/6` |
| policy | 执行过带 `${HF_USER}/my_policy` 的 `lerobot-record` |
| dataset/eval 名 | `act_so101_drop2cap`、`eval_act_so101_drop2cap` |
| 本地数据 | 对应 Hugging Face LeRobot cache 曾被删除；当前未找到该 dataset/policy 的本地副本 |

保存于 `/home/matsunaga-h/lerobot/outputs/captured_images/` 的 2026-04-09 图像进一步显示：

- `video2` 是带红外散斑的灰度画面；
- `video4` 是朝向地面的 RGB 画面；
- `video6` 画面底部可见青色夹爪，基本可判定为 SO-ARM101 腕部/末端相机视角。

但 `/dev/video6` 是枚举结果，不是稳定硬件身份。后续必须基于 `/dev/v4l/by-id/`、USB serial 或自定义 udev symlink 绑定设备。

另外，历史命令中的 dataset 名含 `act`，没有找到 `lerobot-train` 或 SmolVLA checkpoint 的本地证据。因此当前只能确认“运行过 learned policy/evaluation”，不能确认那次 policy 一定是 VLA。需要由操作者或远端 Hugging Face 资产进一步确认。

### 3.6 当前 LeRobot 驱动能提供什么

本机版本的 `SOFollower`：

- 6 个 STS3215：`shoulder_pan`、`shoulder_lift`、`elbow_flex`、`wrist_flex`、`wrist_roll`、`gripper`；
- motor ID 为 1–6；
- `get_observation()` 默认读取关节位置和配置的相机；
- `send_action()` 写入关节目标位置；
- 可用 `max_relative_target` 限制单次相对位置变化，但默认值是 `None`；
- `disconnect()` 可配置 torque disable；
- Feetech control table 中存在 `Present_Load`、`Present_Current`、`Present_Voltage`、`Present_Temperature`，但 SO follower 默认 observation 没有发布这些量。

这说明 LeRobot driver 可作为重新 bring-up 的快速工具，也可以借用其校准语义；但要进入现有 Robot Health/Safety 体系，还需要持续 ROS 状态、命令 watchdog、控制器生命周期、报警/温度/电流监控和单写者仲裁。

### 3.7 设备名冲突风险

现有机器人至少还有：

- lift Arduino 默认 `/dev/ttyACM0`；
- OpenRB-150 pan/tilt 使用稳定 `/dev/serial/by-id/...`；
- SO-ARM101 历史上 follower/leader 使用 `/dev/ttyACM0/1`。

因此把旧 LeRobot 命令原样复制到整机上，很可能打开错误控制板。SO-ARM101 follower、leader、lift Arduino、OpenRB 和两路相机都要建立稳定设备身份表，且 launch 不得以 `/dev/ttyACM0` 或 `/dev/video6` 作为最终默认值。

### 3.8 计算资源边界

本次会话中：

- CPU 为 Intel Core i5-1340P；
- RAM 30 GiB；
- `nvidia-smi` 不存在；
- LeRobot conda 环境中 `torch.cuda.is_available()` 为 `False`。

这只说明当前软件会话没有可用 CUDA，不排除未来加外部 GPU。现阶段应假设本机适合 ROS、传统视觉和轻量推理；VLA 训练以及较大的实时 VLA 推理需要另外评估远端/独立 GPU、网络延迟和断线后的安全停止。

## 4. 推荐的系统边界

### 4.1 ROS 2 是整机运行时，LeRobot 是可插拔适配器

推荐：

```text
ROS 2 ownership
  ├── joint state / TF
  ├── trajectory controller
  ├── MoveIt planning scene
  ├── Servo / Cartesian control
  ├── safety / health / command ownership
  └── mission skill result

LeRobot ownership
  ├── calibration utility
  ├── leader teleop adapter
  ├── dataset recording
  └── learned policy adapter（可启停、可仲裁）
```

理由不是排斥 LeRobot，而是现有整机已经以 ROS 2、Nav2、TF、Dashboard 和 SkillResult 为共同语言。让 LeRobot 成为唯一硬件进程会使 MoveIt、状态发布和整机安全很难得到单一事实来源。

### 4.2 单写者原则

同一时刻只能有一个机械臂 command owner：

```text
NONE
 ├── MANUAL_LEADER
 ├── MOVEIT_TRAJECTORY
 ├── MOVEIT_SERVO
 └── LEARNED_POLICY
```

切换 owner 时必须：

1. 停止并确认上一来源不再发布；
2. 以当前 feedback 作为新控制器初始状态；
3. 清空旧 action chunk/轨迹缓存；
4. 记录 owner、切换原因和时间；
5. 任何 stale command、通信超时、mode 改变或 E-stop 都进入 HOLD/STOP，而不是继续执行最后命令。

### 4.3 推荐 ROS 接口

最终 topic/action 名可在实现前调整，建议语义如下：

| 接口 | 建议用途 |
|---|---|
| `/joint_states` | 整机统一关节位置/速度/effort；避免两个 publisher 对同名关节竞争 |
| `/arm_controller/follow_joint_trajectory` | 标准关节轨迹 action |
| `/gripper_controller/gripper_cmd` | 标准夹爪 action，若硬件适配可行 |
| `/arm/command_owner` | 当前唯一写者和 lease 状态 |
| `/arm/health_summary` | 位置新鲜度、通信、load/current、温度、电压、torque、calibration、fault |
| `/arm/stop` | 软件快速停止/hold；不能替代物理急停 |
| `/arm_camera/color/image_raw` | 腕部 RGB，不能复用现有 `/camera/...` 名称 |
| `/arm_camera/color/camera_info` | 腕部相机独立内参 |
| `/arm_camera/diagnostics` | 帧率、掉线、USB 身份与曝光状态 |
| `ObserveRegion` action | 多视点主动观察的长任务 |
| `PressButton` action | 按钮定位、接近、接触、验证与撤回的长任务 |

现有 `SkillClient.execute_skill()` 是同步调用。单次 `set_camera_pose` 尚可同步执行，但完整按钮任务与多视点观察应由 ROS Action 承载，以获得 feedback、cancel 和超时；`robot_skills` executor 再把 action result 转成既有 `SkillResult`。

### 4.4 建议 TF 树

如果机械臂安装在 lift 上：

```text
map
└── odom
    └── base_footprint
        └── base_link
            ├── livox_frame
            ├── existing_realsense_pan/tilt chain
            └── lift_base_link
                └── lift_carriage_link       # prismatic joint，必须来自可信位置
                    └── arm_mount_link       # 实测安装外参
                        └── arm_base_link
                            └── ... arm joints ...
                                └── tool0
                                    ├── button_tool_link
                                    └── arm_camera_link
                                        └── arm_camera_color_optical_frame
```

必须记录：

- `arm_mount_link → arm_base_link` 的实测 xyz/rpy；
- TCP 是夹爪中心还是按钮工具尖端；
- `tool0 → arm_camera_link` hand-eye 外参；
- 每张图像曝光时对应的 joint state 和 TF 时间；
- lift 位置的来源和置信状态。

TF 不能使用“命令目标角”冒充“实际角度”；需要实际 feedback 且时间新鲜。

## 5. 底层集成路线

### 5.1 首选路线：ros2_control + MoveIt

ROS 2 Humble 的 `joint_state_broadcaster`、`joint_trajectory_controller` 与 MoveIt Servo 正好覆盖当前需求：

- joint state 统一发布；
- FollowJointTrajectory 与轨迹容差；
- MoveIt 规划、自碰撞/环境碰撞检查；
- Servo 的关节/Cartesian 增量控制、奇异点和碰撞减速；
- 与现有 ROS 2 lifecycle、diagnostics 和 action cancel 方式一致。

外部项目 [`ros-physical-ai/ros2_so_arm`](https://github.com/ros-physical-ai/ros2_so_arm) 已包含 SO-ARM100/101 description、Feetech ros2_control driver、MoveIt 和仿真资产，可作为 spike 的候选来源。但当前仓库 README 主要展示 `so_arm100_moveit_config`，只说明 SO-101 使用 `so_arm101_description`；不能未经验证就认定其 SO-101 MoveIt 配置、关节方向、标定范围、Humble 兼容性和本机硬件完全可用。

在决定 vendoring/fork 前做以下只读或 mock 验证：

1. 许可证和依赖可接受；
2. ROS Humble 能 build；
3. SO-101 mesh、link 长度和 joint axis 与真机一致；
4. motor ID、baud、归一化与本机 LeRobot calibration 可映射；
5. mock hardware 下 `joint_state_broadcaster`、trajectory controller、MoveIt 全部能启动；
6. 真机 driver 支持 timeout、torque disable、limit、temperature/current diagnostics；
7. 与 leader teleop/LeRobot 不会同时写串口。

如果该项目无法满足这些条件，再写本项目自己的 `SystemInterface`，不要先写一个临时 topic bridge 后长期依赖它。

### 5.2 LeRobot bridge 的位置

可设计一个独立 adapter，二选一：

- leader teleop 输入转成受仲裁的 ROS trajectory/jog；
- policy action 转成受限的 ROS joint target/Servo 输入。

bridge 必须启用：

- 非空 `max_relative_target` 或等价的每周期关节 delta 限制；
- action chunk 丢弃与新鲜度检查；
- 输出频率 watchdog；
- 关节位置/速度/温度/load/current 边界；
- command owner lease；
- policy 推理异常、网络断开、相机 stale 后立刻 hold。

## 6. 目标 A：按下指定按钮

### 6.1 先定义“指定按钮”

`press_button("3")` 在工程上仍不完整，至少要明确：

```yaml
panel_id: elevator_A
button_id: floor_3
expected_label: "3"
approach_side: front
verification: indicator_or_panel_state
```

按钮可以来自三种来源，难度不同：

1. **已知固定面板 + 示教 pose**：最低风险 baseline；
2. **已知面板 + 视觉修正**：推荐近期目标；
3. **未知面板 + OCR/通用检测**：后续泛化目标。

第一阶段应使用测试按钮/低风险面板，不能直接以电梯、急停、设备电源等真实关键按钮作为开发夹具。

### 6.2 推荐状态机

```text
VALIDATE_REQUEST
  ↓
CHECK_SAFETY_AND_OWNER
  ↓
BASE_STATIONARY + ARM/LIFT HEALTHY
  ↓
MOVE_TO_OBSERVATION_POSE
  ↓
DETECT_PANEL_AND_BUTTON
  ↓
ESTIMATE_TARGET + CONFIDENCE GATE
  ↓
PLAN_TO_PRE_PRESS
  ↓
VISUAL_REFINE
  ↓
SLOW_APPROACH_ALONG_NORMAL
  ↓
CONTACT_DETECT / MAX_TRAVEL / TIMEOUT
  ↓
DWELL
  ↓
RETREAT
  ↓
VERIFY_BUTTON_EFFECT
  ↓
STOW OR REPORT FAILURE
```

失败时不能盲目重复按压。需要区分：

- `BUTTON_NOT_FOUND`
- `BUTTON_AMBIGUOUS`
- `POSE_CONFIDENCE_LOW`
- `TF_STALE`
- `IK_FAILED`
- `COLLISION_RISK`
- `CONTACT_NOT_DETECTED`
- `MAX_PRESS_TRAVEL_REACHED`
- `ARM_OVERLOAD`
- `BUTTON_EFFECT_NOT_VERIFIED`
- `CANCELLED_BY_SAFETY`

### 6.3 按钮 3D 定位方案

若腕部相机只是 RGB，单帧检测框不能直接给出可靠按压深度和面法向。按优先级考虑：

1. 已知测试面板模型或 AprilTag/ArUco 辅助，求面板 pose；
2. 使用现有 D435 对面板给出粗 3D，腕部 RGB 做末端 image-based visual servo；
3. 多视点/已知机械臂运动做几何估计；
4. 更换/增加腕部 RGB-D 或小型 ToF；
5. 最后才考虑 learned 6D pose。

无论哪种方案，都需要 hand-eye calibration 和实际曝光时 TF。

### 6.4 接触策略

SO-ARM101 没有已确认的末端六轴力传感器。Feetech 可读 `Present_Load`/`Present_Current`，但它们不是经过标定的 TCP 力：

- 先在软质测试按钮上测空载、运动、堵转和接触分布；
- 使用慢速、小步长、最大位移、最大时间、最大 load/current 多重界限；
- 用“位置误差 + load/current 变化 + 视觉运动”组合判断接触；
- 若分布不稳定，增加弹性按钮工具或小型力/触觉传感器；
- 不建议直接用硬夹爪尖端，推荐圆头、柔顺、可更换的 button tool。

### 6.5 按钮任务分级验收

| Gate | 场景 | 最低验收建议 |
|---|---|---|
| P0 | mock/sim，固定目标 pose | 规划、取消、超时、撤回路径全部可重复 |
| P1 | 软质测试按钮，完全示教 pose | 30 次无超限/碰撞，成功率 ≥ 90%，所有失败可归因 |
| P2 | 已知面板，位置小范围扰动 | 30 次成功率 ≥ 90%，错误按钮 0 次 |
| P3 | OCR/label 指定按钮 | 置信度不足时拒绝；错误按钮 0 次优先于成功率 |
| P4 | 与 Nav2/lift 联动 | base 停止、lift 有可信参考、arm healthy 后才执行 |
| P5 | 真实非关键设备 | 操作者在场、单次确认、完整日志后逐步放开 |

按钮任务的核心安全指标是“绝不按错”和“可安全撤回”，不能只报告平均成功率。

## 7. 目标 B：腕部相机主动观察

### 7.1 能力定位

腕部相机与现有 RealSense 的职责建议区分为：

| 相机 | 初期职责 |
|---|---|
| 现有 D435 | 导航障碍、固定/有限 pan-tilt 的 RGB-D 粗观察 |
| SO-ARM101 腕部相机 | 近距离、遮挡后、不同高度/角度的主动 RGB 观察 |

机械臂不是一个可任意转动的“昂贵云台”。主动观察必须考虑自碰撞、线缆、工作空间、底盘外轮廓和周围人员。

### 7.2 推荐 `ObserveRegion` 行为

输入示例：

```yaml
target:
  frame_id: base_link
  region_id: front_panel
purpose: read_label
view_profile: panel_close_range
max_views: 5
return_stow: true
```

输出至少包含：

```yaml
observations:
  - image_path: ...
    camera_id: arm_camera
    optical_frame: arm_camera_color_optical_frame
    capture_stamp: ...
    joint_state_stamp: ...
    camera_pose: ...
    viewpoint_id: ...
    detections: ...
coverage: ...
stop_reason: target_found | exhausted | safety | timeout
```

推荐状态机：

```text
BASE_STATIONARY
  ↓
ARM HEALTH / CAMERA HEALTH / TF FRESH
  ↓
SELECT NEXT APPROVED VIEWPOINT
  ↓
COLLISION-CHECKED MOVE
  ↓
SETTLE + CAPTURE FRESH FRAME
  ↓
DETECT / OCR / SCORE INFORMATION GAIN
  ↓
FOUND ? RETURN RESULT : NEXT VIEW
  ↓
RETURN STOW
```

可以复用当前 `capture_observation`、`detect_known_object`、artifact 和 `SkillResult` 思路，但接口必须增加：

- `camera_id` / image topic；
- `optical_frame`；
- capture timestamp；
- exposure 时机械臂 pose；
- 相机 health 与 TF freshness；
- 多相机 observation 不能混在没有 source metadata 的同一个列表中。

### 7.3 初期限制

第一版应规定：

- 底盘静止后才能展开机械臂观察；
- lift 固定或已可靠 referenced；
- 仅使用审核过的关节观察姿态；
- 每个姿态经过 self-collision、车体 collision 和线缆检查；
- 到位并稳定后再采新帧；
- 完成后回 `arm_stow`，确认 stow 后才允许底盘自动移动；
- 人靠近时由操作者停止，直到具备可靠人员安全区域监测。

暂不把腕部相机作为 Nav2 持续障碍源，原因是：

- 外参持续变化；
- 视野可能被机械臂/夹爪遮挡；
- RGB 相机可能没有深度；
- 展开 arm 会改变整机 footprint；
- 相机与 arm motion 时间同步错误会产生错误障碍点。

后期若加入动态 point cloud，需要用 joint feedback + 时间同步进行每帧 TF，并同步更新移动机器人 footprint/禁行状态。

### 7.4 主动观察验收

| Gate | 验收内容 |
|---|---|
| O0 | 稳定设备名、相机内参、30 Hz/目标帧率、断线可检测 |
| O1 | 10 个审核姿态，各 50 次到位，无超限、无明显线缆拉扯 |
| O2 | 图像、joint state、TF 时间一致；重复观察静态标定板的 pose 误差可量化 |
| O3 | 目标在预定义区域，至少一个视点发现目标；找不到时明确返回 exhausted |
| O4 | Mission Agent 可调用，cancel 后停止并安全回 stow |
| O5 | arm 未 stow 时底盘 AUTO 被门禁；stow feedback 新鲜后才解除 |

## 8. 分阶段开发计划与 Gate

### Phase 0：需要先讨论/测量的事实

不写控制代码，先完成：

- follower/leader/相机的型号、USB serial、`by-id`、供电和线缆清单；
- SO-ARM101 安装位置、朝向、是否固定在 lift carriage；
- 腕部相机型号、RGB/深度能力、镜头 FOV、实际 mount；
- 按钮对象、面板高度、按钮尺寸、行程和允许按压力；
- 物理急停是否能切断 arm power/enable；
- 找回或确认历史 LeRobot calibration、dataset 与 policy 类型。

**退出条件：** 本文第 13 节的高优先级问题有答案。

### Phase 1：独立工作台重新建立 SO-ARM101 baseline

- 机械臂暂不装到移动底盘，或底盘断电固定；
- 建立稳定 USB 名；
- 备份 calibration；
- follower/leader teleop；
- 读取 position/load/current/temperature/voltage；
- 测量通信频率、最大 gap、断线行为；
- 配置非空 per-joint delta limit；
- 建立 `home`、`stow`、`observation_safe` 姿态。

**退出条件：** 50 次 `stow → test pose → stow`，无通信丢失、关节越界和不可解释漂移；断 USB/停 policy 会 hold 或 torque disable，而不是继续最后命令。

### Phase 2：ROS 2 driver、URDF、控制器与安全

- mock 验证外部 `ros2_so_arm` 候选；
- 确定 ros2_control driver 来源；
- 整机 URDF 加 arm/lift/camera/TCP；
- joint state、trajectory、gripper controller；
- command owner；
- `/arm/health_summary`；
- software stop 与物理停机链验证；
- MoveIt self-collision 和车体 collision model。

**退出条件：** RViz 与真机方向一致；controller cancel/timeout 有效；stale feedback、overtemperature、communication loss、E-stop 各自有可观察结果。

### Phase 3：腕部相机主动观察 baseline

- 相机稳定名、内参、hand-eye；
- 预定义安全 viewpoint library；
- `ObserveRegion` action；
- 复用/扩展 perception artifacts；
- Agent skill adapter；
- arm stow ↔ base motion interlock。

**退出条件：** 通过 O0–O5，且失败不会留下展开机械臂后允许底盘移动的状态。

### Phase 4：固定示教 pose 按测试按钮

- 安装柔顺 button tool；
- 固定面板/固定 lift/固定 base；
- pre-press、slow approach、contact、dwell、retreat；
- 建立 load/current/position residual baseline；
- 实现 PressButton action 与失败码。

**退出条件：** 通过 P0–P1。

### Phase 5：视觉修正后的指定按钮

- 已知面板 pose；
- 按钮 label/ID 与几何布局；
- D435 粗定位或 fiducial；
- 腕部视觉 refine；
- 按后视觉/指示灯/外部状态验证。

**退出条件：** 通过 P2–P3，错误按钮为 0；置信度不足时拒绝执行。

### Phase 6：与整机 Mission Agent 联动

建议新增复合 skill，而不是暴露每个关节：

```text
arm_get_status
arm_stow
observe_region
inspect_with_arm_camera
press_button
cancel_arm_task
```

Mission plan 示例：

```text
resolve target
→ Nav2 approach
→ await base stationary
→ verify lift reference
→ acquire arm owner
→ observe/locate panel
→ request human confirm（初期）
→ press_button
→ verify
→ arm_stow
→ release owner
```

**退出条件：** dry-run、sim/mock、真机 supervised 三种 mode 有清晰支持矩阵；Dashboard 能显示 arm/camera/button task 的直接证据。

### Phase 7：可选 learned policy/VLA

只有 P2/O4 已有确定性 baseline 后再做：

- 恢复历史 ACT policy 或重新采集 dataset；
- 保持 observation/action key、相机命名、calibration 版本稳定；
- learned policy 封装为 `press_button_learned` 或视觉 refine 子模块；
- 不让模型绕过 owner、limits、collision、stale data 和 E-stop；
- 与 geometric baseline 使用相同测试集、成功定义和失败分类。

VLA 更适合后期解决“不同外观面板/语言指令/多视角语义选择”，不适合代替最初的设备身份、TF、轨迹和接触安全。

## 9. 建议的未来 package 划分

以下只是目录建议，本次没有创建：

```text
src/
├── so_arm101_description/       # 或经审核引用外部 package
├── so_arm101_hardware/          # ros2_control SystemInterface + diagnostics
├── so_arm101_moveit_config/
├── arm_camera_driver/           # 若普通 v4l2_camera 不足
├── arm_task_server/
│   ├── observe_region_action
│   └── press_button_action
├── arm_safety/
│   ├── command_owner
│   ├── interlocks
│   └── arm_health_summary
└── lerobot_ros_adapter/         # leader / dataset / learned policy adapter
```

现有 package 的修改点预计是：

- `robot_description`：组合底盘、lift、arm、wrist camera；
- `robot_bringup`：独立 `arm:=false` 默认开关，硬件未验证前不能默认启动；
- `robot_skills`：registry、executor、result codes；
- `robot_agent`：intent/parser/plan/health gate；
- `health_monitor`：arm、wrist camera、stow、command owner、active task 证据；
- Dashboard：新增 arm capability，UNKNOWN 不显示为 OK。

## 10. 测试与证据策略

### 10.1 测试层级

1. 纯 Python/C++ unit：schema、limit、状态机、failure mapping；
2. mock ros2_control：trajectory、cancel、controller switching；
3. MoveIt/RViz：TF、IK、collision、stow；
4. 桌面 follower：低速、无移动底盘；
5. 整机静止 supervised；
6. Nav2 + arm 的任务级测试；
7. learned policy 影子模式和受限真机评估。

### 10.2 每次真机运行应记录

- git commit、LeRobot/ROS package version；
- calibration ID/hash；
- URDF/SRDF/config hash；
- USB stable identity；
- `/joint_states`、controller state、owner、arm health；
- `/tf`、`/tf_static`、lift position/reference；
- wrist image、CameraInfo、capture timestamps；
- requested/action-sent/feedback positions；
- load/current/temperature/voltage；
- action feedback/result、失败码、operator stop；
- 按钮检测、目标选择、接触与验证证据。

不要只录 policy 的 observation/action。没有整机 safety、TF、owner 和 health，失败后仍无法归因。

### 10.3 故障注入

至少覆盖：

- follower USB 拔出；
- wrist camera 拔出/冻结；
- joint feedback stale；
- policy/bridge crash；
- action cancel；
- base 从 stationary 变为 motion request；
- lift 未 referenced；
- button detection 多解；
- contact load 超限；
- MoveIt collision/IK failure；
- software E-stop 与 physical E-stop。

每一项都必须定义“臂实际发生什么、Dashboard 显示什么、任务返回什么”。

## 11. 主要风险和对应策略

| 风险 | 当前依据 | 对策 |
|---|---|---|
| `/dev/ttyACM*` 打开错误设备 | follower/leader/lift 历史端口重叠 | 全部改 stable ID，并在 driver 校验硬件身份 |
| `/dev/video6` 变化 | 仅是 2026-04-09 枚举结果 | `/dev/v4l/by-id`/udev symlink + camera serial |
| 动态相机使用错误 TF | 现有 D435 URDF 是固定 Nav pose | 腕部相机进入完整 joint TF；按曝光时间查询 |
| lift 高度不可信 | 当前主要是软件积分估计 | 初期固定 lift；之后接 ABZO/limit/home direct feedback |
| 急停只停底盘 | 当前 software safety 面向 cmd_vel | arm torque/power 专用停机链与直接验证 |
| 多个程序同时写 arm | LeRobot、MoveIt、teleop 都可能写 | command owner lease，单写者 |
| 开环按压损坏按钮/arm | 无末端 F/T 证据 | 柔顺工具、慢速、短行程、多阈值、测试夹具 |
| 误按按钮 | OCR/检测可能多解 | panel/button ID、置信门、初期人工确认、错误按钮零容忍 |
| 腕部相机当导航传感器产生伪障碍 | 动态外参与遮挡 | 初期只做静止按需观察，不进 costmap |
| learned policy 无法解释失败 | 历史 policy/dataset 信息不完整 | 先确定性 baseline，再 A/B；完整版本和运行日志 |
| 本机算力不足以实时 VLA | 当前无可用 CUDA | 传统视觉优先；另机推理也必须有本地 watchdog |

## 12. 第一轮实施前的建议决策

在下面问题未确认前，不建议开始写真机运动代码。可以先做 URDF/mock spike，但不要使能 follower。

### 高优先级，决定系统结构

1. **SO-ARM101 实际安装在哪里？** 是否在现有 0–200 mm lift carriage 上，安装朝向和高度是多少？
2. **腕部相机具体型号是什么？** 是否只有 RGB？保存图中的青色夹爪相机是否就是计划继续使用的相机？
3. **机械臂的物理停止方案是什么？** 红色停止按钮现在是否切 arm 电源/enable，还是只影响 BLVD 底盘？
4. **第一个要按的按钮是什么？** 测试夹具、面板按钮、电梯按钮，还是设备控制按钮？尺寸、行程、高度和允许力是多少？
5. **“指定”如何表达？** 固定 ID/位置、按钮文字/OCR、颜色，还是自然语言描述？

### 中优先级，决定第一版算法

6. 是否允许在测试面板贴 AprilTag/ArUco，先完成可靠几何 baseline？
7. 是否接受增加柔顺 button tool 或小型力/触觉传感器？
8. 主动观察时是否允许底盘完全静止、arm 观察后回 stow，还是必须边走边看？
9. 是否需要腕部相机结果只给 Agent/人看，还是要生成 3D 地图/障碍？
10. lift 是否必须参与第一版按钮任务？若不必须，建议锁定一个物理高度。

### 历史资产确认

11. `${HF_USER}/my_policy` 当时是 ACT、Diffusion Policy、SmolVLA 还是其他模型？
12. Hugging Face 上是否仍有 `act_so101_drop2cap` / `eval_act_so101_drop2cap` 和 calibration 备份？
13. follower、leader 和腕部相机现在是否仍是当时同一批硬件，机械装配和电机零点有没有变化？

## 13. 推荐先讨论的三个问题

为了最快进入可执行的下一阶段，建议先回答这三个：

1. SO-ARM101、lift、腕部相机当前的真实安装照片或尺寸关系；
2. 第一个测试按钮的实体、位置与“按下成功”的可观察信号；
3. 现有红色急停是否实际切断 SO-ARM101，若没有，是否接受增加 arm power/enable interlock。

这三个答案会决定 URDF/TF、接触方案和是否允许进入真机 Phase 1–2。

## 14. 外部参考（调查时点：2026-08-25）

- [LeRobot SO-101 官方文档](https://huggingface.co/docs/lerobot/en/so101)：校准要求及 follower/leader 工作流。
- [LeRobot SO follower implementation](https://github.com/huggingface/lerobot/blob/main/src/lerobot/robots/so_follower/so_follower.py)：position observation、`send_action` 和 `max_relative_target`。
- [ros2_control Humble joint_state_broadcaster](https://control.ros.org/humble/doc/ros2_controllers/joint_state_broadcaster/doc/userdoc.html)：标准 joint state 发布。
- [ros2_control Humble joint_trajectory_controller](https://control.ros.org/humble/doc/ros2_controllers/joint_trajectory_controller/doc/parameters.html)：trajectory command/state interface 与 tolerance 配置。
- [MoveIt Servo Humble](https://moveit.picknik.ai/humble/doc/examples/realtime_servo/realtime_servo_tutorial.html)：Cartesian/joint servo、奇异点与碰撞检查；同时明确要求有效 URDF/SRDF、控制器和快速准确 joint feedback。
- [ros-physical-ai/ros2_so_arm](https://github.com/ros-physical-ai/ros2_so_arm)：可评估的 SO-ARM100/101 ROS 2 description/driver/MoveIt/仿真候选，不等同于已经通过本项目兼容性验证。

## 15. 2026-08-29 真机重新标定后的实施更新

本节记录 2026-08-29 在操作者监督下完成的只读设备辨识、相机确认和 follower 重新标定结果，并把新增的 Dashboard 需求转成可实施接口。它更新第 3、8、9、12 节的部分“待确认”状态，但不表示 ROS 控制器、Dashboard arm 控制或按钮任务已经实现。

### 15.1 已确认的硬件事实

| 项目 | 当前确认值 |
|---|---|
| arm | 只连接 SO-ARM101 follower；没有 leader |
| 供电 | 12 V 套件 |
| follower USB | QinHeng `1a86:55d3`，serial `5AE6054086` |
| follower 稳定端口 | `/dev/serial/by-id/usb-1a86_USB_Single_Serial_5AE6054086-if00` |
| follower 临时枚举名 | 本次为 `/dev/ttyACM1`，不得写入 launch 默认值 |
| lift USB | Arduino Uno serial `03536383236351E062C1`，当前 `/dev/ttyACM0` |
| wrist camera | Sonix/ARC USB2.0 CAM1，USB ID `05a3:9230` |
| wrist camera 稳定路径 | `/dev/v4l/by-id/usb-Sonix_Technology_Co.__Ltd._USB2.0_CAM1_USB2.0_CAM1-video-index0` |
| wrist camera 验证 | 640×480 实拍画面底部清楚可见青色夹爪，确认是 arm camera |

通过“拔出 follower USB → 设备消失；重新插入 → 新增 `1a86:55d3`/`ttyACM1`”完成了端口差分确认。旧命令中的 `/dev/ttyACM0` 当前对应 lift，严禁继续作为 follower 默认端口。

### 15.2 新 calibration 基线

操作者确认旧 calibration 是更换电机后产生的有效历史参考，并决定重新标定。2026-08-29 已使用稳定 follower 端口和新 ID 完成一次完整标定：

```text
robot type: so101_follower
robot id: follower_12v_recal_20260831_v2
file: /home/matsunaga-h/.cache/huggingface/lerobot/calibration/robots/so_follower/follower_12v_recal_20260831_v2.json
sha256: 276e40239a27baa4b910d9f1f384e934bf70265e8f558fbc51e4266ffcf5f68c
```

记录值：

| joint | homing_offset | range_min | range_max |
|---|---:|---:|---:|
| shoulder_pan | -1624 | 659 | 3040 |
| shoulder_lift | -1243 | 886 | 3249 |
| elbow_flex | 1285 | 850 | 2999 |
| wrist_flex | 1645 | 781 | 3106 |
| wrist_roll | -1445 | 0 | 4095 |
| gripper | 1569 | 1801 | 3238 |

`shoulder_pan` 的本次记录范围比旧文件窄，操作者已明确选择保留当前结果。后续所有软件限位、URDF 关节方向、预设姿态和真机测试均以当前 calibration 为被测基线，不能为了匹配旧数值而强推机械关节。`wrist_roll=0..4095` 是当前 LeRobot 实现的固定全转范围，不是本次漏扫。

必须保留以下规则：

- Dashboard、ROS driver 和运行日志都显示 calibration ID/hash；
- calibration hash 不匹配时，真机动作 capability 为 `BLOCKED`；
- 在线示例姿态、上游硬编码 offset 和旧 policy 不得直接当作本机安全姿态；
- 当前 ACT policy 若恢复评估，必须记录其训练时 calibration 与新 calibration 的差异。

### 15.3 URDF/ROS 资产选择更新

本机当前没有 SO-ARM101 URDF 或 mesh。可以优先评估两个上游来源：

1. [`TheRobotStudio/SO-ARM100/Simulation/SO101`](https://github.com/TheRobotStudio/SO-ARM100/tree/main/Simulation/SO101)
   - 提供 `so101_new_calib.urdf`、mesh 和 MuJoCo 描述；
   - `new_calib` 的关节虚拟零点位于量程中点，与当前 LeRobot 标定语义一致；
   - 上游明确说明 base collision mesh 曾因规划/仿真问题被移除，且 gripper 的 LeRobot `0..100` 映射尚未完整反映在模型中，不能直接当作完成的碰撞模型。
2. [`ros-physical-ai/ros2_so_arm`](https://github.com/ros-physical-ai/ros2_so_arm)
   - 提供 `so_arm101_description`、mesh、RViz、Gazebo/MuJoCo 和 `feetech_ros2_driver` 接口；
   - 可直接从 `mock_components` 路径开始验证 `/robot_description`、`/joint_states` 和控制器；
   - 当前 real-hardware xacro 包含固定 motor offset，这些数值不等于本机 LeRobot calibration，必须先研究驱动换算，不得原样启动真机。

采用顺序：

```text
上游 URDF/mesh 只读审核
  → mock_components 启动
  → RViz/Lichtblick 方向与关节名验证
  → 本机 calibration 到 ROS joint 的换算测试
  → torque-disabled 状态回读
  → 受监督低速单关节测试
  → 多关节轨迹与 MoveIt
```

### 15.4 RViz 可视化 + Dashboard Arm 控制

第一版不在浏览器中重复渲染 3D 模型。现有 RViz 配置已经包含订阅 `/robot_description` 的 `RobotModel`；组合 URDF 加入 SO101 后，实际 arm 会跟随真实 `/joint_states` 和 TF 自动显示。Dashboard 只承担状态、控制权、候选目标、预设姿态和任务 trigger：

```text
RViz
┌─────────────────────────────────────────────────────────────┐
│ 整机 + SO101 actual model                                  │
│ TF / tool0 / wrist camera                                  │
│ candidate/planned trajectory ghost + collision scene       │
└─────────────────────────────────────────────────────────────┘

Dashboard /arm
┌──────────────────────────────┬──────────────────────────────┐
│ Arm health / ownership       │ Approved poses / actions     │
│ calibration / USB / camera   │ STOW / HOME / OBSERVE_*      │
│ controller / task / faults   │ 观察四周 / 按钮测试          │
├──────────────────────────────┼──────────────────────────────┤
│ Joint target editor          │ Validation / execution       │
│ actual ─────────────         │ limits / collision / owner   │
│ target ─────●───────         │ preview / execute / cancel   │
└──────────────────────────────┴──────────────────────────────┘
```

#### 15.4.1 3D 模型显示

第一版使用现有 RViz：

- `/robot_description` 提供组合后的底盘、lift、SO101、tool 和 wrist camera URDF；
- `/joint_states` 只使用真实 feedback，`robot_state_publisher` 生成实际 TF；
- 当前 `src/robot_description/rviz/robot.rviz` 和 `rviz/nav2_navigation.rviz` 已有 `RobotModel`，不需要再维护一个浏览器 URDF renderer；
- 候选姿态由后端校验/规划后发布 `moveit_msgs/DisplayTrajectory` 到 `/display_planned_path`，RViz 以 ghost/planned trajectory 显示，不能把候选值伪装成真实 `/joint_states`；
- mock mode 可先显示实际 mock state、候选轨迹、limit 和 collision，不连接 follower。

Dashboard 已有的 Lichtblick/Foxglove iframe 保留为可选远程诊断能力，默认关闭。只有确实需要远程 3D 查看时才启动 bridge 和浏览器 3D panel；日常本机开发不同时运行两套 3D renderer。React + Three.js/URDF loader 暂不引入。

#### 15.4.2 关节滑动条

滑动条不能直接连续写串口。正确语义是：

1. 滑动只更新浏览器内的 candidate target；
2. 后端把通过初步校验的 candidate 发布为 RViz ghost/planned trajectory，实际 RobotModel 继续只显示 feedback；
3. 后端返回 limit、collision、owner、health 和预计轨迹时长的检查结果；
4. 操作者明确按下 `执行候选姿态` 后才提交 ROS Action；
5. 真机执行期间持续显示 requested/commanded/actual/error；
6. cancel、浏览器掉线、feedback stale、owner 丢失或 safety 改变时由 ROS 后端 hold/stop，不能依赖浏览器 JavaScript 实现安全停止。

控制流程借鉴现有 Dashboard Joy-Con 的 **lease、dead-man/watchdog 和物理输入抢占**，但不能把 arm 目标塞进 `sensor_msgs/Joy`。底盘速度控制与机械臂离散轨迹的语义不同。建议接口：

| 数据/命令 | 建议接口 |
|---|---|
| 实际关节 | `/joint_states` |
| 控制器状态 | `/arm_controller/controller_state` 或统一 `/arm/dashboard_state` |
| 候选检查 | `ValidateArmTarget` service/action |
| 执行目标 | `/arm_controller/follow_joint_trajectory`，由 arm command gateway 代理 |
| 所有权 | `/arm/command_owner` + acquire/release lease |
| 快速停止 | `/arm/stop`；同时保留物理断电手段 |
| 健康 | `/arm/health_summary` |

若以后需要“按住才运动”的关节微调，单独实现低速 `JointJog`/MoveIt Servo 模式，并要求持续 dead-man；滑动条仍只作为离散目标编辑器，不采用拖动即运动。

UI 至少区分：

```text
READ_ONLY → MOCK → SUPERVISED → ARMED → EXECUTING
                                      ↘ FAULT / STOPPED
```

在 `READ_ONLY`、health `UNKNOWN`、calibration hash 不符或 command owner 不是 Dashboard 时，所有执行按钮必须 disabled，但模型和 feedback 仍可查看。

#### 15.4.3 预设姿态

预设姿态不直接硬编码在 React 中，使用受版本控制的 YAML：

```yaml
id: observation_left
description: approved wrist-camera left viewpoint
calibration_id: follower_12v_recal_20260831_v2
calibration_sha256: 276e40239a27baa4b910d9f1f384e934bf70265e8f558fbc51e4266ffcf5f68c
joint_positions: {}
speed_scale: 0.1
allowed_modes: [MOCK, SUPERVISED]
review_state: UNMEASURED
return_pose: stow
```

2026-09-02 底座重新安装后的 operator-captured 集合：

- `home`
- `see_front`
- `see_ground`
- `see_left`
- `see_right`
- `see_upside`

旧安装方向下的命名姿态不再进入实机配置。新集合的 joint 值来自本机 feedback，
仍须通过 Preview、当前反馈、软限位和运行时保护后才能执行。

#### 15.4.4 `观察四周` trigger

`观察四周` 按钮应调用 `ObserveRegion` action，而不是在网页里依次发送关节值：

```text
验证 base stationary / lift / arm health / camera
  → acquire owner
  → see_front
  → settle + capture fresh image
  → see_left/right/upside/ground（仅审核通过的姿态）
  → 每个视点保存 image + joint/TF timestamp
  → return home
  → release owner
```

Dashboard 显示当前 viewpoint、图像、覆盖进度、下一姿态、cancel 和 stop reason。任何姿态不可达或相机 stale 时停止序列并优先回安全姿态；不能盲目跳到下一个姿态。

#### 15.4.5 `按按钮测试` trigger

第一版按钮只能在 mock/sim 出现为可执行；真机按钮保持 `BLOCKED`，直到：

- 使用软质、非关键测试按钮；
- 定义 `button_observation`、`pre_press`、最大接近距离和 retreat；
- load/current/position error 阈值经过空载采样；
- command owner、base stationary、lift 状态、collision 和人工确认全部通过；
- action 支持 cancel，并且取消后撤回或进入明确 HOLD；
- Dashboard 明确显示这是 test fixture，不是任意真实设备按钮。

按钮执行必须走 `PressButton` action/state machine，不能把它实现为一个 WebSocket `String` 或多个前端定时器。

### 15.5 Dashboard 真机动作的统一门禁

任一滑动条目标、预设姿态或 trigger 在真机执行前都必须满足：

| Gate | 最低要求 |
|---|---|
| device | stable USB identity 与期望 serial 一致 |
| calibration | ID/hash 与配置一致 |
| feedback | joint state 新鲜且六个 motor 均存在 |
| controller | lifecycle active、无其他串口 writer |
| owner | Dashboard/对应 task 持有唯一 lease |
| limits | 目标、速度、加速度和单次 delta 全部在本机限制内 |
| collision | self/robot/environment collision check 通过 |
| base | stationary，且没有新的底盘 motion request |
| lift | 第一版锁定且人工确认；以后必须 referenced |
| safety | software stop 未触发；操作者可立即切 12 V |
| mode | 明确 `SUPERVISED`，不能从 `UNKNOWN` 推断允许 |

现有 Dashboard 的 Joy lease/watchdog 可作为设计参考，但 arm 必须使用独立 owner；不能因为 Dashboard 获得 `/joy` 控制权就自动获得 arm 控制权。

### 15.6 接下来按这个顺序开发

#### Step A：冻结本机证据与配置

- 把 follower/camera stable identity 写入专用配置；
- 保存 calibration ID/hash，不复制或修改电机值；
- 新增 arm launch 参数，默认 `arm:=false`、`hardware_type:=mock_components`；
- 定义 joint name、单位、方向、gripper 映射和状态 schema。

**退出条件：** 配置单测能拒绝 `/dev/ttyACM*` 临时名、错误 serial 和错误 calibration hash。

#### Step B：URDF + mock + Dashboard 只读模型

- 审核并引入 SO101 URDF/mesh；
- 在独立 mock launch 中发布 `/robot_description`、`/joint_states` 和 TF；
- 核对五个 arm joint 与 gripper 的方向、零位和 limit；
- 在现有 RViz 中显示 actual RobotModel，并增加 candidate/planned trajectory display；
- 增加 Dashboard `/arm` 状态和控制页面，不在浏览器中重复渲染 3D；
- 滑条先做 candidate preview，通过后端发布到 RViz，但不产生 hardware command；
- 预设按钮先全部显示为 `UNMEASURED/BLOCKED`。

**退出条件：** 不连接 follower 也能在 mock 中完整演示 RViz actual/preview 模型、Dashboard 滑条候选、预设状态和安全阻断。

#### Step C：真实状态回读，不执行动作

- 评估 `feetech_ros2_driver` 与本机 ROS 2 Humble 的 build/runtime；
- 明确 LeRobot calibration 到 ROS joint radians 的转换和符号；
- torque-disabled 条件下发布 joint state、通信间隔、load/current/temperature/voltage；
- 实现 `/arm/health_summary` 和 Dashboard evidence；
- 做 USB 拔出、反馈 stale、driver crash 故障注入。

**退出条件：** RViz/Lichtblick 姿态与手动移动真机方向一致，且全程没有 Goal Position 写入。

#### Step D：受监督单关节和小增量动作

- 实现 arm command owner、trajectory gateway、stop/watchdog；
- 先在 mock 验证 cancel、timeout、limit 和 owner 抢占；
- 真机从当前姿态开始，只做一个关节的小增量、低速测试；
- 再做 `test_near_current → current`，不直接使用 home/stow 示例值；
- Dashboard 滑条开放为“预览 → 校验 → 明确执行”，禁止拖动即运动。

**退出条件：** 每个关节方向和停止行为有直接证据；断 WebSocket 不会让动作继续失控。

#### Step E：建立并验收预设姿态

- 从真机 feedback 捕获候选 `home/see_*`；
- 每个姿态人工检查车体、桌面、自碰撞和相机线缆；
- 逐步执行 `stow → pose → stow`；
- 达到 Phase 1 的 50 次重复测试后标记为 `APPROVED`。

#### Step F：腕部相机与 `观察四周`

- 发布 `/arm_camera/color/image_raw` 和 CameraInfo；
- 标定或至少记录 `tool0 → arm_camera_link`；
- 实现 approved viewpoint library 和 `ObserveRegion` action；
- Dashboard 增加图像、进度、cancel 和 observation artifacts。

#### Step G：测试按钮

- 先在 sim/mock 完成 PressButton state machine；
- 制作低风险软按钮夹具和柔顺工具；
- 采集无接触/接触 load-current 基线；
- 只在人工确认后开放 Dashboard 真机 trigger；
- 通过 P1 后再研究视觉修正和指定按钮。

### 15.7 当前立即开始的开发项

当前最合适的下一项不是 teleoperate，也不是按钮真机测试，而是：

> **Step B：引入经过审核的 SO101 description，在 mock_components 中建立 `/robot_description` + `/joint_states`，在现有 RViz 中显示 actual/preview 模型，并给 Dashboard 增加不负责 3D 渲染的 Arm 状态、slider candidate、预设和 trigger 页面。**

这一步可以在 12 V 关闭、follower 不被打开的情况下完成，同时为后续 ros2_control、真机 feedback、预设姿态和两个 trigger 建立统一 UI/接口边界。
