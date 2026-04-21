# Joy-Con 控制电机运动说明（基于快照 20260407_143156）

## 1) 发生了什么

当你使用 Joy-Con 控制小车时，消息链路如下：

1. `joy_node` 发布 `/joy`（`sensor_msgs/msg/Joy`）
2. `teleop_twist_joy_node` 订阅 `/joy`，发布 `/cmd_vel`（`geometry_msgs/msg/Twist`）
3. `cmd_vel_to_motor_node` 订阅 `/cmd_vel`，转换并发布：
   - `/drive_vel`（`my_messages/msg/DriveMotor`）
   - `/steer_angle`（`my_messages/msg/SteerMotor`）
4. `steer_motor_node` 订阅 `/steer_angle`，发布 `/set_position`（`dynamixel_sdk_custom_interfaces/msg/SetPosition`）
5. `read_write_node` 订阅 `/set_position`，将位置指令写入电机

## 2) 消息发送到哪里

- `/joy`: `joy_node` -> `teleop_twist_joy_node`
- `/cmd_vel`: `teleop_twist_joy_node` -> `cmd_vel_to_motor_node`
- `/drive_vel`: `cmd_vel_to_motor_node` -> `my_sub_2`（调试/观测）
- `/steer_angle`: `cmd_vel_to_motor_node` -> `steer_motor_node`
- `/set_position`: `steer_motor_node` -> `read_write_node`（实际写舵机）

## 3) 与 Joy-Con 映射相关的关键参数

来自 `/teleop_twist_joy_node` 参数：

- `axis_linear.x = 1`
- `axis_angular.yaw = 3`
- `enable_button = 4`
- `enable_turbo_button = 5`
- `require_enable_button = True`
- `scale_linear.x = 0.4`
- `scale_angular.yaw = 0.4`
- `scale_linear_turbo.x = 1.0`
- `scale_angular_turbo.yaw = 0.6`

来自 `/joy_node` 参数：

- `deadzone = 0.3`
- `autorepeat_rate = 20.0`

## 4) 消息内容示例

### 4.1 Joy 原始输入示例

```yaml
# topic: /joy
# type: sensor_msgs/msg/Joy
axes:    [0.0, 0.8, 0.0, -0.5, ...]
buttons: [0, 0, 0, 0, 1, 0, ...]
```

含义：

- `axes[1] = 0.8` -> 前进输入
- `axes[3] = -0.5` -> 转向输入
- `buttons[4] = 1` -> 使能键按下

### 4.2 转换后的速度指令（普通档）

```yaml
# topic: /cmd_vel
# type: geometry_msgs/msg/Twist
linear:
  x: 0.32    # 0.8 * 0.4
  y: 0.0
  z: 0.0
angular:
  x: 0.0
  y: 0.0
  z: -0.2    # -0.5 * 0.4
```

### 4.3 转换后的速度指令（Turbo）

```yaml
# topic: /cmd_vel (turbo)
# type: geometry_msgs/msg/Twist
linear:
  x: 0.8     # 0.8 * 1.0
angular:
  z: -0.3    # -0.5 * 0.6
```

### 4.4 电机侧消息

- `/drive_vel` 和 `/steer_angle` 是自定义消息（`my_messages/msg/DriveMotor`, `my_messages/msg/SteerMotor`）
- 该快照记录了拓扑和参数，没有记录每条消息的实时 payload
- 要给出字段级精确样例，需要对应 `.msg` 定义文件或运行时 `ros2 topic echo`

## 5) 快照中看到的异常点

- `cmd_vel_to_motor_node` 在节点列表中出现两次
- `/cmd_vel`、`/drive_vel`、`/steer_angle` 的连接也出现重复记录

这通常意味着：

- 同名节点可能被启动了两次，或
- 快照采集时存在重复项

如果同名节点真的在同时运行，可能导致控制命令重复发送。