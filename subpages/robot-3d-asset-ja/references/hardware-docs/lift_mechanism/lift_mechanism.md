# Lift 昇降機構：実機構成記録

最終更新：2026-09-20
目的：搭載ハードウェア、現場配線、一意の機器識別情報、ドライバーパラメータ、絶対位置の校正、現在の保護境界を記録します。取付・調整・試験の操作手順書ではありません。

## 1. 現在の構成概要

| 項目 | 現在の記録 |
|---|---|
| 機構 | Oriental Motor EAS 電動スライダー `EASM2XF020AZAK` |
| ドライバー | Oriental Motor `AZD-KD`、DC 24 V、パルス列入力・RS-485 付き |
| 位置センサー | バッテリーレス・メンテナンスフリーの ABZO 絶対値センサーを内蔵 |
| 公式機械ストローク | `200 mm` |
| ボールねじリード | 型番コード `F`：`3 mm` |
| 現場の座標定義 | 下端 `0 mm`、上端 `200 mm`、上向きを正とする |
| ABZO 実測端点 | 下端 `-404 steps`、上端 `20707 steps` |
| 校正係数 | `0.009473734072 mm/step` |
| 校正オフセット | `3.827388565 mm` |
| ROS 通常動作範囲 | `15–185 mm`。校正した機械端点から両端に `15 mm` を確保 |
| 主動作制御 | Arduino UNO D8/D9 → MOSFET 5 V→24 V → AZD-KD CN4 の FW/RV |
| 絶対位置監視 | 独立した Waveshare USB TO RS485 を AZD-KD CN6/CN7 に接続。読み取り専用 Modbus RTU |
| 識別済みアラーム | `30h` = overload（過負荷）。端点走査中に発生 |
| AZD 内部の物理・ソフトウェアリミット | 根拠となる MEXE02 出力と作動記録は未整備。確認済みとは扱えない |

## 2. ハードウェア構成と接続関係

```text
動作指令経路：
Ubuntu PC
  └─ USB ─ Arduino UNO
              ├─ D8 / FW / UP ─┐
              └─ D9 / RV / DOWN ─┴─ MOSFET 5 V→24 V インターフェース ─ AZD-KD CN4

読み取り専用フィードバック経路：
Ubuntu PC
  └─ USB ─ Waveshare USB TO RS485 ─ A+/B-/GND ─ AZD-KD CN6 または CN7

アクチュエーター経路：
AZD-KD ─ モーター線・ABZO センサー線 ─ EASM2XF020AZAK ─ 昇降ブラケット
```

動作指令と RS-485 フィードバックの経路は独立しています。RS-485 は AZD-KD の読み取り専用で、既存の Arduino FW/RV 制御を置き換えません。また、車体の BLVD 用 RS-485 バスと変換器を共用しません。

## 3. USB 機器の識別情報

### 3.1 本機構で使用する2つの USB 機器

| 用途 | 固定パス | USB 識別情報 | 現場の動的ノード記録 | ソフトウェア上の条件 |
|---|---|---|---|---|
| Lift Arduino | `/dev/serial/by-id/usb-Arduino__www.arduino.cc__0043_03536383236351E062C1-if00` | VID:PID `2341:0043`、シリアル番号 `03536383236351E062C1` | 2026-09-18 は `/dev/ttyACM2` | `lift_serial_node` が VID/PID を確認。シリアル速度 `9600` |
| Lift AZD-KD RS-485 | `/dev/serial/by-id/usb-FTDI_FT232R_USB_UART_BG04PM6K-if00-port0` | VID:PID `0403:6001`、シリアル番号 `BG04PM6K`、Linux ドライバー `ftdi_sio` | 2026-09-19 は `/dev/ttyUSB2` | AZD-KD 専用。Modbus `115200, 8E1, ID 1` |

運用設定には `/dev/serial/by-id/...` のみを保存します。`ttyACM*` と `ttyUSB*` はその時点の列挙記録であり、再接続や再起動で変わる場合があります。

### 3.2 同一ホストの USB シリアル一覧スナップショット

以下は 2026-09-18/19 の現場で取得した `/dev/serial/by-id` の出力です。他のコントローラーを Lift と誤認しないために記録しています。

| by-id 名 | 当時のノード | Lift 用途 |
|---|---:|---|
| `usb-1a86_USB_Single_Serial_5AE6054086-if00` | `ttyACM1` | いいえ |
| `usb-1a86_USB_Single_Serial_5AE6084777-if00` | `ttyACM0` | いいえ |
| `usb-Arduino__www.arduino.cc__0043_03536383236351E062C1-if00` | `ttyACM2` | はい、動作指令 |
| `usb-FTDI_FT232R_USB_UART_BG04PM6K-if00-port0` | `ttyUSB2` | はい、AZD-KD の読み取り専用監視 |
| `usb-FTDI_USB-RS485_Cable_FT7E9M3C-if00-port0` | `ttyUSB0` | いいえ。Lift 専用変換器の代用不可 |
| `usb-FTDI_USB__-__Serial_Converter_FT4TCWV6-if00-port0` | `ttyUSB1` | いいえ |
| `usb-ROBOTIS_OpenRB-150_183098125055344E312E3120FF092507-if00` | `ttyACM3` | いいえ |

