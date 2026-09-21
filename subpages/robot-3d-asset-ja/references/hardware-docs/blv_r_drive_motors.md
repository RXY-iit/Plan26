# Oriental Motor BLV-R — 駆動モーター（x3）

## ハードウェア

### 搭載機器の銘板による根拠（2026-08-19）

保存済みの実機写真6枚から、搭載位置との対応を直接確認できます。

| Modbus ID / 手書き番号 | 実機上の位置 | ドライバーの追跡コード | ギヤヘッドの追跡コード | 根拠ファイル |
|---:|---|---|---|---|
| 1 | 後方 | `RX5 F178611` | `RX9 A127705` | `motor-image/1-back.jpeg`, `motor-image/1-back.jpg` |
| 2 | 左前 | `RX5 F178612` | `RX9 A127704` | `motor-image/2-front-left.jpeg`, `motor-image/2-front-left.jpg` |
| 3 | 右前 | `RX5 F178620` | `RX9 A127706` | `motor-image/3-front-right.jpeg`, `motor-image/3-front-right.jpg` |

3台分の写真で、ドライバー型番 `BLVD-KRD`、定格入力 `24–48 VDC / 10.5 A`、IP20、2024/10、ギヤヘッド型番 `GFS5G30FR` を確認できます。`RX5`/`RX9` の文字列は追跡・製造コードとして記録しています。メーカーによる定義がないため、シリアル番号とは断定していません。モーター型番 `BLMR5100K-GFV-B` は提供写真に銘板が写っていないため、導入記録として扱います。

| 項目 | 値 |
|---|---|
| ドライバー型番 | Oriental Motor BLVD-KRD |
| モーター型番 | BLMR5100K-GFV-B（導入記録） |
| ギヤヘッド型番 | GFS5G30FR（実物銘板） |
| ドライバー定格入力 | 24–48 VDC、10.5 A（定格値であり、運転中の実測値ではない） |
| 保護等級 | IP20（実物銘板上の自己宣言） |
| 台数 | 3（右 / 左 / 後輪） |
| 通信 | RS-485 経由の Modbus RTU |
| インターフェース | USB-to-RS485 アダプター → `/dev/ttyUSB0` |
| ボーレート | 230400 |
| モーター ID | 1（後方）、2（左前）、3（右前）— 実物ラベル |
| Global ID | 10（ID-share ブロードキャスト） |
| モード | 連続速度制御（速度制御） |

## ROS2

| 項目 | 値 |
|---|---|
| パッケージ | `om_modbus_master_V201` |
| 主ノード | `drive_motor.py` |
| 配置場所 | `om_modbus_master/sample/BLV_R/drive_motor.py` |

トピック：

| トピック | 型 | 方向 | 説明 |
|---|---|---|---|
| `/drive_vel` | `my_messages/DriveMotor` | 受信 | 各車輪の目標速度 |
| `/drive_odom` | `my_messages/DriveMotor` | 配信 | 実測速度のフィードバック |
| `/odom` | `nav_msgs/Odometry` | 配信 | 車輪オドメトリ（frame: base_link） |
| `/om_response0` | `om_msgs/Response` | 配信 | Modbus の生レスポンス |
| `/om_state0` | `om_msgs/State` | 配信 | Modbus ドライバーの状態 |
| `/om_query0` | `om_msgs/Query` | 受信 | Modbus の生クエリ（内部用） |

## 起動

```bash
# ビルド後、pickup_ws または robot_ws から実行：
ros2 launch om_modbus_master_V201 <launch_file> \
  com:=/dev/ttyUSB0 topicID:=1 baudrate:=230400 \
  updateRate:=1000 secondGen:="1,2,3" globalID:=10 axisNum:=3
```

## トラブルシューティング

- `ls /dev/ttyUSB*` — USB-RS485 アダプターが認識されているか確認
- `sudo chmod 666 /dev/ttyUSB0` — 必要に応じて権限を修正（またはユーザーを `dialout` グループに追加）
- `/om_state0` トピック：state=0 は準備完了、state=1 は処理中（通信トランザクションの途中）
- モーターが応答しない場合：配線の極性（A/B）を確認し、ドライバーの ID-share モードが有効か確認
- タイムアウト後に速度が 0 になる場合：`drive_motor.py` にウォッチドッグがあるため、指令を継続して送る必要があります

## 低頻度の電気状態監視

運用時の ID-share 設定では、新しいトランザクションを追加せず、残りの Share Read スロットを使用します。

| Share Read スロット | 公式 NET-ID | 値 |
|---:|---:|---|
| 8 | 106 | Direct I/O。検証済みの DIN3 赤色停止入力を含む |
| 9 | 155 | 主電源電流、`0.001 A/unit` |
| 10 | 163 | インバーター電圧、`0.1 V/unit` |
| 11 | 164 | 主電源電圧、`0.1 V/unit` |

低頻度の結合レスポンス1回で、ID 1/2/3 の各4項目を取得します。`/drive/health_summary` は生値とスケール変換値を公開します。2026-08-20 の通電試験で、軸ごとの対応と値が有限であることを確認しました。銘板の 24–48 VDC / 10.5 A は定格であり、運用時の自動判定しきい値ではありません。

位置ラベル付きの写真6枚によって、搭載された BLVD-KRD/GFS5G30FR の機種と ID・車輪の対応を実物から確認しています。Dashboard は、この搭載機器の識別に `VERIFIED` を使用します。これは静的な実物根拠であり、通信による機器識別のリアルタイム照会ではありません。通信の稼働状態は別途評価します。

## ドライバー別のアラーム監視

直列化した 25 Hz のスケジュールで、一部の速度読み取りを低頻度のユニキャスト状態読み取りに置き換えるため、Modbus トランザクションは増えません。各実機ドライバーを約 1.3 秒ごとに読み取ります。

| レジスター | 公式 NET-ID | 直接取得する情報 |
|---:|---:|---|
| 128/129 | 64 | 現在のアラーム |
| 130/131 | 65 | アラーム履歴 1 |

現在のアラームがゼロ以外ならエラーです。アラーム履歴は駆動プロセス起動時の値を基準とし、そのセッション中に変更があれば、現在のアラームが解除されても degraded を維持します。起動前からの履歴は背景情報として保存し、現在のセッションで発生したものとは扱いません。コードは16進数で表示し、意味を推測しません。


COMM 白色点灯/点滅：正常
COMM 赤色：通信エラー
PWR/SYS 白色点灯：正常な給電
PWR/SYS 白色点滅：power removal/ETO 状態。通常の COMM 点滅とは区別する
PWR/SYS 赤色点滅：ドライバーアラーム
