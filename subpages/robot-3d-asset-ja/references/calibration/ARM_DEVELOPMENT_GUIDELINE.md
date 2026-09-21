# SO-ARM101 既存の移動ロボットへの統合：調査結果と開発 Guideline

> 日付：2026-08-25<br>
> 段階：調査と方式設計。未実装<br>
> 当面の目標：① 指定ボタンを必要に応じて押下すること；② ロボットアーム前端カメラを用いて周囲を能動的に観察し、ロボットに情報を提供すること<br>
> 本文は [`ARM-plan.md`](./ARM-plan.md) の、上記2つの目標に対する詳細な内容であり、関連機能が既に実装されたこと、または実機による検証を通過したことを意味しません。

## 1. 結論の要点

SO-ARM101 は、安全条件で実行を制限する独立した ROS 2 サブシステムとして既存システムに統合することを推奨する。LeRobot/VLA が機体全体を直接制御する構成にはしない。

```text
自然言語 / Mission Agent
        ↓ 適用範囲を定めた複合スキルだけを呼び出す Skill
robot_skills
  ├── observe_region / inspect_with_arm_camera
  └── press_button
        ↓ ROS Action（推奨）+ 構造化 SkillResult
arm task servers
  ├── viewpoint executor
  └── button press state machine
        ↓
MoveIt / MoveIt Servo / ros2_control
        ↓
SO-ARM101 Feetech driver + wrist camera
```

LeRobot は以下の役割を担う。

- follower/leader 遠隔操作と再キャリブレーション；
- 教示データ取得、再生とオフライン評価；
- 後期 ACT、Diffusion Policy、SmolVLA 等 learned skill の実行アダプタ；
- 決定性 `press_button` / `observe_region` baseline との A/B 比較。

当面、次のことは推奨しない。

- Agent または VLA を直接連続して 6 個の関節目標に書き込みます。
- アームの停止経路、動的 TF、ソフトリミット、指令の調停を確立する前に機体全体へ統合すること。
- 最初から、アーム先端カメラの点群で Nav2 costmap を修正します。
- 未知のボタンに対して、純粋な位置開ループで「前方に 3 cm だけ進む」操作を行います。
- 「カメラが画面を認識した」を「信頼できる3Dボタン位置・姿勢が得られる」とみなします。

## 2. 調査の範囲

今回、読み取り専用の調査のみを行い、本文を追加しました。

- `todo-my/arm-baseline/ARM-plan.md` を読む；
- 現在の `robot_ws` の Agent、Skill、カメラ、URDF、bringup、lift と safety のコード/ドキュメントを読む；
- `/home/matsunaga-h/lerobot`、関連する shell history、LeRobot の出力画像と conda 環境をチェックする；
- LeRobot、MoveIt Servo、ros2_control と既存の SO-ARM ROS 2 プロジェクトの公開資料を参照する；
- ロボットアームに接続、有効化、移動を行わず、ROS 2 機能コードを変更せず、外部依存関係も取付けませんでした。

## 3. 確認済みの現状

### 3.1 既存の移動ロボットアーキテクチャ

現在の移動ロボットの標準構成は次のとおり。

```text
FAST-LIO2 + GICP localization
        ↓
Nav2 MPPI
        ↓
mode switch
        ↓
cmd_vel safety layer
        ↓
omni base
```

詳細はリポジトリ直下の [`README.md`](../../README.md) を参照してください。現在のシステムは、ロボットアームの拡張に適した上位構成を既に備えています。

- [`robot_agent`](../../src/robot_agent/) には `MissionIntent → SkillCall → SkillResult` の実行チェーンが既に存在します。
- [`skill_registry.yaml`](../../src/robot_skills/config/skill_registry.yaml) は、skill の mode、timeout、safety level の前提条件を宣言します。
- [`mission_agent.py`](../../src/robot_agent/robot_agent/agents/mission_agent.py) は、静止状態の実行条件判定、稼働状態の確認、実行イベント、および失敗処理を実装しています。
- [`health_monitor.py`](../../src/robot_agent/robot_agent/nodes/health_monitor.py) は、「直接エビデンスがない限り OK を報告できない」という稼働状態の判定モデルを使用します。
- 現在の `mission_policy.yaml` は、`press_button`、`grasp_object`、`place_object` を `blocked_until_implemented` に明確に列挙しているため、ボタンを押せると思い込むような誤りは発生しません。

これらのインターフェースは拡張すべきであり、既存の Agent と並行して別のタスクシステムを構築すべきではありません。

### 3.2 既存 RealSense 主カメラ機能

既存の RealSense D435 は、pan/tilt 機構を通じて提供されます。

- `/camera/camera/color/image_raw`；
- `/camera/camera/depth/image_rect_raw`；
- カメラ内部パラメータと RealSense 自身の optical frames；
- `set_camera_pose → 角度フィードバックを待つ → 指令後の新しいフレームを取得 → 検出 → 中央へ戻る` プロセス；
- 九視点の実機キャリブレーション姿勢とスキャン profile。

重要な実装：

- [`camera.py`](../../src/robot_skills/robot_skills/executors/camera.py)
- [`perception.py`](../../src/robot_skills/robot_skills/executors/perception.py)
- [`camera_scan_profiles.yaml`](../../src/robot_skills/config/camera_scan_profiles.yaml)
- [`real_camera_poses.yaml`](../../src/robot_skills/config/real_camera_poses.yaml)
- [`perception_agent.py`](../../src/robot_agent/robot_agent/agents/perception_agent.py)

これは再利用可能な「能動観察の制御」の経験ですが、重要な制限事項があります。現在、[`robot.urdf.xacro`](../../src/robot_description/urdf/robot.urdf.xacro) が RealSense をナビゲーションにおける位置・姿勢として固定し、`base_link` に固定されており、pan/tilt joint feedback を用いたカメラ TF の動的な更新が行われていません。したがって：

- 現在の2D 画像検索、OCR、および手動確認は引き続き利用可能です。
- カメラがナビゲーション位置から移動した場合、この固定 TF を正確な3D位置特定またはロボットアームの接触タスクに使用すべきではありません。
- SO-ARM101 の手首カメラは、初めから動的な関節 TF 系列に組み込む必要があり、同じ制約を引き継いではならない。

### 3.3 lift とロボットアーム取付関係

既存のドキュメントでは、lift を「アーム支持ブラケットを昇降させる機構」と定義し、ストロークは約 0–200 mm とされています（[`lift_mechanism.md`](../../hardware/lift_mechanism/lift_mechanism.md) を参照）。しかし、現在の ROS 位置は依然として速度×時間の積分推定に過ぎません。

- 信頼できる物理的基準が確立されていない状態は `UNREFERENCED_SOFTWARE_ESTIMATE` です。
- ABZO/上限/HOME complete はまだ完全な制御閉ループに入っていません。
- Dashboard は現在、lift 能力を `SUPERVISED_ONLY` とみなしています。

SO-ARM101 が実際に lift スライダーに取り付けられている場合、`lift_carriage_link → arm_base_link` はボタンの高さと腕部カメラの位置・姿勢に直接影響します。信頼できる lift 位置がない場合、`base_link → tool0` が正確な動的な TF であると主張することはできません。第1版では、lift を手動確認された機械的な位置に固定するか、信頼できる位置の読み取りを完了してから、多段階ボタンタスクを許可する必要があります。

### 3.4 安全チェーン現状

現在の [`cmd_vel_safety_node.py`](../../src/safety_layer/safety_layer/cmd_vel_safety_node.py) の watchdog、速度制限、および `/emergency_stop` の主な作用は車体 `/cmd_vel_raw → /cmd_vel` に適用されます。物理的な赤色停止ボタンは BLVD DIN3 を用いた観察と検証によって車体 inhibit が確認されていますが、これは SO-ARM101 電源または Feetech torque が切断されることを自動的に証明するものではありません。

