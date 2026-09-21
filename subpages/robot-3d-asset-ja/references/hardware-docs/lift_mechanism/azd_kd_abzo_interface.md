# AZD-KD RS-485 / ABZO インターフェースと実測記録

最終更新：2026-09-19
対象：Lift 専用 USB-RS485、AZD-KD CN6/CN7 の配線、通信と MEXE02 の設定、読み取り専用レジスタ、現場データ、校正結果を記録する。配線手順、テストコマンド、トラブルシューティング手順は含まない。

## 1. システム構成

AZD-KD には、独立した 2 系統の経路がある。

```text
制御系：PC → Arduino UNO → MOSFET 5 V/24 V インターフェース → CN4 FW/RV
フィードバック系：PC → Lift 専用 USB-RS485 → CN6/CN7 → AZD-KD Modbus/ABZO
```

フィードバック系のソフトウェアは、Modbus RTU function `03` による holding registers の読み取りのみを使用し、レジスタ書き込み機能は持たない。ABZO 位置、アラーム、READY/MOVE、温度、電圧、リミット状態を取得する。Lift の実際の動作は引き続き CN4 の FW/RV 入力で制御する。

## 2. USB-RS485 変換器の実機記録

| 項目 | 実機の記録 |
|---|---|
| 購入リンク/ASIN | Amazon Japan `B0931565YQ` |
| 製品 | Waveshare `USB TO RS485` |
| USB/UART チップ | FTDI `FT232RL` |
| RS-485 トランシーバ | `SP485EEN` |
| 端子表示 | `A+`、`B-`、`GND` |
| 送受信方向 | 自動制御、2 線式半二重 |
| 基板上の終端抵抗 | `120 Ω` |
| 保護 | TVS、サージ/ESD 保護 |
| 絶縁 | **非絶縁型**。保護素子は電気的絶縁を意味しない |
| Linux VID:PID | `0403:6001` |
| USB シリアル番号 | `BG04PM6K` |
| Linux ドライバ | `ftdi_sio` |
| 固定デバイスパス | `/dev/serial/by-id/usb-FTDI_FT232R_USB_UART_BG04PM6K-if00-port0` |
| 動的ノードの記録 | 2026-09-19 時点では `/dev/ttyUSB2`。設定パスには使用しない |
| 専用接続先 | Lift の AZD-KD のみ。BLVD 走行モータのバスには接続しない |

AZD-KD の CN6/CN7 も非絶縁インターフェースのため、現在の接続には PC とドライバ間の galvanic isolation がない。基板上の保護回路は現在の短距離ポイントツーポイント接続を対象とするが、絶縁素子の代わりにはならない。

## 3. RS-485 配線対応表

CN6 と CN7 は並列の RS-485 ポートであり、現場では一方を使用する。現在記録されている電気的対応を示す。

| Waveshare 端子 | 信号の定義 | AZD-KD CN6/CN7 pin | AZD-KD 名称 | 接続状態 |
|---|---|---:|---|---|
| `A+` | RS-485 differential `+` | 3 | `TR+` | 接続済み |
| `B-` | RS-485 differential `-` | 6 | `TR-` | 接続済み |
| `GND` | 通信基準グランド | 2 | `GND` | 接続済み |
| なし | — | 1 | N.C. | 接続しない |
| なし | — | 4 | N.C. | 接続しない |
| なし | — | 5 | N.C. | 接続しない |
| なし | — | 7 | N.C. | 接続しない |
| なし | — | 8 | N.C. | 接続しない |

USB の `5 V` は AZD-KD に接続しない。既存の CN4 FW/RV の動作制御配線は変更しない。現場の配線色、使用ポートが CN6/CN7 のどちらか、RJ45 breakout の型式は未記録であり、現時点では pin 番号が唯一の配線基準となる。

### 3.1 終端設定

| バスの端点 | 終端の記録 |
|---|---|
| PC/USB-RS485 側 | Waveshare 変換器の基板上の `120 Ω` |
| AZD-KD 側 | SW1 No.3 と No.4 を両方 ON にし、ドライバ側の `120 Ω` を有効化 |
| バス構成 | ポイントツーポイント、両端終端 |
| 追加の終端抵抗 | なし。3 個目の `120 Ω` は並列接続していない |

## 4. AZD-KD パネルスイッチの記録

スイッチは電源を切って設定し、再投入後に反映される。現場設定と Modbus の読み取り値を示す。

