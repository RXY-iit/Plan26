> **v003 已更新**：双击 `启动预览.command` 查看；Blender 主文件为 `blender/robot_master_v003.blend`。本轮修订、来源与限制见 [IMPLEMENTATION.md](IMPLEMENTATION.md)。v001 / v002 保留。

> 成品、使用方法、验证结果与几何限制见 [IMPLEMENTATION.md](IMPLEMENTATION.md)。以下内容保留原始工作包说明。

# Robot 3D 资产与交互式硬件说明工作包

建立日期：2026-09-20

本目录用于把当前实机整理成：

1. 可在 Blender 中维护的整机装配模型；
2. 可切换正常装配与爆炸视图的 Web 3D 资产；
3. 可点击零件并查看型号、尺寸、安装关系、设计理由与证据的交互式硬件说明。

## 当前资料是否足够

结论：**足够开始第一版结构占位模型，不足以直接完成尺寸可信的整机数字资产。**

目前已经具备：

- 整机简化 URDF 与主要 TF 关系；
- SO-ARM101 的完整 STL 组合与关节 URDF；
- RealSense D435 网格；
- Livox MID360 的官方外形尺寸级简化模型；
- Lift、驱动电机、转向电机、相机、LiDAR、急停等硬件记录；
- Lift 的具体型号、200 mm 行程、ABZO 标定与安装后的运行数据；
- SO-ARM101、Lift 和整机斜视照片，以及驱动器/减速机铭牌照片；
- Pan/Tilt 与 Arm/Camera TF 的标定记录。
- 实测 `700 × 600 mm` 水平 frame 包络、`300/515/620/1330 mm` 结构上平面高度；
- 主结构 4040、前方 Arm/Camera/LiDAR 垂直支架 2020 型材规格。

仍然缺少的关键资料包括：

- 各根 4040/2020 的切割长度、连接方式，以及安装板、Lift 支架、Pan/Tilt 支架的完整尺寸与 CAD；
- 整机六面正交照片、带标尺局部照片和遮挡区域照片；
- 各电机、轮组、控制器、电源、计算机、接插件和线束的准确安装位置；
- 所有自制/3D 打印件的原始 CAD、打印参数和版本；
- 部分硬件的具体型号，以及 Pan/Tilt 轴心、机械限位和视场覆盖的设计依据；
- MID360 的准确安装原点和倾角，以及各测得 frame 高度与具体结构层的名称对应。

详细缺口见 [MISSING-INFORMATION.md](MISSING-INFORMATION.md)。

## 简要流程

1. **冻结证据**：保存现有文档、URDF、网格、照片和标定记录的只读快照。
2. **补测 P0 尺寸**：先补整机坐标系、外廓、轮轴、Lift、Pan/Tilt 和 Arm 安装基准。
3. **Blender 分层建模**：先做尺寸正确的块模型，再替换成设备网格与自制件细模。
4. **建立装配语义**：每个可点击/可爆炸的部件使用稳定 `component_id`、原点与父子关系。
5. **制作爆炸视图**：保存装配位姿和爆炸位姿；爆炸只改变展示 transform，不改变真实装配数据。
6. **Web 导出**：导出优化后的 GLB，并用 `data/components.json` 关联热点、说明、证据和设计理由。

## 目录

```text
robot-3d-asset/
├── README.md                       本文件
├── GUIDELINE.md                    建模、爆炸图和 Web 交互规范
├── COMPONENT-INVENTORY.md          当前部件与证据盘点
├── MISSING-INFORMATION.md          后续需要逐项补全的清单
├── MEASUREMENTS.md                 当前实机尺寸基线
├── PORTABILITY-CHECK.md            独立复制所含/所缺资料
├── DESIGN-NOTE-TEMPLATE.md         单个部件设计思路记录模板
├── SOURCE-MANIFEST.md              复制来源与快照边界
├── data/
│   ├── README.md                   结构化数据约定
│   ├── components.json             Web/Blender 共用的初始部件目录
│   └── physical-measurements.json  机器可读尺寸
├── blender/
│   └── README.md                   Blender 文件与命名约定
├── web/
│   └── README.md                   GLB 与交互数据导出约定
└── references/                     从现有工程复制的只读证据快照
    ├── hardware-docs/
    ├── urdf/
    ├── meshes/
    ├── photos/
    ├── calibration/
    ├── runtime-config/
    └── licenses/
```

## 从哪里开始

1. 先阅读 [GUIDELINE.md](GUIDELINE.md) 的“事实、估算和设计说明分层”。
2. 按 [MISSING-INFORMATION.md](MISSING-INFORMATION.md) 的 P0 项补拍和补测。
3. 每取得一组数据，就更新 [COMPONENT-INVENTORY.md](COMPONENT-INVENTORY.md) 和 `data/components.json`。
4. 第一版 Blender 文件建议命名为 `blender/robot_master_v001.blend`。

## 数据原则

- `references/` 是 2026-09-20 的证据快照，不在其中直接修正内容。
- 修正后的结论写入本目录顶层文档和 `data/components.json`，并注明证据来源与日期。
- 实机测量优先于照片估算；当前运行配置优先于废弃历史值；URDF 不自动等同于真实 CAD。
- 未确认的数据必须标记为 `unknown`、`estimated` 或 `conflict`，不能为了模型完整而伪造精确值。
- 爆炸距离和网页动画参数是展示数据，不得反写成机械装配尺寸。
