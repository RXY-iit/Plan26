## follower
一時ポート：/dev/ttyACM1
固定パス：/dev/serial/by-id/usb-1a86_USB_Single_Serial_5AE6054086-if00
USB：1a86:55d3 QinHeng USB Single Serial
シリアル番号：5AE6054086

### leader USB ポート：
Leader 5V：/dev/serial/by-id/usb-1a86_USB_Single_Serial_5AE6084777-if00

## 機体への取付外部パラメータ（取付更新後の初期値、2026-09-02）

参考：

- `hardware/real-bot-figure/IMG_0176.jpg`
- `hardware/real-bot-figure/IMG_0177.jpg`
- `hardware/real-bot-figure/IMG_0179.jpg`

SO101 は、D435 カメラのベース上方にある linear motor / 昇降スライダーの取付フレームに固定されています。
2026-09-02 に operator が取付構造を調整し、Arm のベース面を地面と平行にしました。この事実が裏付けるのは roll/pitch を 0 とすることだけです。新しい写真から新たな xyz/yaw を正確に読み取ることはできないため、これらは従来の初期値を暫定的に維持し、二眼の ChArUco データと独立した寸法測定による追加校正を待っています。

現在の `base_link -> arm/world` の取付初期値：

| パラメータ | 初期値 |
|---|---:|
| x | +0.32084 m（現在の運用/校正値。再取付後の独立した寸法測定は未実施）|
| y | +0.01262 m（現在の運用/校正値。再取付後の独立した寸法測定は未実施）|
| z | Lift に応じて `+0.8925～+1.0925 m` の範囲で変化。下端/上端の地上高はそれぞれ `1.005/1.205 m` |
| roll | 0 rad（ベースは地面と平行）|
| pitch | 0 rad（ベースは地面と平行）|
| yaw | -0.01532 rad（現在の運用で使用する前後方向の補正）|

これらの値は実機 Arm とオレンジ色の Preview モデルの両方に使用されます。2026-09-20 に Lift の機械ストロークが `200 mm` であることを再確認したため、従来の `230 mm` の表示スパンは廃止しました。直接測定した Lift 下端の `arm/base_link` の地上高 `1.005 m` と、移動ロボットの `base_link` の地上高 `0.1125 m` を使用しています。現在の動的表示範囲は `base_link Z=0.8925～1.0925 m`、地上高では `1.005～1.205 m` に対応します。この範囲は Arm のベース frame を表し、アームの最高点ではありません。

現在の Z は、校正済み ABZO の `0–200 mm` の位置から動的に対応付けています。X/Y/yaw は既存の校正値・取付推定値であり、今回のアルミフレーム寸法測定で得た結果ではありません。現在の運用では動的 mount publisher から `base_link -> arm/world` を直接配信しており、Lift を `lift_base_link -> lift_carriage_link -> arm_mount_link` という独立した URDF 形状チェーンにはまだ展開していません。
