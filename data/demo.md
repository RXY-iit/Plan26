# デモ計画 & 要件マップ | Robot Harness System

**Project:** Robot Harness System（筑波大学 FY2026）
**Updated:** 2026-04-11
**Page:** demo.html

---

<!-- ================================================================
  EDITING GUIDE:
  - このファイルを編集したあと「demo.md から demo.html を更新して」と依頼
  - radar-scores: [Nav, Mem, Agent, Manip, NL] の順で 0〜10
  - priority: critical | high | medium | future
  - status: done | in-progress | planned | future
================================================================ -->

---

## 🏗️ システムアーキテクチャ

**コアフロー（処理パイプライン）:**
1. 👁️ 知覚（Perception）
2. 🧠 記憶（Memory）
3. 🤖 Agent (LLM)
4. 🔗 Skill System
5. 🦾 Robot

**実装優先順位:** ① SLAM ＞ ② Skill System ＞ ③ AI Agent ＞ ④ VLA

---

## 🗺️ 要件マップ（9カテゴリ）

<!-- priority: critical=赤 / high=青 / medium=緑 / future=紫 -->

### ① 屋内・屋外走行（Navigation）
- **Priority:** critical（SLAM 最優先）
- **機能:** 屋内ナビゲーション / 屋外ナビゲーション / 長距離移動 / 自己位置推定
- **センサー:** Stereo Camera / LiDAR / IMU / GNSS
- **認識:** ORB-SLAM3 / RTAB-Map / Visual Odometry / EKF
- **ナビゲーション:** Nav2 / A* / DWA / Waypoint Nav

### ② 記憶（Memory）
- **Priority:** high
- **機能:** 状態記憶 / 履歴記録 / 知識蓄積 / 経験活用
- **Memory構造:** Working Memory / Episodic Memory / Long-term Memory
- **実装:** FAISS / Chroma / Vector DB / JSON Logs / ROS bag
- **AI:** RAG / Context Injection

### ③ AI System（Multi-Agent）
- **Priority:** high
- **機能:** タスク計画 / 状態監視 / 自己改善 / 安全制御
- **Agent構成:** Planner Agent / Ops Agent / Builder Agent / Safety Agent
- **基盤:** Event Bus / Scheduler
- **LLM:** GPT / Claude / Qwen
- **Prompt:** Chain-of-Thought / Tool-use prompting / Reflection loop

### ④ Manipulation
- **Priority:** medium（軽量アーム）
- **機能:** 把持 / 配置 / 操作
- **ハード:** SOARM101 / LeRobot / ROS2 control
- **制御:** IK / FK
- **認識:** YOLO / Depth estimation
- **学習:** Imitation Learning / VLA

### ⑤ 自然言語インターフェース
- **Priority:** medium
- **機能:** 音声指示 / 会話 / タスク生成
- **入力:** Whisper（音声認識）
- **出力:** TTS
- **理解:** LLM / Prompt設計
- **対話:** Dialogue Memory / Context管理

### ⑥ Perception
- **Priority:** high（コア）
- **機能:** 物体認識 / シーン理解 / 状態検出
- **認識:** YOLO / DETR / Semantic Segmentation / Depth estimation
- **VLM:** GPT-4V / Qwen-VL
- **その他:** OCR

### ⑦ System Infrastructure
- **Priority:** critical（システム基盤・超重要）
- **機能:** 常時稼働 / 安全管理 / 状態監視
- **基盤:** ROS2 / Docker / Logging system / Health monitoring / Watchdog / Fail-safe system

### ⑧ Skill System
- **Priority:** critical（核心）
- **機能:** AI → Robot 接続
- **API:** Skill API設計 / JSON schema / Action wrapper (ROS2)
- **制御:** Retry / Timeout / Safety constraint

### ⑨ World Model
- **Priority:** future（将来）
- **機能:** 環境理解 / 長期推論
- **モデル:** Scene Graph / Spatial Memory / JEPA系

---

## 🎬 デモシナリオ — 3カテゴリ × Level 1/2/3

<!--
  カテゴリ構成:
    🚗 カテゴリ A: モバイルベース 単体 Demo
    🦾 カテゴリ B: アーム 単体 Demo
    🤝 カテゴリ C: モバイル + アーム 複合 Demo

  各カテゴリに Level 1（基礎）/ Level 2（応用）/ Level 3（高度）の3段階
  status: done | in-progress | planned | future
-->

---

