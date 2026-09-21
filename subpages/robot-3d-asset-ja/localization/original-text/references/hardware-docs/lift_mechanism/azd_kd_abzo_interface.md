# AZD-KD RS-485 / ABZO 接口与实测档案

最后更新：2026-09-19
范围：记录 Lift 专用 USB-RS485、AZD-KD CN6/CN7 接线、通信与 MEXE02 设置、只读寄存器、现场数据和标定结果。本文不包含接线步骤、测试命令或故障处理流程。

## 1. 系统定位

AZD-KD 上保留两条独立链路：

```text
控制链：PC → Arduino UNO → MOSFET 5 V/24 V 接口 → CN4 FW/RV
反馈链：PC → Lift 专用 USB-RS485 → CN6/CN7 → AZD-KD Modbus/ABZO
```

反馈链的软件实现只使用 Modbus RTU function `03` 读取 holding registers，没有写寄存器接口。它读取 ABZO 位置、报警、READY/MOVE、温度、电压和限位状态；Lift 的实际运动仍由 CN4 的 FW/RV 输入完成。

## 2. USB-RS485 转换器实物记录

| 字段 | 实机记录 |
|---|---|
| 购买链接/ASIN | Amazon Japan `B0931565YQ` |
| 商品 | Waveshare `USB TO RS485` |
| USB/UART 芯片 | FTDI `FT232RL` |
| RS-485 收发器 | `SP485EEN` |
| 端子标识 | `A+`、`B-`、`GND` |
| 收发方向 | 自动控制，二线半双工 |
| 板载端接 | `120 Ω` |
| 防护 | TVS、浪涌/ESD 防护 |
| 隔离 | **非隔离型**；防护器件不等于电气隔离 |
| Linux VID:PID | `0403:6001` |
| USB 序列号 | `BG04PM6K` |
| Linux 驱动 | `ftdi_sio` |
| 稳定设备路径 | `/dev/serial/by-id/usb-FTDI_FT232R_USB_UART_BG04PM6K-if00-port0` |
| 动态节点快照 | 2026-09-19 为 `/dev/ttyUSB2`，不作为配置路径 |
| 专用范围 | 只连接 Lift 的 AZD-KD；不接入 BLVD 行走电机总线 |

AZD-KD 的 CN6/CN7 也不是隔离接口，所以当前连接没有 PC 与驱动器之间的 galvanic isolation。板载保护适用于当前短距离点对点链路，但不能替代隔离器件。

## 3. RS-485 接线对照表

CN6 与 CN7 是并联的 RS-485 接口，现场只需占用其中一个。当前记录的电气对照如下：

| Waveshare 端子 | 信号定义 | AZD-KD CN6/CN7 pin | AZD-KD 名称 | 连接状态 |
|---|---|---:|---|---|
| `A+` | RS-485 differential `+` | 3 | `TR+` | 已连接 |
| `B-` | RS-485 differential `-` | 6 | `TR-` | 已连接 |
| `GND` | 通信参考地 | 2 | `GND` | 已连接 |
| 无 | — | 1 | N.C. | 不连接 |
| 无 | — | 4 | N.C. | 不连接 |
| 无 | — | 5 | N.C. | 不连接 |
| 无 | — | 7 | N.C. | 不连接 |
| 无 | — | 8 | N.C. | 不连接 |

USB 的 `5 V` 不接 AZD-KD。现有 CN4 FW/RV 运动控制接线保持不变。现场线色、所用 CN6 或 CN7 的具体端口编号、RJ45 breakout 型号尚未写入记录；pin 号是当前档案的唯一接线基准。

### 3.1 端接配置

| 总线端 | 端接记录 |
|---|---|
| PC/USB-RS485 端 | Waveshare 转换器板载 `120 Ω` |
| AZD-KD 端 | SW1 No.3 与 No.4 同时 ON，启用驱动器端 `120 Ω` |
| 总线结构 | 点对点，两端端接 |
| 额外端接 | 无；未并联第三只 `120 Ω` |

## 4. AZD-KD 面板开关记录

开关值属于断电设定，重新上电后生效。当前现场配置与 Modbus 读回如下：

