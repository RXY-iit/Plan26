# FY2026 研究年間プラン | Robot Harness System

**Project:** 移動マニピュレーター研究（筑波大学 FY2026）
**Updated:** 2026-04-16
**Current Phase:** 0
**Final Goal:** Apr 2027

---

<!-- ================================================================
  EDITING GUIDE:
  - このファイルを編集したあと「plan_fy26.md から plan-fy26.html を更新して」と依頼
  - progress: 0〜100 の整数 (%) で各フェーズの進捗を指定
  - status: active | upcoming | done
  - figures: figure/ フォルダのファイル名を指定
================================================================ -->

---

## 🧠 プロジェクト概要

**システム名:** Robot Harness System
**コンセプト:** 知覚・記憶・判断・スキル実行・行動という生物の神経系を模倣した AI ロボットシステム
**技術スタック:** LLM × ROS2 × VLA

**アーキテクチャフロー:**
👁️ 知覚 → 🧠 記憶 → 🤖 判断(Agent) → ⚙️ スキル → 🦾 行動

**実装優先順位:** SLAM ＞ Skill System ＞ AI Agent ＞ VLA

**全体進捗:** 8%

---

## 🔗 Harness とは

**Harness（ハーネス）** は本来、複数の配線・ケーブルをまとめてひとつの束にしたコネクション構造を指す。

> Robot Harness System は、ロボットを構成するあらゆるコンポーネント（センサー・メモリ・AI・アクチュエータ）を、  
> 神経系のように有機的に束ねてつなぐ設計思想。

*※ Harness の詳細な定義・設計思想については後ほど補完予定。*

---

## 📖 研究の背景と価値

### 社会的背景
高齢化・人手不足が加速し、工場・病院・家庭で自律ロボットのニーズが急増。
単純な移動だけでなく「判断できるロボット」が求められている。

### 技術的挑戦
記憶・文脈理解・マルチモーダル認識を統合した AI OS はまだ黎明期。
Perception → Memory → Agent → Skill → Robot という神経系アーキテクチャの実装。

### 実現したいこと
音声指示・過去記憶・視覚情報を統合し、屋外〜屋内をシームレスに移動して
物体操作できる「実用レベル」のロボット神経系を構築する。

---

## 📐 設計資料・図面

<!-- figures セクション: file は figure/ フォルダからのパス -->

| No. | ファイル名             | キャプション             |
|-----|----------------------|------------------------|
| 01  | fy26-plan.png        | FY2026 研究プラン概要    |
| 02  | robot-arch-ver1.png  | ロボットアーキテクチャ v1 |
| 03  | schedual-1.png       | スケジュール詳細 (1)     |
| 04  | schedual-2.png       | スケジュール詳細 (2)     |

<!-- 新しい図を追加する場合: figure/ フォルダにファイルを入れてからここに行を追加 -->

---

## 📅 年間スケジュール

<!-- ガントチャート用: month は 4〜3 月（日本年度）, status: active | upcoming | done -->

### Phase 0 — ロボット基盤の安定化
- **月:** Apr 2026
- **Status:** active
- **Progress:** 50%
- **タスク:** 配線整理 / 電源安定化 / ROS2ノード確認 / 手動操作の安定化（Joy-Con）/ SOARM101初期動作確認 / アーム上下機構修正・テスト / Livox MID360 LiDAR 搭載・接続 / センサー全体動作確認（Camera / IMU / Encoder / LiDAR）/ TF整合・タイムスタンプ同期 / LLM基礎実装（自然言語→移動/アーム）
- **成果物:** 安定して動くロボット + 全センサー接続 + LLM基礎接続
- **最終験収目標:**
  - ✅ ロボットが安定動作（壊れない状態）
  - ✅ Joy-Con手動操縦が安定動作
  - ✅ SOARM101アームの基本動作確認
  - [ ] Livox MID360 LiDAR 搭載・ROS2接続・点群取得
  - [ ] 全センサーデータ取得・TF整合確認
  - [ ] LLM基礎実装：自然言語で移動/アームをトリガー可能

### Phase 1 — 自律移動（LiDAR SLAM + Nav2）
- **月:** May 2026
- **Status:** upcoming
- **Progress:** 0%
- **タスク:** システム分層設計 / TF・座標系構築（map→odom→base_link→sensors）/ 底盤制御確認 / FAST-LIO / ORB-SLAM3 / RTAB-Map / マップ作成・保存・再ロード / Nav2設定（global+local planner / costmap）/ 基本ナビゲーションテスト / 障害物回避チューニング / 簡易環境認識ノード / Isaac Sim 仿真環境構築 / ROS2 Bridge接続 / Sim2Real対応
- **成果物:** A→B の自律移動が可能（実機 + Isaac Sim 両対応）
- **最終験収目標:**
  - [ ] 安定した地図生成が可能（FAST-LIO / SLAM 動作確認）
  - [ ] 地図を読み込んでの自己位置推定が安定動作
  - [ ] RViz で目標地点指定 → 自動ナビゲーション成功
  - [ ] 基本的な静的障害物の回避が可能
  - [ ] Isaac Sim 仿真環境でも同等のナビゲーションが動作可能

