既存のハードウェア文書は、BLV-R の ROS/Modbus インターフェース情報を補足します。システムは3台の BLV-R を RS-485 上の Modbus RTU で制御し、`/om_query0`、`/om_response0` などのインターフェースがあります。

### 1. 確認済みのハードウェア・通信情報

| 項目 | 確認済みの情報 | 状態 |
| ---------- | ------------------------------- | -- |
| Driver | Oriental Motor **BLVD-KRD** | ✅ |
| Motor | **BLMR5100K-GFV-B** | ✅ |
| Gear head | **GFS5G30FR** | ✅ |
| 台数 | 駆動輪3個 | ✅ |
| 通信 | Modbus RTU / RS-485 | ✅ |
| Baudrate | 230400 bps | ✅ |
| Parity | Even | ✅ |
| Stop bit | 1 bit | ✅ |
| ROS RS-485 | FTDI USB-RS485 → `/dev/ttyUSB0` | ✅ |
| Motor IDs | 1 / 2 / 3 | ✅ |
| 赤色停止ボタン | BLVD-KRD の `DIN3:FREE` に作用 | ✅ |

2026-08-19 の `hardware/motor-image/` にある実機銘板写真6枚により、3組ともドライバー `BLVD-KRD`、ギヤヘッド `GFS5G30FR` を使用していることを直接確認しました。手書き番号と位置の対応は ID1=後輪、ID2=左前輪、ID3=右前輪です。写真のドライバー定格入力は `24–48 VDC, 10.5 A`、IP20、製造年月は 2024/10 です。モーター型番 `BLMR5100K-GFV-B` は導入記録に基づく情報であり、写真にない文字を銘板の根拠とは扱いません。位置別の追跡コードは `hardware/blv_r_drive_motors.md` に記録しましたが、メーカーによる定義がないため trace/manufacturing code と呼び、独自にシリアル番号とは解釈しません。

既存のハードウェア文書にも `/dev/ttyUSB0`、230400 baud、ID 1/2/3 が記録されており、過去の調査とおおむね一致しています。

### 2. ROS → BLVD-KRD の指令経路

| 順序 | 信号/機器 | 役割 | 確認状況 |
| -: | ----------------------- | ------------------------ | ----------------- |
| 1 | Joystick / Navigation | ロボットの速度指令を生成 | ✅ |
| ↓ | `/cmd_vel` | ロボットの速度指令 | ✅ ゼロ以外の値あり |
| 2 | `cmd_vel_to_motor_node` | 3輪の速度に変換 | ✅ |
| ↓ | `/drive_vel` | 3輪の目標速度 | ✅ ゼロ以外の値あり |
| 3 | `drive_motor` | BLV-R Modbus command に変換 | ✅ |
| ↓ | `/om_query0` | Modbus query/write | ✅ ゼロ以外の書き込みあり |
| 4 | `om_modbusRTU_node` | Modbus RTU 通信を実行 | ✅ |
| ↓ | `/dev/ttyUSB0` | USB → RS-485 | ✅ |
| 5 | BLVD-KRD | 速度 command を受信 | ✅ 通信成立 |
| 6 | Motor | 実際に回転するか | **FREE/励磁状態に依存** |

今回の不具合から、次の点が確認されました。

> **「ROS が速度を出力した」≠「モーターが必ず回転する」**

その間に、BLVD-KRD 自身の安全・enable 状態が介在します。

### 3. 物理的な赤色ボタン → モーター停止の主要経路

今回の調査で最も重要な結論です。

| 順序 | 状態 | 結果 |
| -: | ----------------- | ----------------- |
| 1 | **赤色の物理停止ボタンを押してロック** | 物理入力状態が変化 |
| ↓ | `DIN3` | BLVD-KRD の外部デジタル入力 |
| 2 | `DIN3 = FREE` が有効 | FREE 機能が作動 |
| ↓ | `FREE = ON` | Driver が FREE 状態になる |
| 3 | モーターが無励磁 | Servo-on は実際には成立していない |
| ↓ | `SON-MON = OFF` | Driver は実際の励磁状態に入っていない |
| 4 | ROS が速度送信を続けても | Driver は動作を実行しない |
| ↓ | **Motor は回転しない** | 最終的な停止効果 |

