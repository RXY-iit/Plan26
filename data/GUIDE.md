# Project Guide — FY2026 Robot Nervous System

**Project:** 筑波大学 FY2026 年間研究プラン可視化サイト
**Last updated:** 2026-04-06

---

## 1. Folder Structure（フォルダ構成）

```
Plan-26/
│
├── plan-fy26.html          # メインページ（研究プラン全体）
├── todo.html               # Todoリストページ
├── demo.html               # デモ計画・要件マップページ
│
├── figure/                 # 画像・設計図（HTMLから参照）
│   ├── fy26-plan.png           # FY2026 研究プラン概要図
│   ├── robot-arch-ver1.png     # ロボットアーキテクチャ図 v1
│   ├── schedual-1.png          # スケジュール図 1
│   └── schedual-2.png          # スケジュール図 2
│
└── data/                   # データソース（Markdownファイル）
    ├── GUIDE.md                # ← このファイル（設計ガイド）
    ├── to_do_list.md           # Todoデータ → todo.html の生成元
    ├── plan_fy26.md            # 研究プランデータ
    ├── demo.md                 # デモ計画データ
    └── temp/                   # 参照・草稿ファイル（編集不要）
        ├── Requirements × Technology Element Map.md
        ├── demo-ideas.md
        └── plan-fy26.md
```

### ルール

- HTMLファイルはルート（`Plan-26/`）に置く
- 新しい画像は必ず `figure/` に追加する
- データ編集は `data/` 内の `.md` ファイルで行い、HTMLに反映する
- `data/temp/` は参照専用。直接編集しない

---

## 2. Page & File Relations（ページとファイルの関係）

```
plan-fy26.html  ←→  todo.html  ←→  demo.html
      ↑                 ↑               ↑
  plan_fy26.md     to_do_list.md     demo.md
  figure/*.png）
```

### 3. スタイル参考

- **全体スタイル参考**: ngrok blog（`ngrok.com/blog`）
  - クリーンなホワイト背景
  - 大きく太いタイポグラフィ
  - パステル系グラデーション（ヒーロー部）
  - シンプルで余白が多い

---

## 4. Claude への更新依頼の書き方

### Todoを更新したい場合

1. `data/to_do_list.md` を直接編集（チェック状態・項目追加など）
2. Claudeに「`to_do_list.md` の内容をもとに `todo.html` を更新して」と伝える

### 新しいページを追加したい場合

- Claudeに「〇〇ページを追加して。既存の nav とデザインに合わせて」と伝える
- 新ページは `Plan-26/` 直下に `.html` で作成
- nav のドロップダウンに追加してもらう

### 画像を追加したい場合

1. `figure/` フォルダに PNG を配置
2. Claudeに「`figure/新画像.png` を設計資料ギャラリーに追加して」と伝える

---

*このファイルはプロジェクトの設計記録です。変更があれば随時更新してください。*
