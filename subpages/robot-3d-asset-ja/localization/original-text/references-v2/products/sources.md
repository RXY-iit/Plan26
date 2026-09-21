# v003 产品资料与来源

采集日期：2026-09-20。以下文件均为原始下载，版权归相应厂家/销售方；仅作为本机器人本地研究和可视化参考，未赋予重新分发或制造授权。

## ROBOTIS XC330-M288-T

https://emanual.robotis.com/docs/en/dxl/x/xc330-m288/

官方型号与 XL/XC-330 共用 STEP，已下载。

本地：references-v2/cad/xc330.stp

## ROBOTIS XH540-W270

https://docs.robotis.com/ko/docs/dxl/model_reference/x_series/xh_series/xh540-w270/

官方 XM/H/D-540 共用 STEP，已下载。

本地：references-v2/cad/xh540.stp

## Livox MID-360

https://www.livoxtech.com/mid-360/downloads

官方机身 STEP 与 FOV STEP，已下载。机身 65 × 65 × 60 mm。

本地：references-v2/cad/mid360.stp

## EASM2XF020AZAK

https://www.orientalmotor.co.jp/ja/products/detail?hinmei=EASM2XF020AZAK&refFlg=1

官方尺寸图已下载；STEP 下载未完成（CAD 门户访问受限）。按尺寸图重建展示模型。

本地：references-v2/products/lift-dimensions.png

## BLMR5100K-GFV-B / GFS5G30FR

https://catalog.orientalmotor.com/item/op-online-components-brushless-dc-motor-components/-12-hp-200-w-1-4-hp-blm-r-type-brushless-dc-motors/blmr5100k-30fr-b

官方外形图已下载；CAD 预览返回 403，未取得 STEP。

本地：references-v2/products/drive-dimensions.jpg

## AZ IT12B-FP

https://store.shopping.yahoo.co.jp/motostyle/4950545351104.html

用户指定商品：150 × 65 × 92 mm、0.9 kg；12 V 与安装数量由操作员确认。外观按商品图重建。

本地：references-v2/products/battery-product.jpg

## STEP 几何检查限制

XH540 几何有效性检查通过。XC330 共用文件含 6 个 openShell 项、MID-360 含 1 个 openShell/noSolid/selfIntersecting 项，保留原文件，不尝试改变厂家几何；可用于外形展示，不视为封闭实体制造验证通过。详情见 references-v2/cad/validation。原始 STEP 包络使用毫米；Blender 导入转换系数 0.001。

## 信息分类

- Verified Hardware Fact：官方产品页、尺寸图、厂家 CAD、硬件文档和实机照片中能直接核查的事实。
- Design Decision / Design Rationale：安装布局、用途、选型理由及操作经验。没有对应外部资料时可以不配置 Evidence。
- Reference / Concept Information：运行配置、标定记录、历史资料与概念示意。它们不自动证明当前实机安装尺寸。

Feedback 文档与开发手绘图仅作开发沟通，不列为正式 Evidence 或 Reference。

相机测量图记录前方0.4–1.6 m、近端宽0.7 m。没有数值安装角及远端宽度；网页俯角按安装高度与两端点推算，远端宽度为概念延伸。该显示姿态未写回原始 URDF/TF。MID360 视场以传感器局部中心平面为基准：下7°、上52°、水平360°，随安装姿态一起旋转。

厂家 CAD 确认产品几何；设备安装位置、打印件壁厚与孔位仍需实测。历史硬件文档保留原文，其中旧尺寸或运行值以当前部件说明的分类为准。
