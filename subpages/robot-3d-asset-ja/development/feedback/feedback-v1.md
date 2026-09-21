整体方向已经基本正确，下面主要对 **3D 模型的外观、部件位置、真实硬件对应关系以及设计依据** 做进一步修正和补充。

## 1. 颜色规则统一

请明确区分不同类型的结构件：

- **铝制 / 金属结构件**：保持当前模型中使用的金属色。
- **3D 打印部件**：统一使用当前模型中的黄色。
- 后续新增模型时，也按照这一规则区分，不要混用颜色。

------

## 2. LiDAR 与 Holder

LiDAR 下方实际上有一个 **3D 打印 Holder** 进行支撑。

参考实机照片：

[IMG_0366.heic](https://chatgpt.com/robot-3d-asset/references/photos/real-robot/IMG_0366.heic)

请参考该图片补全 LiDAR 下方的 3D 打印支架，其颜色应使用黄色。

LiDAR 的可见范围可参考：

/Users/ruan-x/Library/CloudStorage/OneDrive-筑波大学/sharePXT/FY26/temp-data/robot-3d-asset/references/photos/LIVOX-Mid-360-LiDAR-Sensor-FIG-3.webp

LiDAR 的相对位置也需要进一步修正：

- 高度基本与前方支柱顶部一致；
- 支柱顶部先连接一个 3D 打印 Holder；
- LiDAR 安装在 Holder 上方，并相对支柱中心 **稍微靠后**；
- 同文件夹中的其他机器人整体照片也可以用于确认其真实位置关系。

### LiDAR 安装设计理由

请在设计说明中补充以下内容：

- LiDAR 主要用于机器人定位，因此需要尽可能获取周围环境信息，所以安装位置较高。
- LiDAR 当前存在一定向前倾斜角度，这是根据 Mid-360 的可见范围进行设计的。
- 设计目标是使 LiDAR 主要覆盖机器人前方约 **1.5 m 以外的环境**。
- 更近距离的障碍物感知主要交给 Depth Camera，尤其是 Local Planner 所需要的近距离环境感知。

------

## 3. Lift：EASM2XF020AZAK

Lift 使用的部件为：

**EASM2XF020AZAK**

该部件应该可以找到官方或公开的 3D 模型。

请优先参考官方模型，使当前 Lift 的外观、尺寸比例和结构更加接近真实设备。

------

## 4. Lift 驱动相关电子部件

Lift 控制部分不仅包含 **AZD-KD**，还包括：

- Arduino
- MOSFET 5 V→24 V
- RS-485
- 其他相关控制部件

不需要显示这些设备之间的详细线缆连接，但这些主要部件应该在模型中存在。

它们实际安装后的相对位置可以参考：

[IMG_0372.heic](https://chatgpt.com/robot-3d-asset/references/photos/real-robot/IMG_0372.heic)

照片左上区域可以看到这些部件安装到一起的大致状态。

实际机器人上，我使用一个 **3D 打印支架** 将这些部件集中安装，因此：

- 电子部件尽量使用更接近真实设备的模型或贴图；
- 外部固定支架使用黄色，表示 3D 打印件。

------

## 5. E-Stop 与 PC 位置

目前模型中的左右位置需要修正：

- **红色 Emergency Stop Button：左侧**
- **PC：右侧**

两者都位于距离地面约 **51.5 cm** 的上层平台。

------

## 6. 30 cm 平台上的驱动器

距离地面约 **30 cm** 的平台上安装有：

- AZD-KD
- Motor Driver
- 其他底盘相关驱动器

请根据现有实机资料调整它们的位置，使布局更接近真实机器人。

------

## 7. 底盘 Drive / Steer Motor

机器人底盘一共有 **6 个 Motor**：

- 3 个负责前进 / 后退的 Drive Motor
- 3 个负责转向的 Steer Motor

具体型号、安装位置和 ID 请参考：

[blv_r_drive_motors.md](https://chatgpt.com/robot-3d-asset/references/hardware-docs/blv_r_drive_motors.md)

[dynamixel_steer_motors.md](https://chatgpt.com/robot-3d-asset/references/hardware-docs/dynamixel_steer_motors.md)

请根据这些文件确认实际 Motor 型号。

如果网上可以找到：

- 官方 3D Model
- CAD Model
- 产品贴图

请优先使用这些资料，使当前模型更接近真实硬件。

这些 Motor 与车体之间的连接件均为 **金属结构件**，不是 3D 打印件，因此不要使用黄色。

具体位置关系可参考：

![image-20260920224710003](/Users/ruan-x/Library/Application Support/typora-user-images/image-20260920224710003.png)

------

## 8. Battery

在左右两侧、约 30 cm 平台下方分别有两个电池安装位置：

- 左侧 2 个
- 右侧 2 个
- 共计 **4 个 12 V Battery**

电池型号参考：

https://store.shopping.yahoo.co.jp/motostyle/4950545351104.html

请尽可能根据该产品的真实尺寸和外观进行建模或贴图。

------

## 9. Depth Camera Pan-Tilt 机构

Depth Camera 下方的 Pan-Tilt 运动由两个 Motor 实现。

Motor 参考：

https://e-shop.robotis.co.jp/product.php?id=502

两个 Motor 的连接关系和安装角度可参考：

/Users/ruan-x/Library/CloudStorage/OneDrive-筑波大学/sharePXT/FY26/Plan-26/media/new-camera-holder.png

/Users/ruan-x/Library/CloudStorage/OneDrive-筑波大学/sharePXT/FY26/Plan-26/media/new-camera-holder2.png

两个 Motor 之间通过 **3D 打印部件**连接，因此该连接结构使用黄色。

### Depth Camera 安装设计理由

请补充设计说明：

- 当前 Camera 的安装角度是经过实际测量后决定的。
- 正常移动时，希望 Depth Camera 可以覆盖：
  - 机器人前方近距离地面；
  - 一直到前方约 **1.7 m** 范围。
- 该 Camera 主要承担机器人近距离障碍物识别以及 Local Planner 所需环境信息。

Camera 可见范围的测量示意图参考：

FY26/Plan-26/media/camera-visiable-range.png

------

## 10. 旧 Robot Overview 页面

以下页面虽然版本较旧，但其中的机器人结构信息基本正确：

FY26/Plan-26/subpages/robot-model/robot-overview.html

其中包含：

- LiDAR Holder 的参考结构
- RealSense Camera Base 的参考结构
- 对应参考图片
- 一些相关资料链接

这些内容都可以作为当前模型修正时的参考依据。

如有必要，可以将其中使用的参考图片复制一份到当前 `robot-3d-asset` 对应目录中，用于当前网页展示和资料整理。

------

## 11. Arm 高度与 Lift 设计理由

请在设计说明中补充 Arm 和 Lift 的设计依据。

### Arm 高度

当前 Arm 安装高度是假设机器人主要操作：

**距地面约 0.9 m ～ 1.7 m**

范围内的物体。

例如：

- 按钮
- 电梯操作面板
- 桌面物体
- 人机交互目标

因此当前 Arm 与 Lift 的安装高度是根据这一目标工作范围进行设计的。

### Lift Motor

上下升降用 Motor 的选型主要依据：

- 当前机械臂自身重量
- Lift 上安装部件的总负载
- 所需升降能力

因此该 Motor 并不是任意选择，而是根据实际 Arm Load 进行选型。

------

## 12. 本地资料与新增资料的处理原则

当前项目中已有的参考资料可以继续保留。

同时，本次新增提供的：

- 图片
- Markdown 硬件说明
- 产品页面
- 官方资料
- 3D Model / CAD
- 产品贴图

都可以用于修正、补充现有本地资料。

如网上能够找到更真实、可靠的官方模型或图片，可以下载必要文件并整理到当前项目对应目录中，用于：

- 3D Model 构建
- Reference 页面
- Robot Overview 页面
- 设计依据说明
- 后续验证和展示

但应尽量保持目录结构清晰，并优先使用官方或可信来源。

------

## 最终目标

这次修改不只是让模型“看起来更像”，而是希望逐步让当前 3D Asset 能够准确表达：

**真实硬件型号

- 实际安装位置
- 金属 / 3D 打印结构区别
- 传感器可视范围
- 每个主要结构的设计理由**

因此，在现有模型基础上优先修正 **真实机器人上能够明确确认的结构和位置关系**，对于无法确认的细节不要过度猜测。