| 操作部 | 現場設定 | 機能 | 読み取りによる確認 |
|---|---:|---|---|
| ID ロータリースイッチ | `1` | Modbus slave ID 1 | `id_switch_raw = 1` |
| SW1 No.1 | OFF | ID=1 と組み合わせてアドレス 1 | SW1 の一括読み取り値は下記参照 |
| SW1 No.2 | ON | Modbus RTU プロトコル | 115200/8E1、ID1 で継続通信を確認 |
| SW1 No.3 | ON | No.4 と組み合わせて終端を有効化 | 現場での電源断時の設定記録 |
| SW1 No.4 | ON | No.3 と組み合わせて終端を有効化 | 現場での電源断時の設定記録 |
| BAUD ロータリースイッチ | `4` | `115200 bit/s` | `baud_switch_raw = 4` |

実機セッションでは、ドライバの監視レジスタが `sw1_raw = 2` を返した。現在のソフトウェアはこれをメーカーのレジスタ生値として保持し、十進数 `2` を 4 個の DIP スイッチの直接的な bit mask としては扱わない。物理的な ON/OFF 状態は、上表の電源断時に確認した記録を基準とする。

## 5. MEXE02 設定記録

### 5.1 確認済みの通信設定

| MEXE02/ドライバの項目 | 現在値 | 状態/根拠 |
|---|---:|---|
| 通信プロトコル | Modbus RTU | SW1 No.2 の設定と実機通信で確認 |
| Slave address | `1` | ID スイッチとレジスタの読み取り値が一致 |
| Baud rate | `115200 bit/s` | BAUD=4 と実機通信が一致 |
| Data bits | `8` | 現在の RTU 通信設定 |
| Parity | Even | `8E1` の実機通信で確認 |
| Stop bits | `1` | `8E1` の実機通信で確認 |
| Transmission wait time | `3.0 ms`（パラメータ値 30） | MEXE02 での確認記録 |
| Silent interval | Automatic（パラメータ値 0） | MEXE02 での確認記録 |

### 5.2 既存の運転パラメータ

| パラメータ番号 | 項目 | 値 | 記録の範囲 |
|---:|---|---:|---|
| 20 | JOG 移動量 | `1.00 mm` | 既存システムの記録 |
| 21 | JOG 運転速度 | `60.00 mm/s` | 現在の ROS 速度パラメータと一致 |
| 22 | JOG 加減速 | `0.30000 m/s²` | 既存システムの記録 |
| 23 | JOG 起動速度 | `5.00 mm/s` | 既存システムの記録 |
| 28 | HOME 原点復帰方式 | `3-sensor` | 入力割り当ては別途確認できていない |
| 29 | HOME 原点復帰開始方向 | `+` | 既存システムの記録 |
| 15 | 機構の limit パラメータ | ABZO 設定に従う | 正確な limit 値は未保存 |
| 16 | 機構保護パラメータ | ABZO 設定に従う | 正確な保護値は未保存 |

### 5.3 追跡可能なエクスポートが未保存の項目

| 項目 | 現在の記録状態 | ソフトウェアでの扱い |
|---|---|---|
| MEXE02 の全パラメータ出力ファイル | リポジトリに未保存 | 未記録のパラメータから推測しない |
| Electronic gear / resolution | 正確な値は未記録 | 組立後の実機による 2 点校正で mm に換算 |
| Preset / home coordinate | 正確な値は未記録 | ROS 座標は ABZO 端点校正に基づく |
| AZD 正/逆方向のソフトウェア limit 値 | 未記録 | `software_limits_configured=false` |
| FW-LS / RV-LS / HOMES 入力割り当て | 未確認 | `physical_limit_inputs_configured=false` |
| センサ入力の反転論理 | 未記録 | 現在の false ビットをリミットハードウェアの証拠としない |

したがって、ROS の `15–185 mm` guard は運用中のソフトウェア動作保護を表す。AZD-KD 内部の FW-SLS/RV-SLS や物理リミットが有効であることを示すものではない。

## 6. アクチュエータと座標基準

| 項目 | 値 |
|---|---:|
| アクチュエータ型式 | `EASM2XF020AZAK` |
| 公式ストローク | `200 mm` |
| 型式コード `F` | ボールねじリード `3 mm` |
| ABZO の方向 | steps の増加 = 上昇 |
| 機械下端の座標 | `0 mm` |
| 機械上端の座標 | `200 mm` |

機械仕様はメーカー型式に基づき、steps/mm は取り付け後の実機端点走査に基づく。理論分解能を実機全体の校正値と混同しないよう、出典を分けて保存する。

## 7. ABZO 校正データ

### 7.1 端点の生データ

