# 独立复制检查

v003 状态补充：Blender 主文件、两级 GLB、Three.js 本地依赖和网页现已包含，可通过 `serve.py` 独立预览。XC330/XH540/MID-360 官方 CAD、驱动电机和 Lift 尺寸图、Pan/Tilt 型号及新增相机测量图已补入 `references-v2/`；下方“仍缺少”保留为初始快照清单，不代表当前缺失状态。原始标定图像、自制件精确孔位和未独立测量的安装尺寸仍未补齐。

目标：只复制整个 `robot-3d-asset/` 到另一台机器，也能开始 Blender 建模和 Web 资产整理。

## 已包含

- 最新实机尺寸：`MEASUREMENTS.md` 与 `data/physical-measurements.json`；
- 硬件文档、Lift/AZD-KD 手册、ABZO 标定和 USB 身份；
- 3 张整机照片、6 张驱动器/减速机照片；
- SO101 全套现有 STL、关节 URDF 和许可证；
- D435 DAE、plug STL、URDF 和 NOTICE；
- MID360 参数化外形、当前配置和定位配置；
- Pan/Tilt、D435、Arm、腕部相机的标定文档、求解 JSON 和相机内参；
- 当前 camera scan poses、Nav2/D435 local costmap 配置；
- 当前 Lift → Arm 动态高度映射配置；
- 已展开并使用相对 mesh 路径的移动机器人/SO101 URDF；
- Blender/Web 的命名、层级、爆炸图和 component ID 规则。

## 不依赖原 robot_ws 的入口

- 结构尺寸：`MEASUREMENTS.md`
- 机器可读尺寸：`data/physical-measurements.json`
- 部件目录：`data/components.json`
- 移动机器人展开 URDF：`references/urdf/expanded/robot_runtime_simplified.urdf`
- SO101 展开 URDF：`references/urdf/expanded/so_arm101.urdf`
- 网格：`references/meshes/`

展开 URDF 内没有 `/home/...`、`package://` 或 `file://` mesh URI。

## 当前仍缺少，复制目录也不会自动拥有

- 本轮橙/蓝尺寸标注图的原始二进制文件；尺寸已完整转录，但原图需人工放入指定目录；
- 最初两张爆炸图风格参考的原始文件和许可信息；
- 底盘、安装板、轮组支架、Lift/Arm 转接件、Pan/Tilt 支架的 STEP/STL/CAD；
- BLV-R 电机/减速头、XH540、EASM2 滑台、AZD-KD 等厂商 CAD；
- Pan/Tilt 电机的具体型号与外形；
- 4040/2020 每根下料长度和连接表；
- 完整线束、控制器、电源和 NUC 安装坐标；
- 130 组原始双相机标定图像。已复制求解结果，普通 Blender 建模不需要原始图像；只有重新求解外参时才需要。

## 外部软件不随目录复制

- Blender 和 URDF/glTF 导入插件；
- Web 构建工具链，例如 Node.js、Three.js 或 React；
- 可选的 Draco/meshopt 压缩工具。

这些属于执行环境，不是机器人证据资产。具体版本应在真正开始 Blender/Web 工程时锁定。
