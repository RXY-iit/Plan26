# Pan/Tilt、Lift、SO101 と二眼カメラの TF 基準

更新日：2026-09-04

## 確認済みの物理的事実

- Pan が回転しても、Lift と SO101 Arm は回転しません。
- 今回の校正中、Lift は機械的な最下端に固定し、動かしません。
- Pan/Tilt の基準姿勢は Pan `267 deg`、Tilt `102 deg` です。
- Lift 最下端時の `arm/base_link` 中心の実測地上高は `100.5 cm` です。
- `arm/base_link` と `camera_bottom_screw_frame` の `22.3–24.2 cm` は、`base_link` の Z 方向の高さの差であり、ユークリッド距離ではありません。
- 実際の ChArUco の寸法は、完全なチェッカーセルが `33.5 mm`、内部の符号化 marker が `16.5 mm`、辞書は `DICT_5X5_100`、盤面は `7 x 5` です。
- 実物写真から、Arm Camera はグリッパー本体側面に固定され、開閉する jaw と一緒に独立して動かないことを確認しています。剛体の親 link としては、現在 `gripper_link` が最も妥当な候補です。最終的に反映する前に、単関節のデータでカメラが wrist-roll・グリッパー本体に完全に追従するか確認する必要があります。

これらは操作者による実機観察と実物測定に基づく事実であり、ソフトウェアの状態から推測したものではありません。

## 維持すべきツリー構造

目標構造：

```text
base_link
├── camera_pan_mount_base               D435 機構の固定ルート
│   └── camera_pan_yaw_link              Pan の動的軸
│       └── camera_tilt_link             Tilt の動的軸
│           └── realsense_holder_link
│               └── camera_bottom_screw_frame -> D435 内部 frames
└── arm/world                            独立した Lift/Arm の動的取付 TF
    └── SO101 kinematic chain
        └── arm/gripper_link
            └── arm_camera_mount_link
                └── arm_camera_color_optical_frame
```

必須条件：

1. Lift/Arm の枝は `base_link` から直接分岐させます。
2. Lift/Arm を `camera_pan_yaw_link` または `camera_tilt_link` の子ツリーにしてはいけません。
3. 各 TF child に対する parent は1つだけとし、別の取付 TF を重複配信してはいけません。
4. D435 内部の color/depth/optical frame は RealSense ドライバーの定義を維持します。ロボットの自作ブラケットの誤差は `realsense_holder_link` に持たせます。
5. Arm カメラの自作ブラケットの誤差は `arm_camera_holder_link` に持たせ、Arm 関節のゼロ点やカメラ内部パラメータに混ぜてはいけません。

## 現在実装済みの移行構造

- `camera_pan_mount_base` を移動ロボットの URDF に追加し、暫定的に `base_link` と一致させています。
- `realsense_holder_link` を追加し、基準姿勢では従来の `base_link -> camera_link` の数値を維持しています。
- SO101/Lift mount TF publisher の parent は `base_link` です。実測地上高は `1.005 m`、`base_link` 自体の地上高は `0.1125 m` のため、配信する最下点の Z は `0.8925 m` です。D435 Pan/Tilt はこれに影響しません。

これは従来の運用結果を維持するための接続構造の移行であり、Pan 軸心、Tilt 軸心、holder の外部パラメータの校正完了を意味しません。

## 2026-09-03 の求解状況

- 有効な130視点で Arm Camera の内部パラメータ校正を完了し、既定の起動経路で実測内部パラメータを使用しています。
- 90サンプルに `/arm/hardware_status.raw_position` が含まれています。
- 「実際の接続構造を満たし、おおむね妥当な精度とし、残差は上位アルゴリズムで補償する」という方針で、Pan/Tilt の直交オフセット軸、Arm mount、Arm Camera holder、表示専用の Arm 関節スケール補正を運用経路に反映しました。
- 完全な bringup では RealSense driver の `publish_tf` を無効にし、校正済み URDF と同じ camera child frame が重複配信されるのを防いでいます。
- 入力、数値、誤差、適用範囲の詳細は `CALIBRATION-RESULT-20260903.md` を参照してください。

## 2026-09-04 の制約付き同時再求解