| 日付 | 位置 | `feedback_steps` | セッション内の観測値 | 備考 |
|---|---|---:|---|---|
| 2026-09-19 | 機械下端 | `-404` | `observed_min_steps=-404` | `0 mm` として校正 |
| 2026-09-19 | 機械上端 | `20707` | `observed_max_steps=20707` | `200 mm` として校正 |
| 2026-09-19 | 全範囲 | `21111` | `observed_span_steps=21111` | 手動で移動した全範囲 |

### 7.2 現在の換算定数

| 項目 | 現在値 |
|---|---:|
| `position_mm_per_step` | `0.009473734072` |
| `position_offset_mm` | `3.827388565` |
| `calibrated_min_mm` | `0.0` |
| `calibrated_max_mm` | `200.0` |
| 換算式 | `mm = steps × 0.009473734072 + 3.827388565` |

換算の根拠：

```text
span_steps = 20707 - (-404) = 21111
mm_per_step = 200 / 21111 = 0.009473734072
offset_mm = 0 - (-404 × mm_per_step) = 3.827388565
```

下端での瞬時サンプル `-388 steps` は約 `0.15158 mm` に相当する。この差は端点校正の約 `16 steps` の範囲内であり、観測極値 `-404` を下端の基準点とする記録は変更しない。

### 7.3 現在のソフトウェア保護範囲

| 項目 | 値 |
|---|---:|
| 校正済みの物理範囲 | `0–200 mm` |
| ソフトウェア keep-out margin | 両端に各 `15 mm` |
| 通常の移動許容範囲 | `15–185 mm` |
| ABZO 状態の許容経過時間 | `0.5 s` |
| 位置監視の設定周波数 | `10 Hz` |
| 動作許可条件 | 最新かつ校正済みの ABZO、`alarm=0`、起動時に `READY=true` |

上限では UP の継続だけを、下限では DOWN の継続だけを禁止する。安全範囲の内側へ向かう動作は許可する。動作中のアラーム、`0.5 s` を超えるフィードバック未更新、範囲外へ向かう動作の継続を検出すると、Arduino コマンド層は STOP に移行する。

`15 mm` の keep-out は、現在の `60 mm/s`、`10 Hz`、`0.30000 m/s²` に基づく。フィードバック 1 周期で約 `6 mm`、理論制動距離で約 `6 mm`、通信と実行の遅延にさらに約 `3 mm` を確保する。アラーム発生後は手動復帰状態をラッチする。MEXE02 でアラームを解除した後にプロセスを再起動しても、最初の位置が `15–185 mm` の外側であれば同じ復帰ロックを設定する。`alarm=0`、`READY=true`、ABZO が最新、かつ機構停止中という条件がそろった場合にのみ、Dashboard で手動確認を許可する。確認操作では自動的に動作せず、端点付近から通常範囲の内側へ向かう一方向だけを解除する。

## 8. Modbus 読み取り専用レジスタ記録

| データ | レジスタ | 型/スケール | ROS 状態フィールド |
|---|---|---|---|
| 現在のアラーム | `0x0080–0x0081` | 符号なし 32-bit | `driver.present_alarm_code/hex/name` |
| 指令位置 | `0x00C6–0x00C7` | 符号付き 32-bit steps | `position.command_steps` |
| ABZO フィードバック位置 | `0x00CC–0x00CD` | 符号付き 32-bit steps | `position.feedback_steps` |
| Direct I/O | `0x00D4–0x00D5` | 符号なし 32-bit 生値 | `driver.direct_io_raw` |
| 現在のインフォメーション | `0x00F6–0x00F7` | 符号なし 32-bit | `driver.present_information` |
| ドライバ温度 | `0x00F8–0x00F9` | 符号付き 32-bit × `0.1 °C` | `driver.driver_temperature_c` |
| モータ温度 | `0x00FA–0x00FB` | 符号付き 32-bit × `0.1 °C` | `driver.motor_temperature_c` |
| フィードバックカウンタ | `0x0120–0x0121` | 符号付き 32-bit steps | `position.feedback_counter_steps` |
| 指令カウンタ | `0x0122–0x0123` | 符号付き 32-bit steps | `position.command_counter_steps` |
| インバータ電圧 | `0x0146–0x0147` | 符号なし 32-bit × `0.1 V` | `driver.inverter_voltage_v` |
| 電源電圧 | `0x0148–0x0149` | 符号なし 32-bit × `0.1 V` | `driver.power_supply_voltage_v` |
| SW1 | `0x014A–0x014B` | 符号なし 32-bit 生値 | `driver.sw1_raw` |
| ID スイッチ | `0x014C–0x014D` | 符号なし 32-bit 生値 | `driver.id_switch_raw` |
| BAUD スイッチ | `0x014E–0x014F` | 符号なし 32-bit 生値 | `driver.baud_switch_raw` |
| RS-485 受信回数 | `0x0150–0x0151` | 符号なし 32-bit | `driver.rs485_reception_count` |
| 内部入力状態 1 | `0x0170` | 16-bit ビットフィールド | 物理入力状態 |
| 内部出力状態 1 | `0x0178` | 16-bit ビットフィールド | HOME/絶対位置/SLS 状態 |
| 内部出力状態 2 | `0x0179` | 16-bit ビットフィールド | アラーム/ready/move 状態 |

