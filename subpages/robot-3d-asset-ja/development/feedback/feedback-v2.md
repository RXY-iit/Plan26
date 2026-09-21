请在上一版修改基础上，进一步进行以下修正。

## 1. 模型颜色规则

整体继续保持现有的颜色区分方式，但进一步统一：

- **铝制 / 金属结构件**：使用与真实机器人接近的**浅蓝色金属外观**，调整到尽量接近实机照片中的颜色。
- **3D 打印部件**：统一使用当前模型中的**黄色**。arm参考实际的颜色应该是浅蓝色。
- Motor、Driver、Sensor、Battery 等标准硬件尽量保留其真实产品外观和颜色。

------

## 2. 三个 Drive Motor 的安装方向

目前三个轮组的 Drive Motor 在模型中是**横向放置**，与实机不符。

真实结构中 Drive Motor 应为**纵向布置**。

请根据实机照片以及：

[blv_r_drive_motors.md](https://chatgpt.com/robot-3d-asset/references/hardware-docs/blv_r_drive_motors.md)

修正三个 Drive Motor 的安装方向和位置。

另外，当前**左前轮和右前轮 Drive Motor 使用的参考图片实际上对应的是后轮**，请重新检查参考资料并修正图片对应关系。

------

## 3. LiDAR 可见范围

LiDAR 的概念可见范围请按照 Mid-360 的实际规格重新绘制。

其垂直方向范围为：

- 以 LiDAR 中心平面为基准
- **向下约 7°**
- **向上约 52°**
- 水平方向为 **360°**

请参考：

/Users/ruan-x/Library/CloudStorage/OneDrive-筑波大学/sharePXT/FY26/temp-data/robot-3d-asset/references/photos/LIVOX-Mid-360-LiDAR-Sensor-FIG-3.webp

修正当前概念模型中的 LiDAR FOV，使其更接近参考图中的真实可视范围，而不是简单使用对称锥形范围。

------

## 4. Depth Camera 可见范围

之前提到的 **1.7 m** 是基于记忆给出的数字，不一定准确。

因此不要直接将 1.7 m 作为正式参数。

请以实际测量图中的数字为准：

file:///Users/ruan-x/Library/CloudStorage/OneDrive-%E7%AD%91%E6%B3%A2%E5%A4%A7%E5%AD%A6/sharePXT/FY26/Plan-26/media/camera-visiable-range.png

根据图片中记录的测量结果修正：

- Camera 安装角度
- 近距离可视区域
- 前方最大覆盖距离
- 网页中的相关设计说明

------

## 5. 轮组与底盘驱动器的分类

网页中的：

**「底盘控制与驱动器」**

应归属于**轮组 / Wheel Module**相关部分，而不是作为完全独立的系统分类。

驱动器的实际左右布局为：

- **ID 1、ID 2：左侧**
- **ID 3：右侧**

请根据这一关系修正模型布局和网页说明。

------

## 6. Lift 控制组件与 AZD-KD

Lift 控制相关的：

- AZD-KD
- Arduino
- MOSFET 5 V→24 V
- RS-485
- 其他相关控制部件

并不是完全分散安装。

实际结构中，它们位于 **AZD-KD 所在区域附近**，并通过一个共同的 **3D 打印托架**进行组合和固定。

请将：

**Lift 控制打印托架 + AZD-KD + Arduino + MOSFET + RS-485**

作为一个实际安装组件进行表现。

参考：

[IMG_0372.heic](https://chatgpt.com/robot-3d-asset/references/photos/real-robot/IMG_0372.heic)

3D 打印托架继续使用黄色，内部标准电子部件尽量使用其真实外观。

------

## 7. Evidence / Reference 的使用原则

请重新整理网页中的 Evidence 表达方式。

### 可以作为 Evidence 的内容

优先使用：

- 官方产品页面
- 官方 Datasheet
- 官方 CAD / 3D Model
- 官方规格图
- 实机照片
- 硬件说明文档
- 可以直接验证型号、尺寸或结构的可靠网页

如果某个部件没有适合的图片，不需要强行加入图片。

可以直接将**官方产品链接或规格链接本身作为一条 Evidence**。

### Feedback 文件

**Feedback 文件本身不能作为 Evidence。**

Feedback 文件只是开发过程中整理信息的辅助资料。

如果其中包含：

- 官方产品链接
- Datasheet 链接
- 原始图片来源
- 官方 CAD 来源

则可以使用其中的**原始链接作为 Evidence**，但不要引用 Feedback 文件本身作为证据来源。

### 手绘图

**image-20260920224710003.png**

属于我为了说明部件位置和结构关系而制作的手绘示意图。

它只用于向你传递设计信息，**不能作为正式 Evidence**。

可以根据其中表达的位置关系修正模型，但不要：

- 在网页 Evidence 中引用它；
- 将其描述为设计依据；
- 将其作为正式参考资料展示。

------

## 8. Evidence 不需要覆盖所有内容

不需要为了提高“证据覆盖率”而给所有设计说明强行配置 Evidence。

原则是：

**有可靠来源时引用，没有可靠来源时可以不放。**

例如：

- 硬件型号 → 可以使用官方产品链接；
- Sensor FOV → 可以使用官方规格图；
- 实机位置 → 可以使用实机照片；
- 我根据实际使用经验决定的安装位置 → 可以作为设计说明，不一定需要外部 Evidence。

网页中的 Evidence 应以**准确性和可追溯性**为优先，而不是单纯追求数量。

------

## 9. 整体表达原则

最终网页中请明确区分三类信息：

**Verified Hardware Fact**
由官方资料、硬件文档或实机照片能够直接确认的信息。

**Design Decision / Design Rationale**
根据机器人实际用途、可视范围、操作范围、负载等因素做出的设计选择。

**Reference / Concept Information**
用于帮助理解模型位置和结构的信息，但不一定构成正式 Evidence。

不要把这三类信息混在一起，也不要为了补充 Evidence 而把手绘图、Feedback 文件等辅助资料作为正式依据。
