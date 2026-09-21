# perception.lidar.mid360

## Verified Hardware Fact · 可核查事实

Livox 官方 STEP，机身 65 × 65 × 60 mm（不含突出连接器）；FOV 相对局部中心平面水平360°、向下7°、向上52°。

## Design Decision / Design Rationale · 设计选择

安装设计：位于1330 mm顶梁打印holder上，稍靠柱中心后方。操作员确认：LiDAR 用于定位，高位获取周围环境；根据 MID-360 的视场向前倾斜，目标感知前方约 1.5 m 以外环境。更近的障碍物与 Local Planner 感知交给 Depth Camera。

## 仍待验证

30°沿用旧运行记录，实际倾角和安装原点仍待复测；当前点云覆盖不是几何示意可以证明的。旧运行 TF 保留为历史对照，未修改原始 URDF。