## 4. 動作指令の配線記録

| 信号 | PC/Arduino 側 | レベル変換 | AZD-KD 側 | 方向の定義 |
|---|---|---|---|---|
| FW | Arduino UNO `D8` | MOSFET モジュール。5 V GPIO を 24 V 産業用入力に変換 | CN4 `FW` | UP / 上昇 |
| RV | Arduino UNO `D9` | MOSFET モジュール。5 V GPIO を 24 V 産業用入力に変換 | CN4 `RV` | DOWN / 下降 |
| STOP | `D8=LOW` かつ `D9=LOW` | 両方向の入力を解除 | CN4 FW/RV は両方無効 | ドライバー内部で減速停止 |

Arduino ファームウェアの識別名は `LIFT_CONTROL_V2`、ソースは `src/serial_transciever/arduino/lift_control/lift_control.ino` に記録されています。CN4 の実際の端子番号、MOSFET モジュールの具体的な型番、24 V COM の極性、現場の配線色は既存資料に記載がないため、ここでは推測しません。

## 5. アクチュエーターとドライバーの記録

### 5.1 EASM2XF020AZAK

| 項目 | 記録 |
|---|---|
| シリーズ | Oriental Motor EAS シリーズ電動スライダー |
| 型番 | `EASM2XF020AZAK` |
| サイズコード | `EASM2` |
| ねじコード | `F`、ボールねじリード `3 mm` |
| ストロークコード | `020`、ストローク `200 mm` |
| センサー | バッテリーレス・メンテナンスフリーの ABZO 絶対値センサー |
| 本機の方向 | ABZO steps の増加が上昇に対応 |
| 本機の座標 | 機械下端 `0 mm`、機械上端 `200 mm` |

### 5.2 AZD-KD パラメータ記録

以下は既存のシステム記録に基づく値です。通信項目と実測状態を除き、今回新たな MEXE02 全パラメータ出力は保存していません。

| パラメータ番号 | 項目 | 記録値 | 根拠の状態 |
|---:|---|---:|---|
| 20 | JOG 移動量 | `1.00 mm` | 既存プロジェクト記録 |
| 21 | JOG 運転速度 | `60.00 mm/s` | ROS の速度設定と一致 |
| 22 | JOG 加減速度 | `0.30000 m/s²` | 既存プロジェクト記録 |
| 23 | JOG 開始速度 | `5.00 mm/s` | 既存プロジェクト記録 |
| 28 | HOME 原点復帰方式 | `3-sensor` | 既存プロジェクト記録。センサー入力の割当は未確認 |
| 29 | HOME 原点復帰開始方向 | `+` | 既存プロジェクト記録 |
| 15 | 機構の limit パラメータ | ABZO 設定に従う | 既存プロジェクト記録。内部リミット値は未出力 |
| 16 | 機構の保護パラメータ | ABZO 設定に従う | 既存プロジェクト記録。内部保護値は未出力 |

「ABZO 搭載済み」は絶対位置を読み取れることを示すだけです。FW-LS、RV-LS、HOMES、AZD-KD のソフトウェア範囲超過保護が設定済みであることを自動的に裏付けるものではありません。

## 6. 絶対位置の校正記録

### 6.1 校正サンプル

2026-09-19 に上下の全ストロークを手動で動かして取得しました。

| 校正点 | 実物位置 | ABZO feedback | 説明 |
|---|---:|---:|---|
| 下端 | `0 mm` | `-404 steps` | 観測最小値。端部付近で `30h` 過負荷が発生 |
| 上端 | `200 mm` | `20707 steps` | 観測最大値。端部付近で `30h` 過負荷が発生 |
| 幅 | `200 mm` | `21111 steps` | `20707 - (-404)` |

### 6.2 換算関係

| 項目 | 値 |
|---|---:|
| `mm_per_step` | `200 / 21111 = 0.009473734072 mm/step` |
| `offset_mm` | `404 × mm_per_step = 3.827388565 mm` |
| 位置式 | `position_mm = feedback_steps × 0.009473734072 + 3.827388565` |
| 下端の逆算 | `-404 steps = 0.000 mm` |
| 上端の逆算 | `20707 steps = 200.000 mm` |

ユーザー提供の下端の即時サンプルは `-388 steps` で、この校正では約 `0.152 mm` に相当します。そのサンプルのセッション観測範囲は `-404..20707 steps` で、校正の基準点と一致しています。

この換算は取付後の機体の端点校正であり、電子ギヤの理論値からの推定ではありません。スライダー、ドライバー、ABZO 座標のプリセット、機械的な取付が変わった場合、このデータは無効になった過去の記録として扱います。

## 7. 保護境界と状態の根拠