### 🚗 カテゴリ A — モバイルベース 単体 Demo

*ロボットの自律移動能力を段階的に実証*

> **前提（完了済み）:** Joy-Con 手動操縦・モーター制御チェーン確認（2026-04-11）
> → [joycon-demo snapshot](../logs/20260407_joycon-demo/snapshot.html) / [teleoperate.MOV](../media/teleoperate.MOV)

#### A-Level 1 — SLAM 自律移動 & 音声指令操縦 + 走行ログ記録
- **Status:** planned
- **Phase:** 1–2
- **説明:** 「○○に移動して」という音声・テキスト指示を LLM が解釈し、SLAM + Nav2 で自律走行。走行経路・時刻・位置をリアルタイムでログ記録し、後の記憶システムの基盤データを蓄積する最初の自律移動デモ。
- **フロー:** 🗣️ 音声/テキスト指示 → 🤖 LLM 解釈 → 📍 Waypoint 生成 → 🗺️ SLAM 自己位置推定 → 🚗 Nav2 自律走行 → 📝 走行ログ記録（経路・時刻・位置）→ ✅ 到達確認
- **技術タグ:** ORB-SLAM3 / Nav2 / LLM Planner / Whisper / ROS bag / Walk Log
- **Radar-scores:** [7, 2, 3, 0, 5]

#### A-Level 2 — 記憶システム活用による文脈移動
- **Status:** planned
- **Phase:** 3–4
- **説明:** 「さっきいた場所に戻って」「昨日行ったルートで移動して」など、Episodic Memory / Long-term Memory を参照した文脈依存の移動指示を実行。Level 1 で蓄積した走行ログを Vector DB に格納し、RAG で場所・状況を想起して LLM Planner がルートを生成する。
- **フロー:** 🗣️ 文脈指示（「前に行った〇〇へ」）→ 🧠 Memory 検索（Vector DB + RAG）→ 📍 位置推定 → 🗺️ SLAM ナビゲーション → 🚗 自律走行 → 📝 Memory 更新 → ✅ 完了報告
- **技術タグ:** RAG / Vector DB / SLAM / Nav2 / Episodic Memory / LLM Planner / FAISS / Chroma
- **Radar-scores:** [7, 8, 6, 0, 6]

#### A-Level 3 — 屋外・屋内シームレス走行 + 安全システム + 記憶統合
- **Status:** future
- **Phase:** 5–6
- **説明:** GNSS+SLAM で屋外→屋内をシームレスに自律走行しながら、Safety Agent が障害物・段差・異常状況をリアルタイム判断し安定走行を維持。記憶システムと連携して過去の走行経験を環境学習に活用する、移動能力の集大成デモ。
- **フロー:** 📋 ルート設定 → 🌳 屋外走行（GNSS+SLAM）→ 🏢 屋内移動（Nav2）→ ⚠️ Safety Agent 監視（障害物・段差・異常）→ 🔄 安定走行制御（EKF + IMU）→ 🧠 記憶システム参照・更新 → ✅ 到達・記録
- **技術タグ:** GNSS / ORB-SLAM3 / Nav2 / Safety Agent / EKF / Memory / Always-on / IMU
- **Radar-scores:** [10, 7, 7, 0, 5]

---

### 🦾 カテゴリ B — アーム 単体 Demo

*マニピュレーターの精度・知覚・学習能力を段階的に実証*

> **前提（完了済み）:** SOARM101 基本動作確認・Teleoperator・VLA サンプル実行（2026-04-11）
> → [VLA.MOV](../media/VLA.MOV) / [teleoperate.MOV](../media/teleoperate.MOV)

#### B-Level 1 — 音声指令によるエレベーターボタン押下
- **Status:** planned
- **Phase:** 1–2
- **説明:** 「3階のボタンを押して」という音声指示を LLM が解釈し、カメラでボタンを認識して SOARM101 で正確に押下。指示→認識→動作の基本パイプラインを実証する最初の実用的アームデモ。
- **フロー:** 🗣️ 音声指示 → 🤖 LLM 解釈（階数・対象認識）→ 📸 カメラ入力 → 👁️ ボタン検出（YOLO/VLM）→ 📐 Depth 推定 + IK 計算 → 🦾 SOARM101 押下 → ✅ 動作確認
- **技術タグ:** SOARM101 / YOLO / VLM / IK / Depth estimation / LLM / Whisper
- **Radar-scores:** [1, 0, 3, 7, 5]

