## follower
临时端口：/dev/ttyACM1
稳定路径：/dev/serial/by-id/usb-1a86_USB_Single_Serial_5AE6054086-if00
USB：1a86:55d3 QinHeng USB Single Serial
序列号：5AE6054086

### leader USB 口：
Leader 5V：/dev/serial/by-id/usb-1a86_USB_Single_Serial_5AE6084777-if00

## 整机安装外参（安装更新后的初值，2026-09-02）

参考：

- `hardware/real-bot-figure/IMG_0176.jpg`
- `hardware/real-bot-figure/IMG_0177.jpg`
- `hardware/real-bot-figure/IMG_0179.jpg`

SO101 固定在 D435 相机底座上方的 linear motor / 升降滑块安装架上。
2026-09-02 operator 调整了机械安装，使 Arm 底座平面与地面平行。该事实只
支持将 roll/pitch 设为 0；新照片不能可靠给出新的 xyz/yaw，因此它们暂时保留
此前初值，等待双相机 ChArUco 数据和独立尺寸测量进一步校准。

当前 `base_link -> arm/world` 安装初值：

| 参数 | 初值 |
|---|---:|
| x | +0.32084 m（当前运行/标定值，重装后仍待独立尺量）|
| y | +0.01262 m（当前运行/标定值，重装后仍待独立尺量）|
| z | 随 Lift 在 `+0.8925～+1.0925 m` 变化；下端/上端分别对应离地 `1.005/1.205 m` |
| roll | 0 rad（底座平行地面）|
| pitch | 0 rad（底座平行地面）|
| yaw | -0.01532 rad（当前运行的前后方向修正）|

这些数值同时用于实际 Arm 和橙色 Preview 模型。2026-09-20 再次确认 Lift
机械行程是 `200 mm`，因此停用历史 `230 mm` 可视化跨度。沿用已直接测得的
Lift 下端 `arm/base_link` 离地 `1.005 m`，而移动机器人 `base_link` 离地
`0.1125 m`，当前动态显示范围为 `base_link Z=0.8925～1.0925 m`，对应离地
`1.005～1.205 m`。该范围描述 Arm 底座 frame，不是机械臂最高点。

当前 Z 已由标定后的 ABZO `0–200 mm` 位置动态映射；X/Y/yaw 仍是已有标定/安装
估计，并非本轮铝型材尺寸测量的结果。当前运行通过动态 mount publisher 直接发布
`base_link -> arm/world`，尚未把 Lift 展开成
`lift_base_link -> lift_carriage_link -> arm_mount_link` 的独立 URDF 几何链。
