# Todo List | FY2026 Robot Harness System

**Phase:** 0 → 1 進行中
**Updated:** 2026-04-16
**Project:** Robot Harness System（筑波大学 FY2026）

**Timeline:** `ROS/トピック確認 ✓` → `モーター確認 ✓` → `アーム確認 ✓` → `Lidar追加` → `通信テスト` → `LLM実装` → `SLAM & Nav2` → `Isaac Sim`

---

<!-- ================================================================
  EDITING GUIDE:
  - [ ] = 未完了 (pending)
  - [~] = 進行中 (in progress)
  - [x] = 完了   (done)
  - tags: use [Software] [Hardware] [AI/LLM] [Navigation] [New] etc.
  - Sub-items: indent with 2 spaces under the parent item
  - 日付フォーマット: 更新: YYYY-MM-DD
================================================================ -->

---

## 🎯 最終験収目標

### Phase 0 — ロボット基盤の安定化（Done Definition）

- [x] ロボットが安定して動作する（壊れない状態）
- [x] Joy-Con による手動操縦が安定動作（teleop → cmd_vel → motor チェーン確認済み）
- [x] SOARM101 アームの基本動作・Teleoperator・VLA 確認済み
- [x] Livox MID360 LiDAR 搭載・ROS2 ドライバ接続・点群データ取得可能 `[Hardware]`
- [ ] 全センサー（Camera / IMU / Encoder / LiDAR）データ取得・TF 整合確認 `[Hardware]` `[Software]`
- [ ] LLM 基礎実装：自然言語コマンドで移動 / アーム操作をトリガー可能 `[Software]` `[AI/LLM]`

### Phase 1 — 自律移動 LiDAR SLAM + Nav2（Done Definition）

- [ ] 安定した地図生成（SLAM 動作確認） `[Software]` `[Navigation]`
- [ ] 地図を読み込んでの自己位置推定が安定動作 `[Software]` `[Navigation]`
- [ ] RViz で目標地点指定 → 自動ナビゲーション成功 `[Software]` `[Navigation]`
- [ ] 基本的な静的障害物の回避が可能 `[Navigation]`
- [ ] Isaac Sim 仿真環境でも同等のナビゲーションが動作可能 `[Software]` `[New]`

---

## ✅ Phase 0 — 完了済み（〜2026-04-11）

- [x] **ROS2 ワークスペース構成の確認**
  `[Software]` 完了: 2026-04-11
  ワークスペース全体の把握・ノード依存関係の整理・トピック一覧作成

- [x] **移動系ノード・トピックの確認**
  `[Software]` 完了: 2026-04-11
  移動関連の各ノード・トピックを一覧化し、依存関係を特定
  → ログ参照: [joycon-demo](../logs/20260407_joycon-demo/snapshot.html) / [test-motor-driver](../logs/test-motor-driver/20260407_205057/snapshot.html) / [test-motor-softarm](../logs/test-motor-softarm/20260407_165340/snapshot.html) / [test-motor-steer](../logs/test-motor-steer/20260407_210512/snapshot.html)

- [x] **手動操作（Joy-Con）の確認**
  `[Software]` `[Hardware]` 完了: 2026-04-11
  Joy-Con によるリアルタイム操縦テスト完了。teleop_twist_joy → cmd_vel → motor の制御チェーンが正常動作することを確認。
  → テスト記録: [joycon-demo snapshot](../logs/20260407_joycon-demo/snapshot.html)

- [x] **SOARM101 アームの動作確認（Teleoperator / VLA）**
  `[Hardware]` 完了: 2026-04-11
  新ロボット機体上でアーム動作テストを実施。CPU が機械臂を正常に駆動できることを確認。
  - テレオペレーション（手動遠隔操作）の動作確認
  - VLA（既存サンプル実装）を新 OS 上で実行・動作確認
  → テスト動画: [VLA.MOV](../media/VLA.MOV) / [teleoperate.MOV](../media/teleoperate.MOV)

- [x] **上下機構への実アーム搭載テスト**
  `[Hardware]` `[New]` 完了: 2026-04-11
  スライドレール方式の上下機構を採用・テスト完了。実アームの重量支持・上下駆動動作を確認。
  コネクタ破損（3Dプリント製）→ ネジ（金属製）＋ 3Dプリントベース構造に再設計し解決。
  → 詳細: [問題対処記録](../issues/arm-vertical/arm-vertical.html)
  → テスト動画: [chuoku1.MOV](../media/chuoku1.MOV) / [chuoku2.MOV](../media/chuoku2.MOV)

- [x] **Lidar 追加 — Livox MID360**
  `[Hardware]` 更新: 2026-04-13
  3D LiDAR のマウント・ROS2 ドライバ導入・点群データ確認（LiDAR SLAM への布石）

- [ ] **センサー全体の動作確認**
  `[Hardware]` 更新: 2026-04-13
  Stereo Camera・IMU・エンコーダ・LiDAR の取得データ検証・タイムスタンプ同期・Sensor Fusion (EKF) 確認

- [ ] **LLM システム実装**
  `[Software]` `[AI/LLM]` 更新: 2026-04-13
  GPT / Claude API をロボットに接続し、自然言語コマンドによる基礎的な移動・操作の制御を初期実験
  - [ ] テキストコマンド制御 UI の実装（デモ選択・実行）
  - [ ] 自然言語指令でデモを個別トリガーできることを確認

