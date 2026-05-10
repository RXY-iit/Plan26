下面是你现在系统的完整整理。

# 1. 当前系统构成

```text
Ubuntu 22 PC
  ↓ USB Serial
Arduino UNO
  ↓ 5V GPIO 控制信号
MOSFET 模块
  ↓ 24V 工业输入信号
AZD-KD 驱动器
  ↓ 电机线 + Encoder 线
EASM2XF020AZAK / EAS 电动滑台
  ↓
丝杆升降机构
```

你的系统本质是：

```text
PC 不直接驱动电机
Arduino 不直接驱动电机
MOSFET 不驱动电机本体
AZD-KD 才是真正驱动电机的设备
```

---

# 2. 各部件角色

| 部件             | 作用                                      |
| -------------- | --------------------------------------- |
| Ubuntu 22 PC   | 后续运行 ROS2，发送升降命令                        |
| Arduino UNO    | 接收 PC/ROS2 串口命令，输出 GPIO                 |
| MOSFET 模块      | 把 Arduino 的 5V 控制转换成 AZD-KD 可识别的 24V 输入 |
| AZD-KD         | 东方马达驱动器，控制 EASM 电机                      |
| EASM2XF020AZAK | 带 encoder / ABZO 的闭环步进执行器               |
| EAS 滑台/丝杆      | 实际上下移动机构                                |
| MEXE02         | Windows 上的一次性调试/参数设置工具                  |

---

# 3. 硬件工作逻辑

你现在采用的是 **JOG 控制方式**，不是 Pulse/Direction 方式。

也就是说：

```text
Arduino 不发送高速 pulse
Arduino 只是控制 FW-JOG / RV-JOG 的 ON/OFF
```

工作逻辑：

```text
Arduino GPIO HIGH
↓
MOSFET ON
↓
AZD-KD 的 IN8 或 IN9 被触发
↓
驱动器执行 JOG 动作
↓
电动滑台持续移动
↓
Arduino GPIO LOW
↓
MOSFET OFF
↓
JOG 停止
```

所以现在的控制含义是：

| 信号          | 含义        |
| ----------- | --------- |
| FW-JOG ON   | 正方向连续移动   |
| RV-JOG ON   | 反方向连续移动   |
| FW/RV 都 OFF | 停止        |
| FW/RV 同时 ON | 禁止，可能导致异常 |

---

# 4. 最终线路连接方式

## 4.1 AZD-KD 主电源

```text
24V+  → AZD-KD CN1 +
24V0V → AZD-KD CN1 -
FG    → 可暂时不接，正式系统建议接地
```

---

## 4.2 电机与 Encoder

```text
EASM motor cable   → AZD-KD CN2
EASM encoder cable → AZD-KD CN3
```

注意：
之前你没接 motor cable / encoder cable 时，AZD-KD 出现 **ALARM 红灯闪 8 次**。接上 CN2 / CN3 后，绿色常亮，Alarm 消失。

---

## 4.3 AZD-KD CN4 输入端

你最终确认成功的逻辑是：

```text
Pin17 IN-COM[8-9] → 0V
Pin6  IN8/FW-JOG  → +24V 时正方向 JOG 动
Pin18 IN9/RV-JOG  → +24V 时反方向 JOG 动
```

这说明 AZD-KD 的输入不是简单短接输入，而是需要 **12–24V 工业输入信号**。

---

## 4.4 MOSFET 模块连接方式

你现在使用的是低边开关 MOSFET 模块，因此最终采用这种方式：

```text
AZD-KD Pin17 IN-COM[8-9] → +24V
AZD-KD Pin6  IN8/FW-JOG  → MOSFET OUT- / LOAD-
MOSFET VIN- / DC-        → 0V
Arduino D8               → MOSFET Signal / IN
Arduino GND              → MOSFET GND
```

如果要控制反方向，需要第二路 MOSFET：

```text
AZD-KD Pin17 IN-COM[8-9] → +24V
AZD-KD Pin18 IN9/RV-JOG → 第二个 MOSFET OUT- / LOAD-
第二个 MOSFET VIN-      → 0V
Arduino D9              → 第二个 MOSFET Signal / IN
Arduino GND             → 第二个 MOSFET GND
```

如果当前只有一个 MOSFET，只能先控制一个方向。要完整上下移动，需要：

```text
2 个 MOSFET 模块
或
2ch MOSFET / 继电器 / 光耦输出模块
```

---

# 5. 串口信息与 ROS2 计划

目前串口链路是：

```text
Ubuntu 22
↓ USB
/dev/ttyACM0
↓
Arduino UNO
```

你已经确认：

```text
Arduino IDE 可以在 Ubuntu 上传程序
Arduino 黄灯闪烁
MOSFET LED 按程序亮灭
```

说明：

```text
Ubuntu ↔ Arduino USB 通信正常
Arduino 程序正常执行
```

后续 ROS2 控制结构应该是：