| 保護層 | 現在の値 | 現在の状態 |
|---|---|---|
| 機械定格ストローク | `0–200 mm` | 公式型番データと端点走査が一致 |
| ROS 方向保護 | `15–185 mm` | 有効。両端に各 `15 mm` を確保 |
| ABZO の鮮度 | 最大 `0.5 s` | タイムアウトで停止・動作拒否 |
| ドライバーアラームによる許可判定 | `alarm == 0` | アラーム時に停止・動作拒否 |
| ドライバー READY による許可判定 | 動作開始時に true が必要 | READY でなければ新規動作を拒否 |
| アラーム・端部領域の手動復帰ロック | `/lift/recovery_command` | アラーム解除かつ READY 復帰後、またはノード起動時に位置が `15–185 mm` の外にある場合も手動確認が必要。安全領域の内側へ向かう方向のみを解放し、自動では動かさない |
| AZD 物理入力リミット | FW-LS/RV-LS/HOMES | 入力割当と実際の作動は未確認 |
| AZD ソフトウェアリミット | FW-SLS/RV-SLS | MEXE02 の値と有効状態は未確認 |

方向保護は片方向に作用します。上限では UP を禁止し、DOWN は維持します。下限では DOWN を禁止し、UP は維持します。現在の既定設定では、時間で端部に当てる homing は使用しません。ABZO モードでは、旧 `HOME`、`SET_MIN`、`SET_MAX` を実機座標の基準に使用しません。

`15 mm` の余裕は現在の運用条件に基づきます。`60 mm/s` と `10 Hz` のフィードバックでは、1周期あたり最大約 `6 mm` 進みます。JOG 減速度 `0.30000 m/s²` で `60 mm/s` から停止する理論距離は約 `6 mm`、合計約 `12 mm` です。さらに通信・実行遅延のため約 `3 mm` を確保しています。これは ROS の通常動作境界であり、`-404 / 20707 steps` の機械端点校正は変更しません。

## 8. 記録済みの端点アラーム

| 項目 | 記録 |
|---|---|
| ROS の10進値 | `48` |
| AZD の16進値 | `30h` / `0x30` |
| 公式の意味 | `OVERLOAD` / 過負荷 |
| 発生条件 | 手動の全ストローク走査中、機械端部付近 |
| 復帰状況 | MEXE02 の「アラームリセット」で復帰に成功 |
| 判定の範囲 | 通信エラーではなく、`66h` のハードウェア範囲超過や `67h` のソフトウェア範囲超過でもない |

端点走査後の下端サンプルにも `present_alarm_code=48`、`READY=false` が記録されており、再び端部に近づくと過負荷が再発する可能性を示します。この事象は「機械端部に力が加わった」という判断を支持しますが、AZD 内部リミットの有効性は証明しません。

2026-09-20 の再度の下端事象は `-394 steps = 0.0947 mm`、`alarm=0x30`、`READY=false` で、現在のセッション観測範囲は `-404..20429 steps` でした。`20429` は、その monitor 起動後のセッション内最大値にすぎず、新しい機械上端ではありません。このため、全ストローク走査で得た `20707 steps = 200 mm` の校正点は変更していません。

## 9. ソフトウェアと Dashboard の対応記録

| 機能 | 現在の記録 |
|---|---|
| Arduino ブリッジ | `lift_serial_node`。固定 Arduino by-id、9600 baud を使用 |
| AZD 読み取り | `lift_abzo_monitor_node`。Modbus function 03、読み取り専用 |
| AZD ポーリング | 現在の launch 設定は `10 Hz` |
| 絶対位置 | `/lift/abzo_position_raw` と `/lift/abzo_position_mm` |
| 完全な状態 | `/lift/abzo_state`、JSON schema version 3 |
| Dashboard の位置表示 | calibrated mm、raw feedback steps、command steps |
| Dashboard のドライバー状態 | アラームコード・名称、READY、MOVE、通信状態 |
| Dashboard の電気・温度表示 | ドライバー温度、モーター温度、inverter/supply voltage |
| Dashboard の保護表示 | 物理校正範囲、ROS 安全範囲、guard 状態、UP/DOWN の許可状態 |
| Dashboard の復帰 | アラームリセットかつ READY 復帰後に「手動確認して復帰」を表示。再起動時に Lift が端部 keep-out 領域にある場合も表示。確認は復帰ロックの解除のみで、`15–185 mm` の内側へ向かう方向に限定し、動作指令は送らない |

RS-485 配線、MEXE02 通信項目、レジスター、実測スナップショットの詳細は [azd_kd_abzo_interface.md](azd_kd_abzo_interface.md) を参照してください。

## 10. 出典

- ローカル AZD-KD 公式マニュアル：[HM-60313J.pdf](HM-60313J.pdf)
- Oriental Motor `EASM2XF020AZAK` 製品ページ：<https://www.orientalmotor.co.jp/ja/products/detail?hinmei=EASM2XF020AZAK&refFlg=1>
- Oriental Motor `AZD-KD` 製品ページ：<https://www.orientalmotor.co.jp/ja/products/detail?hinmei=AZD-KD>
- 実機の `/lift/abzo_state` スナップショットと 2026-09-19 の全端点走査
- 現在の ROS launch と `lift_abzo_monitor_node` の設定