- [ ] **外装・配線整理**
  `[Hardware]` 更新: 2026-04-13
  ロボット本体カバー・配線整理・センサーマウント・上下機構の最終 CAD / 仕上げ

---

## 🔹 Phase 1 — 自律移動（LiDAR SLAM + Nav2）

### ① システム設計・データリンク

- [ ] **システム分層設計・データリンク確立**
  `[Software]` `[Navigation]` 更新: 2026-04-16
  - 伝感器層：Mid360 / RealSense / IMU / 里程計
  - 基礎処理層：ドライバ + TF + 時刻同期
  - 空間認識層：SLAM / 測位 / ローカル環境認識
  - （予定）語義層 & LLM 層インタフェース

- [ ] **センサー接続確認（Phase 1 向け）**
  `[Hardware]` 更新: 2026-04-16
  Mid360 点群安定出力・IMU / odom 動作確認・ROS2 topic & Hz 正常

- [ ] **TF・座標系構築**
  `[Software]` 更新: 2026-04-16
  `map → odom → base_link → sensors` 構築・外参校正（LiDAR / IMU / Camera）・座標方向整合・タイムスタンプ同期確認

### ② 運動・測位基礎

- [ ] **底盤制御確認**
  `[Hardware]` `[Software]` 更新: 2026-04-16
  `/cmd_vel` 正常動作・前進 / 回転方向確認・速度スケール検証

- [ ] **測位ルート決定・SLAM 検証**
  `[Software]` `[Navigation]` 更新: 2026-04-16
   C（Odom安定）→ B（SLAM）→ A（測位ナビゲーション）
  地図生成（FAST-LIO / その他）・地図品質確認・測位安定性検証（ドリフトなし）

### ③ Nav2 ナビゲーション能力

- [ ] **Nav2 設定**
  `[Software]` `[Navigation]` 更新: 2026-04-16
  global planner / local planner・costmap（local + global）・footprint / inflation 設定

- [ ] **基本ナビゲーションテスト**
  `[Software]` `[Navigation]` 更新: 2026-04-16
  RViz で 2D Goal 送信・自動目標地点到達・静的障害物回避確認

- [ ] **安定性チューニング**
  `[Software]` `[Navigation]` 更新: 2026-04-16
  速度 / 加速度・避障パラメータ・goal tolerance 調整・成功率向上

### ④ シナリオ・検証

- [ ] **ターゲットシナリオ設定**
  `[Navigation]` 更新: 2026-04-16
  室内廊下往復 / 実験室→入口 / 部屋内障害物回避（いずれかひとつを選定）

- [ ] **地図・タスク検証**
  `[Software]` `[Navigation]` 更新: 2026-04-16
  建図 → 保存 → 再ロード・複数回ナビゲーション成功・異なる起点での安定動作確認

- [ ] **簡易環境認識（Phase 2 準備）**
  `[Software]` `[Navigation]` 更新: 2026-04-16
  点群前処理ノード（任意先行実装）：前方障害物距離・通路幅・free space 推定・JSON 構造化データ出力

### ⑤ Isaac Sim 仿真検証

- [ ] **仿真環境構築**
  `[Software]` `[New]` 更新: 2026-04-16
  ロボット URDF の Isaac Sim 取り込み・LiDAR / Camera 追加・簡易シーン（廊下 / 障害物）構築

- [ ] **ROS2 Bridge 接続**
  `[Software]` 更新: 2026-04-16
  `/tf /cmd_vel /scan /pointcloud` 対応・実機インタフェースとの一致確認

- [ ] **仿真上でのナビゲーション検証**
  `[Software]` `[Navigation]` 更新: 2026-04-16
  SLAM / 測位（任意）・Nav2 動作確認・RViz → Goal → 自動ナビゲーション

- [ ] **Sim2Real 基本対応**
  `[Software]` 更新: 2026-04-16
  統一座標系・統一話題インタフェース・パラメータ最大限一致

---

## 🔮 中長期タスク

- [ ] **外装設計**
  `[Software]` `[Navigation]` 更新: 2026-04-13
  テーマ：可愛さ / テクノロジー感 / 公式感・フォーマル
  - 色合い：清潔感のあるホワイト or ライトグレーを基調に、アクセントでメタリックブルーやネオン系を投入
  - 必須要素：センサー配置が自然に見えるデザイン、配線カバー、ロゴ・ブランドアイデンティティ、前面ステータス表示
  - 関連：TTS 表示 / スピーカー配置を外装設計に組み込み

- [ ] **ブランド・キャラクター設計**
  `[Software]` `[AI/LLM]` 更新: 2026-04-16
  - Logo：簡潔で公式感のあるマーク / タイポグラフィ
  - 名前：プロダクト名 / ロボット名の候補検討
  - TTS モデル：音声の性格を決める（落ち着いたフォーマル、親しみやすい、テクノロジー感）
  - 性格 / キャラ定義：公式感のある言葉遣い、または親しみやすいサポートキャラ軸の選定

- [ ] **Harnessシステムの構築**
  `[Software]` `[AI/LLM]` 更新: 2026-04-13
  - 最新のトレンドを参考に更新

---

<!-- ================================================================
  ADD NEW ITEMS BELOW THIS LINE
================================================================ -->
