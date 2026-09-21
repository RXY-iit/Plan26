# Livox MID360 — 3D LiDAR

## ハードウェア

| 項目 | 値 |
|---|---|
| 型番 | Livox MID360 |
| FOV | 水平 360°、垂直 -7°~52° |
| 測距範囲 | 0.1–40 m |
| 点群生成速度 | 約200,000 pts/s |
| IMU | 6軸 IMU 内蔵 |
| インターフェース | Ethernet (UDP) |

## ネットワーク設定

| 項目 | 値 |
|---|---|
| ホスト IP | `192.168.1.50` |
| LiDAR IP | `192.168.1.147` |
| 設定ファイル | `src/livox_ros_driver2/config/MID360_config.json` |

ポート（MID360）：
- cmd: host=56101, lidar=56100
- push_msg: host=56201, lidar=56200
- point_data: host=56301, lidar=56300
- imu_data: host=56401, lidar=56400

## ROS2

| 項目 | 値 |
|---|---|
| パッケージ | `livox_ros_driver2` |
| ノード | `livox_lidar_publisher` |
| 起動ファイル | `livox_ros_driver2/launch_ROS2/msg_MID360_launch.py` |
| 点群トピック | `/livox/lidar` (sensor_msgs/PointCloud2) |
| IMU トピック | `/livox/imu` (sensor_msgs/Imu) |
| 配信周期 | 10 Hz（設定可能） |
| xfer_format | 1 = Livox 独自点群形式 |

## TF

```
base_link
└── livox_frame    ← robot.urdf.xacro で定義した固定関節
```

ドライバーの frame_id は `livox_frame` です（起動ファイルで設定し、URDF と一致）。

**TODO：実際の取付 xyz を測定し、robot.urdf.xacro を更新する（現在は xyz="0.10 0.0 0.10"）**

## トラブルシューティング

- `ping 192.168.1.147` — LiDAR に到達できるか確認
- `ip addr` — ホストの Ethernet インターフェースに `192.168.1.50` が設定されているか確認
- RViz に点群が表示されるが回転している場合：`MID360_config.json` の extrinsic_parameter にある `roll/pitch/yaw` を調整
- 点群がない場合：ファイアウォールを確認（一時的に `sudo ufw disable`）、MID360_config.json の IP を確認
- IMU のフレームは `src/lddc.cpp` 内で `livox_frame` に固定されています