したがって、ロボットアーム接続前に明確に区別する必要があります。

1. 車体ソフトウェア停止；
2. 車体物理 inhibit；
3. ロボットアームソフトウェア stop/torque disable；
4. ロボットアーム給電またはハードウェア enable の物理的な切断。

当面の最低条件は 1–3 に直接エビデンスがあることとし、無人接触動作の前に、物理非常停止によってアームへのエネルギー供給も確実に遮断できることが推奨されます。 ROS topic を追加するだけではロボットアーム E-stop とは言えません。

### 3.5 本機 LeRobot/SO-ARM101 履歴エビデンス

`/home/matsunaga-h/lerobot` が存在し、空ディレクトリではないこと：

| 項目 | 調査結果 |
|---|---|
| ソースコード | Seeed-Projects fork、現在の checkout `0f39248` |
| conda env | `lerobot`、Python 3.10.20、LeRobot 0.4.4、PyTorch 2.7.1+cu126 |
| follower | 過去のコマンドでは `so101_follower`、`/dev/ttyACM0` |
| leader | 過去のコマンドでは `so101_leader`、`/dev/ttyACM1`、ポート交換も試した |
| 遠隔操作 | 複数回 `lerobot-teleoperate` を実行 |
| カメラ | `lerobot-find-cameras opencv` を実行し、個別に `/dev/video2/4/6` を試した |
| policy | `${HF_USER}/my_policy` を含む `lerobot-record` を実行 |
| dataset/eval 名 | `act_so101_drop2cap`、`eval_act_so101_drop2cap` |
| ローカルデータ | 対応する Hugging Face LeRobot cache が削除されたことがある。現在のところ、この dataset/policy のローカルコピーは見つかっていない |

`/home/matsunaga-h/lerobot/outputs/captured_images/` に保存されている 2026-04-09 映像は、さらに以下のことを示しています。

- `video2` は赤外スペックルのあるグレースケール画像です。
- `video4` は地面を向いている RGB 画像です。
- `video6` 画面の底には青緑色のグリッパーが見え、基本的には SO-ARM101 腕部/先端カメラの視点であると判断できます。

しかし、`/dev/video6` は列挙結果であり、安定したハードウェア識別子ではありません。以降は、`/dev/v4l/by-id/`、USB、serial、またはカスタムのudev、symlinkに基づいて機器をバインドする必要があります。

また、過去のコマンドには dataset 名に `act` が含まれており、`lerobot-train` または SmolVLA、checkpoint のローカルエビデンスは見つかりませんでした。したがって、現在確認できるのは「learned policy/evaluation を使用したこと」のみで、その policy が必ずしも VLA であったことを確認することはできません。操作者またはリモートの Hugging Face アセットによるさらなる確認が必要です。

### 3.6 現在の LeRobot ドライバで提供できる機能

本機バージョンの `SOFollower`：

- 6 個 STS3215：`shoulder_pan`、`shoulder_lift`、`elbow_flex`、`wrist_flex`、`wrist_roll`、`gripper`；
- motor ID は 1–6；
- `get_observation()` は、デフォルトで関節位置と構成されたカメラを読み込みます。
- `send_action()` は、関節目標位置を書き込みます。
- `max_relative_target` で、一度の相対位置の変化を制限できますが、デフォルト値は `None` です。
- `disconnect()` は、torque disable を構成可能です。
- Feetech control table には `Present_Load`、`Present_Current`、`Present_Voltage`、`Present_Temperature` が存在しますが、SO follower の既定の observation にはこれらの値が含まれていない。

これは、LeRobot driver を再 bring-up するための迅速なツールとして機能するか、その校正意味を借用できることを示しています。しかし、既存の Robot Health/Safety システムに統合するには、継続的な ROS 状態、コマンド watchdog、コントローラライフサイクル、アラーム/温度/電流監視、および単一ライター仲裁が必要です。

### 3.7 機器名衝突リスク

既存のロボットには、少なくとも次のものがあります：

- lift Arduino はデフォルト `/dev/ttyACM0` です。
- OpenRB-150 pan/tilt は安定した `/dev/serial/by-id/...` を使用します。
- SO-ARM101 過去には follower/leader を使用した `/dev/ttyACM0/1` がありました。

したがって、古い LeRobot コマンドをそのまま全体にコピーすると、誤った制御基板を開く可能性があります。SO-ARM101 follower、leader、lift Arduino、OpenRB および両方のカメラは、安定した機器識別テーブルを確立する必要があり、また、 launch は `/dev/ttyACM0` または `/dev/video6` を最終的なデフォルト値として使用できません。

### 3.8 計算リソース境界

今回のセッションにおいて：

- CPU は Intel Core i5-1340P です。
- RAM 30 GiB です。
- `nvidia-smi` は存在しません。
- LeRobot conda 環境において `torch.cuda.is_available()` は `False` です。

これは、現在のソフトウェアセッションで利用可能な CUDA がないことを示すだけであり、将来的に外部 GPU を追加する可能性は排除できません。現段階では、本機が ROS、従来のビジョン、および軽量推論に適していると仮定すべきです。VLA トレーニングや、より大きなリアルタイム VLA 推論には、別途、リモート/独立 GPU、ネットワーク遅延、および断線後の安全停止を評価する必要があります。

## 4. 推奨されるシステム境界

### 4.1 ROS 2 を機体全体の実行基盤とし、LeRobot を着脱可能なアダプタとする

推奨：

```text
ROS 2 ownership
  ├── joint state / TF
  ├── trajectory controller
  ├── MoveIt planning scene
  ├── Servo / Cartesian control
  ├── safety / health / command ownership
  └── mission skill result

LeRobot ownership
  ├── calibration utility
  ├── leader teleop adapter
  ├── dataset recording
  └── learned policy adapter（起動・停止、仲裁可能）
```

LeRobot を排除するためではない。既存の機体全体が ROS 2、Nav2、TF、Dashboard、SkillResult を共通基盤としているためである。LeRobot を唯一のハードウェアプロセスにすると、MoveIt、状態配信、機体全体の安全管理で一貫した状態の参照元を確保しにくくなる。

### 4.2 単一書き込み元原則

同一時刻にロボットアーム command owner が一つしか存在できません：

```text
NONE
 ├── MANUAL_LEADER
 ├── MOVEIT_TRAJECTORY
 ├── MOVEIT_SERVO
 └── LEARNED_POLICY
```

owner を切り替える際には、以下の手順が必要です：

1. 停止し、以前のソースが発行しなくなったことを確認します。
2. 現在の feedback を新しいコントローラ初期状態として設定します。
3. 既存の action chunk/軌跡キャッシュをクリアします。
4. owner、切り替え理由、および時間を記録します。
5. 任意の stale command、通信タイムアウト、mode の変更、または E-stop が発生した場合、実行を継続する代わりに HOLD/STOP に移行します。

### 4.3 推奨 ROS インターフェース

最終 topic/action 名は実装前に調整可能であり、以下の意味合いが推奨されます。

