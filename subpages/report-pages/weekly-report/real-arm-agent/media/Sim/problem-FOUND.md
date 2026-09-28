# Arm / Touch Anything Sim Baseline - Found Problems

记录时间：2026-09-21

目标：在 Isaac Sim 中把当前环境当作 real robot 替身，RViz / Dashboard 作为操作与验证界面，先保证 Touch Anything baseline 可以稳定跑通：

Depth Camera シーン取得 -> VLM / human click -> SAM2 segmentation -> depth 3D target -> ARM approach -> wrist camera handoff -> near visual correction -> Touch / Press

## P0 - RViz SO101 Arm TF 断链

现象：
- RViz `SO101 Arm` 显示 `/arm/robot_description` 可以收到，URDF parsed OK。
- 只有 `arm/world`、`arm/base_link` 有 Transform OK。
- `arm/shoulder_link`、`arm/upper_arm_link`、`arm/lower_arm_link`、`arm/wrist_link`、`arm/gripper_link`、`arm/touch_tip`、`arm_camera_color_optical_frame` 等全部报 `No transform`。
- 画面中出现一部分 arm 模型/历史轨迹堆在 robot 下方，另一部分又在接近正确位置。

初步判断：
- 这不是单纯 RViz 配置问题，而是 arm dynamic TF 没有从 `/arm/visual_joint_states` 正常驱动到 robot_state_publisher。
- 高概率原因之一是 sim arm mock/backend 与 RViz/robot_state_publisher 使用不同时间基准，导致 TF stamp 对 `/clock` 来说不可用。
- 另一个需要下次运行确认的原因是 `sim nav2 3b arm touch mock` 子窗口是否实际启动并持续运行；如果该 launch 退出，`/arm/visual_joint_states` 与 `/touch_anything/state` 会同时消失。

已做/建议修改：
- `arm_visual_joint_state_calibrator` 输出 `/arm/visual_joint_states` 时用本节点 clock 重新打 stamp，不再照抄输入 `/joint_states` stamp。
- `robot_sim sim_arm_touch.launch.py` 中 mock trajectory server 与 arm gateway 改为跟随 `use_sim_time`。
- 下次复测时优先检查：
  - `ros2 topic hz /arm/visual_joint_states --window 5`
  - `ros2 topic echo /arm/visual_joint_states --once`
  - `ros2 run tf2_ros tf2_echo arm/base_link arm/gripper_link --ros-args -p use_sim_time:=true`
  - `ros2 node list --no-daemon | rg 'so101|arm_visual|robot_state|touch'`

## P0 - Touch Mode 获取 D435 depth 后退出或 BLOCKED

现象：
- 进入 Touch mode 后点击获取/freeze D435 depth 画面，会退出或进入 BLOCKED。
- RViz panel 曾显示类似：
  - `D435 synchronization rejected: depth skew=0.200s ... limit=0.120s`
  - 或 `D435 color, aligned depth, or CameraInfo is missing`
- real baseline 可以稳定运行，因此 sim 中应优先保证 D435 RGB、aligned depth、CameraInfo、TF 的数据流与时间戳一致。

初步判断：
- sim 的不同启动路径存在 depth 同步阈值不一致：主 sim arm launch 是 `0.25s`，单独 `touch_observation.launch.py` 之前默认是 `0.05s`。
- 如果用户从不同路径启动 Touch node，会出现相同操作有时通过、有时 BLOCKED 的问题。
- 还需要下次运行确认 freeze 失败时是正常保持 active，还是 Dashboard/其他节点发了 `exit/cancel`。

已做/建议修改：
- `touch_observation.launch.py` 默认 `maximum_sync_skew_sec` 统一改为 `0.25`，与 config 和 sim arm launch 一致。
- 后续建议：
  - BLOCKED 只作为可恢复状态，不应自动退出 Touch mode。
  - 在 `/touch_anything/state` 中保留最近一次 `freeze` 失败原因与各 topic stamp/skew，方便 dashboard 和 RViz 直接显示。
  - 若 Isaac D435 depth 固定落后约 0.2s，可把 sim profile 单独提高到 `0.30s`，但 real profile 保持当前实机阈值。

