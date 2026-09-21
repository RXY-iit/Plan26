# perception.camera.pan_tilt

## Verified Hardware Fact · 可核查事实

2 × ROBOTIS XC330-M288-T，使用官方 XL/XC-330 共用 STEP。两电机间的连接件与相机座均为黄色打印件。

## Design Decision / Design Rationale · 设计选择

依据实机照片重建双电机与打印连接件。以真实 Tilt 枢轴调整展示姿态，使相机朝向测量图0.4–1.6 m区域；既有URDF保留在 Reference 中。

## 仍待验证

打印件厚度、孔位按照片估算；图中60°/120°用于结构理解，不能等同于关节命令或新增相机标定。
