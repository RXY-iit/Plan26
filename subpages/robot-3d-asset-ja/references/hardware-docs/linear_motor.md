# 直動モーター（Chokudo / 直動）

## ハードウェア

| 項目 | 値 |
|---|---|
| 機能 | 直動アクチュエーター — ホースまたは機構を鉛直方向に伸縮させる |
| コントローラー | Robotis OpenRB-150 マイコンボード |
| インターフェース | USB シリアル → `/dev/ttyACM*`（同じ基板の camera_swing_motor と共用） |
| 通信 | `serial_transciever` パッケージによる独自シリアルプロトコル |

## ROS2

| 項目 | 値 |
|---|---|
| パッケージ | `serial_transciever` |
| 主ノード | `chokudo_cameraswing_air_serial_node.py` |
| 共用対象 | カメラ首振りモーター（同じシリアルノードと OpenRB-150 を使用） |

トピック：

| トピック | 型 | 方向 | 説明 |
|---|---|---|---|
| `/chokudomotor/target_angle` | (custom or Float32) | 受信 | 目標位置指令 |
| `/chokudomotor/angle` | (custom or Float32) | 配信 | 現在角度・位置のフィードバック |

手動制御ノード：`manipulator_control/motor_manual_chokudo_node.py`
統合制御：`manipulator_control/integrated_control_node.py`

## トラブルシューティング

- `ls /dev/ttyACM*` — OpenRB-150 が認識されているか確認
- `sudo chmod 666 /dev/ttyACM0` — 権限を修正
- 直動モーターとカメラ首振りモーターは同じシリアルノードを共用します。`chokudo_cameraswing_air_serial_node.py` の起動で両方を制御します
- 応答がない場合：ノードパラメータの `/dev/ttyACM*` ポート番号が正しいか確認
- 基板上で OpenRB-150 のファームウェアが動作している必要があります
