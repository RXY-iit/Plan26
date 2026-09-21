# perception.camera.d435

## Verified Hardware Fact · 可核查事实

测量图记录：机器人前方近端 0.4 m、远端 1.6 m，近端宽 0.7 m。图中没有给出数值安装角或远端宽度。

## Design Decision / Design Rationale · 设计选择

相机为近距离地面、障碍物识别和 Local Planner 提供信息。显示俯角结合参考安装高度和0.4–1.6 m端点推算；原始运行TF保持不变。

## 仍待验证

该角度是展示推算，不是图中直接测得的标定值。远端宽度仅为概念延伸，不能视作测量。需要当前内参与精确距离起点才能验证完整覆盖。