| 控件 | 现场设置 | 功能 | 读回证据 |
|---|---:|---|---|
| ID 旋转开关 | `1` | Modbus slave ID 1 | `id_switch_raw = 1` |
| SW1 No.1 | OFF | 与 ID=1 组合为地址 1 | SW1 组合读回值见下方说明 |
| SW1 No.2 | ON | Modbus RTU 协议 | 115200/8E1、ID1 链路已持续通信 |
| SW1 No.3 | ON | 与 No.4 成对启用端接 | 现场断电设置记录 |
| SW1 No.4 | ON | 与 No.3 成对启用端接 | 现场断电设置记录 |
| BAUD 旋转开关 | `4` | `115200 bit/s` | `baud_switch_raw = 4` |

驱动器监测寄存器在实机会话中返回 `sw1_raw = 2`。当前软件将它保留为厂家寄存器原始值，不把十进制 `2` 当成四个 DIP 位的直接 bit mask；物理 ON/OFF 状态以上述现场断电确认记录为准。

## 5. MEXE02 配置档案

### 5.1 已确认的通信配置

| MEXE02/驱动器项目 | 当前值 | 状态/依据 |
|---|---:|---|
| 通信协议 | Modbus RTU | SW1 No.2 设置及实机通信验证 |
| Slave address | `1` | ID 开关与寄存器读回一致 |
| Baud rate | `115200 bit/s` | BAUD=4 与实机通信一致 |
| Data bits | `8` | 当前 RTU 链路配置 |
| Parity | Even | `8E1` 实机通信验证 |
| Stop bits | `1` | `8E1` 实机通信验证 |
| Transmission wait time | `3.0 ms`（参数值 30） | MEXE02 确认记录 |
| Silent interval | Automatic（参数值 0） | MEXE02 确认记录 |

### 5.2 既有运行参数记录

| 参数号 | 项目 | 值 | 记录边界 |
|---:|---|---:|---|
| 20 | JOG 移动量 | `1.00 mm` | 既有系统记录 |
| 21 | JOG 运行速度 | `60.00 mm/s` | 当前 ROS 速度参数与之匹配 |
| 22 | JOG 加减速 | `0.30000 m/s²` | 既有系统记录 |
| 23 | JOG 启动速度 | `5.00 mm/s` | 既有系统记录 |
| 28 | HOME 原点复归方法 | `3-sensor` | 输入分配尚未独立确认 |
| 29 | HOME 原点复归开始方向 | `+` | 既有系统记录 |
| 15 | 机构 limit 参数 | 遵从 ABZO 设置 | 精确 limit 值未保存 |
| 16 | 机构保护参数 | 遵从 ABZO 设置 | 精确保护值未保存 |

### 5.3 尚缺少可追溯导出的项目

| 项目 | 当前档案状态 | 软件中的处理 |
|---|---|---|
| MEXE02 全参数导出文件 | 未保存到仓库 | 不根据未记录参数作推断 |
| Electronic gear / resolution | 精确值未记录 | 使用整机实测两点标定换算毫米 |
| Preset / home coordinate | 精确值未记录 | ROS 以 ABZO 端点标定为坐标来源 |
| AZD 正/反向软件 limit 值 | 未记录 | `software_limits_configured=false` |
| FW-LS / RV-LS / HOMES 输入分配 | 未确认 | `physical_limit_inputs_configured=false` |
| 传感器输入反相逻辑 | 未记录 | 不把当前 false 位当作限位硬件证明 |

因此，ROS 的 `15–185 mm` guard 是已经投入使用的软件运动保护；它不代表 AZD-KD 内部的 FW-SLS/RV-SLS 或物理限位已经启用。

## 6. 执行器与坐标基准

| 字段 | 值 |
|---|---:|
| 执行器型号 | `EASM2XF020AZAK` |
| 官方行程 | `200 mm` |
| 型号代码 `F` | `3 mm` 滚珠丝杠导程 |
| ABZO 方向 | steps 增大 = 上升 |
| 机械下端坐标 | `0 mm` |
| 机械上端坐标 | `200 mm` |

机械规格来自厂家型号，steps/mm 则来自安装后实机端点扫描。两者的来源分开保存，避免把理论分辨率当作整机标定值。

## 7. ABZO 标定数据

### 7.1 端点原始数据