## P1 - Agent task 中 localization 丢失后的恢复与运动门控

现象：
- Go-to / agent task 测试中出现 `FAILED_LOCALIZATION` 后漂移。
- 定位没有恢复时不应该继续运动；恢复应优先使用丢失前一刻 pose，静止积累点云，再尝试 GICP。
- 用户已手动把 Odometry display Keep 改为 1；不要覆盖这个改动。
- 2026-09-21 复测中，即使任务开始时没有明显漂移，也出现长时间 localization check / recovery，最后才继续执行 task。

已做/建议修改：
- 之前已追加 Nav2 AUTO `/nav2/cmd_vel` localization gate：GICP score/pose 不新鲜或未稳定时强制零速度。
- 之前已调整 recovery：发布丢失前可信 pose 到 `/initialpose`，静止等待 GICP 恢复，不再一边定位失败一边移动。
- 2026-09-21 已确认一个强触发原因：NavigationAgent 每次 absolute navigation 都会插入 `check_localization_health(settle_timeout_sec=15.0)`；该检查要求 initialpose settling 结束、连续 3 个 good GICP samples、score/pose 都新鲜，warm-up 状态也会被当成不健康，随后 MissionAgent 会自动进入 `recover_localization_spin(timeout_sec=24.0)`。
- 2026-09-21 已调整：
  - `check_localization_health` 支持 `allow_warmup_pass`，当 GICP score/pose 已经新鲜且低于 warn threshold 时，不再强制等待完整 settling gate。
  - absolute navigation preflight 从 15s 改为 5s warm-up-aware check。
  - MissionAgent 只有在 `GICP_SCORE_BAD`、`GICP_TRUSTED_POSE_DIVERGENCE`、`POSSIBLE_STATIONARY_DRIFT` 等硬证据出现时才自动 recovery；普通 stale/missing/warm-up 不再重置 pose。
  - sim recovery 的 initialpose settle cap 从 6s 降到 3s。
- 后续建议：
  - 记录每次恢复尝试的 `last_good_pose_age`、`score`、`inlier_rmse`、等待点云帧数。
  - Dashboard health 中把 `FAILED_LOCALIZATION` 作为 motion hard gate 的证据显示。
  - 下次复测时观察 `/agent/mission_events` 里是否还出现无硬证据的 `recover_localization_spin`；如果仍出现，需要记录触发时的 `localization_metrics`。

## P1 - RViz 可视化干扰

现象：
- 画面上有大量红色历史箭头/轨迹堆叠，干扰判断 arm 与 base 的相对位置。
- `rviz/nav2_navigation.rviz` 和 `rviz/sim_nav2_navigation.rviz` 都会被用于测试，需要保持一致的低干扰显示策略。

已做/建议修改：
- `SO101 Preview` 默认隐藏，避免候选 arm 与 actual arm 混淆。
- `/touch_anything/markers` display depth 保持 1，只显示当前 touch 指示。
- 后续如果仍有历史箭头，需要在运行中的 RViz 确认具体 Display 名称，再把对应 display 的 Queue Size / History / Keep 设置为 1。

## P0 - Wrist Camera 低纹理目标跟踪断链

现象：
- 2026-09-21 最新 Touch Anything 测试已推进到腕相机 handoff：
  - D435 depth -> human click -> SAM -> 3D target -> FAR prepare pose 已基本可用。
  - 腕相机 SAM 能分割目标，例：绿色块 `mask_pixels=6116`、`sam_score≈0.984`。
  - 进入 `ARM TARGET` 后失败：`ARM_TARGET_REJECTED — Confirmed SAM region cannot start geometric tracking: confirmed target has only 2 usable KLT points; need 6`。
  - tracker 状态显示 `TRACKER LOST / SEMANTIC_RECOVERY_REQUIRED`。