現在の運用 TF は `solve_joint_extrinsics.py` の同時求解結果に切り替えています。求解器は公開 SO-frame モデルを入力・制約として使用していません。使用したのは、実際の二眼 ChArUco 観測130組、対応する Arm joint states、実測地上高、Pan/Tilt の直交関係、確認済みの機構の接続構造のみです。

校正板の `base_link` に対する絶対 X/Y pose を独立測定していないため、共通の X/Y/yaw gauge は画像から復元できません。そのため Arm mount の X/Y/yaw は取付基準値を維持し、Z は直接測定値を使用します。5サンプルごとに1サンプルを検証用として留保しました。学習データの並進/回転 RMS は `10.60 mm / 1.95 deg`、留保データは `12.44 mm / 2.15 deg`、全130組は `10.99 mm / 1.99 deg` です。完全な結果は `JOINT-EXTRINSIC-SOLVE-20260904.json` を参照してください。

求めた実際の Arm Camera optical 外部パラメータ：

```yaml
gripper_link_to_arm_camera_color_optical_frame:
  xyz_m: [0.005322, 0.054910, -0.051643]
  rpy_rad: [2.530848, 0.025611, -0.149163]
```

公開モデルは外観とオーダー比較の参考に限定し、実測データによる hand-eye 結果を上書きしません。

## 新しいデータで求める量

2台のカメラで同じ ChArUco 板を同時観測し、実際の Pan/Tilt feedback と六軸の `/joint_states` を記録して、次を推定します。

- Pan raw feedback から物理回転角へのゼロ点、方向、スケール
- Tilt raw feedback から物理回転角へのゼロ点、方向、スケール
- `camera_pan_mount_base -> camera_pan_yaw_link` の軸心位置と軸方向
- Pan 軸から Tilt 軸までの固定変換
- `camera_tilt_link -> realsense_holder_link`
- `camera_pan_mount_base -> lift_base_link`
- Lift 最下端での `lift_carriage_link -> arm_mount_base_link`
- SO101 末端の剛体 link から `arm_camera_holder_link` への変換
- `arm_camera_holder_link -> arm_camera_color_optical_frame`

基準姿勢 `267/102` における既存の `base_link -> camera_link` を絶対基準とします。各同期サンプルで、校正板の2台のカメラに対する姿勢から未知の板の絶対位置を消去できるため、板の `base_link` に対する実測値は不要です。ただし露光中は、ロボット、板、Pan/Tilt、Arm が静止している必要があります。

## 次回のデータ取得基準

- 各サンプルに、最新で欠落がなく、すべて有限値の六軸 `/joint_states` を保存します。
- 各サンプルに `/arm/hardware_status` の六軸の直接値 `raw_position` も保存し、raw tick から URDF rad へのスケールとゼロ点を確認します。
- Pan/Tilt は少なくとも `0.8 s`、Arm 六関節も少なくとも `0.8 s` 安定させます。各関節の観測窓内の変動幅は `0.01 rad` 以下とします。
- 最初に `reference_267_102` を取得します。
- `267/102` を維持して、Arm を明確に回転差のある少なくとも10姿勢に変えます。
- Arm を1姿勢に固定し、Pan/Tilt の左・中・右、上・中・下、および組合せ姿勢を取得します。
- 主要な Pan/Tilt 姿勢には増加方向・減少方向の両方から繰り返し到達し、バックラッシュを推定します。
- 毎回、両カメラでそれぞれ少なくとも8個の ChArUco コーナーを検出する必要があります。

## 今後の変更でも維持すべき条件

- 写真から Pan/Tilt 軸心や Arm Camera の固定親 link を推測しないこと。
- 現在の移行用 identity frame を実測外部パラメータと説明しないこと。
- 実際の `/joint_states` がないサンプルで Arm base/hand-eye 外部パラメータを再求解しないこと。
- Lift のソフトウェア推定高さを絶対エンコーダーの測定値として扱わないこと。今回は操作者が確認した物理的な最下端のみを離散的な基準として使用します。

実機で Arm Camera が jaw の開閉に追従しないことを確認済みで、現在の剛体親ノードは `arm/gripper_link` です。今後 `jaw_link` に付け替えてはいけません。機械的取付を変更し、再校正した場合にのみ変更できます。
