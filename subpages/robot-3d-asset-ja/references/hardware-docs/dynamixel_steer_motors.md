# Dynamixel — 操舵モーター（x3）

## ハードウェア

| 項目 | 値 |
|---|---|
| ブランド | Robotis Dynamixel |
| 台数 | 3（車輪の操舵用、各車輪に1台） |
| 通信 | Dynamixel Protocol（UART 半二重） |
| インターフェース | USB-to-Dynamixel（U2D2 または同等品） |
| モーター ID | 11（車輪 1）、12（車輪 2）、13（車輪 3） |
| モード | 位置制御 |

## 2026-08-19 に運用時の機種を確認

Protocol 2.0 の ping に対し、設定された3つの ID すべてからモデル番号 `1100` が返りました。

| ID | 取得したモデル番号 | 公式の型番対応 |
|---:|---:|---|
| 11 | 1100 | XH540-W270 |
| 12 | 1100 | XH540-W270 |
| 13 | 1100 | XH540-W270 |

対応関係は ROBOTIS 公式 XH540-W270 コントロールテーブルによるもので、ローカルの型番推定によるものではありません。

- https://emanual.robotis.com/docs/en/dxl/x/xh540-w270/
- Hardware Error Status：アドレス 70、1 byte
- Present Current：アドレス 126、2 bytes、符号付き、2.69 mA/unit
- Present Input Voltage：アドレス 144、2 bytes、0.1 V/unit
- Present Temperature：アドレス 146、1 byte、1 °C/unit

実機ドライバーは、これらの低頻度の状態レジスターを 1 Hz で読み取り、`/dynamixel/health_summary` に含めます。位置フィードバックは既存のリクエスト経路を維持します。レジスターの読み取り失敗やゼロ以外の Hardware Error Status は直接報告し、操舵動作から推測しません。

## ROS2

| 項目 | 値 |
|---|---|
| パッケージ | `DynamixelSDK` → `dynamixel_sdk_examples` |
| ドライバーノード | `omni_base_driver` (`steer_motor_node`) |

トピック：

| トピック | 型 | 方向 | 説明 |
|---|---|---|---|
| `/steer_ang` | `my_messages/SteerMotor` | 受信 | 目標操舵角（rad、各車輪） |
| `/steer_odom` | `my_messages/SteerMotor` | 配信 | 実操舵角のフィードバック |

内部で使用するサービス：
- `get_position` (dynamixel_sdk_custom_interfaces/srv/GetPosition) — ID 11/12/13 の現在位置を読み取る

## 運動学

操舵と駆動の組合せで、3輪全方向移動（ホロノミック）車体を構成します。
運動学計算：`omni_base_driver/include/omni_base_driver/picking_robot_matrix.hpp`

オドメトリノード（`robot_odom_node`）：
- 受信：`/steer_odom` + `/drive_odom`
- 配信：`/wheel_odom`（nav_msgs/Odometry、frame: `odom` → child: `base_link`）
- TF も配信：`odom → base_link`

## トラブルシューティング

- `ros2 service call /get_position ...` — モーター位置を手動で問い合わせる
- モーターが見つからない場合：U2D2 の接続と `/dev/ttyUSB*` を確認
- 位置の単位：Dynamixel の生の tick 値を `convertPositionRadian()` で rad に変換
- 原点位置（直進）は `motor_param.hpp` に定義