### 8.1 内部 I/O のビット対応

| Register | Bit | ソフトウェア上の名称 | 意味 |
|---|---:|---|---|
| `0x0170` | 12 | `fw_ls` | 正方向の物理リミット入力 |
| `0x0170` | 13 | `rv_ls` | 逆方向の物理リミット入力 |
| `0x0170` | 14 | `homes` | HOME センサ入力 |
| `0x0170` | 15 | `slit` | SLIT 入力 |
| `0x0178` | 0 | `home_end` | HOME 完了 |
| `0x0178` | 1 | `absolute_position_enabled` | 絶対位置の有効/有効化状態 |
| `0x0178` | 9 | `fw_sls` | 正方向のソフトウェアリミット状態 |
| `0x0178` | 10 | `rv_sls` | 逆方向のソフトウェアリミット状態 |
| `0x0179` | 1 | `alarm_a` | Alarm A |
| `0x0179` | 2 | `alarm_b` | Alarm B |
| `0x0179` | 3 | `system_ready` | システム準備完了 |
| `0x0179` | 4 | `ready` | 準備完了 |
| `0x0179` | 5 | `pulse_ready` | パルス受付準備完了 |
| `0x0179` | 6 | `moving` | 動作中 |
| `0x0179` | 7 | `information` | インフォメーション |

MEXE02 の入力割り当てが未確認の場合、`fw_ls=false` などは、その時点で該当する内部状態ビットが立っていないことだけを示す。物理センサの存在や使用可能性を証明するものではない。

## 9. 現場の通信と状態スナップショット

### 9.1 上端付近のスナップショット

| 項目 | 値 |
|---|---:|
| `feedback_steps` / `command_steps` | `20491 / 20491` |
| セッション内の最大値 | `20707 steps` |
| アラーム | 十進数 `48` = `0x30` = `OVERLOAD` |
| ドライバ / モータ温度 | `40.8 °C / 38.6 °C` |
| インバータ / 電源電圧 | `25.9 V / 25.9 V` |
| 成功 / 失敗した問い合わせ | `1024 / 0` |
| 連続失敗回数 | `0` |
| RS-485 受信回数 | `9346` |
| セッションのポーリング周波数 | `5 Hz` |

### 9.2 下端のスナップショット

| 項目 | 値 |
|---|---:|
| `feedback_steps` / `command_steps` | `-388 / -388` |
| セッション内の最小/最大/全幅 | `-404 / 20707 / 21111 steps` |
| 換算位置 | 約 `0.152 mm` |
| アラーム | 十進数 `48` = `0x30` = `OVERLOAD` |
| `direct_io_raw` | `2147483648` = `0x80000000` |
| 現在のインフォメーション | `0` |
| ドライバ / モータ温度 | `36.3 °C / 36.3 °C` |
| インバータ / 電源電圧 | `25.9 V / 25.9 V` |
| SW1 / ID / BAUD 生値 | `2 / 1 / 4` |
| 成功 / 失敗した問い合わせ | `7134 / 0` |
| 連続失敗回数 | `0` |
| RS-485 受信回数 | `15454` |
| セッションのポーリング周波数 | `5 Hz` |

### 9.3 下端スナップショットの内部状態

| グループ | 状態 |
|---|---|
| 物理入力 | `FW-LS=false`, `RV-LS=false`, `HOMES=false`, `SLIT=false` |
| ソフトウェア出力 | `HOME-END=false`, `absolute_position_enabled=true`, `FW-SLS=false`, `RV-SLS=false` |
| 実行時 I/O | `ALARM-A=true`, `ALARM-B=false`, `SYS-RDY=true`, `READY=false`, `PULSE-RDY=false`, `MOVE=false`, `INFO=false` |

上記 2 回のスナップショットは、RS-485 通信が安定しており、温度と電圧を取得できること、および `30h` アラーム時に `READY=false` となることを示す。物理/SLS リミットが設定済みであることは示していない。

