# Lift 升降机构：实机配置档案

最后更新：2026-09-20
用途：记录已安装硬件、现场接线、唯一设备身份、驱动器参数、绝对位置标定和当前保护边界。本文不是安装、调试或测试操作指南。

## 1. 当前配置摘要

| 项目 | 当前记录 |
|---|---|
| 机构 | Oriental Motor EAS 电动滑台 `EASM2XF020AZAK` |
| 驱动器 | Oriental Motor `AZD-KD`，DC 24 V，脉冲列输入并带 RS-485 |
| 位置传感器 | 内置 ABZO 电池免维护绝对值传感器 |
| 官方机械行程 | `200 mm` |
| 滚珠丝杠导程 | 型号代码 `F`：`3 mm` |
| 现场坐标定义 | 下端 `0 mm`，上端 `200 mm`，向上为正 |
| 实测 ABZO 端点 | 下端 `-404 steps`，上端 `20707 steps` |
| 标定系数 | `0.009473734072 mm/step` |
| 标定偏置 | `3.827388565 mm` |
| ROS 正常移动范围 | `15–185 mm`；机械标定端点内各保留 `15 mm` |
| 主运动控制 | Arduino UNO D8/D9，经 MOSFET 5 V→24 V 接 AZD-KD CN4 的 FW/RV |
| 绝对位置监测 | 独立 Waveshare USB TO RS485 接 AZD-KD CN6/CN7，只读 Modbus RTU |
| 已识别报警 | `30h` = overload（过负荷）；端点扫描期间曾触发 |
| AZD 内部物理/软件限位 | 尚未形成可证明的 MEXE02 导出和触发记录；不能视为已确认 |

## 2. 硬件组成与连接关系

```text
运动命令链：
Ubuntu PC
  └─ USB ─ Arduino UNO
              ├─ D8 / FW / UP ─┐
              └─ D9 / RV / DOWN ─┴─ MOSFET 5 V→24 V 接口 ─ AZD-KD CN4

只读反馈链：
Ubuntu PC
  └─ USB ─ Waveshare USB TO RS485 ─ A+/B-/GND ─ AZD-KD CN6 或 CN7

执行机构链：
AZD-KD ─ 电机线与 ABZO 传感器线 ─ EASM2XF020AZAK ─ 升降支架
```

运动命令链与 RS-485 反馈链彼此独立。RS-485 只读取 AZD-KD，不替换现有 Arduino FW/RV 控制，也不与底盘 BLVD 的 RS-485 总线共用转换器。

## 3. USB 设备身份

### 3.1 本机构使用的两个 USB 设备

| 用途 | 稳定路径 | USB 身份 | 现场动态节点记录 | 软件约束 |
|---|---|---|---|---|
| Lift Arduino | `/dev/serial/by-id/usb-Arduino__www.arduino.cc__0043_03536383236351E062C1-if00` | VID:PID `2341:0043`；序列号 `03536383236351E062C1` | 2026-09-18 为 `/dev/ttyACM2` | `lift_serial_node` 校验 VID/PID，串口 `9600` |
| Lift AZD-KD RS-485 | `/dev/serial/by-id/usb-FTDI_FT232R_USB_UART_BG04PM6K-if00-port0` | VID:PID `0403:6001`；序列号 `BG04PM6K`；Linux 驱动 `ftdi_sio` | 2026-09-19 为 `/dev/ttyUSB2` | 专用于 AZD-KD，Modbus `115200, 8E1, ID 1` |

运行配置只保存 `/dev/serial/by-id/...`。`ttyACM*` 和 `ttyUSB*` 仅是当时的枚举记录，重插或重启后可能变化。

### 3.2 同机 USB 串口清单快照

下表来自 2026-09-18/19 的 `/dev/serial/by-id` 现场输出，用于防止把其他控制器误认为 Lift：

| by-id 名称 | 当时节点 | Lift 用途 |
|---|---:|---|
| `usb-1a86_USB_Single_Serial_5AE6054086-if00` | `ttyACM1` | 否 |
| `usb-1a86_USB_Single_Serial_5AE6084777-if00` | `ttyACM0` | 否 |
| `usb-Arduino__www.arduino.cc__0043_03536383236351E062C1-if00` | `ttyACM2` | 是，运动命令 |
| `usb-FTDI_FT232R_USB_UART_BG04PM6K-if00-port0` | `ttyUSB2` | 是，AZD-KD 只读监测 |
| `usb-FTDI_USB-RS485_Cable_FT7E9M3C-if00-port0` | `ttyUSB0` | 否，不得代替 Lift 专用转换器 |
| `usb-FTDI_USB__-__Serial_Converter_FT4TCWV6-if00-port0` | `ttyUSB1` | 否 |
| `usb-ROBOTIS_OpenRB-150_183098125055344E312E3120FF092507-if00` | `ttyACM3` | 否 |