#### B-Level 2 — 物品名称指定 & 文字ブロックスペリング
- **Status:** planned
- **Phase:** 3–4
- **説明:** 「〇〇を並べて」という指示から物品名を認識し、対応する文字ブロックを選択してスペルアウト。OCR+YOLO でブロックを認識し、LLM が順序を計画、複数ステップの把持・配置を継続実行する中級マニピュレーションデモ。
- **フロー:** 🗣️ 物品名指示 → 🤖 LLM 解釈（スペリング計画）→ 👁️ OCR+YOLO ブロック認識 → 📋 順序計画 → 🦾 ブロック把持 × N回 → 📍 指定位置に配置 → ✅ 完成確認
- **技術タグ:** YOLO / OCR / IK / FK / LLM Planner / Sequential manipulation / Depth estimation
- **Radar-scores:** [0, 2, 4, 9, 5]

#### B-Level 3 — 精密フィードバック制御操作（プラグ挿入）
- **Status:** future
- **Phase:** 5–6
- **説明:** コンセントへのプラグ挿入など、視覚フィードバックをリアルタイムに活用した精細操作デモ。挿入口をカメラで認識しながら位置補正ループを回し、電流値・映像で挿入完了を検出する。視覚と制御が密結合したクローズドループ操作を実証。
- **フロー:** 🗣️ 操作指示 → 👁️ VLM/YOLO 挿入口認識 → 📐 精密 IK 計算 → 🦾 挿入アプローチ → 🔄 視覚フィードバック補正ループ → ✅ 挿入確認（電流/映像）
- **技術タグ:** SOARM101 / IK / VLM / Visual Feedback / Current sensing / Closed-loop control
- **Radar-scores:** [0, 1, 4, 10, 3]

---

### 🤝 カテゴリ C — モバイル + アーム 複合 Demo

*移動と操作を統合した総合的なタスク実行能力を段階的に実証*

#### C-Level 1 — 音声指令による移動 & ターゲット操作 + 走行ログ記録
- **Status:** planned
- **Phase:** 2–3
- **説明:** 「〇〇の前に移動してボタンを押して」など、移動＋単純操作を1つの音声指示で実行。SLAM 自律走行でターゲットに接近し、LLM が解釈したアーム動作（ボタン押下など）を実行する最初の複合デモ。走行ログも記録し記憶基盤を構築。
- **フロー:** 🗣️ 音声指示 → 🤖 LLM 分解（移動タスク + アームタスク）→ 🗺️ SLAM+Nav2 移動 → 📝 走行ログ記録 → 👁️ ターゲット認識（YOLO/VLM）→ 📐 Depth + IK → 🦾 アーム操作 → ✅ 完了報告
- **技術タグ:** Nav2 / SLAM / SOARM101 / YOLO / VLM / IK / LLM Planner / Whisper / Walk Log
- **Radar-scores:** [7, 2, 5, 7, 6]

#### C-Level 2 — 記憶活用 × 移動 × 物品操作（自律デリバリー）
- **Status:** planned
- **Phase:** 4–5
- **説明:** 「前に置いてあった〇〇を取ってきて」など、Episodic Memory を活用した文脈ある指示に対応。記憶から対象の位置を推定し、SLAM 自律移動→把持→搬送→配置まで一貫して実行。LLM がルートと動作プランを統合生成する中級複合デモ。
- **フロー:** 🗣️ 文脈指示 → 🧠 Memory 検索（RAG+Vector DB）→ 📍 位置推定 → 🗺️ SLAM+Nav2 移動 → 👁️ YOLO 物体認識 → 📐 Depth+IK → 🦾 把持・搬送 → 📍 配置 → 🧠 Memory 更新 → ✅ 完了報告
- **技術タグ:** RAG / Episodic Memory / Nav2 / YOLO / IK / SOARM101 / LLM Planning / Whisper / TTS
- **Radar-scores:** [8, 8, 7, 8, 7]