MEXE02 の「アラームリセット」でアラームを正常に解除できた記録がある。その後の下端スナップショットでは再び `30h` が発生しており、端部付近で過負荷が再発しうる。1 回のリセット成功を恒久的な解決とはみなさない。

### 9.4 2026-09-20 の下端での再発

| 項目 | 値 |
|---|---:|
| `feedback_steps` / `command_steps` | `-394 / -394` |
| 換算位置 | `0.0947 mm` |
| 現在のセッション内の観測最小/最大 | `-404 / 20429 steps` |
| Alarm / READY | `0x30 OVERLOAD / false` |
| 電源 | `26.0 V` |
| ドライバ / モータ温度 | `34.1 °C / 37.6 °C` |

このセッションの `20429` は上端までの完全な測定値ではなく、monitor の今回の起動後に観測した最大値を表す。機械上端の校正には、引き続き 2026-09-19 の全範囲走査で得た `20707 steps` を使用する。

## 10. アラームコードの記録

| 十六進数 | 十進数 | 名称 | 実機での状態 |
|---:|---:|---|---|
| `30h` | `48` | Overload / 過負荷 | 上下端走査中に実測で発生 |
| `66h` | `102` | Hardware overtravel / ハードウェアオーバートラベル | 今回のスナップショットでは未観測 |
| `67h` | `103` | Software overtravel / ソフトウェアオーバートラベル | 今回のスナップショットでは未観測 |

`30h` は「ソフトウェアの最大値超過」を意味しない。過負荷を示すコードであり、現場での発生タイミングは機械端部への到達との関連を示す。ただし原因については、「端部に加わる力による過負荷」という実測に基づく判断として記録する。

## 11. ROS と Dashboard のデータ記録

| 項目 | 現在の設定/表示 |
|---|---|
| Monitor 実行ファイル | `lift_abzo_monitor_node` |
| Modbus モード | function `03` のみ、読み取り専用 |
| Serial | Lift FTDI by-id、ID 1、115200/8E1 |
| 現在のポーリング設定 | `10 Hz`。端点サンプリング時の実測は `5 Hz` |
| 生値 topic | `/lift/abzo_position_raw` (`std_msgs/Int32`) |
| 校正済み topic | `/lift/abzo_position_mm` (`std_msgs/Float32`) |
| 構造化 topic | `/lift/abzo_state` (`std_msgs/String`, JSON schema 3) |
| Dashboard の位置表示 | ABZO mm、feedback steps、command steps、校正範囲 |
| Dashboard の診断表示 | Link、alarm、READY/MOVE、温度、電圧、問い合わせ回数 |
| Dashboard の保護表示 | ROS 通常範囲 `15–185 mm`、motion guard、UP/DOWN の許可状態 |
| Dashboard の復帰 | `/lift/recovery_command` の手動確認状態。AZD アラームのリセット、自動移動、外向き方向の解除は行わない |
| AZD 設定フラグ | `physical_limit_inputs_configured=false`; `software_limits_configured=false` |

Dashboard の「OBSERVED」は、ドライバから直接取得したデータを示す。mm 位置は実測端点で校正した ABZO 値である。「AZD 内部リミット未確認」と「ROS guard 有効」は別々に表示し、一方を他方の代わりにはしない。

## 12. 出典

- ローカルの AZD-KD 公式マニュアル：[HM-60313J.pdf](HM-60313J.pdf)、CN6/CN7、パネルスイッチ、RS-485 の各章
- Oriental Motor AZ Series 機能マニュアル `HM-60262-11E`：<https://www.orientalmotor.com/products/pdfs/opmanuals/HM-60262-11E.pdf>
- Oriental Motor Modbus 設定資料 `HM-60252J`：<https://www.orientalmotor.co.jp/system/files/product_detail/manual/HM-60252J.pdf>
- Oriental Motor `EASM2XF020AZAK` 製品ページ：<https://www.orientalmotor.co.jp/ja/products/detail?hinmei=EASM2XF020AZAK&refFlg=1>
- Oriental Motor `AZD-KD` 製品ページ：<https://www.orientalmotor.co.jp/ja/products/detail?hinmei=AZD-KD>
- Waveshare USB TO RS485 製品ページ：<https://www.waveshare.com/usb-to-rs485.htm>
- Waveshare USB TO RS485 Wiki：<https://www.waveshare.com/wiki/USB_TO_RS485>
- Amazon Japan 購入済み型式：<https://www.amazon.co.jp/-/en/Industrial-converter-RS485-communication-protection/dp/B0931565YQ?th=1>
- 2026-09-19 実機の `/lift/abzo_state` スナップショットと上下端の全範囲走査