| 日期 | 位置 | `feedback_steps` | 会话观测值 | 备注 |
|---|---|---:|---|---|
| 2026-09-19 | 机械下端 | `-404` | `observed_min_steps=-404` | 标定为 `0 mm` |
| 2026-09-19 | 机械上端 | `20707` | `observed_max_steps=20707` | 标定为 `200 mm` |
| 2026-09-19 | 完整跨度 | `21111` | `observed_span_steps=21111` | 完整手动移动范围 |

### 7.2 当前换算常数

| 字段 | 当前值 |
|---|---:|
| `position_mm_per_step` | `0.009473734072` |
| `position_offset_mm` | `3.827388565` |
| `calibrated_min_mm` | `0.0` |
| `calibrated_max_mm` | `200.0` |
| 变换式 | `mm = steps × 0.009473734072 + 3.827388565` |

换算来源：

```text
span_steps = 20707 - (-404) = 21111
mm_per_step = 200 / 21111 = 0.009473734072
offset_mm = 0 - (-404 × mm_per_step) = 3.827388565
```

下端即时样本 `-388 steps` 对应约 `0.15158 mm`。该差异在端点标定的约 `16 steps` 内，不改变以观测极值 `-404` 作为下端锚点的记录。

### 7.3 当前软件保护边界

| 项目 | 值 |
|---|---:|
| 标定物理范围 | `0–200 mm` |
| 软件 keep-out margin | 两端各 `15 mm` |
| 允许日常移动范围 | `15–185 mm` |
| ABZO 状态最大年龄 | `0.5 s` |
| 位置监测配置频率 | `10 Hz` |
| 运动门控 | 新鲜且已标定的 ABZO、`alarm=0`、启动时 `READY=true` |

上边界只封锁继续 UP，下边界只封锁继续 DOWN；朝安全范围内部的方向保持可用。运动中出现报警、反馈超过 `0.5 s` 未更新或继续朝越界方向移动时，Arduino 命令层进入 STOP。

`15 mm` keep-out 以当前 `60 mm/s`、`10 Hz` 和 `0.30000 m/s²` 为依据：单个反馈周期约 `6 mm`，理论制动距离约 `6 mm`，另留约 `3 mm` 给通信与执行延迟。报警发生后会锁存人工恢复状态；即使进程是在报警已由 MEXE02 清除后才重启，只要首个位置仍位于 `15–185 mm` 外，也会建立同一恢复锁。`alarm=0`、`READY=true`、ABZO 新鲜且机构停止后，Dashboard 才允许人工确认。确认不会自动运动，只在端点区解锁朝正常范围内部的单一方向。

## 8. Modbus 只读寄存器档案

| 数据 | 寄存器 | 类型/缩放 | ROS 状态字段 |
|---|---|---|---|
| Present alarm | `0x0080–0x0081` | unsigned 32-bit | `driver.present_alarm_code/hex/name` |
| Command position | `0x00C6–0x00C7` | signed 32-bit steps | `position.command_steps` |
| ABZO feedback position | `0x00CC–0x00CD` | signed 32-bit steps | `position.feedback_steps` |
| Direct I/O | `0x00D4–0x00D5` | unsigned 32-bit raw | `driver.direct_io_raw` |
| Present information | `0x00F6–0x00F7` | unsigned 32-bit | `driver.present_information` |
| Driver temperature | `0x00F8–0x00F9` | signed 32-bit × `0.1 °C` | `driver.driver_temperature_c` |
| Motor temperature | `0x00FA–0x00FB` | signed 32-bit × `0.1 °C` | `driver.motor_temperature_c` |
| Feedback counter | `0x0120–0x0121` | signed 32-bit steps | `position.feedback_counter_steps` |
| Command counter | `0x0122–0x0123` | signed 32-bit steps | `position.command_counter_steps` |
| Inverter voltage | `0x0146–0x0147` | unsigned 32-bit × `0.1 V` | `driver.inverter_voltage_v` |
| Power supply voltage | `0x0148–0x0149` | unsigned 32-bit × `0.1 V` | `driver.power_supply_voltage_v` |
| SW1 | `0x014A–0x014B` | unsigned 32-bit raw | `driver.sw1_raw` |
| ID switch | `0x014C–0x014D` | unsigned 32-bit raw | `driver.id_switch_raw` |
| BAUD switch | `0x014E–0x014F` | unsigned 32-bit raw | `driver.baud_switch_raw` |
| RS-485 reception count | `0x0150–0x0151` | unsigned 32-bit | `driver.rs485_reception_count` |
| Internal input state 1 | `0x0170` | 16-bit bit field | physical input state |
| Internal output state 1 | `0x0178` | 16-bit bit field | HOME/absolute/SLS state |
| Internal output state 2 | `0x0179` | 16-bit bit field | alarm/ready/move state |