### Phase 2 — Skill System 構築
- **月:** Jun 2026
- **Status:** upcoming
- **Progress:** 0%
- **タスク:** Skill API設計 / JSON schema / ROS2→API抽象化 / Retry / Timeout / Safety constraint
- **成果物:** ROS機能をAIが使える形に変換

### Phase 3 — AI OS 導入（Agent System）
- **月:** Jul 2026
- **Status:** upcoming
- **Progress:** 0%
- **タスク:** Planner Agent / Ops Agent / Safety Agent / Event Bus / Memory（簡易）
- **成果物:** Always-on AI システム稼働

### Phase 4 — 移動タスクの AI 化
- **月:** Aug 2026
- **Status:** upcoming
- **Progress:** 0%
- **タスク:** 巡回タスク / Planner→Skill実行 / 成功/失敗判定 / RAG 記憶統合
- **成果物:** AI による自律移動タスク実行

### Phase 5 — アーム統合（Manipulation）
- **月:** Sep 2026
- **Status:** upcoming
- **Progress:** 0%
- **タスク:** SOARM101 ROS統合 / IK / FK / YOLO物体検出 / pick & place / Depth estimation
- **成果物:** 移動＋操作が可能

### Phase 6 — VLA 導入
- **月:** Oct 2026
- **Status:** upcoming
- **Progress:** 0%
- **タスク:** LeRobotデータ収集 / Imitation Learning / VLA モデル適用
- **成果物:** 「見て→動く」動作実現

### Phase 7 — システム統合
- **月:** Nov 2026
- **Status:** upcoming
- **Progress:** 0%
- **タスク:** Navigation + Arm + AI / Multi-agent / Health monitoring / Fail-safe
- **成果物:** Robot Harness System 完成

### Phase 8 — デモ完成
- **月:** Dec 2026
- **Status:** upcoming
- **Progress:** 0%
- **タスク:** E2E タスク設計 / シナリオ作成 / 安定化調整 / デモ検証
- **成果物:** 完成デモ（実用レベル）

### Phase 9 — 研究化・論文・発表
- **月:** Jan–Apr 2027
- **Status:** upcoming
- **Progress:** 0%
- **タスク:** システム改善 / ログ分析 / 論文化 / 発表準備
- **成果物:** 論文・完成プロジェクト

---

## 🎯 デモ要件

<!-- radar-scores: 順番は 屋外対応, 長期記憶, マルチエージェント, SOARM101, 音声UI, マルチモーダル認識 -->
<!-- 各スコアは 0〜10 -->

| 要件                                      | 優先度 | スコア |
|-------------------------------------------|--------|--------|
| 🌳 屋外・屋内シームレス走行（GNSS + LiDAR SLAM）| 最重要 | 9  |
| 🧠 記憶システム活用（Episodic / RAG + Vector DB）| 重要  | 8  |
| 🤖 マルチエージェント（Planner / Ops / Safety）  | 重要  | 7  |
| 🦾 精密マニピュレーション（SOARM101 + Closed-loop）| 必須 | 8 |
| 🎤 音声指令 UI（Whisper + TTS）               | 必須   | 7      |
| 👁️ マルチモーダル認識（VLM + YOLO + OCR）    | 必須   | 8      |
| 🛡️ 安全システム（Safety Agent + Fail-safe）   | 重要   | 7      |

---

## 🎬 デモシナリオ（メインページ概要版）

<!-- タブ表示用。詳細・技術仕様は demo.md を参照 -->
<!-- カテゴリ A: モバイル単体 / カテゴリ B: アーム単体 / カテゴリ C: モバイル+アーム複合 -->

### ① SLAM 自律移動 & エレベーターボタン押下（A-L1 / B-L1）
- **アイコン:** 🟢
- **Phase:** 1–2
- **説明:** 音声指令で SLAM 自律移動＋走行ログ記録（A-L1）と、指示によるエレベーターボタン押下（B-L1）を実証する最初の実用デモ群。
- **フロー A:** 🗣️ 音声指示 → 🤖 LLM 解釈 → 🗺️ SLAM+Nav2 自律走行 → 📝 走行ログ記録 → ✅ 到達確認
- **フロー B:** 🗣️「3階を押して」→ 🤖 LLM 解釈 → 👁️ YOLO/VLM ボタン認識 → 📐 IK 計算 → 🦾 SOARM101 押下 → ✅ 確認
- **技術タグ:** ORB-SLAM3 / Nav2 / Whisper / LLM / YOLO / IK / SOARM101

### ② 移動 & 操作 複合デモ（C-L1）
- **アイコン:** 🔵
- **Phase:** 2–3
- **説明:** 「〇〇に移動してボタンを押して」という1つの音声指示を LLM が分解し、SLAM 移動とアーム操作を連続実行する最初の複合デモ。走行ログも記録。
- **フロー:** 🗣️ 音声指示 → 🤖 LLM 分解 → 🗺️ SLAM+Nav2 移動 → 📝 走行ログ → 👁️ ターゲット認識 → 🦾 アーム操作 → ✅ 完了報告
- **技術タグ:** Nav2 / SLAM / SOARM101 / YOLO / LLM Planner / Whisper