- 目标是纯色 button/block，表面低纹理，KLT/ORB 特征点很少；这不是 operator 选择错误。

已做：
- `target_tracker.py` 新增低纹理外观/颜色 mask tracking：
  - SAM 确认 mask 后，即使 KLT 点少，也建立 Lab 色彩外观模型。
  - 后续帧优先用上一帧局部窗口 + 色彩连通域追踪，返回 `APPEARANCE_COLOR_MASK`。
  - 保留 KLT/ORB 对纹理目标的路径，不改变原有几何 tracker 成功逻辑。
- 将 rolling visual servo 的 tracker freshness 上限从 `0.20s` / `0.30s` 调整到 `0.65s`，in-flight grace 调整到 `0.35s`，适配当前 Isaac RTX + ROS 负载下腕相机约 4 Hz、偶发 0.5s 间隔的实际发布情况。底层 arm gateway 350ms watchdog、z-drop guard 和 session timeout 仍保留为独立安全保护。
- 新增 flat low-texture target 单测，覆盖纯色按钮/方块的初始化与平移追踪。
- 修复 motion tracking evidence 时间源混用：此前 dispatch 使用 wall/ROS 时间，completion 可能来自 Isaac sim time，导致出现巨大负数窗口并误判 `tracker coverage failed`；现在优先用 local monotonic 时间窗口，同时保留 ROS stamp 作为诊断字段。
- 2026-09-23 进一步推进后，rolling servo 在 FAR→NEAR 阶段触发 `CARTESIAN_Z_DROP_LIMIT: drop=0.0143m limit=0.0120m`。
  - 证据显示 tracker 连续覆盖运动窗口，`motion_tracking_evidence.continuous=true`，不是识别断链。
  - 当时上一 waypoint 的 Z 目标仍高于实际 tip 约 10mm，说明控制器正在向上修正；停止原因更像 mock/Isaac 跟随滞后超过过紧 soft guard。
  - 已改成两级 Z guard：`rolling_visual_servo_max_z_drop_m=0.012` 作为 soft guard，超过后暂停 X advance、优先追回 Z；新增 `rolling_visual_servo_hard_z_drop_m=0.035`，只有超过 hard guard 才 terminal STOP。
  - 已允许 `APPROACH_VISUAL_SERVO_STOPPED` 状态在保留 arm-camera target 时重新 plan approach step，便于调试连续推进，不必每次重新 D435/SAM 全流程。

建议：
- 下一次复测重点看 `/touch_anything/state`：
  - `target_tracker.last_result.method` 应从 `SAM_HUMAN_CONFIRMED_APPEARANCE` 进入 `APPEARANCE_COLOR_MASK`。
  - rolling servo 不应再因 KLT 点少或 0.3s 级别的正常 Isaac 相机帧间隔立刻 STOP / semantic recovery。
  - `approach_plan.motion_tracking_evidence.time_basis` 应为 `LOCAL_MONOTONIC`，且不应再出现负数 `motion_window_sec`。
  - 如果出现 `z_drop_recovery_only=true`，应看到 X advance 暂停而 Z residual 下降；若超过 `rolling_visual_servo_hard_z_drop_m=0.035` 才应 STOP。
- 若接近过程中目标颜色被 tip/阴影遮挡，后续可把外观 tracker 加入“轮廓尺寸 + 深度平面”二次约束。

### 2026-09-24 追踪频率 / action horizon 复测

现象：
- 相机频率提升后，动作肉眼上已经连续。
- 但 FAR -> NEAR 追踪仍容易丢失；用户退出 Touch mode 后手动执行到橙色/候选 arm pose，目标又重新进入腕相机视野。

实测：
- `/arm_camera/color/image_raw` 约 9.9 Hz。
- `/arm/visual_servo_state` 最后一轮显示：
  - `update_count=93`
  - `action_horizon_replan_count=93`
  - `action_horizon_length=10`
  - `action_horizon_index=1`