#### C-Level 3 — 屋外・屋内 × 精密操作 × 安全 × 記憶 統合最終デモ ⭐
- **Status:** future
- **Phase:** 7–8
- **説明:** 屋外・屋内シームレス自律走行（GNSS+SLAM）＋ Safety Agent による安全管理 ＋ 記憶システム活用 ＋ プラグ挿入などの精密フィードバック操作を統合した集大成デモ。すべての要素（Navigation / Memory / Safety / 精密Manipulation）が連携して動作することを実証する。
- **フロー:** 🗣️ 複合指示 → 🧠 Memory 参照（RAG+Vector DB）→ 🌳 屋外走行（GNSS+SLAM）→ 🏢 屋内移動（Nav2）→ ⚠️ Safety Agent 監視 → 👁️ VLM 状態認識 → 🦾 精密操作（Closed-loop フィードバック制御）→ 📝 Memory 更新・結果報告
- **技術タグ:** GNSS+SLAM / Nav2 / Safety Agent / Episodic Memory / SOARM101 / Closed-loop / VLM / Whisper / RAG
- **Radar-scores:** [10, 9, 9, 10, 8]

---

## 💡 活用できるシーン（ユースケース）

<!-- category ごとに整理。新しいカードは同じフォーマットで追加 -->

### 🏠 日常生活支援（Daily Assistance）

| 場面                     | ロボットの動作                       | 要件タグ                          |
|--------------------------|-------------------------------------|----------------------------------|
| 「コーヒー持ってきて」     | 台所まで移動して物品を把持・配達      | Navigation / Manipulation / NL UI / Skill |
| 「明日の天気を教えて」     | LLMが情報取得・音声で回答            | NL UI / Agent / Memory           |
| 部屋の片付けを手伝う       | 物体認識・分類・指定場所への移動      | Perception / Manipulation / Navigation / Skill |
| いつものルーティン覚えてる？| Episodic Memoryから習慣を想起して先回り| Memory / Agent / NL UI           |

### 🌿 屋外探索・配達（Outdoor Exploration）

| 場面                     | ロボットの動作                       | 要件タグ                          |
|--------------------------|-------------------------------------|----------------------------------|
| キャンパス内の建物Aへ移動  | GNSS + SLAM で屋外自律走行           | Navigation / Perception / System  |
| 未知エリアを探索してマップ生成| RTAB-Map でリアルタイム地図構築    | Navigation / Perception / Memory  |
| 雨天・段差・傾斜への対応   | IMU + Depth で走行可能領域を判断     | Navigation / System / Perception  |

### 🔬 研究・実験支援（Lab Support）

| 場面                     | ロボットの動作                       | 要件タグ                          |
|--------------------------|-------------------------------------|----------------------------------|
| 実験器具を正確な位置に配置  | SOARM101 + IK で精密把持・配置      | Manipulation / Perception / Skill |
| 長時間実験のモニタリング   | 常時稼働 + Watchdog でデータ記録     | System / Memory / Perception      |
| 実験手順を音声で指示       | Whisper → LLM → Skill 実行          | NL UI / Agent / Skill             |

### 🏙️ 社会インフラ応用（Social Infrastructure）

| 場面                     | ロボットの動作                       | 要件タグ                          |
|--------------------------|-------------------------------------|----------------------------------|
| 病院での薬品搬送           | 自律走行 + 精密把持 + 安全管理        | Navigation / Manipulation / System / Skill |
| 施設内巡回・異常検知        | 自律巡回 + VLM で状態を監視・報告    | Navigation / Perception / Agent / Memory |
| 介護補助・見守り支援        | 会話 + 状態検出 + 緊急時報告         | NL UI / Perception / System / Agent |
| 将来：World Model で環境推論| Scene Graph + JEPA で長期的な行動計画| World Model / Memory / Agent     |

---

## 📝 メモ・備考

- **カテゴリ A (Mobile):** 手動操縦完了済み（2026-04-11）。Level 1（SLAM+LLM）〜 Phase 1–2 から開始
- **カテゴリ B (Arm):** 基本動作・Teleop・VLA 完了済み（2026-04-11）。Level 1（エレベーターボタン押下）〜 Phase 1–2 から開始
- **カテゴリ C (Combined):** Level 1（移動+操作複合）〜 Phase 2–3 から開始
- Radar-scores は [Nav, Mem, Agent, Manip, NL] の順で各 0〜10
- 各 Level の詳細内容は後ほど探討・補完予定

---

<!-- ================================================================
  新しいシナリオを追加する場合のテンプレート:

  #### X-Level N — タイトル
  - **Status:** planned
  - **Phase:** X–Y
  - **説明:** 一行説明
  - **フロー:** ステップ1 → ステップ2 → ... → ✅ 完了
  - **技術タグ:** Tag1 / Tag2 / Tag3
  - **Radar-scores:** [Nav, Mem, Agent, Manip, NL]  ← 各0〜10
================================================================ -->
