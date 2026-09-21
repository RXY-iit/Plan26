# v003 製品資料と出典

取得日：2026-09-20。以下は取得した原本であり、著作権は各メーカー/販売者に帰属する。本ロボットのローカル研究と可視化の参考用であり、再頒布や製造の許諾を与えるものではない。

## ROBOTIS XC330-M288-T

https://emanual.robotis.com/docs/en/dxl/x/xc330-m288/

公式型式の情報と XL/XC-330 共通 STEP を取得済み。

ローカル：references-v2/cad/xc330.stp

## ROBOTIS XH540-W270

https://docs.robotis.com/ko/docs/dxl/model_reference/x_series/xh_series/xh540-w270/

公式の XM/H/D-540 共通 STEP を取得済み。

ローカル：references-v2/cad/xh540.stp

## Livox MID-360

https://www.livoxtech.com/mid-360/downloads

公式の本体 STEP と FOV STEP を取得済み。本体は 65 × 65 × 60 mm。

ローカル：references-v2/cad/mid360.stp

## EASM2XF020AZAK

https://www.orientalmotor.co.jp/ja/products/detail?hinmei=EASM2XF020AZAK&refFlg=1

公式寸法図を取得済み。CAD ポータルのアクセス制限により STEP は未取得のため、寸法図から表示モデルを再構成しました。

ローカル：references-v2/products/lift-dimensions.png

## BLMR5100K-GFV-B / GFS5G30FR

https://catalog.orientalmotor.com/item/op-online-components-brushless-dc-motor-components/-12-hp-200-w-1-4-hp-blm-r-type-brushless-dc-motors/blmr5100k-30fr-b

公式外形図を取得済み。CAD プレビューが 403 を返したため STEP は未取得。

ローカル：references-v2/products/drive-dimensions.jpg

## AZ IT12B-FP

https://store.shopping.yahoo.co.jp/motostyle/4950545351104.html

ユーザー指定製品：150 × 65 × 92 mm、0.9 kg。12 V と搭載数は操作者が確認済み。外観は製品画像から再構成しました。

ローカル：references-v2/products/battery-product.jpg

## STEP 形状検査の制約

XH540 は形状有効性検査に合格。XC330 共通ファイルには openShell が 6 件、MID-360 には openShell/noSolid/selfIntersecting が 1 件ある。メーカー形状を修正せず元ファイルを保持する。外形表示には使用できるが、閉じたソリッドとしての製造検証済みとは扱わない。詳細は references-v2/cad/validation を参照。元 STEP の外形寸法は mm、Blender への換算係数は 0.001。

## 情報の分類

- Verified Hardware Fact：公式製品ページ、寸法図、メーカー CAD、ハードウェア文書、実機写真から直接確認できる事実。
- Design Decision / Design Rationale：取り付け配置、用途、選定理由、運用経験。対応する外部資料がない場合、Evidence は不要。
- Reference / Concept Information：運用設定、校正記録、過去資料、概念図。これらだけで現在の実機取り付け寸法が証明されるわけではない。

フィードバック文書と開発用手描き図は開発時の連絡用に限り、正式な Evidence または Reference には含めない。

カメラ測定図は前方 0.4–1.6 m、手前側の幅 0.7 m を記録している。取り付け角と遠方側の幅の数値はない。Web 表示の俯角は取り付け高さと両端点から推算し、遠方側の幅は概念的に延長している。この表示姿勢は元の URDF/TF に書き戻していない。MID360 の視野はセンサ局所中心平面を基準に下 7°、上 52°、水平 360° とし、取り付け姿勢とともに回転する。

メーカー CAD は製品形状の根拠となる。機器の取り付け位置、印刷部品の壁厚と穴位置は実測が必要。過去のハードウェア文書の原文も保持し、旧寸法や運用値は現在の部品説明の分類に従って扱う。