- 当前 rolling horizon 是 10 steps x 0.05s = 0.5s，但 tracker/camera 约 10 Hz，每约 0.1s 来一次新识别结果。

判断：
- 控制链路频率基本正常，问题不是相机太慢。
- Touch node 过于频繁地用新 tracker frame 替换整段 0.5s action horizon，controller 通常只执行到第 1 个 waypoint，剩余 8-9 个点被覆盖。
- 这会导致每轮前进量很小，arm 还没进入更好的观察位置就开始下一轮重算或停机。

已做：
- 新增 sim rolling replan gate：
  - `rolling_visual_servo_min_replan_interval_sec`
  - `rolling_visual_servo_min_replan_horizon_index`
- `touch_anything_sim.yaml` 当前设为至少约 `0.40s` 或 horizon index `8` 后才允许正常 replan。
- `touch_anything_sim.yaml` 将 continuous tracker tick 降到 `0.10s`，与 Isaac 腕相机约 `10 Hz` 的有效输入对齐，避免 25 Hz 空转消耗。
- `so101_arm_control/config/arm_mock.yaml` 将 sim/mock visual-servo watchdog 从 `0.35s` 放宽到 `0.65s`。这是为了允许 10 x 50 ms horizon 中的 8-9 个点真正执行；real hardware 配置仍保持更紧的 watchdog。
- `touch_observation_node.py` 追加 gateway terminal guard：当 arm gateway 已经 `WATCHDOG_HOLD` / `REJECTED` 并清掉 active session 时，Touch 不再继续发送旧 session 的 `visual_servo_update`，避免 `UPDATE session does not match active session` 循环。
- 安全停止条件、tracker loss、too-close、Z drop hard limit 不受这个 gate 阻挡。

后续复测期望：
- `/arm/visual_servo_state.action_horizon_index` 应能经常达到 7-9，而不是长期停在 0-1。
- `action_horizon_replan_count / update_count` 仍会增长，但增长频率应低于 arm camera frame rate，目标约 `2-3 Hz`。
- 若目标仍丢失，再调大/调小 chunk：
  - 更平滑：`min_replan_horizon_index=6`, `min_replan_interval_sec=0.30`
  - 更完整执行：`min_replan_horizon_index=9`, `min_replan_interval_sec=0.45`
  - 不能超过低层 watchdog：当前 sim/mock watchdog 是 `0.65s`，所以 replan interval 应保留明显余量。
- 注意：2026-09-24 读到的 live topic 仍是旧运行节点：`watchdog_sec=0.35`, `min_interval=0.24`, `min_horizon_index=5`。需要重启 ROS arm/touch stack 后，新参数才会生效。

## P2 - Press 成功可视反馈

需求：
- 当前 sim 中按压彩色按钮后不会像真实按钮一样变色，operator 很难判断 press 是否真的发生。

已做：
- 新增 Isaac post-play 脚本 `setup_isaac_warehouse_button_feedback.py`。
- 它监听 SO101 `touch_tip` 与四个 elevator colored button 的几何距离，触达后把该按钮材质锁成橙色。
- 脚本已挂入 `setup_isaac_real_lab_post_play.py`，后续正常执行 post-play wrapper 会自动启用。
- 2026-09-23 补充：黄色 nut 和 yellow button 拆成独立材质；button feedback 会显式重置四个按钮的 displayColor，避免 press feedback 或共享材质让其他测试物体被一起染色。

## P0 - D435 / Camera Reset / Wrist Camera 3D 点不一致

现象：
- 进入 Touch Anything 后，D435 depth 估计的目标点、camera-pose-prepare-reset 后的目标点、arm camera handoff 后的目标点之间出现明显偏差。
- 画面上 arm camera 能稳定看到目标，但 IK 认为不可达或目标点落在真实物体下方/侧方。