### ③ 記憶システム活用 & 文字スペリング（A-L2 / B-L2）
- **アイコン:** 🟡
- **Phase:** 3–4
- **説明:** 走行ログを Vector DB に蓄積し、「前に行った場所へ」という文脈指示で RAG 記憶から位置を想起して移動（A-L2）。物品名を指定して文字ブロックをスペルアウト（B-L2）。
- **フロー A:** 🗣️ 文脈指示 → 🧠 Memory 検索（RAG）→ 📍 位置推定 → 🗺️ SLAM 移動 → 📝 Memory 更新
- **フロー B:** 🗣️ 物品名指示 → 🤖 LLM 計画 → 👁️ OCR+YOLO → 🦾 ブロック把持×N → ✅ 完成
- **技術タグ:** RAG / Vector DB / Episodic Memory / OCR / YOLO / Sequential manipulation

### ④ 記憶 × 自律デリバリー（C-L2）
- **アイコン:** 🟠
- **Phase:** 4–5
- **説明:** 「前に置いてあった〇〇を取ってきて」など Episodic Memory を参照した文脈指示に対応。記憶から対象位置を推定し、移動→把持→搬送→配置を一貫して実行。
- **フロー:** 🗣️ 文脈指示 → 🧠 Memory 検索（RAG+Vector DB）→ 🗺️ SLAM+Nav2 移動 → 👁️ YOLO → 🦾 把持・搬送・配置 → 🧠 Memory 更新 → ✅ 報告
- **技術タグ:** Episodic Memory / RAG / Nav2 / YOLO / IK / SOARM101 / Whisper / TTS

### ⑤ 屋外・屋内シームレス走行 & 精密操作（A-L3 / B-L3）
- **アイコン:** 🔴
- **Phase:** 5–6
- **説明:** GNSS+SLAM で屋外→屋内を安定走行し Safety Agent が異常を自律判断（A-L3）。プラグ挿入など視覚フィードバック Closed-loop による精密操作（B-L3）。
- **フロー A:** 🌳 屋外（GNSS+SLAM）→ 🏢 屋内（Nav2）→ ⚠️ Safety Agent 監視 → 🧠 記憶参照・更新
- **フロー B:** 👁️ 挿入口認識 → 📐 精密 IK → 🦾 挿入 → 🔄 視覚フィードバック補正 → ✅ 完了
- **技術タグ:** GNSS / ORB-SLAM3 / Safety Agent / EKF / SOARM101 / Closed-loop / VLM

### ⑥ 屋外・屋内 × arm操作 × 安全 × 記憶 — 統合最終デモ ⭐（C-L3）
- **アイコン:** 🔴⭐
- **Phase:** 7–8
- **説明:** 全要素統合・ストーリー性あり。屋外・屋内シームレス走行 ＋ Safety Agent ＋ 記憶システム ＋ 精密フィードバック操作がすべて連携して動作する集大成デモ。
- **フロー:** 🗣️ 複合指示 → 🧠 Memory 参照 → 🌳 屋外走行 → 🏢 屋内移動 → ⚠️ Safety 監視 → 👁️ VLM 認識 → 🦾 精密操作（Closed-loop）→ 📝 Memory 更新・報告
- **技術タグ:** GNSS+SLAM / Nav2 / Safety Agent / Episodic Memory / SOARM101 / Closed-loop / VLM / Whisper

---

<!-- ================================================================
  NOTES / MEMO エリア（自由記述）
================================================================ -->

## 📝 メモ・備考

- Phase 0 部分完了（2026-04-11）。ROS2ノード確認・手動操縦・SOARM101動作・アーム上下機構テストすべて完了。残タスク：LiDAR追加・センサー統合・LLM基礎実装。
- Joy-Con 手動操縦・モーター制御チェーン確認済み（2026-04-11）。
- SOARM101 基本動作・Teleoperator・VLA サンプル実行を新機体上で確認済み（2026-04-11）。
- アーム上下機構：3Dプリントコネクタ破損→金属ネジ＋3Dプリントベース再設計で解決（2026-04-11）。
- Phase 0 残タスク：Livox MID360 LiDAR 追加 → センサー全体確認 → LLM システム実装 → 外装・配線整理。
- Phase 1 タスク詳細を Todo-may.md より追加（2026-04-16）：システム分層設計 / TF構築 / FAST-LIO / Nav2 / Isaac Sim。
- Phase 1 最終験収目標：安定建図 / 自己位置推定 / RViz→自動ナビ / 障害物回避 / Isaac Sim 動作確認。
- デモシナリオは3カテゴリ×Level 1/2/3 構成に再編（詳細は demo.md 参照）。
- Harness の概念・定義については後ほど参考情報をもとに補完予定。

---
