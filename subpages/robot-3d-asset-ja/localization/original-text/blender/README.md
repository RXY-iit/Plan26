# Blender 工作区

当前主文件为 `robot_master_v003.blend`，由 `scripts/build_robot.py` 构建，网页导出位于 `../web/`。下列 v001 文件名是最初的规划记录；历史场景保留，不作为当前入口。

建议文件：

- `robot_master_v001.blend`：唯一主场景；保留高质量层级与材质；
- `robot_review_v001.glb`：阶段审阅导出；
- `scripts/`：后续如需自动导入 URDF、批量命名或导出，可在此新增脚本。

开始设置：Metric、Unit Scale `1.0`、Length `Meters`，坐标采用 X 前、Y 左、Z 上。

禁止直接修改 `../references/meshes/` 中的源网格。导入后产生的清理版网格保存在 Blender 文件内，或另存到本目录的 `derived/`，并记录来源与缩放。

无 ROS 环境时可直接从以下展开文件导入：

- `../references/urdf/expanded/robot_runtime_simplified.urdf`
- `../references/urdf/expanded/so_arm101.urdf`

其中移动机器人 URDF 的底盘 box 是运行占位，必须按 `../MEASUREMENTS.md` 用 4040/2020 重新搭建。

对象命名、Collection 和爆炸 transform 规则见 [../GUIDELINE.md](../GUIDELINE.md)。