```text
ROS2 topic
↓
Python ROS2 node
↓
Serial write: "UP", "DOWN", "STOP"
↓
Arduino Serial.read()
↓
GPIO D8 / D9 控制 MOSFET
↓
AZD-KD JOG
```

例如未来命令可以设计成：

```text
UP 300
DOWN 300
STOP
```

含义：

```text
UP 300   → 上升 300 ms
DOWN 300 → 下降 300 ms
STOP     → 立即停止
```

---

# 6. 到目前遇到的问题与解决过程

## 问题 1：Arduino 和 AZD-KD 的角色混淆

最初以为：

```text
Arduino 是不是 AZD-KD？
```

后来明确：

```text
Arduino = 控制器，发信号
AZD-KD = 驱动器，真正控制电机
EASM = 执行器
```

---

## 问题 2：MEXE02 是否在 Arduino IDE 里设置

明确了：

```text
MEXE02 ≠ Arduino IDE
```

| 软件          | 用途            |
| ----------- | ------------- |
| MEXE02      | 设置/调试 AZD-KD  |
| Arduino IDE | 给 Arduino 写程序 |
| ROS2        | 后续机器人系统控制     |

MEXE02 是 Windows 软件，主要用于一次性配置和调试。

---

## 问题 3：AZD-KD 报 ALARM 红灯闪 8 次

原因：

```text
当时没有接 motor cable 和 encoder cable
```

AZD-KD 是闭环系统，上电会检查电机和 encoder/ABZO。

解决：

```text
断电
接 CN2 motor cable
接 CN3 encoder cable
重新上电
Alarm 消失，绿色常亮
```

---

## 问题 4：MEXE02 JOG 可以动，但 Arduino 直接接 IN8/IN9 没反应

一开始尝试：

```text
Arduino D8 → IN8
Arduino GND → IN-COM
```

结果：

```text
Dio8 不亮
电机不动
```

原因：

```text
AZD-KD CN4 输入不是 5V Arduino GPIO 输入
而是 12–24V 工业输入
```

解决：

```text
加入 MOSFET 模块
用 Arduino 控制 MOSFET
MOSFET 再控制 24V 输入回路
```

---

## 问题 5：短接 IN8 和 IN-COM 没反应

最初以为：

```text
IN8 ↔ IN-COM 短接后应该触发
```

但实际没反应。

后来通过查资料和实测确认：

```text
AZD-KD 输入需要 12–24V 电压差
不是单纯短接
```

最终成功测试：

```text
Pin17 IN-COM[8-9] → 0V
Pin6 IN8/FW-JOG → +24V
电机正方向动
```

以及：

```text
Pin17 IN-COM[8-9] → 0V
Pin18 IN9/RV-JOG → +24V
电机反方向动
```

这一步确认了：

```text
CN4 输入正常
Pin 号正确
FW-JOG / RV-JOG 功能正常
```

---

## 问题 6：万用表测 CN4 不响，以为内部不通

后来明确：

```text
CN4 输入是光耦输入
不是内部直接短路
```

所以用蜂鸣档测：

```text
IN8 ↔ IN-COM
```

不响是正常的，不能说明内部断线。

正确判断方式应该是：

```text
通电状态下施加 24V 输入
看 MEXE02 Dio8/Dio9
或看电机是否运动
```

---

## 问题 7：MEXE02 里 5kHz 和 8kHz 速度体感差别不大

原因：

```text
JOG 加减速存在
短距离/短时间运动可能没达到目标速度
```

解决方法：

```text
看实际速度
调整 JOG 速度和加减速
不要只看设定 Hz
```

后来把单位改成 mm，更容易理解。

---

## 问题 8：单位从 step 改成 mm

一开始没有找到单位切换。

后来通过设置机构参数：

```text
机构 lead / 机械参数
```

把单位切到 mm。

现在可以用：

```text
mm/s
m/s²
mm
```

来设置 JOG，更适合机器人系统。

---

# 7. 2026-05-10 ROS2 控制实现更新

参考 `data/status-0425.md` 中的 **Update - Vertical Lift Mechanism ROS2 Control（2026-05-10）**，目前升降机构已经从“硬件验证阶段”推进到“ROS2 串口控制集成阶段”。

## 7.1 当前硬件链路

```text
Ubuntu 22 PC
  ↓ USB Serial (/dev/ttyACM0)
Arduino UNO  ← lift_control.ino
  ↓ 5V GPIO  D8(FW=UP) / D9(RV=DOWN)
MOSFET 模块
  ↓ 24V 工业输入信号
AZD-KD 驱动器（JOG 模式）
  ↓ 电机线 + ABZO 编码器线
EASM2XF020AZAK 电动滑台
  ↓
丝杆升降机构
```

AZD-KD 仍然采用 JOG 控制方式，Arduino 不输出高速 pulse，只负责控制 `FW-JOG` / `RV-JOG` 的 ON/OFF。