簡略化すると、次の経路になります。

**物理ボタンのロック → DIN3 active → FREE ON → SON-MON OFF → 無励磁 → モーター停止**

### 4. ボタン解除時の通常ロジック

逆の場合は次のとおりです。

| 赤色ボタン | DIN3 / FREE | SON-MON | Motor |
| -------- | ----------- | ----------- | ------- |
| 🔴 押下/ロック | FREE 有効 | OFF | ❌ 動作不可 |
| ⚪ 解除 | FREE は作動しない | ON（他の条件が正常な場合） | ✅ 動作可能 |

現在の理解は以下のとおりです。

**ボタン解除 → FREE OFF → SON-MON が成立可能 → Motor は運転可能**

**ボタン押下 → FREE ON → SON-MON 不成立 → Motor は運転しない**

### 5. MEXE02 で実際に観察した状態

不具合発生時：

| MEXE02 状態 | 値 | 意味 |
| ----------- | ------: | ------------------- |
| 現在の Alarm | `00` | 現在の Alarm なし |
| INFO | ON | 観察済み |
| S-ON | ON | Servo-on command は存在 |
| **SON-MON** | **OFF** | 実際の励磁は成立していない |
| **FREE** | **ON** | FREE 入力が有効 |

### 6. 公式通信資料と V1.2 インターフェース

公式 BLV-R Function Manual `HP-5142-4E`：

- https://www.orientalmotor.com/products/pdfs/opmanuals/HP-5142-4E.pdf
- ID-share NET-ID `106 (0x006A)` は Direct I/O。
- Direct I/O の Modbus monitor register では、DIN0..DIN3 は下位4 bit に対応し、DIN3 は bit 3。
- NET-ID `63 (0x003F)` は Driver output status。具体的な出力機能はパラメータで再割当可能。
- NET-ID `64 (0x0040)` は Present alarm。
- NET-ID `124/125` は driver/motor temperature（0.1 °C）。
- NET-ID `155` は main power supply current（0.001 A）。
- NET-ID `163/164` は inverter/main power supply voltage（0.1 V）。

V1.2 ではまず NET-ID 106 を接続し、3台のドライバーから約 1 Hz で raw Direct I/O を読み取り、`/drive/health_summary` に DIN3 を出力します。

2026-08-19 に、同じ配線・同じ drive process でロボットを静止させたまま、実機の2状態を直接取得しました。

| 物理ボタンの状態 | ID 1 | ID 2 | ID 3 | 3台の raw 値 |
|---|---:|---:|---:|---:|
| 解除 | DIN3=1 | DIN3=1 | DIN3=1 | 196616 |
| 押下してロック（初回校正 session） | DIN3=0 | DIN3=0 | DIN3=0 | 196608 |

このため、現在の取付配線における運用時の対応を、すべて1 = `RELEASED/OK`、すべて0 = `PRESSED/BLOCKED`、3台間で不一致 = `ERROR` と限定しています。ここで確認したのは、3台の BLVD が認識する DIN3 の入力状態です。ソフトウェアの `/safety_status` を物理ボタンとは扱わず、SON-MON も監視済みだとは主張しません。断線時の挙動には別途、断線・故障注入試験が必要です。完了するまでは、このインターフェースが安全 PLC や safety relay の故障診断水準を満たすとは主張できません。

V1.3 の初回再起動時も、ボタン押下状態では3台とも DIN3=0 でしたが、完全な raw 値は ID1/2=196608、ID3=0 でした。NET-ID 106 の DIN0..DIN3 以外のビットは、現在の監視では意味を定義していません。そのため、運用判定は公式に定義された DIN3 bit 3 のみを比較し、raw 値全体の一致は要求しません。表の raw 値は当時のサンプルであり、状態の規格値ではありません。