### 8.1 内部 I/O 位映射

| Register | Bit | 软件名称 | 含义 |
|---|---:|---|---|
| `0x0170` | 12 | `fw_ls` | 正向物理限位输入 |
| `0x0170` | 13 | `rv_ls` | 反向物理限位输入 |
| `0x0170` | 14 | `homes` | HOME sensor input |
| `0x0170` | 15 | `slit` | SLIT input |
| `0x0178` | 0 | `home_end` | HOME 完成 |
| `0x0178` | 1 | `absolute_position_enabled` | 绝对位置有效/启用状态 |
| `0x0178` | 9 | `fw_sls` | 正向软件限位状态 |
| `0x0178` | 10 | `rv_sls` | 反向软件限位状态 |
| `0x0179` | 1 | `alarm_a` | Alarm A |
| `0x0179` | 2 | `alarm_b` | Alarm B |
| `0x0179` | 3 | `system_ready` | System ready |
| `0x0179` | 4 | `ready` | Ready |
| `0x0179` | 5 | `pulse_ready` | Pulse ready |
| `0x0179` | 6 | `moving` | Moving |
| `0x0179` | 7 | `information` | Information |

未确认 MEXE02 输入分配时，`fw_ls=false` 等只表示对应内部状态位当时没有置位，不能证明物理传感器存在或可用。

## 9. 现场通信与状态快照

### 9.1 上端附近快照

| 字段 | 值 |
|---|---:|
| `feedback_steps` / `command_steps` | `20491 / 20491` |
| 会话最大值 | `20707 steps` |
| Alarm | decimal `48` = `0x30` = `OVERLOAD` |
| Driver / motor temperature | `40.8 °C / 38.6 °C` |
| Inverter / supply voltage | `25.9 V / 25.9 V` |
| Successful / failed queries | `1024 / 0` |
| Consecutive failures | `0` |
| RS-485 reception count | `9346` |
| 会话轮询率 | `5 Hz` |

### 9.2 下端快照

| 字段 | 值 |
|---|---:|
| `feedback_steps` / `command_steps` | `-388 / -388` |
| 会话最小/最大/跨度 | `-404 / 20707 / 21111 steps` |
| 换算位置 | 约 `0.152 mm` |
| Alarm | decimal `48` = `0x30` = `OVERLOAD` |
| `direct_io_raw` | `2147483648` = `0x80000000` |
| Present information | `0` |
| Driver / motor temperature | `36.3 °C / 36.3 °C` |
| Inverter / supply voltage | `25.9 V / 25.9 V` |
| SW1 / ID / BAUD raw | `2 / 1 / 4` |
| Successful / failed queries | `7134 / 0` |
| Consecutive failures | `0` |
| RS-485 reception count | `15454` |
| 会话轮询率 | `5 Hz` |

### 9.3 下端快照的内部状态

| 组 | 状态 |
|---|---|
| Physical inputs | `FW-LS=false`, `RV-LS=false`, `HOMES=false`, `SLIT=false` |
| Software outputs | `HOME-END=false`, `absolute_position_enabled=true`, `FW-SLS=false`, `RV-SLS=false` |
| Runtime I/O | `ALARM-A=true`, `ALARM-B=false`, `SYS-RDY=true`, `READY=false`, `PULSE-RDY=false`, `MOVE=false`, `INFO=false` |

上述两次快照证明 RS-485 通信稳定、温度与电压可以读取，也证明 `30h` 报警时 `READY=false`。它们不证明物理/SLS 限位已经配置。