| インターフェース | 推奨用途 |
|---|---|
| `/joint_states` | 機体全体統一関節位置/速度/effort；2つの publisher が同一関節で競合するのを避ける |
| `/arm_controller/follow_joint_trajectory` | 標準関節軌跡 action |
| `/gripper_controller/gripper_cmd` | 標準グリッパー action、ハードウェアの適合が可能であれば |
| `/arm/command_owner` | 現在唯一の書き込み元と lease 状態 |
| `/arm/health_summary` | 位置の鮮度、通信、load/current、温度、電圧、torque、calibration、fault |
| `/arm/stop` | ソフトウェアによる迅速停止/hold；物理的な非常停止の代替にはならない |
| `/arm_camera/color/image_raw` | 腕部 RGB、既存の `/camera/...` 名称を再利用できない |
| `/arm_camera/color/camera_info` | 腕部カメラ独立内部パラメータ |
| `/arm_camera/diagnostics` | フレームレート、接続断、USB 識別と露光状態 |
| `ObserveRegion` action | 複数視点による能動的な観察を行う長時間のタスク |
| `PressButton` action | ボタン位置決め、接近、接触、検証と撤回を行う長時間のタスク |

既存の `SkillClient.execute_skill()` は同期呼び出しです。単一の `set_camera_pose` は同期実行可能ですが、完全なボタンタスクと複数視点観察は ROS Action で実装する必要があり、feedback、cancel とタイムアウトを得られます。`robot_skills` executor は action result を既存の `SkillResult` に変換します。

### 4.4 推奨 TF ツリー

ロボットアーム取付が lift 上にある場合：

```text
map
└── odom
    └── base_footprint
        └── base_link
            ├── livox_frame
            ├── existing_realsense_pan/tilt chain
            └── lift_base_link
                └── lift_carriage_link       # prismatic joint，信頼できる位置からのものである必要あり
                    └── arm_mount_link       # 実測取付外部パラメータ
                        └── arm_base_link
                            └── ... arm joints ...
                                └── tool0
                                    ├── button_tool_link
                                    └── arm_camera_link
                                        └── arm_camera_color_optical_frame
```

記録必須：

- `arm_mount_link → arm_base_link` の実測 xyz/rpy；
- TCP はグリッパー中心か、ボタン工具の先端か；
- `tool0 → arm_camera_link` hand-eye 外部パラメータ；
- 各画像が露光される際の joint state と TF 時間；
- lift 位置の由来と信頼状態。

TF は「命令目標角」で「実際角度」を偽装できません。実際 feedback を取得し、かつ時間的に新鮮である必要があります。

## 5. 下位層統合経路

### 5.1 優先経路：ros2_control + MoveIt

ROS 2 Humble の `joint_state_broadcaster`、`joint_trajectory_controller` と MoveIt Servo は、現在の要求を完全に満たします。

- joint state を統一して配信；
- FollowJointTrajectory と軌道許容差；
- MoveIt 計画、自己衝突/環境衝突チェック；
- Servo の関節/Cartesian 増分制御、特異点と衝突減速；
- 既存の ROS 2 lifecycle、diagnostics と action cancel 方式と一貫性がある。

