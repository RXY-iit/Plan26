# Intel RealSense D435 — 深度カメラ

## ハードウェア

| 項目 | 値 |
|---|---|
| 型番 | Intel RealSense D435 |
| 深度方式 | 赤外線ステレオ方式 |
| 深度範囲 | 0.2–10 m（推奨 0.3–3 m） |
| カラー解像度 | 最大 1920×1080 @ 30fps |
| 深度解像度 | 最大 1280×720 @ 30fps |
| インターフェース | USB 3.0 (USB-C) |

## ROS2

| 項目 | 値 |
|---|---|
| パッケージ | `realsense2_camera`（`realsense-ros/` 内） |
| 起動ファイル | `realsense2_camera/launch/rs_launch.py` |
| 呼び出し元 | `robot_bringup/launch/bringup.launch.py` |
| camera_name / namespace | `camera` / `camera` |

主なトピック：

| トピック | 型 | 説明 |
|---|---|---|
| `/camera/camera/color/image_raw` | sensor_msgs/Image | RGB カラー映像 |
| `/camera/camera/color/camera_info` | sensor_msgs/CameraInfo | カメラ内部パラメータ |
| `/camera/camera/depth/image_rect_raw` | sensor_msgs/Image | 深度（uint16、mm） |
| `/camera/camera/depth/camera_info` | sensor_msgs/CameraInfo | 深度カメラの内部パラメータ |
| `/camera/camera/aligned_depth_to_color/image_raw` | sensor_msgs/Image | カラー画像に位置合わせした深度 |

## TF

```
base_link
└── camera_link                    ← robot.urdf.xacro 内の固定関節
    ├── camera_color_frame
    │   └── camera_color_optical_frame    ← Z 前方、X 右方、Y 下方
    ├── camera_depth_frame
    │   └── camera_depth_optical_frame
    └── camera_infra1_frame / camera_infra2_frame
```

bringup.launch.py で `base_frame_id = camera_link` を設定し、ドライバーのツリーを URDF に接続しています。

**TODO：実際の取付 xyz を測定し、robot.urdf.xacro を更新する（現在は xyz="0.22 0.0 0.05"）**

## トラブルシューティング

- `rs-enumerate-devices` — カメラが認識されているか確認
- `ros2 topic hz /camera/camera/color/image_raw` — 映像配信が動作しているか確認
- TF ツリーが途切れる場合：bringup の起動引数で `publish_tf: true` を確認
- 深度とカラーの位置合わせ：`/camera/camera/aligned_depth_to_color/image_raw` トピックを使用
- USB 帯域に問題がある場合：USB 3.x ポートを使用し、USB ハブを避ける