已记录 MEXE02“报警复位”曾成功清除报警；之后的下端快照又出现 `30h`，说明靠近端部后过负荷可能重新触发，不能把一次复位记录理解为问题永久消失。

### 9.4 2026-09-20 再次下端事件

| 字段 | 值 |
|---|---:|
| `feedback_steps` / `command_steps` | `-394 / -394` |
| 换算位置 | `0.0947 mm` |
| 当前会话观测最小/最大 | `-404 / 20429 steps` |
| Alarm / READY | `0x30 OVERLOAD / false` |
| 电源 | `26.0 V` |
| Driver / motor temperature | `34.1 °C / 37.6 °C` |

该会话的 `20429` 不是完整上端测量，仅表示 monitor 本次启动之后看见的最大值；机械上端标定仍采用 2026-09-19 完整扫描的 `20707 steps`。

## 10. 报警代码记录

| 十六进制 | 十进制 | 名称 | 本机状态 |
|---:|---:|---|---|
| `30h` | `48` | Overload / 过负荷 | 上下端扫描期间实测出现 |
| `66h` | `102` | Hardware overtravel / 硬件越界 | 未在本次快照观察到 |
| `67h` | `103` | Software overtravel / 软件越界 | 未在本次快照观察到 |

`30h` 不能解释为“超过软件最大值”。它表示过负荷；现场时间关系显示它与抵达机械端部有关，但报警原因仍应保留为“端部受力导致过负荷”的实测判断。

## 11. ROS 与 Dashboard 数据记录

| 项目 | 当前配置/显示 |
|---|---|
| Monitor executable | `lift_abzo_monitor_node` |
| Modbus 模式 | function `03` only，read-only |
| Serial | Lift FTDI by-id，ID 1，115200/8E1 |
| 当前配置轮询率 | `10 Hz`；端点采样会话实测为 `5 Hz` |
| Raw topic | `/lift/abzo_position_raw` (`std_msgs/Int32`) |
| Calibrated topic | `/lift/abzo_position_mm` (`std_msgs/Float32`) |
| Structured topic | `/lift/abzo_state` (`std_msgs/String`, JSON schema 3) |
| Dashboard 位置 | ABZO mm、feedback steps、command steps、标定范围 |
| Dashboard 诊断 | Link、alarm、READY/MOVE、温度、电压、查询计数 |
| Dashboard 保护 | ROS normal range `15–185 mm`、motion guard、UP/DOWN 允许状态 |
| Dashboard 恢复 | `/lift/recovery_command` 的人工确认状态；不复位 AZD 报警、不自动移动、不解锁向外方向 |
| AZD 配置标志 | `physical_limit_inputs_configured=false`; `software_limits_configured=false` |

Dashboard 中“OBSERVED”表示数据直接来自驱动器；毫米位置为实测端点标定后的 ABZO 值。“AZD 内部限位未确认”与“ROS guard 已启用”会分别显示，不互相替代。

## 12. 资料来源

- 本地 AZD-KD 官方手册：[HM-60313J.pdf](HM-60313J.pdf)，CN6/CN7、面板开关与 RS-485 章节
- Oriental Motor AZ Series 功能手册 `HM-60262-11E`：<https://www.orientalmotor.com/products/pdfs/opmanuals/HM-60262-11E.pdf>
- Oriental Motor Modbus 设置资料 `HM-60252J`：<https://www.orientalmotor.co.jp/system/files/product_detail/manual/HM-60252J.pdf>
- Oriental Motor `EASM2XF020AZAK` 产品页：<https://www.orientalmotor.co.jp/ja/products/detail?hinmei=EASM2XF020AZAK&refFlg=1>
- Oriental Motor `AZD-KD` 产品页：<https://www.orientalmotor.co.jp/ja/products/detail?hinmei=AZD-KD>
- Waveshare USB TO RS485 产品页：<https://www.waveshare.com/usb-to-rs485.htm>
- Waveshare USB TO RS485 Wiki：<https://www.waveshare.com/wiki/USB_TO_RS485>
- Amazon Japan 已购型号：<https://www.amazon.co.jp/-/en/Industrial-converter-RS485-communication-protection/dp/B0931565YQ?th=1>
- 2026-09-19 实机 `/lift/abzo_state` 快照与完整上下端扫描