外部プロジェクト [`ros-physical-ai/ros2_so_arm`](https://github.com/ros-physical-ai/ros2_so_arm) には SO-ARM100/101 description、Feetech ros2_control driver、MoveIt とシミュレーションアセットが含まれており、spike の候補ソースとして利用できます。しかし、現在のリポジトリ README は主に `so_arm100_moveit_config` を示しており、SO-101 が `so_arm101_description` を使用することのみを示しています。検証されていない限り、その SO-101 MoveIt 設定、関節方向、キャリブレーション範囲、Humble 互換性、および本機ハードウェアが完全に利用可能であると断定することはできません。

vendoring/fork を決定する前に、以下の読み取り専用または mock 検証を行います。

1. ライセンスと依存関係を受け入れられるか。
2. ROS Humble で build できるか。
3. SO-101 mesh、link 長、joint axis が実機と一致するか。
4. motor ID、baud、正規化と本機の LeRobot calibration を対応付けられるか。
5. mock hardware で `joint_state_broadcaster`、trajectory controller、MoveIt をすべて起動できるか。
6. 実機 driver が timeout、torque disable、limit、temperature/current diagnostics に対応するか。
7. leader teleop/LeRobot と同時にシリアルポートへ書き込まないか。

条件を満たせない場合は、本プロジェクト専用の `SystemInterface` を実装する。一時的な topic bridge を作り、そのまま長期的に依存する構成は避ける。

### 5.2 LeRobot bridge の位置

独立した adapter を設計できます。どちらか一方を選択してください：

- leader teleop 入力を仲裁された ROS trajectory/jog に変換します。
- policy action を制限された ROS joint target/Servo 入力に変換します。

bridge では次を必須とする。

- 空でない `max_relative_target` または同等の周期関節 delta 制限。
- action chunk の破棄と鮮度確認。
- 出力周波数 watchdog。
- 関節位置/速度/温度/load/current 境界。
- command owner lease。
- policy 推論異常、ネットワーク断線、カメラ stale 後に直ちに hold します。

## 6. ターゲット A：指定されたボタンを押す

### 6.1 「指定ボタン」の定義

`press_button("3")` だけでは仕様が不十分であり、少なくとも以下の点を明確にする必要があります。

```yaml
panel_id: elevator_A
button_id: floor_3
expected_label: "3"
approach_side: front
verification: indicator_or_panel_state
```

ボタンは、難易度が異なる3つのソースから取得できます。

1. **既知の固定パネル + ティーチング pose**：リスクが最も低い baseline；
2. **既知のパネル + ビジョン修正**：推奨される短期目標；
3. **未知のパネル + OCR/汎用検出**：今後の汎化目標。

第1段階では、テストボタン/低リスクパネルを使用し、エレベーター、非常停止、機器電源などの実際の重要なボタンを開発用治具として直接使用することはできません。

### 6.2 推奨状態遷移

```text
VALIDATE_REQUEST
  ↓
CHECK_SAFETY_AND_OWNER
  ↓
BASE_STATIONARY + ARM/LIFT HEALTHY
  ↓
MOVE_TO_OBSERVATION_POSE
  ↓
DETECT_PANEL_AND_BUTTON
  ↓
ESTIMATE_TARGET + CONFIDENCE GATE
  ↓
PLAN_TO_PRE_PRESS
  ↓
VISUAL_REFINE
  ↓
SLOW_APPROACH_ALONG_NORMAL
  ↓
CONTACT_DETECT / MAX_TRAVEL / TIMEOUT
  ↓
DWELL
  ↓
RETREAT
  ↓
VERIFY_BUTTON_EFFECT
  ↓
STOW OR REPORT FAILURE
```

失敗時には、無闇に繰り返しボタンを押さないでください。以下の区別が必要です。

- `BUTTON_NOT_FOUND`
- `BUTTON_AMBIGUOUS`
- `POSE_CONFIDENCE_LOW`
- `TF_STALE`
- `IK_FAILED`
- `COLLISION_RISK`
- `CONTACT_NOT_DETECTED`
- `MAX_PRESS_TRAVEL_REACHED`
- `ARM_OVERLOAD`
- `BUTTON_EFFECT_NOT_VERIFIED`
- `CANCELLED_BY_SAFETY`

### 6.3 ボタンの3D位置特定方式

手首カメラが RGB のみの場合、単一フレームの検出枠から信頼できる押下深さや面法線を直接求めることはできない。次の優先順で検討する。

1. テストパネルモデルが既知、または AprilTag/ArUco を補助として使用し、パネル pose を取得します。
2. 既存の D435 を使用してパネルの粗い3Dを取得し、腕部 RGB の先端 image-based visual servo を行います。
3. 複数視点/既知のロボットアームの動作で幾何学的な推定を行います。
4. 腕部 RGB-D または小型 ToF を交換/追加します。
5. 最後に learned 6D pose を検討します。

どの方式でも、hand-eye calibration と実際の露光時の TF が必要です。

### 6.4 接触戦略

SO-ARM101 には確認済みの先端六軸力センサーはありません。Feetech は `Present_Load`/`Present_Current` を読み取れますが、これらは校正済みの TCP 力を表すものではない。

- まず軟質のテストボタンを使い、無負荷、動作、拘束、接触時の値の分布を測定する。
- 低速、小刻みな移動、最大変位、最大時間、最大 load/current 複数境界を使用します。
- 「位置誤差 + load/current 変化 + 視覚動作」の組み合わせで接触を判断します。
- 分布が不安定な場合は、弾性ボタン工具または小型力/触覚センサーを追加します。
- 硬いグリッパ先端を直接使用することは推奨されず、円頭、柔軟性を持つ、交換可能な button tool を推奨します。

### 6.5 ボタンタスクの段階別受入基準

| Gate | シナリオ | 最低限の推奨受入基準 |
|---|---|---|
| P0 | mock/sim、固定ターゲット pose | 計画、キャンセル、タイムアウト、経路撤回が全て繰り返し可能 |
| P1 | 軟質テストボタン、完全ティーチング pose | 30 回でリミット超過/衝突なし、成功率 ≥ 90%，全ての失敗は原因究明可能 |
| P2 | 既知パネル、位置の小範囲変動 | 30 回成功率 ≥ 90%，誤ったボタンの押下 0 回 |
| P3 | OCR/label 指定ボタン | 信頼度不足時は拒否；誤ったボタンの押下 0 回は成功率より優先 |
| P4 | Nav2/lift との連携 | base 停止、lift の基準位置が信頼できる、arm healthy 後に実行 |
| P5 | 重要機能に関わらない実機器 | オペレーター立会、単回確認、完全ログ後に段階的に解放 |

ボタンのタスクにおける主要な安全指標は「誤ったボタンを押さない」ことと「安全に復帰可能である」ことであり、平均成功率のみを報告することはできません。

## 7. 目的 B：アームカメラによる能動観察

### 7.1 機能の位置付け

アームカメラと既存の RealSense の役割は、以下のように区別することをお勧めします。

| カメラ | 初期役割 |
|---|---|
| 既存の D435 | ナビゲーション用の障害物検出、固定/限定的な pan-tilt の RGB-D 粗観察 |
| SO-ARM101 アームカメラ | 近距離、遮蔽物の裏側、異なる高さ/角度での積極的な RGB 観察 |

ロボットアームは、自由に回転できる「高価なジンバル」ではありません。能動観察は、衝突、ケーブル、作業空間、車体外輪郭、および周囲の人員を考慮する必要があります。

### 7.2 推奨 `ObserveRegion` 行動

入力例：

```yaml
target:
  frame_id: base_link
  region_id: front_panel
purpose: read_label
view_profile: panel_close_range
max_views: 5
return_stow: true
```

出力には少なくとも以下のものが含まれます：

```yaml
observations:
  - image_path: ...
    camera_id: arm_camera
    optical_frame: arm_camera_color_optical_frame
    capture_stamp: ...
    joint_state_stamp: ...
    camera_pose: ...
    viewpoint_id: ...
    detections: ...
coverage: ...
stop_reason: target_found | exhausted | safety | timeout
```

推奨されるステートマシン：

```text
BASE_STATIONARY
  ↓
ARM HEALTH / CAMERA HEALTH / TF FRESH
  ↓
SELECT NEXT APPROVED VIEWPOINT
  ↓
COLLISION-CHECKED MOVE
  ↓
SETTLE + CAPTURE FRESH FRAME
  ↓
DETECT / OCR / SCORE INFORMATION GAIN
  ↓
FOUND ? RETURN RESULT : NEXT VIEW
  ↓
RETURN STOW
```

現在 `capture_observation`、`detect_known_object`、artifact および `SkillResult` の考え方を再利用できますが、インターフェースには以下のものを追加する必要があります：

- `camera_id` / image topic；
- `optical_frame`；
- capture timestamp；
- exposure 時のロボットアーム pose；
- カメラ health と TF freshness；
- 複数カメラ observation は、source metadata がない同じリストに混在できません。

### 7.3 初期制限

第一版では以下の点を規定する必要があります：

- 車体が静止した後でのみロボットアームの展開観察が可能；
- lift の固定または信頼性の高い referenced の確保；
- 承認済みの関節観察姿勢のみを使用；
- 各姿勢は self-collision、車体 collision およびケーブルの検査を経る；
- 到着し安定してから新しいフレームを取得；
- 完了後 `arm_stow` に戻り、stow を確認してから車体の自動移動を許可；
- 人が接近した場合はオペレーターが停止させ、信頼性の高い人員安全区域モニタリングが確立されるまで待機。

腕部カメラを Nav2 の継続的な障害源として扱わないのは、理由があります：

- 外部パラメータが継続的に変化します。
- 視野がロボットアーム/グリッパーで遮蔽される可能性があります。
- RGB カメラに深度機能がない可能性があります。
- 展開 arm を行うと、機体全体 footprint が変化します。
- カメラと arm motion の時間同期エラーが発生すると、誤った障害点が発生します。

後で動的な point cloud を追加する場合、joint feedback + 時間同期を用いて毎フレーム TF を行い、移動ロボット footprint/禁行状態を同期して更新する必要があります。

### 7.4 能動観察の受入基準

| Gate | 検査内容 |
|---|---|
| O0 | 機器名、カメラ内部パラメータ、30 Hz/目標フレームレート、断線検出 |
| O1 | 10 個の検査姿勢、各 50 回の到達でリミット超過なし、明らかなケーブルの引っ張りなし |
| O2 | 画像、joint state、TF 時間の一致；繰り返し観察する静的キャリブレーション板の pose 誤差を定量化可能 |
| O3 | ターゲットは定義済みの領域内にあり、少なくとも一つの視点からターゲットを検出；ターゲットが見つからない場合は、明確に exhausted を返す |
| O4 | Mission Agent が呼び出し可能、cancel 後に停止し安全に stow へ戻る |
| O5 | arm が stow でない場合は車体 AUTO を禁止。最新の stow feedback を確認してから解除 |

## 8. 段階的な開発計画と Gate

### Phase 0：事前に議論/決定する必要がある事項

制御コードは記述せず、先に完了させる：

- follower/leader/カメラの型番、USB serial、`by-id`、給電とケーブルのリスト；
- SO-ARM101 取付位置、向き、lift carriage に固定されているか；
- 腕部カメラ型番、RGB/深度機能、レンズ FOV、実際の mount；
- ボタン対象、パネル高さ、ボタンサイズ、ストロークと許容押圧力；
- 物理非常停止が arm power/enable を遮断できるか；
- 過去の LeRobot calibration、dataset と policy タイプを回復または確認する。

**完了条件：** 本文第 13 節の高優先度問題に答えがある。

### Phase 1：独立した作業台で SO-ARM101 baseline を再構築

- アームを移動車体にまだ搭載しないか、車体の電源を切って固定する；
- 安定した USB 名を確立する；
- calibration をバックアップする；
- follower/leader teleop を行う；
- position/load/current/temperature/voltage を読み取る；
- 通信周波数、最大 gap、断線動作を測定する；
- 非空 per-joint delta limit を構成する；
- `home`、`stow`、`observation_safe` の姿勢を確立する。

**完了条件：** 50 回の `stow → test pose → stow`、通信の喪失、関節越界、不可解なドリフトがないこと；USB の取り外し/policy の停止 は hold または torque disable を引き起こし、最後のコマンドを継続することではない。

### Phase 2：ROS 2 driver、URDF、コントローラと安全

- mock で外部 `ros2_so_arm` の候補を検証する；
- ros2_control driver のソースを特定する；
- 機体全体 URDF に arm/lift/camera/TCP を加える；
- joint state、trajectory、gripper controller を行う；
- command owner を行う；
- `/arm/health_summary` を行う；
- software stop と物理的な停止チェーンを検証する；
- MoveIt self-collision と車体 collision model を行う。

**完了条件：** RViz と実機方向が一致すること；controller cancel/timeout が有効であること；stale feedback、overtemperature、communication loss、E-stop 各自に可観測結果があること。

### Phase 3：手首カメラの能動観察 baseline

- カメラ安定名、内部パラメータ、hand-eye；
- 事前定義した安全な viewpoint library；
- `ObserveRegion` action；
- 共有/拡張 perception artifacts；
- Agent skill adapter；
- arm stow ↔ base motion interlock。

**完了条件：** O0–O5 を通過し、失敗時に展開ロボットアーム後の車体移動を許可する状態を残さないこと。

### Phase 4：固定教示 pose テストボタン押下

- 柔軟性を持つ button tool を取り付ける；
- 固定パネル/固定 lift/固定 base；
- pre-press、slow approach、contact、dwell、retreat；
- load/current/position residual baseline を構築する；
- PressButton action と失敗コードを実装する。

**完了条件：** P0–P1 を通過すること。

### Phase 5：視覚修正後の指定ボタン押下

- 既知パネル pose；
- ボタン label/ID と幾何配置；
- D435 概略位置推定または fiducial；
- 腕部視覚 refine；
- 押下後視覚/指示灯/外部状態検証。

**完了条件：** P2–P3 を通過し、誤ったボタンは 0；信頼度が不十分な場合は実行を拒否する。

### Phase 6：機体全体の Mission Agent との連携

各関節を個別に公開するのではなく、複合 skill を追加することを推奨します。

```text
arm_get_status
arm_stow
observe_region
inspect_with_arm_camera
press_button
cancel_arm_task
```

Mission plan の例：

```text
resolve target
→ Nav2 approach
→ await base stationary
→ verify lift reference
→ acquire arm owner
→ observe/locate panel
→ request human confirm（初期状態）
→ press_button
→ verify
→ arm_stow
→ release owner
```

**終了条件：** dry-run、sim/mock、実機 supervised の３つの mode に明確なサポートマトリックスが存在し、Dashboard が arm/camera/button task の直接的なエビデンスを表示できること。

### Phase 7：オプションの learned policy/VLA

P2/O4 の確実な baseline が得られた後にのみ実施します。

- 過去の ACT policy を復元するか、dataset を再取得します。
- observation/action key、カメラ命名、calibration バージョンを安定させます。
- learned policy を `press_button_learned` またはビジョン refine サブモジュールとしてパッケージ化します。
- モデルが owner、limits、collision、stale data および E-stop を回避できないようにします。
- geometric baseline と同じテストセット、成功定義、および失敗分類を使用します。

VLA は、「異なる外観パネル/言語コマンド/多視点意味選択」を後で解決するのに適しており、最初のロボットの識別、TF、軌跡、接触安全を代替するのには適していません。

## 9. 提案される将来の package 区分

以下はあくまでディレクトリの提案であり、今回は作成されていません。

```text
src/
├── so_arm101_description/       # または審査を経て外部引用 package
├── so_arm101_hardware/          # ros2_control SystemInterface + diagnostics
├── so_arm101_moveit_config/
├── arm_camera_driver/           # 通常の v4l2_camera では不足する場合
├── arm_task_server/
│   ├── observe_region_action
│   └── press_button_action
├── arm_safety/
│   ├── command_owner
│   ├── interlocks
│   └── arm_health_summary
└── lerobot_ros_adapter/         # leader / dataset / learned policy adapter
```

既存の package の変更点は以下の通りです。

- `robot_description`：複合車体、lift、arm、wrist camera；
- `robot_bringup`：独立 `arm:=false` デフォルトスイッチ。ハードウェア未検証前にデフォルトで起動できない；
- `robot_skills`：registry、executor、result codes；
- `robot_agent`：intent/parser/plan/health gate；
- `health_monitor`：arm、wrist camera、stow、command owner、active task エビデンス；
- Dashboard：新規 arm capability を追加。UNKNOWN は OK として表示しない。

## 10. テストとエビデンス戦略

### 10.1 テスト階層

1. 純粋な Python/C++ unit：schema、limit、状態遷移、failure mapping；
2. mock ros2_control：trajectory、cancel、controller switching；
3. MoveIt/RViz：TF、IK、collision、stow；
4. 卓上 follower：低速、無移動車体；
5. 機体全体静止 supervised；
6. Nav2 + arm のタスクレベルテスト；
7. learned policy シャドウモードと制限された実機評価。

### 10.2 実機運用ごとに記録する内容

- git commit、LeRobot/ROS package version；
- calibration ID/hash；
- URDF/SRDF/config hash；
- USB stable identity；
- `/joint_states`、controller state、owner、arm health；
- `/tf`、`/tf_static`、lift position/reference；
- wrist image、CameraInfo、capture timestamps；
- requested/action-sent/feedback positions；
- load/current/temperature/voltage；
- action feedback/result、失敗コード、operator stop；
- ボタン検出、目標選択、接触と検証エビデンス。

policy の observation/action だけを記録するだけでは不十分です。機体全体 safety、TF、owner と health がない場合、失敗後も原因を特定できません。

### 10.3 故障注入

少なくとも以下の項目をカバーする：

- follower USB の取り外し。
- 手首カメラの取り外し/フリーズ。
- 関節フィードバックの更新停止。
- policy/bridge の異常終了。
- action のキャンセル。
- base が静止状態から移動要求へ遷移。
- lift の基準位置が未確立。
- ボタン検出結果が複数存在。
- 接触 load の上限超過。
- MoveIt の collision/IK 失敗。
- ソフトウェア E-stop と物理 E-stop。

各項目は「アームが実際に何をしているか、Dashboard 何を表示しているか、タスクが何を返すか」を必ず定義しなければなりません。

## 11. 主要なリスクと対応策

| リスク | 現在の根拠 | 対策 |
|---|---|---|
| `/dev/ttyACM*` 誤った機器を開く | follower/leader/lift 過去のポート重複 | 全てを stable ID に変更し、driver でハードウェア識別情報を照合を行う |
| `/dev/video6` の変化 | 2026-04-09 の結果の列挙のみ | `/dev/v4l/by-id`/udev symlink + camera serial |
| 動くカメラに誤った TF を使用 | 既存の D435 URDF は固定 Nav pose | アームカメラを完全な joint TF に投入；露光時間で照会する |
| lift 高度の信頼性がない | 現在は主にソフトウェア積分推定 | 初期固定 lift；その後 ABZO/limit/home direct feedback を接続する |
| 非常停止は車体のみ停止 | 現在 software safety は cmd_vel を向いている | arm torque/power 専用の停止チェーンと直接検証 |
| 複数のプログラムが同時に arm を書く | LeRobot、MoveIt、teleop は全て書ける | command owner lease、単一書き込み者 |
| 開ループの押下でボタン/arm を破損 | 先端の F/T エビデンスがない | 柔軟性を持つなツール、低速、短ストローク、多閾値、テスト治具 |
| 誤ってボタンを押下 | OCR/検出が多解の可能性 | panel/button ID、信頼度ゲート、初期の人手確認、誤ったボタンの押下を許容しない |
| アームカメラがナビゲーションセンサーとして偽の障害を発生させる | 動的な外部パラメータと遮蔽 | 初期は静止したオンデマンド観察のみを行い、costmap には投入しない |
| learned policy の説明できない失敗 | 過去の policy/dataset 情報が不完全 | まず確定的 baseline を決定し、その後 A/B を行う；完全なバージョン情報と運用ログ |
| 本機の計算能力がリアルタイム VLA に追いつかない | 現在利用可能な CUDA がない | 従来のビジョン優先；別の機械での推論もローカル watchdog が必要 |

## 12. 最初のラウンドの実施前の推奨される意思決定

下記の質問が確認されるまで、実機動作コードの作成を開始することは推奨されません。先に URDF/mock spike を行うことはできますが、follower は有効にしないでください。

### 高優先度、システム構造を決定する

1. **SO-ARM101 の実際の取り付け位置はどこか。** 既存の 0–200 mm lift carriage 上か。取り付け方向と高さはいくつか。
2. **手首カメラの具体的な型式は何か。** RGB のみか。保存画像の青緑色のグリッパカメラを引き続き使用する予定か。
3. **アームの物理的停止方法は何か。** 赤い停止ボタンは arm 電源/enable を切るのか、BLVD 車体だけに作用するのか。
4. **最初に押すボタンは何か。** テスト治具、パネル、エレベータ、機器制御のいずれか。寸法、ストローク、高さ、許容力はいくつか。
5. **対象の「指定」方法は何か。** 固定 ID/位置、文字/OCR、色、自然言語のいずれか。

### 中優先度、第一版アルゴリズムを決定する

6. テストパネルに AprilTag/ArUco を貼り、信頼できる幾何 baseline を先に構築できるか。
7. 柔軟性を持つ button tool または小型の力/触覚センサを追加できるか。
8. 能動観察時は車体を完全に停止し、観察後に arm を stow に戻してよいか。それとも移動しながらの観察が必要か。
9. 手首カメラの結果は Agent/人への提示だけか、3D 地図/障害物の生成にも必要か。
10. 初版のボタンタスクに lift は必須か。必須でなければ物理高さを固定することを推奨する。

### 過去資産の確認

11. `${HF_USER}/my_policy`当時、ACT、Diffusion Policy、SmolVLAまたは他のモデルであったか？
12. Hugging Face上に`act_so101_drop2cap` / `eval_act_so101_drop2cap`とcalibrationのバックアップは残っているか？
13. follower、leaderと腕部カメラは現在も当時の同一ハードウェアであり、機械組立とモーター零点に変更はないか？

## 13. 優先的に議論すべき3つの質問

最も迅速に実行可能な次の段階に入るために、以下の3つの質問にまず答えることを推奨する。

1. SO-ARM101、lift、腕部カメラの現在の実際の取付写真または寸法関係；
2. 最初のテストボタンの物理的な形状、位置と「押し込み成功」として観測可能な信号；
3. 既存の非常停止が実際にSO-ARM101を切断するか？もしそうでない場合、arm power/enable interlockを追加することを許可するか？

この3つの回答によって、URDF/TF、接触方式、および実機の Phase 1–2 へ進めるかが決まる。

## 14. 外部参考（調査時点：2026-08-25）

- [LeRobot SO-101 公式ドキュメント](https://huggingface.co/docs/lerobot/en/so101)：キャリブレーション要件および follower/leader ワークフロー。
- [LeRobot SO follower implementation](https://github.com/huggingface/lerobot/blob/main/src/lerobot/robots/so_follower/so_follower.py)：position observation、`send_action` および `max_relative_target`。
- [ros2_control Humble joint_state_broadcaster](https://control.ros.org/humble/doc/ros2_controllers/joint_state_broadcaster/doc/userdoc.html)：標準 joint state 公開。
- [ros2_control Humble joint_trajectory_controller](https://control.ros.org/humble/doc/ros2_controllers/joint_trajectory_controller/doc/parameters.html)：trajectory command/state interface と tolerance 構成。
- [MoveIt Servo Humble](https://moveit.picknik.ai/humble/doc/examples/realtime_servo/realtime_servo_tutorial.html)：Cartesian/joint servo、特異点と衝突チェック；同時に有効な URDF/SRDF、コントローラと高速かつ正確な joint feedback を明確に要求。
- [ros-physical-ai/ros2_so_arm](https://github.com/ros-physical-ai/ros2_so_arm)：評価可能な SO-ARM100/101 ROS 2 description/driver/MoveIt/シミュレーション候補は、本プロジェクトの互換性検証を通過したものではない。

## 15. 2026-08-29 実機再キャリブレーション後の実施更新

本節は 2026-08-29 に操作者の監督下で完了した読み取り専用機器識別、カメラ確認および follower 再キャリブレーション結果を記録し、追加の Dashboard 要件を実装可能なインターフェースに変換します。第 3、8、9、12 節の一部の「待確認」状態を更新しますが、ROS コントローラ、Dashboard arm コントロールまたはボタンタスクが実装されたことを意味しません。

### 15.1 確認済みのハードウェア事実

| 項目 | 現在の確認値 |
|---|---|
| arm | SO-ARM101 follower のみ接続；leader なし |
| 給電 | 12 V キット |
| follower USB | QinHeng `1a86:55d3`、serial `5AE6054086` |
| follower 安定ポート | `/dev/serial/by-id/usb-1a86_USB_Single_Serial_5AE6054086-if00` |
| follower 一時的な列挙名 | 今回は `/dev/ttyACM1`。launch の既定値には設定しない |
| lift USB | Arduino Uno serial `03536383236351E062C1`、現在 `/dev/ttyACM0` |
| wrist camera | Sonix/ARC USB2.0 CAM1、USB ID `05a3:9230` |
| wrist camera 安定パス | `/dev/v4l/by-id/usb-Sonix_Technology_Co.__Ltd._USB2.0_CAM1_USB2.0_CAM1-video-index0` |
| wrist camera 検証 | 640×480 実写画面底部に青緑色のグリッパーが明確に確認でき、arm camera であることを確認 |

「follower USB を抜く → デバイス消失；再接続 → 追加 `1a86:55d3`/`ttyACM1`」でポート差分確認を完了しました。旧コマンド中の `/dev/ttyACM0` は現在 lift に対応し、follower の既定ポートとして引き続き使用してはならない。

### 15.2 新 calibration 基準

オペレーターは、旧 calibration がモーター交換後に得られた有効な過去の参考値であることを確認し、再キャリブレーションを決定しました。2026-08-29 は安定した follower ポートと新しい ID を使用して一度完全なキャリブレーションが完了しました：

```text
robot type: so101_follower
robot id: follower_12v_recal_20260831_v2
file: /home/matsunaga-h/.cache/huggingface/lerobot/calibration/robots/so_follower/follower_12v_recal_20260831_v2.json
sha256: 276e40239a27baa4b910d9f1f384e934bf70265e8f558fbc51e4266ffcf5f68c
```

記録値：

| joint | homing_offset | range_min | range_max |
|---|---:|---:|---:|
| shoulder_pan | -1624 | 659 | 3040 |
| shoulder_lift | -1243 | 886 | 3249 |
| elbow_flex | 1285 | 850 | 2999 |
| wrist_flex | 1645 | 781 | 3106 |
| wrist_roll | -1445 | 0 | 4095 |
| gripper | 1569 | 1801 | 3238 |

`shoulder_pan` の今回の記録範囲は旧ファイルより狭く、オペレーターは現在の結果を保持することを明確に選択しました。以降のすべてのソフトウェアリミット、URDF 関節方向、プリセット姿勢、および実機テストは、現在の calibration を検証対象の基準として使用し、旧数値との整合性を図るために機械関節を強制的に押し付けることはできません。`wrist_roll=0..4095` は現在の LeRobot で実現された固定の全回転範囲であり、走査漏れではない。

以下のルールは維持する必要があります：

- Dashboard、ROS driver および運用ログはすべて calibration ID/hash を表示します。
- calibration hash が不一致の場合、実機動作 capability は `BLOCKED` になります。
- オンラインのサンプル姿勢、上流のハードコーディング offset および旧 policy は、本機の安全姿勢として直接使用できません。
- 既存の ACT policy の評価を再開する場合、訓練時の calibration と新 calibration の差異を記録する必要があります。

### 15.3 URDF/ROS 資産選択更新

本機は現在 SO-ARM101 URDF または mesh を搭載していません。 2つの上流ソースを優先的に評価できます：

1. [`TheRobotStudio/SO-ARM100/Simulation/SO101`](https://github.com/TheRobotStudio/SO-ARM100/tree/main/Simulation/SO101)
   - `so101_new_calib.urdf`、mesh および MuJoCo の説明を提供します。
   - `new_calib` の関節仮想零点は走査範囲の中点にあり、現在の LeRobot キャリブレーション意味と一致します。
   - 上流から、base collision mesh が計画/シミュレーションの問題により削除されたことが明確に示されており、gripper の LeRobot `0..100` マッピングはモデルに完全に反映されていないため、完成した衝突モデルとして直接使用することはできません。
2. [`ros-physical-ai/ros2_so_arm`](https://github.com/ros-physical-ai/ros2_so_arm)
   - `so_arm101_description`、mesh、RViz、Gazebo/MuJoCo および `feetech_ros2_driver` インターフェースを提供します。
   - `mock_components` パスから直接検証を開始し、`/robot_description`、`/joint_states` およびコントローラを検証できます。
   - 現在の real-hardware xacro には固定 motor offset が含まれており、これらの数値は本機 LeRobot calibration と等しくないため、まず駆動換算を調査し、そのまま実機を起動してはなりません。

採用順序：

```text
上流 URDF/mesh 読み取り専用 監査
  → mock_components 起動
  → RViz/Lichtblick 方向と関節名検証
  → 本機 calibration から ROS joint へ の換算テスト
  → torque-disabled 状態フィードバック
  → 監督下での低速単関節テスト
  → 多関節軌道と MoveIt
```

### 15.4 RViz 可視化 + Dashboard Arm 制御

第一版ではブラウザで3Dモデルを繰り返しレンダリングしません。既存のRViz構成には、`/robot_description`の`RobotModel`が含まれています。URDFをSO101と組み合わせると、実際のarmが、実際の`/joint_states`とTFに合わせて自動的に表示されます。Dashboardは、状態、制御権、候補目標、プリセット姿勢、およびタスクtriggerのみを担います。

```text
RViz
┌─────────────────────────────────────────────────────────────┐
│ 全体 + SO101 actual model                                  │
│ TF / tool0 / wrist camera                                  │
│ candidate/planned trajectory ghost + collision scene       │
└─────────────────────────────────────────────────────────────┘

Dashboard /arm
┌──────────────────────────────┬──────────────────────────────┐
│ Arm health / ownership       │ Approved poses / actions     │
│ calibration / USB / camera   │ STOW / HOME / OBSERVE_*      │
│ controller / task / faults   │ 周囲を観察 / ボタンテスト          │
├──────────────────────────────┼──────────────────────────────┤
│ Joint target editor          │ Validation / execution       │
│ actual ─────────────         │ limits / collision / owner   │
│ target ─────●───────         │ preview / execute / cancel   │
└──────────────────────────────┴──────────────────────────────┘
```

#### 15.4.1 3Dモデル表示

初版は既存の RViz を使用する。

- `/robot_description` 組み合わせて完成された車体、lift、SO101、tool および wrist camera URDF を提供します。
- `/joint_states` 実際の feedback のみを使用し、`robot_state_publisher` 実際の TF を生成します。
- 現在の `src/robot_description/rviz/robot.rviz` と `rviz/nav2_navigation.rviz` は `RobotModel` が存在するため、別のブラウザ URDF renderer を維持する必要はありません。
- 候補姿勢はバックエンドで検証/計画された後、`moveit_msgs/DisplayTrajectory` に公開され、`/display_planned_path` で RViz ghost/planned trajectory で表示されます。候補値を実際の `/joint_states` と偽装することはできません。
- mock mode は、実際の mock state、候補軌跡、limit および collision を先に表示し、follower に接続しないことが可能です。

既存の Dashboard の Lichtblick/Foxglove iframe は、オプションの遠隔診断機能として保持され、デフォルトで無効です。実際に遠隔 3D 閲覧 する場合にのみ bridge とブラウザ 3D panel を起動します。通常の実機上での開発では、別系統の 3D renderer を同時に動かさない。React + Three.js/URDF loader は、現時点では導入されていません。

#### 15.4.2 関節スライダー

スライダーは直接連続してシリアルポートに書き込むことはできません。正しい意味は：

1. スライダー操作はブラウザ内の candidate target のみを更新します。
2. バックエンドは、初期検証を通過した candidate を RViz ghost/planned trajectory として公開し、実際の RobotModel は引き続き feedback のみを表示します。
3. バックエンドは limit、collision、owner、health と予想軌跡の長さをチェックした結果を返します。
4. オペレーターが `候補姿勢を実行` を明確に押下した後に ROS Action を送信します。
5. 実機実行中は、継続的に requested/commanded/actual/error を表示します。
6. cancel、ブラウザの切断、feedback stale、owner の消失または safety の変更があった場合、ROS バックエンド hold/stop で安全停止を実現でき、ブラウザ JavaScript に依存することはできません。

制御フローは、既存の Dashboard Joy-Con の **lease、dead-man/watchdog と物理入力の優先** を参考にしますが、arm の目標を `sensor_msgs/Joy` に含めることはできません。車体速度制御とロボットアームの離散軌跡は意味が異なります。推奨インターフェース：

| データ/コマンド | 推奨インターフェース |
|---|---|
| 実際関節 | `/joint_states` |
| コントローラー状態 | `/arm_controller/controller_state` または統一 `/arm/dashboard_state` |
| 候補チェック | `ValidateArmTarget` service/action |
| 実行目標 | `/arm_controller/follow_joint_trajectory`、arm command gateway により代理 |
| 所有権 | `/arm/command_owner` + acquire/release lease |
| 即時停止 | `/arm/stop`；同時に物理的な断電手段を保持 |
| 稼働状態 | `/arm/health_summary` |

将来、「押し続けなければ動作しない」関節の微調整が必要になった場合、個別に低速 `JointJog`/MoveIt Servo モードを実現し、継続的な dead-man を要求する場合でも、スライダーは離散目標エディタとしてのみ使用し、ドラッグによる動作は採用しません。

UI は少なくとも以下を区別する：

```text
READ_ONLY → MOCK → SUPERVISED → ARMED → EXECUTING
                                      ↘ FAULT / STOPPED
```

`READ_ONLY`、health `UNKNOWN`、calibration hash が不一致、または command owner が Dashboard でない場合、すべての実行ボタンは disabled 状態となり、ただしモデルと feedback は引き続き表示可能である。

#### 15.4.3 プリセット姿勢

プリセット姿勢は React に直接ハードコーディングされず、バージョン管理された YAML を使用する：

```yaml
id: observation_left
description: approved wrist-camera left viewpoint
calibration_id: follower_12v_recal_20260831_v2
calibration_sha256: 276e40239a27baa4b910d9f1f384e934bf70265e8f558fbc51e4266ffcf5f68c
joint_positions: {}
speed_scale: 0.1
allowed_modes: [MOCK, SUPERVISED]
review_state: UNMEASURED
return_pose: stow
```

2026-09-02 ベースの再取付後の operator-captured 集合：

- `home`
- `see_front`
- `see_ground`
- `see_left`
- `see_right`
- `see_upside`

旧取付方向の命名姿勢は実機構成には移行しない。新集合の joint 値は本機 feedback から取得され、引き続き Preview、現在のフィードバック、ソフトリミット、運用時の保護を経てから実行可能である。

#### 15.4.4 `周囲を観察` trigger

`周囲を観察` ボタンは、`ObserveRegion` action を呼び出すべきであり、関節値をウェブページ上で順次送信するべきではありません。

```text
検証 base stationary / lift / arm health / camera
  → acquire owner
  → see_front
  → settle + capture fresh image
  → see_left/right/upside/ground（承認された姿勢のみ）
  → 各視点を保存 image + joint/TF timestamp
  → return home
  → release owner
```

Dashboard には、現在の viewpoint、画像、進捗状況、次の姿勢、cancel および stop reason が表示されます。 姿勢に到達できない場合、またはカメラ stale の場合、シーケンスは停止し、安全姿勢に戻ります。 次の姿勢に無闇にジャンプすることはできません。

#### 15.4.5 `ボタン押下テスト` trigger

第一版のボタンは、mock/sim が実行可能状態のときのみ有効になります。 実機側のボタンは、以下の条件が満たされるまで `BLOCKED` を保持します。

- 軟質で重要度の低いテストボタンを使用する。
- `button_observation`、`pre_press`、最大接近距離、および retreat を定義する。
- load/current/position error 閾値は、無負荷サンプリングで確認する。
- command owner、base stationary、lift 状態、collision および手動確認がすべて通過する。
- action は cancel をサポートし、キャンセル後に退避または明示的な HOLD に移行する。
- Dashboard は、これが test fixture であることを明確に表示し、任意の実際の機器ボタンではないことを示す。

ボタンの実行は、必ず `PressButton` action/state machine を経由する必要があり、それを WebSocket `String` または複数のフロントエンドタイマーとして実装することはできません。

### 15.5 Dashboard の実機動作に共通する実行条件

任意のスライダー目標、プリセット姿勢、またはtriggerは、実機実行前に必ず以下の条件を満たす必要があります。

| Gate | 最低要件 |
|---|---|
| device | stable USB identity と期待されるserialが一致 |
| calibration | ID/hashと設定が一致 |
| feedback | joint state が新鮮で、6つのmotorがすべて存在 |
| controller | lifecycle active、他のシリアルポートwriterがない |
| owner | Dashboard/対応するtaskが唯一のleaseを持つ |
| limits | 目標、速度、加速度、および1 回の deltaはすべて本機の制限内 |
| collision | self/robot/environment collision checkを通過 |
| base | stationary、新しい車体motion requestがない |
| lift | 最初の版でロックされ、手動で確認。その後は必ずreferenced |
| safety | software stopがトリガーされていない。オペレーターはすぐに12 V を遮断可能 |
| mode | `SUPERVISED`を明確にする。`UNKNOWN`から推論して許可されることはできない |

既存のDashboardのJoy、lease/watchdogは設計の参考として使用できますが、armは独立したownerを使用する必要があります。Dashboardが`/joy`の制御権を獲得したからといって、自動的にarmの制御権を獲得するわけではありません。

### 15.6 次の開発順序

#### Step A：本機エビデンスと設定を凍結する

- follower/camera の stable identity を専用設定に記録する。
- calibration ID/hashを保存し、モーター値をコピーまたは変更しない。
- 新規にarm launchパラメータを追加し、デフォルトを`arm:=false`、`hardware_type:=mock_components`にする。
- joint name、単位、方向、gripperマッピング、および状態schemaを定義する。

**完了条件：** 設定の単体テストが `/dev/ttyACM*` の一時名、不正な serial、不正な calibration hash を拒否すること。

#### Step B：URDF + mock + Dashboard 読み取り専用モデル

- SO101 URDF/mesh をレビューし導入します。
- 独立した mock launch で `/robot_description`、`/joint_states` および TF を公開します。
- 5つの arm joint と gripper の方向、零位および limit を確認します。
- 既存の RViz に actual RobotModel を表示し、candidate/planned trajectory display を追加します。
- Dashboard `/arm` の状態と制御ページを追加し、ブラウザで 3D を重複してレンダリングしません。
- スライダーはまず candidate preview を行い、バックエンドを通じて RViz に公開しますが、hardware command は生成しません。
- プリセットボタンはまずすべて `UNMEASURED/BLOCKED` として表示します。

**完了条件：** follower に接続していなくても、mock で RViz actual/preview モデル、Dashboard スライダー候補、プリセット状態、および安全遮断を完全にデモできること。

#### Step C： 実際の状態を読み取り、動作は実行しません。

- `feetech_ros2_driver` と本機 ROS 2 Humble の build/runtime を評価します。
- LeRobot calibration から ROS joint radians への変換と符号を明確にします。
- torque-disabled 条件下で joint state、通信間隔、load/current/temperature/voltage を公開します。
- `/arm/health_summary` と Dashboard evidence を実装します。
- USB 抜出、フィードバック stale、driver crash 故障注入を行います。

**完了条件：** RViz/Lichtblick 姿勢と手動移動の実際の機器方向が一致し、かつ全程において Goal Position 書き込みがないこと。

#### Step D：監督下での単関節小増分動作

- arm command owner、trajectory gateway、stop/watchdog を実現します。
- 事前に mock で cancel、timeout、limit および owner の占有を検証します。
- 実機は現在の姿勢から開始し、関節の微小な増分での低速テストのみを行います。
- その後、`test_near_current → current` を行い、home/stow のサンプル値を直接使用しません。
- Dashboard スライダーは「プレビュー → 検証 → 明確な実行」で開放し、ドラッグ即動作は禁止します。

**完了条件：** 各関節方向と停止動作に直接的な証拠があること。WebSocket が切断されても動作が制御不能なまま継続しないこと。

#### Step E：プリセット姿勢の確立と受入

- 実機 feedback から候補 `home/see_*` をキャプチャします。
- 各姿勢について、車体、卓上、衝突、カメラケーブルを目視で確認します。
- 段階的に `stow → pose → stow` を実行します。
- Phase 1 の 50 回の繰り返しテストに達した後、`APPROVED` とマークします。

#### Step F：アームカメラと `周囲を観察`

- `/arm_camera/color/image_raw` と CameraInfo を公開します。
- キャリブレーションまたは少なくとも `tool0 → arm_camera_link` を記録します。
- approved viewpoint library および `ObserveRegion` action を実現します。
- Dashboard で画像、進捗、cancel および observation artifacts を追加します。

#### Step G：テストボタン

- 事前に sim/mock で PressButton state machine を完了します。
- 低リスクのソフトボタン治具とフレキシブルツールを作成します。
- 非接触/接触 load-current の基準を取得します。
- 手動確認後のみ Dashboard 実機 trigger を開放します。
- P1 を通過した後、視覚修正と指定ボタンを検討します。

### 15.7 現在直ちに開始する開発項目

現在最も適切な次の項目は、teleoperate でも、ボタンの実機テストでもなく、以下のものです。

> **Step B：承認済みの SO101 description を導入し、mock_components で `/robot_description` + `/joint_states` を構築し、既存の RViz で actual/preview モデルを表示し、Dashboard に 3D レンダリングを担当しない Arm 状態、slider candidate、プリセット、および trigger ページを追加する。**

このステップは、12 V 電源を切り、follower ポートを開いていない状態で完了し、後続の ros2_control、実機 feedback、プリセット姿勢、および 2 つの trigger に対して統一された UI/インターフェース境界を確立します。
