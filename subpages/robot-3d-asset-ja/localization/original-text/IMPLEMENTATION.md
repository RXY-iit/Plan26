# Robot Atlas · v003 交付说明

更新日期：2026-09-20。

## 打开与文件

双击 `启动预览.command`，或执行 `python3 serve.py`。浏览器通过本机服务器打开 `web/`。可编辑主文件为 `blender/robot_master_v003.blend`。v001 / v002 保留，原始 `references/` 快照未改写。全部网页脚本和展示网格随包保存，不依赖 CDN。

## 本轮修订

- 结构金属使用浅蓝色金属外观；SO101 臂体浅蓝色；打印支架黄色；标准设备保留产品外观。
- 三台 Drive 的纵向长轴竖直布置，输出轴对齐轮轴。后轮 ID1、左前 ID2、右前 ID3 的铭牌照片逐项对应，不再共用后轮照片。
- 三台 BLVD-KRD 分别可选并归入轮组；ID1/2 在左侧（+Y），ID3 在右侧（−Y）的300 mm平台。
- AZD-KD、Arduino、MOSFET 5 V→24 V、RS-485 共用黄色打印托架；爆炸展示保持这个装配单元的组合关系。
- MID360 以传感器局部中心平面为基准，下7°、上52°、水平360°，随安装姿态旋转。显示半径仅用于示意，不是量程。
- D435 采用测量图记录的前方0.4–1.6 m、近端宽0.7 m。安装俯角由参考高度和端点推算，远端宽度为概念延伸；未修改原始运行 URDF/TF。地面边界在装配状态显示。
- 正式 Evidence 仅列可核查的产品来源、硬件文档、实机照片。运行记录与概念示意单列 Reference；设计说明可没有外部证据。反馈与开发手绘图移入开发归档，不在页面展示。

## 模型与验证边界

37个可选组件。Lift机械行程0–200 mm，日常软件区间15–185 mm；SO101底座模型端点离地1005/1205 mm。机械臂0.9–1.7 m是目标物高度设计范围，不能等同于已验证可达包络。

MID360、XH540、XC330使用官方STEP；SO101与D435使用原始网格。Lift和Drive按官方尺寸图重建。支架孔位、厚度及精确安装位置仍待复测。XH540的STEP几何检查通过；XC330含6项开放壳体，MID360含1项开放壳体/自交，保留原始厂家几何，不作为封闭加工实体合格声明。详见 `references-v2/products/sources.md` 与 `references-v2/cad/validation/`。

`node web/validate-assets.mjs` 检查两级GLB的组件、坐标、分层爆炸及复位、六轴参考姿态、Lift端点、材料、轮组竖直方向、控制板左右位置、托架装配、证据路径和资源哈希。报告位于 `data/validation-report.json`。原始参考快照的完整性由 `data/reference-integrity.json` 记录。

验证不包含真实机器人运动、负载、碰撞或感知覆盖实测。CAD查看器是额外本机进程；随包静态检查快照无需该进程。

## 重建

`blender/scripts/prepare_v003.py` 从v002数据归档准备当前资料。`blender/scripts/build_robot.py` 构建Blender场景、两级GLB和渲染图。

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python blender/scripts/build_robot.py
node web/validate-assets.mjs
```

厂家STEP转换环境 `.cad-venv` 不放入便携包；Blender重建所需STL已在 `blender/derived/` 中提供。