JOG 速度当前按 **60 mm/s** 处理，对应 AZD-KD 参数 21。

## 7.2 已确定的 ROS2 控制参数

| 参数 | 当前值 | 含义 |
|---|---:|---|
| `position_min_mm` | `0.0 mm` | 软件下限 |
| `position_max_mm` | `200.0 mm` | 软件上限 |
| `home_position_mm` | `100.0 mm` | 自动 homing 完成后的基准位置 |
| `jog_speed_mm_s` | `60.0 mm/s` | ROS2 侧用于位置推定的 JOG 速度 |
| `auto_home_on_start` | `true` | 启动 2.5 秒后自动 homing |

注意：这里的 `/lift/position` 是 ROS2 节点根据 JOG 速度积分得到的推定位置，不是 AZD-KD 直接回传的绝对位置。后续需要用实际位移校准误差。

## 7.3 已加入的实现文件

| 文件 | 内容 |
|---|---|
| `src/serial_transciever/arduino/lift_control/lift_control.ino` | Arduino 程序，接收 `UP` / `DOWN` / `STOP` 串口命令并控制 D8/D9 |
| `src/serial_transciever/serial_transciever/lift_control/lift_serial_node.py` | ROS2 串口桥接节点，包含位置推定和软件上下限 |
| `src/serial_transciever/serial_transciever/lift_control/lift_joy_node.py` | Joy-Con 按键映射节点 |
| `src/serial_transciever/setup.py` | 添加 `lift_serial_node`、`lift_joy_node` 入口 |
| `src/robot_bringup/launch/lift_control.launch.py` | 升降机构单体 launch |
| `src/robot_bringup/launch/test_all.launch.py` | 添加 `lift:=true` 默认启用选项 |
| `hardware/lift_mechanism/lift_mechanism.md` | 升降机构硬件参考文档 |

## 7.4 ROS2 Topics

| Topic | Type | 内容 |
|---|---|---|
| `/lift/command` | `std_msgs/String` | `"UP"` / `"DOWN"` / `"STOP"` / `"HOME"` |
| `/lift/position` | `std_msgs/Float32` | 推定位置 `[mm]` |
| `/lift/state` | `std_msgs/String` | 当前动作状态 |

命令含义：

```text
UP    → 上升，触发 Arduino D8 / FW-JOG
DOWN  → 下降，触发 Arduino D9 / RV-JOG
STOP  → 停止，D8/D9 全部关闭
HOME  → 执行 ROS2 侧自动 homing 流程
```

## 7.5 Joy-Con 操作

| 操作 | 按键 |
|---|---|
| 上升 UP | L1（4）+ Y（3） |
| 下降 DOWN | L1（4）+ A（0） |
| 停止 STOP | 松开按键 |

Joy-Con 按键编号需要通过下面命令确认：

```bash
ros2 topic echo /joy
```

## 7.6 启动与测试命令

单独启动升降机构控制：

```bash
ros2 launch robot_bringup lift_control.launch.py
```

全体 bringup 中启用 lift：

```bash
ros2 launch robot_bringup test_all.launch.py
```

Arduino 未连接或暂时不测试升降机构时，可以关闭 lift：

```bash
ros2 launch robot_bringup test_all.launch.py lift:=false
```

终端直接发送控制命令：

```bash
ros2 topic echo /lift/position
ros2 topic echo /lift/state
ros2 topic pub --once /lift/command std_msgs/msg/String "data: 'UP'"
ros2 topic pub --once /lift/command std_msgs/msg/String "data: 'DOWN'"
ros2 topic pub --once /lift/command std_msgs/msg/String "data: 'STOP'"
ros2 topic pub --once /lift/command std_msgs/msg/String "data: 'HOME'"
```

## 7.7 2026-05-10 动作确认结果

已经确认：

```text
ros2 launch robot_bringup lift_control.launch.py
```

可以正常启动。

启动日志中已确认：

```text
Serial opened: /dev/ttyACM0 @ 9600 baud
```

自动 homing 流程日志也已确认：

```text
DOWN
↓
到达下限
↓
STOP
↓
position = 100.0 mm
```

需要特别注意：Arduino 上必须写入 `lift_control.ino`。如果 Arduino 里仍然是原来的 Blink 程序，ROS2 串口节点即使启动成功，D8/D9 也不会按升降命令控制 MOSFET。

## 7.8 后续 TODO

- [ ] 将 `lift_control.ino` 写入 Arduino，并做实机升降动作确认
- [ ] 用 `ros2 topic echo /joy` 确认 Joy-Con 的 Y/A/L1 按键编号，必要时调整映射
- [ ] 测量实际移动距离，对比 ROS2 侧 `60 mm/s` 积分得到的位置推定误差
- [ ] 根据实际机构行程修正 `position_min_mm` / `position_max_mm`
- [ ] 确认软件上下限和 AZD-KD / 机构硬限位之间有足够安全余量
