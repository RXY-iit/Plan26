| Phase       | 期間    | 目的          | タスク                                                        | 成果                 |
| ----------- | ----- | ----------- | ---------------------------------------------------------- | ------------------ |
| **Phase 0** | 4月    | ロボット基盤の安定化  | ・配線整理 / 電源安定化・ROS2ノード確認・手動操作の安定化・センサー動作確認・SOARM101初期動作確認   | 安定して動くロボット（壊れない状態） |
| **Phase 1** | 5月    | 自律移動の実現     | ・SLAM構築（ORB-SLAM3 / RTAB-Map）・マップ作成・Nav2導入・Waypoint移動      | A→Bの自律移動が可能        |
| **Phase 2** | 6月    | Skill化（抽象化） | ・navigation skill設計・system系skill作成・ROS2→API抽象化・ログ取得整備      | ROS機能をAIが使える形に変換   |
| **Phase 3** | 7月    | AI OS導入     | ・Gateway実装・Event system構築・Memory（簡易）・Planner/Ops Agent導入   | Always-on AIシステム稼働 |
| **Phase 4** | 8月    | 移動タスクのAI化   | ・巡回タスク作成・Planner→Skill実行・成功/失敗判定ロジック・簡易UI                  | AIによる自律移動タスク実行     |
| **Phase 5** | 9月    | アーム統合       | ・SOARM101 ROS統合・pick & place実装・カメラ連携・座標系調整                 | 移動＋操作が可能           |
| **Phase 6** | 10月   | VLA導入       | ・LeRobotデータ収集・imitation learning・VLAモデル適用・簡単な操作タスク学習       | 「見て→動く」動作実現        |
| **Phase 7** | 11月   | システム統合      | ・navigation + arm + AI統合・multi-agent化・Safety Agent導入・異常時対応 | Robot OpenClaw完成   |
| **Phase 8** | 12月   | デモ完成        | ・エンドツーエンドタスク設計・シナリオ作成・安定化調整・デモ検証                           | 完成デモ（実用レベル）        |
| **Phase 9** | 1月〜4月 | 研究化・洗練      | ・システム改善・ログ分析・論文化・発表準備                                      | 論文・完成プロジェクト        |
