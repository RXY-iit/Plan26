# 当前部件与 3D 证据盘点

v003 更新：本表保留初始盘点；当前 37 个部件、厂家 CAD 和 Evidence / Reference 分类以 `data/components.json` 为准。

本表是 2026-09-20 的起始盘点。`可用`表示已有网格或足以生成规则几何，不表示已验证安装尺寸。

| component_id | 部件 | 数量 | 已有几何/证据 | 当前可用信息 | 主要缺口 |
|---|---|---:|---|---|---|
| `robot.root` | 整机 | 1 | 简化 URDF、3 张实物照、实测标注 | ROS 坐标方向、主要系统组成、底部水平包络 `700×600 mm` | 六面照片、最大动态包络、整机版本定义 |
| `base.frame` | 铝型材底盘/门架 | 1 | 照片、实测尺寸、URDF box | X=`700 mm`、Y=`600 mm`；上平面 `300/515/620/1330 mm`；4040/2020 | 三个高度层名称、每根长度、连接件和面板 CAD |
| `base.panel` | 底板/安装板 | 多 | 照片 | 可见多层安装板 | 材料、厚度、外形、孔位 |
| `mobility.wheel.front_left` | 左前轮 | 1 | URDF cylinder、照片 | 位置约 `(206.4, 248.9) mm`；R=112.5 mm | 轮胎/轮毂真实 CAD 与轴向 |
| `mobility.wheel.front_right` | 右前轮 | 1 | URDF cylinder、照片 | 位置约 `(206.4, -248.9) mm`；R=112.5 mm | 同上 |
| `mobility.wheel.rear` | 后轮 | 1 | URDF cylinder、照片 | 位置约 `(-385, 0) mm`；R=112.5 mm | 同上 |
| `mobility.drive` | BLV-R 驱动电机 | 3 | 型号文档、铭牌照片 | `BLMR5100K-GFV-B` 部署记录 | 电机铭牌和厂家 CAD/尺寸图 |
| `mobility.gearhead` | 减速头 | 3 | 铭牌照片 | `GFS5G30FR` 已从实物确认 | CAD、输出法兰与轮毂连接 |
| `mobility.drive_driver` | 驱动器 | 3 | 铭牌照片、详细记录 | `BLVD-KRD`、ID 1/2/3 | 底盘内准确位置与安装方向 |
| `mobility.steer` | 转向伺服 | 3 | 通信实测与型号映射 | `XH540-W270`、ID 11/12/13 | 真实外形、安装支架与轴心 |
| `perception.lidar.mid360` | 3D LiDAR | 1 | 参数化 URDF 几何 | Φ70.4 × 65 mm、265 g、FOV | 安装坐标/倾角冲突、支架尺寸 |
| `perception.camera.d435` | 深度相机 | 1 | DAE、厂家 URDF、标定记录 | Intel RealSense D435 | 实机序列号、holder CAD、最终轴心关系 |
| `perception.camera.pan_tilt` | Pan/Tilt 机构 | 1 | 动态 URDF/标定、照片部分可见 | 两轴 TF、运行 pose/scan pose | 电机型号、支架 CAD、真实限位、设计依据 |
| `lift.stage.eas` | 电动滑台 | 1 | 型号、手册、照片、标定 | `EASM2XF020AZAK`、200 mm、3 mm lead | 厂家 STEP/尺寸图、整机安装基准 |
| `lift.driver.azd_kd` | Lift 驱动器 | 1 | 手册、接线和照片局部 | `AZD-KD`、24 V、ABZO | 底盘内位置、外形网格、散热空间 |
| `lift.control.arduino` | Lift Arduino | 1 | USB 身份/接线记录 | Arduino UNO、固定 USB ID | 安装位置、外壳和端子布局 |
| `lift.monitor.rs485` | Lift RS485 转换器 | 1 | 型号/USB 身份/接线记录 | Waveshare USB TO RS485、FT232RL | 安装位置、板卡/外壳外形 |
| `arm.so101` | SO-ARM101 | 1 | 完整 STL、URDF、照片 | 6 × STS3215、关节层级 | 与 Lift 的最终安装 transform |
| `arm.camera.wrist` | 腕部相机 | 1 | URDF box、标定记录、照片 | Sonix USB2.0 CAM1、已标定内参 | 外壳 CAD、准确实物型号/板卡尺寸 |
| `arm.mount` | Arm/Lift 转接组件 | 1 | 实物照片 | 安装在 Lift 滑块；底座平行地面 | 所有打印件/型材尺寸和 CAD |
| `safety.estop` | 红色停止按钮 | 1 | 整机照片、运行逻辑文档 | 作用到 3 台 BLVD 的 DIN3/FREE | 按钮型号、安装孔、完整安全回路 |
| `electrical.openrb150` | OpenRB-150 | 1 | USB 身份/系统记录 | Pan/Tilt/线性机构控制板 | 安装位置、外壳和接线外观 |
| `electrical.nuc` | 控制计算机 | 1 | 主机名与照片线索 | NUC13ANH-B 主机环境 | 精确 SKU、安装位置、外形和接口方向 |
| `electrical.power` | 电源与配电 | 多 | 整机照片 | 24 V 系统存在 | 型号、容量、位置、配电拓扑 |
| `cables.main` | 主线束 | 多 | 实物照片 | 可见 USB、电机、传感器线束 | 路由、端点、接插件和正式固定方案 |

## 可直接复用的几何

- `references/meshes/so_arm101/`：SO101 的结构件、电机和夹爪 STL。
- `references/meshes/realsense/d435.dae`：D435 外观网格。
- `references/urdf/robot_description/livox_mid360.urdf.xacro`：可在 Blender 中重建 MID360 的圆柱/球体近似。
- `references/urdf/robot_description/robot.urdf.xacro`：轮径、三轮位置和当前传感器 TF 的起始参考。

## 只能作为位置/关系参考的资料

- `robot.urdf.xacro` 的底盘是单个 box，不是实际铝型材装配。
- 轮组只是 cylinder，没有转向、电机、减速头和支架几何。
- Pan/Tilt 只有 link/joint 和标定 transform，没有设备外观。
- Lift 未进入整机 URDF；Arm 通过独立运行节点发布动态安装 TF。
- 实物照片有明显透视和遮挡，不能直接读取精确长度。

## 当前结论与仍保留的冲突

| 项目 | 来源 A | 来源 B | 处理 |
|---|---|---|---|
| 底盘尺寸 | 2026-09-20 实测 `700×600 mm`，多个高度平面 | URDF property `670×600×580 mm` 单 box | 实测为建模基线；URDF box 仅是旧简化模型 |
| MID360 X/Z | 注释 `-0.240/0.6875 m` | 运行 property `+0.240/1.38 m` | 标记 `conflict`，P0 实测 |
| Lift/Arm span | 当前执行器与 ABZO `200 mm` | 历史 Arm visual mount `230 mm` | 已统一为 200 mm；上端 base_link Z=`1.0925 m` |
| Frame 高度命名 | 蓝色实测 `300/515/620/1330 mm` | 单张斜视图不能唯一命名前三层 | 尺寸有效；前三层 component 名称待操作者确认 |