## 4. 运动命令接线记录

| 信号 | PC/Arduino 侧 | 电平接口 | AZD-KD 侧 | 方向定义 |
|---|---|---|---|---|
| FW | Arduino UNO `D8` | MOSFET 模块，5 V GPIO 转 24 V 工业输入 | CN4 `FW` | UP / 上升 |
| RV | Arduino UNO `D9` | MOSFET 模块，5 V GPIO 转 24 V 工业输入 | CN4 `RV` | DOWN / 下降 |
| STOP | `D8=LOW` 且 `D9=LOW` | 两方向输入均撤销 | CN4 FW/RV 均无效 | 由驱动器内部减速停止 |

Arduino 固件身份为 `LIFT_CONTROL_V2`，源码记录在 `src/serial_transciever/arduino/lift_control/lift_control.ino`。CN4 的实际端子号、MOSFET 模块具体型号、24 V COM 极性和现场线色尚未写入现有资料，因此本文不推测这些字段。

## 5. 执行器与驱动器记录

### 5.1 EASM2XF020AZAK

| 字段 | 记录 |
|---|---|
| 系列 | Oriental Motor EAS 系列电动滑台 |
| 型号 | `EASM2XF020AZAK` |
| 尺寸代码 | `EASM2` |
| 丝杠代码 | `F`，滚珠丝杠导程 `3 mm` |
| 行程代码 | `020`，行程 `200 mm` |
| 传感器 | ABZO 电池免维护绝对值传感器 |
| 本机方向 | ABZO steps 增大对应上升 |
| 本机坐标 | 机械下端 `0 mm`；机械上端 `200 mm` |

### 5.2 AZD-KD 参数档案

以下数值来自既有系统记录；除通信项和实测状态外，本次没有保存新的 MEXE02 全参数导出文件。

| 参数号 | 项目 | 记录值 | 证据状态 |
|---:|---|---:|---|
| 20 | JOG 移动量 | `1.00 mm` | 既有项目记录 |
| 21 | JOG 运行速度 | `60.00 mm/s` | 与 ROS 速度配置一致 |
| 22 | JOG 加减速 | `0.30000 m/s²` | 既有项目记录 |
| 23 | JOG 启动速度 | `5.00 mm/s` | 既有项目记录 |
| 28 | HOME 原点复归方法 | `3-sensor` | 既有项目记录；传感器输入分配尚未证明 |
| 29 | HOME 原点复归开始方向 | `+` | 既有项目记录 |
| 15 | 机构 limit 参数 | 跟随 ABZO 设置 | 既有项目记录；内部限位值未导出 |
| 16 | 机构保护参数 | 跟随 ABZO 设置 | 既有项目记录；内部保护值未导出 |

“ABZO 已安装”只说明位置可以绝对读取，不自动证明 FW-LS、RV-LS、HOMES 或 AZD-KD 软件越界已经配置。

## 6. 绝对位置标定记录

### 6.1 标定采样

2026-09-19 手动覆盖完整上下行程后得到：

| 标定点 | 实物位置 | ABZO feedback | 说明 |
|---|---:|---:|---|
| 下端 | `0 mm` | `-404 steps` | 观测最小值；靠近端部时触发过 `30h` 过负荷 |
| 上端 | `200 mm` | `20707 steps` | 观测最大值；靠近端部时触发过 `30h` 过负荷 |
| 跨度 | `200 mm` | `21111 steps` | `20707 - (-404)` |

### 6.2 换算关系

| 项目 | 值 |
|---|---:|
| `mm_per_step` | `200 / 21111 = 0.009473734072 mm/step` |
| `offset_mm` | `404 × mm_per_step = 3.827388565 mm` |
| 位置公式 | `position_mm = feedback_steps × 0.009473734072 + 3.827388565` |
| 下端反算 | `-404 steps = 0.000 mm` |
| 上端反算 | `20707 steps = 200.000 mm` |

用户提供的下端即时样本为 `-388 steps`，按该标定等于约 `0.152 mm`。该样本中的会话观测范围为 `-404..20707 steps`，与标定锚点一致。

此换算是安装后整机的端点标定，不是根据电子齿轮理论值推算。若滑台、驱动器、ABZO 坐标预置或机械安装发生变化，应将本组数据视为失效历史记录。

## 7. 保护边界与状态证据