原因判断：
- 当前 wrist camera 只有 RGB，没有可靠 metric depth。
- 旧逻辑把 wrist image centroid 沿当前 arm-camera ray “抬升”为新的 3D tracking point，并在 approach plan 中用 wrist image 的 Y/Z correction 改写 `refined_point_base_m`。
- 这会把 D435 anchor、相机 pan/tilt 当前位姿、经验像素映射混成一个新的 3D 点；在 Isaac 里 TF/相机角度微调时，误差会累积并表现为 prepare/reset/arm-camera 三套点互相不一致。

已做：
- `touch_observation_node.py` 中 `_arm_camera_tracking_point()` 改为返回 retained D435 metric target。
- `refined_point_base_m` 保持 D435 anchor，不再被 wrist image Y/Z correction 改写。
- 新增 `visual_alignment_point_base_m` telemetry：只表示本次 stop-observe 的图像对齐目标，供调试 arm camera visual servo，不再代表全局 3D 目标。

建议：
- 下一次复测时重点比较 `/touch_anything/state`：
  - `target.point_target`
  - `target.reacquisition.observed_point_target`
  - `approach_plan.refined_point_base_m`
  - `approach_plan.visual_alignment_point_base_m`
- 前三者应接近；第四者允许随 wrist image alignment 小幅变化，但不应再反向污染全局目标。

## P2 - Dashboard / control source 风险

现象：
- Dashboard control 已恢复过一次，但曾出现自动跳回 AUTO / control source 被抢的问题。
- 用户希望默认 `/joy/source_status` 是 `PHYSICAL`，但 Dashboard ON 后必须保持 Dashboard 优先，不要因为未连接 Joy-Con 或噪声自动抢回。

建议：
- `Dashboard control ON` 应作为最高优先级锁，直到用户显式 OFF 或 emergency stop。
- Joy-Con physical input 抢权逻辑未来重新设计；当前 sim baseline 不应让未连接 Joy-Con 的虚假输入影响 mode。
- health/dashboard 需要明确显示当前 source authority、最近一次切换原因、切换来源 topic。

## 下次复测最小检查清单

启动后先确认：

```bash
source /opt/ros/humble/setup.bash
source /home/ruan-x/robot_ws/install/setup.bash
export ROS_DOMAIN_ID=20
export RMW_IMPLEMENTATION=rmw_fastrtps_cpp
unset CYCLONEDDS_URI

ros2 node list --no-daemon | sort | rg 'so101|arm_visual|robot_state|touch|gicp|nav_mode'
ros2 topic hz /arm/visual_joint_states --window 5
ros2 run tf2_ros tf2_echo arm/base_link arm/gripper_link --ros-args -p use_sim_time:=true
ros2 topic hz /camera/camera/color/image_raw --window 10
ros2 topic hz /camera/camera/aligned_depth_to_color/image_raw --window 10
ros2 topic echo /touch_anything/state --once
```

## P0 - 2026-09-24 Touch 执行慢、抖、PRESS 没有明显 X 推进

现象：
- FAR -> NEAR 的规划方向大体合理，但执行过程慢、抖、频繁停顿。
- 用户多次通过 Dashboard 的 `Execute MOCK` 手动补完动作后，下一步预测才继续推进。
- PRESS 阶段没有明显 +X 运动，仍像是在等人工确认或被 Y/Z 对齐门控拖住。
- Wrist camera 能看到并跟踪目标，但目标会因视差逐步偏离，需要 D435 retained 3D anchor 帮助每个 chunk 重新校准 shoulder pan。

确认原因：
- 当前运行中的 `/touch_observation_node` 仍是旧进程，ROS 参数读数为 `rolling_visual_servo_forward_horizon_m=0.0015`，新加参数还未声明；说明源码/配置修改后尚未重启 touch stack。
- 旧 sim 配置每个 0.5s chunk 只允许约 `1.5 mm` X 方向前进，Y/Z 每 tick 只允许 `1 mm` 修正。
- `so101_arm_control/config/arm_mock.yaml` 旧速度限制太低，底层 20 Hz mock 执行很容易滞后，表现为连续 tracking 但 motion 不连续。
- `NEAR_ALIGN` 对齐后仍会进入 `PRESS_CONFIRMATION_REQUIRED`，在 sim baseline 中会中断连续 press。

