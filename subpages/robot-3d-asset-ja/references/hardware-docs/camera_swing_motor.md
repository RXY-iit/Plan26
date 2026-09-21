# カメラ首振りモーター

## ハードウェア

| 項目 | 値 |
|---|---|
| 機能 | カメラのピッチを制御し、運用中に上下へ傾ける |
| コントローラー | Robotis OpenRB-150 マイコンボード |
| インターフェース | USB シリアル → `/dev/ttyACM*`（同じ基板の直動モーターと共用） |
| 通信 | `serial_transciever` パッケージによる独自シリアルプロトコル |

## ROS2

| 項目 | 値 |
|---|---|
| パッケージ | `serial_transciever` |
| 主ノード | `chokudo_cameraswing_air_serial_node.py` |
| 共用対象 | 直動モーター（Chokudo）— 同じシリアルノードと OpenRB-150 基板を使用 |

トピック：

| トピック | 型 | 方向 | 説明 |
|---|---|---|---|
| `/cameraswingmotor/target_angle` | (custom or Float32) | 受信 | 目標角度指令 |
| `/cameraswingmotor/angle` | (custom or Float32) | 配信 | 現在角度のフィードバック |

自動制御（物体追跡時）：`object_chaser/object_chaser_node.py`
手動・統合制御：`manipulator_control/integrated_control_node.py`

## トラブルシューティング

- 直動モーターとシリアルポートを共用するため、両方に必要な `chokudo_cameraswing_air_serial_node.py` は1つだけです
- カメラ画像が予期せず傾く場合：`/cameraswingmotor/angle` のフィードバックを確認
- カメラ角度は点群の位置合わせに影響します。キャリブレーション用のデータ取得時は camera_swing を既知の角度に維持してください