| 保护层 | 当前值 | 当前状态 |
|---|---|---|
| 机械额定行程 | `0–200 mm` | 官方型号数据与端点扫描一致 |
| ROS 方向保护 | `15–185 mm` | 已启用；两端各保留 `15 mm` |
| ABZO 新鲜度 | 最大 `0.5 s` | 超时停止/拒绝运动 |
| 驱动器报警门控 | `alarm == 0` | 报警时停止/拒绝运动 |
| 驱动器 READY 门控 | 启动动作时必须为 true | 未 READY 时拒绝新动作 |
| 报警/端点区人工恢复锁 | `/lift/recovery_command` | 报警清除且 READY 恢复后，或节点启动时位置已在 `15–185 mm` 外，仍须人工确认；只解锁向安全区内部的方向，不自动运动 |
| AZD 物理输入限位 | FW-LS/RV-LS/HOMES | 输入分配与实际触发尚未确认 |
| AZD 软件限位 | FW-SLS/RV-SLS | MEXE02 数值与启用状态尚未确认 |

方向保护是单向的：到达上边界时阻止继续 UP，但保留 DOWN；到达下边界时阻止继续 DOWN，但保留 UP。当前默认不使用定时撞端 homing，旧 `HOME`、`SET_MIN`、`SET_MAX` 在 ABZO 模式下不作为实机坐标来源。

`15 mm` 余量来自当前运行条件：`60 mm/s` 与 `10 Hz` 反馈对应每周期最多约 `6 mm`；按 JOG 减速度 `0.30000 m/s²`，从 `60 mm/s` 的理论制动距离约 `6 mm`，合计约 `12 mm`，再保留约 `3 mm` 给通信和执行延迟。它是 ROS 正常运动边界，不改变 `-404 / 20707 steps` 的机械端点标定。

## 8. 已记录的端点报警事件

| 字段 | 记录 |
|---|---|
| ROS 十进制值 | `48` |
| AZD 十六进制值 | `30h` / `0x30` |
| 官方含义 | `OVERLOAD` / 过负荷 |
| 发生条件 | 手动完整行程扫描、接近机械端部 |
| 恢复情况 | 使用 MEXE02“报警复位”后恢复成功 |
| 判定边界 | 不是通信错误，也不是 `66h` 硬件越界或 `67h` 软件越界 |

端点扫描后的下端样本仍记录到 `present_alarm_code=48`、`READY=false`，表示过负荷可能在再次靠端后重现。该事件支持“机械端部受力”的判断，但不能证明 AZD 内部限位有效。

2026-09-20 的再次下端事件记录为 `-394 steps = 0.0947 mm`、`alarm=0x30`、`READY=false`，当前会话观测区间为 `-404..20429 steps`。其中 `20429` 只是该次 monitor 启动后的会话最大值，并非新的机械上端，因此没有覆盖已完成全行程扫描得到的 `20707 steps = 200 mm` 标定点。

## 9. 软件与 Dashboard 对应记录

| 功能 | 当前记录 |
|---|---|
| Arduino 桥接 | `lift_serial_node`，使用稳定 Arduino by-id，9600 baud |
| AZD 读取 | `lift_abzo_monitor_node`，Modbus function 03，只读 |
| AZD 轮询 | 当前 launch 配置 `10 Hz` |
| 绝对位置 | `/lift/abzo_position_raw` 与 `/lift/abzo_position_mm` |
| 完整状态 | `/lift/abzo_state`，JSON schema version 3 |
| Dashboard 位置 | 显示 calibrated mm、raw feedback steps、command steps |
| Dashboard 驱动状态 | 显示报警代码/名称、READY、MOVE、通信状态 |
| Dashboard 电气/温度 | 显示驱动器温度、电机温度、inverter/supply voltage |
| Dashboard 保护 | 显示物理标定范围、ROS 安全范围、guard 状态和 UP/DOWN 是否允许 |
| Dashboard 恢复 | 报警复位且 READY 后显示“人工确认并恢复”；重启时若 Lift 已在端点 keep-out 区也会显示；确认只解除恢复锁，并限制为朝 `15–185 mm` 区内的方向，不发送运动命令 |

详细的 RS-485 接线、MEXE02 通信项、寄存器与实测快照见 [azd_kd_abzo_interface.md](azd_kd_abzo_interface.md)。

## 10. 资料来源

- 本地 AZD-KD 官方手册：[HM-60313J.pdf](HM-60313J.pdf)
- Oriental Motor `EASM2XF020AZAK` 产品页：<https://www.orientalmotor.co.jp/ja/products/detail?hinmei=EASM2XF020AZAK&refFlg=1>
- Oriental Motor `AZD-KD` 产品页：<https://www.orientalmotor.co.jp/ja/products/detail?hinmei=AZD-KD>
- 实机 `/lift/abzo_state` 快照与 2026-09-19 完整端点扫描
- 当前 ROS launch 与 `lift_abzo_monitor_node` 配置