已修改：
- `touch_anything_sim.yaml`
  - `rolling_visual_servo_forward_horizon_m: 0.006`
  - `rolling_visual_servo_max_yz_step_m: 0.0025`
  - `rolling_visual_servo_z_priority_error_px: 35.0`
  - `rolling_visual_servo_x_slowdown_error_px: 18.0`
  - `rolling_visual_servo_min_replan_interval_sec: 0.30`
  - `rolling_visual_servo_min_replan_horizon_index: 6`
  - `rolling_visual_servo_auto_press_when_aligned: true`
  - 追加 D435 retained target -> shoulder pan 小补偿参数。
- `touch_observation_node.py`
  - 连续 servo 模式下，NEAR 对齐后可自动切入 PRESS，不再必须人工确认。
  - 普通 approach fallback 也允许 sim 自动 press。
  - 每个 rolling update 后根据 D435 retained target 与当前 tip 的 lateral error 给 `shoulder_pan_joint` 一个小限幅 bias，并写入 `rolling_visual_servo.d435_pan_bias` telemetry。
- `so101_arm_control/config/arm_mock.yaml`
  - mock visual-servo 最大关节速度放宽到 sim 测试值。
- `ai_operator/config/ai_operator.yaml`
  - 同步 mock arm 速度拷贝，避免后续 GPT/IK operator 启动时因配置 drift 拒绝运行。

复测要求：
- 重启 ROS arm/touch stack 后再测；无需 rebuild，因为 install 是 symlink，但旧进程不会自动加载新参数。
- 复测时确认：
  - `ros2 param get /touch_observation_node rolling_visual_servo_forward_horizon_m` 应为 `0.006`
  - `ros2 param get /touch_observation_node rolling_visual_servo_auto_press_when_aligned` 应为 `True`
  - `/arm/visual_servo_state.action_horizon_index` 应经常走到 `6+`，而不是长期停在 `0-1`
  - `/touch_anything/state` 中 `rolling_visual_servo.d435_pan_bias.applied_bias_rad` 应能看到小幅非零修正；如果方向相反，调 `rolling_visual_servo_d435_pan_sign` 为 `-1.0`

## 2026-09-25 阶段性结论：暂停继续 patch，转入下一阶段设计

当前进展：
- Isaac Sim 中的 SO101 arm、arm camera、D435/depth camera、dashboard、RViz Touch panel 已经能组成一条基本测试链。
- D435 -> target 3D point -> FAR pose -> arm-camera handoff -> wrist-camera tracking 的主流程已多次推进到 FAR/NEAR/PRESS 附近。
- 相机频率优化后，arm camera 可达到约 8-10 Hz，D435 depth 约 6 Hz；tracking 本身在目标仍在视野内时通常是可用的。
- 连续动作执行经过多轮调整后已有改善，但仍存在抖动、session mismatch、watchdog hold、rolling correction gate、PRESS recovery 等逻辑互相干扰的问题。
- 最大的结构性问题不再只是参数，而是 wrist camera 单目接近时的可观测性不足。

核心未解决问题：
- **单目腕相机视差 / 深度歧义**：arm camera 中 SAM centroid 与 tip 看起来重合，并不代表 3D 中 tip 已经对准目标。目标、tip、相机光心接近共线时，图像误差会很小，但真实 lateral/depth 偏差仍可能很大。
- **当前 2D servo 目标定义不充分**：只让 SAM center 靠近 tip 会在 block/button 接近阶段失效，尤其是 tip 遮挡目标、目标表面倾斜、目标平面与 arm 不平行时。
- **D435 与 wrist camera 的融合策略还不够稳定**：D435 可以提供额外可观测性，但现有 shoulder-pan / retained-target compensation 容易和 wrist tracking、chunk replan、IK gate 相互打架。
- **过度复杂的保护逻辑降低了调试效率**：为了兼容 real robot safety、sim mock、semantic recovery、press recovery、rolling horizon，多处 STOP / HOLD / recovery gate 会在 tracking 尚可时中断动作。

用户当前不打算追加新硬件，因此后续方向先限定在现有传感器：
- D435 / depth camera
- wrist / arm RGB camera
- TF / URDF / Isaac sim ground truth 可用于 sim debug，但 real 侧不能依赖 Isaac ground truth
- Dashboard / RViz 作为人机调试界面

### 方向 1：模板位置 + active perception

思路：
- 记录几组“期望 press 前位置模板”，例如正确 press 前 wrist camera 画面、tip 在目标边缘/下方的相对位置、目标大小/边缘方向、D435 中 target-tip 的相对位置。
- 到达模板附近后，不直接 press，而是在模板附近做小范围 active perception：
  - 小幅 pan / shoulder-pan / lateral motion；
  - 观察目标特征点、边缘、面积、mask centroid 的变化；
  - 判断当前 3D 位置是否可 press；
  - 可用则 press，不可用则根据 active perception 结果微调。

优点：
- 工程上相对可控，适合固定测试场景和固定按钮/方块形状。
- 可以充分利用当前 Isaac sim 环境做 repeatable debug。
- 能把“press 前正确视角”显式化，比单纯 `SAM center == tip` 更可靠。

局限：
- 泛化性有限，容易依赖固定目标尺寸、固定形状、固定表面和固定相机视角。
- 如果 arm 与目标所在平面不平行，或夹角每次变化，模板匹配和 active perception 的解释会变得不稳定。
- active perception 需要谨慎设计成“测量动作”，不能只是盲目 pan，否则会继续引入控制耦合。
- 对非平面目标、柔性物体、透明/反光物体会更困难。

### 方向 2：arm camera 接近阶段使用 RL / VLA

思路：
- 保留现有 baseline 作为数据采集和安全边界：
  - D435 负责给出粗 3D target；
  - FAR pose 把腕相机带到目标附近；
  - wrist camera 提供连续 RGB 观测；
  - low-level IK / mock execution 负责执行小步动作。
- 在 NEAR / PRESS 阶段用 RL 或 VLA 学习“从当前 wrist image 到下一步 arm delta”的策略。
- 训练目标可以先限定为简单 block/button press，再逐步增加姿态、平面角度、遮挡和目标形状变化。

优点：
- 更适合处理图像中难以手写规则的几何关系，例如 tip 遮挡、目标边缘、视角变化、局部接触前姿态。
- 可以学习“不要让目标出视野”“接近时保持合适视角”“press 前如何微调”的隐式策略。
- 比纯模板方案更有机会泛化到不同形状和相机/目标夹角。

局限：
- 需要稳定的数据采集、reward/成功判定、sim randomization、失败回放和安全边界。
- 如果没有明确的深度/接触/成功信号，学习方法也会遇到同样的单目不可观测问题。
- 在 real 迁移前，需要先解决 sim-to-real 的视觉差异、速度限制和安全约束。

### 当前建议的暂停点

本阶段先不继续增加 patch。保留当前代码作为“可运行但未稳定”的 sim baseline，并把主要经验沉淀为下一阶段设计输入：
- `SAM center == tip` 不是可靠 press 条件。
- wrist camera tracking 可用，但单目 tracking 不能单独解决 3D 对齐。
- D435/depth camera 是当前系统中最重要的补充可观测性来源。
- 后续如果继续规则法，应先重构成更简单的两层控制：
  - coarse 3D anchor / D435 校验；
  - wrist camera local servo / target-in-view 保持。
- 后续如果转 RL/VLA，应把现有流程用于生成 demonstration、failure cases 和 evaluation scenes，而不是继续在当前复杂 gate 上堆规则。
