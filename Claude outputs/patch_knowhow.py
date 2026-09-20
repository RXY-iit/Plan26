import re, shutil

SRC = "/mnt/user-data/uploads/Plan-26/subpages/report-pages/weekly-report/real-arm-agent/TOUCH-ANYTHING-KNOWHOW-20260907.html"
DST = "/mnt/user-data/outputs/build/TOUCH-ANYTHING-KNOWHOW-20260907.html"
s = open(SRC, encoding="utf-8").read()

def rep(old, new, count=1):
    global s
    assert old in s, "missing: " + old[:60]
    s = s.replace(old, new, count)

# 1. proper document skeleton (charset is required for local file viewing)
assert s.lstrip().startswith("<title>")
s = ('<!DOCTYPE html>\n<html lang="ja">\n<head>\n<meta charset="UTF-8">\n'
     '<meta name="viewport" content="width=device-width, initial-scale=1">\n') + s.lstrip()
rep('</style>\n\n<div class="wrap">', '</style>\n</head>\n<body>\n\n<div class="wrap">')
s = s.rstrip() + "\n</body>\n</html>\n"

# 2. extra CSS
css = """
  /* figures / videos */
  .fig{margin:18px 0 0;border:1px solid var(--line);background:var(--surface);}
  .fig img,.fig video{width:100%;height:auto;display:block;}
  .fig video{background:#000;max-height:520px;}
  .fig figcaption{font-size:12.5px;color:var(--ink-faint);padding:9px 12px;border-top:1px solid var(--line);line-height:1.7;}
  .fig-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:18px;}
  .fig-2 .fig{margin:0;}
  .fig-2 .fig img{height:280px;object-fit:contain;background:var(--surface-2);}
  @media (max-width:600px){.fig-2{grid-template-columns:1fr;}.fig-2 .fig img{height:auto;}}
  .backlink{margin:14px 0 0;font-size:12.5px;}
  table.spec td:first-child{white-space:nowrap;color:var(--ink);}
  ol.plain{margin:14px 0 0;padding-left:22px;font-size:14px;color:var(--ink-soft);}
  ol.plain li{margin-bottom:8px;}
</style>"""
rep("</style>", css, 1)

# 3. header updates
rep('<span class="chip chip-watch">再現性：サンプル収集継続中</span>',
    '<span class="chip chip-watch">再現性：サンプル収集継続中</span>\n      <span class="chip chip-watch">最終接近：連続視覚サーボへ移行中</span>')
rep("更新 2026-09-07 ／", "更新 2026-09-20 ／")
rep("  </header>\n", '  </header>\n  <p class="backlink"><a href="real-arm-agent-ja.html">← 週次報告（実機 ARM 追加・Touch Anything）へ戻る</a></p>\n')
rep('<a href="#issues">06 問題と対策</a>',
    '<a href="#issues">06 問題と対策</a>\n    <a href="#servo">07 最終接近の改善</a>')

# 4. hardware: test-bench photo
rep('<p class="caption">アーム設置は現状12 V卓上運用。移動ベースへの搭載・リフト連動は本文執筆時点で今後の課題。</p>',
    '<p class="caption">アーム設置は現状12 V卓上運用。移動ベースへの搭載・リフト連動は本文執筆時点で今後の課題。</p>\n'
    '    <figure class="fig"><img src="media/touch-test.jpg" alt="Touch Anything 実機試験環境">'
    '<figcaption>実機試験環境。番号付きボタン（1〜3）と色付きボタンを並べた試験パネルに対して、SO-ARM101 を向けている。</figcaption></figure>')

# 5. calibration photo in step 2
old = "<li>高さ・方向別のTouch prepare pose reference、Pan/Tilt、実関節seedを記録し、旧来の汎用参照姿勢を廃止した</li>\n        </ul>"
rep(old, old + '\n        <figure class="fig"><img src="media/calibration.jpg" alt="較正の様子">'
    '<figcaption>ChArUco ボードを用いた D435・Arm Camera・ARM 間の較正の様子。</figcaption></figure>')

# 6. demo section: replace placeholder with real videos + press.png
demo = ('<div class="fig-2" style="grid-template-columns:1fr;">\n'
        '      <figure class="fig"><video controls preload="metadata" muted><source src="media/touch-demo.mp4" type="video/mp4"></video>'
        '<figcaption>Touch Anything 実機デモ（目標指定から接近・接触まで）。</figcaption></figure>\n'
        '      <figure class="fig"><video controls preload="metadata" muted><source src="media/touch-anything-demo.mp4" type="video/mp4"></video>'
        '<figcaption>Touch Anything 実行録画（通し・長尺版）。</figcaption></figure>\n'
        '      <figure class="fig"><img src="media/press.png" alt="正常な接近時の RViz">'
        '<figcaption>正常動作時の RViz（Touch Anything パネル）。Arm Camera 上で爪先と対象が整列し、PRESS フェーズに到達した状態。</figcaption></figure>\n'
        '    </div>')
s, n = re.subn(r'<div class="demo-box">.*?</p>\s*</div>', lambda m: demo, s, count=1, flags=re.S)
assert n == 1

# 7. issues: early visual deviation (resolved)
rep("<p>実機で踏んだ問題と、その対策を時系列にまとめる。</p>",
    """<p>実機で踏んだ問題と、その対策を時系列にまとめる。</p>

    <div class="issue">
      <p class="issue-label">初期の視覚定位偏差（解消済み）</p>
      <div class="issue-row"><span class="issue-tag problem">問題</span><p>開発初期の実験で、視覚定位に偏差があり、最終接近位置が目標からずれた。下図はそのときの RViz の状態で、開発過程の問題事例として残している。</p></div>
      <div class="issue-row"><span class="issue-tag fix">対策</span><p>視覚偏差は解消済み。現在は 05 に示した正常動作の例のように、対象へ整列した状態で PRESS に到達できる。</p></div>
      <figure class="fig"><img src="media/press-error.png" alt="視覚定位偏差による誤差の例"><figcaption>初期実験での誤差例（RViz）。視覚定位の偏差により、最終接近位置がずれた状態。</figcaption></figure>
    </div>""")

# 8. new section 07
sec = r"""
  <section id="servo">
    <div class="sec-head"><span class="sec-num">07</span><h2>最終接近フェーズの改善 — 連続視覚サーボへ</h2></div>
    <div class="sec-rule"></div>
    <p>06 までの対策で FAR → NEAR → Press の一連は実機で成立したが、<strong>最後の精密接近と Press は依然として安定しない</strong>。ここでは、問題 → 原因 → 新しい制御構成 → 実機で見つかった問題 → 次の検証、の順に整理する。</p>

    <h3 class="sub"><span class="tag">7.1</span>問題と原因</h3>
    <div class="issue">
      <p class="issue-label">停止・再始動を繰り返す接近方式</p>
      <div class="issue-row"><span class="issue-tag problem">問題</span><p>従来の接近は「SAM 再分割 → 軌道生成 → 実行 → 停止・整定待ち → 再観測」を 1 ステップずつ繰り返す。実際の観測間隔は約 6〜13 秒に達し、目標位置と ARM 動作の更新が不連続になっていた。</p></div>
      <div class="issue-row"><span class="issue-tag fix">原因</span><p>停止のたびに荷重による沈み込みや振動が起き、再始動でも新たな誤差が乗る。補償モデルが扱う誤差が、方向・姿勢・機械状態で変わる不安定なものになる。</p></div>
    </div>
    <div class="issue">
      <p class="issue-label">ARM 自体の精度限界と単発視覚への依存</p>
      <div class="issue-row"><span class="issue-tag problem">問題</span><p>SO-ARM101 は低コストなアームで、絶対位置精度・繰り返し位置精度が限られる（ギアのバックラッシュや荷重による下振れ）。</p></div>
      <div class="issue-row"><span class="issue-tag fix">原因</span><p>ある一時点の視覚定位結果だけで最終 Press を実行すると、この機械誤差と視覚推定誤差がそのまま蓄積する。</p></div>
    </div>

    <h3 class="sub"><span class="tag">7.2</span>新しい制御構成</h3>
    <p>方針は、<strong>単一の目標位置で最終運動を決めるのをやめ、接近中は視覚特徴量を実時間で計算し続け、画像誤差のフィードバックで運動方向を修正しながら最終 Press 位置へ収束させる</strong>こと（画像ベース視覚サーボ）。SAM は「どの物体か」を最初に確定する役割だけを担い、その後の高速な更新は軽量な追跡に任せる。</p>
    <div class="tblwrap">
      <table class="spec">
        <thead><tr><th>層</th><th>手法</th><th class="num">頻度</th><th>役割</th></tr></thead>
        <tbody>
          <tr><td>目標初期化</td><td>SAM 2.1 + 人の確認</td><td class="num">1 回</td><td>意味的な目標と初期マスクの確定</td></tr>
          <tr><td>連続追跡</td><td>Pyramid KLT</td><td class="num">約 25 Hz</td><td>目標位置・マスクの連続更新（SAM の再実行なし）</td></tr>
          <tr><td>再同定</td><td>ORB 特徴（設計）</td><td class="num">必要時</td><td>KLT が外れたときの目標再特定。両方失敗した場合のみ SAM 再実行・人の再確認</td></tr>
          <tr><td>視覚制御</td><td>画像誤差の閉ループ</td><td class="num">10 Hz</td><td>Y/Z の整列と +X の前進を連続的に補正</td></tr>
          <tr><td>Press 判定</td><td>人が確認した目標領域の色・外観変化</td><td class="num">画像レート</td><td>ボタンの変色や対象の移動で成功を判定</td></tr>
        </tbody>
      </table>
    </div>
    <p class="caption">目標の同一性は、人が確認した時点の基準（キーフレーム・マスク・色）を不変に保持する。追跡結果で基準を更新し続けると、背景へ漂流したときに背景を永久に「目標」と学習してしまうため。</p>

    <h3 class="sub"><span class="tag">7.3</span>連続動作の実行 — 10 ステップの動作ブロック</h3>
    <p>視覚側が連続になっても、指令が「軌道を最後まで実行 → 停止 → 次」のままでは停止・再始動が残る。そこで、VLA の action chunking に近い形で、<strong>0.5 秒分（10 ステップ）の関節目標をまとめて送り、新しい観測のたびに未実行の後半を置き換える</strong>方式にした。学習モデルではなく幾何・IK による生成で、既存の安全チェーン（関節範囲・速度制限・電流・温度など）はそのまま有効。</p>
    <div class="tblwrap">
      <table class="spec">
        <thead><tr><th>項目</th><th class="num">値</th><th>意味</th></tr></thead>
        <tbody>
          <tr><td>動作ブロック</td><td class="num">10 × 50 ms</td><td>0.5 秒分。終点は IK 目標に厳密に一致、途中は滑らかな補間</td></tr>
          <tr><td>再計画周期</td><td class="num">100 ms</td><td>10 Hz で観測を反映し、未実行の後半を原子的に置換</td></tr>
          <tr><td>観測遅延の補正</td><td class="num">≤ 250 ms</td><td>観測の古さに応じ、実測速度で先読みした状態から生成</td></tr>
          <tr><td>ウォッチドッグ</td><td class="num">350 ms</td><td>更新が途絶えたら、0.5 秒のブロックを走り切る前に HOLD</td></tr>
        </tbody>
      </table>
    </div>
    <p class="caption">時間の大小関係：通常の再計画 0.10 s ＜ 追跡の鮮度上限 0.20 s ＜ ウォッチドッグ 0.35 s ＜ ブロック長 0.50 s。短い計算の揺らぎでは止まらず、上位が落ちたときは確実に止まる。</p>

    <h3 class="sub"><span class="tag">7.4</span>実機で見つかった問題と対策</h3>
    <div class="issue">
      <p class="issue-label">Z 方向の下振れ（2026-09-18 実機）</p>
      <div class="issue-row"><span class="issue-tag problem">問題</span><p>約 2.5 秒の連続動作で、ARM 先端が Z 方向に最大 約 44.8 mm 下がり、目標が視野から外れていった。追跡・制御は正常に動いていた。</p></div>
      <div class="issue-row"><span class="issue-tag fix">原因</span><p>実機較正で確認済みの「目標が画像の右側 → 先端は +Z へ」という関係と、制御器が出した Z の向きが逆だった。さらに FAR 用の上方補償（+22 mm）が最初の目標にしか効かず、2 周期目以降は「前回の目標と現在位置の残差」が引き継がれず補償が消えていた。</p></div>
      <div class="issue-row"><span class="issue-tag fix">対策</span><p>実機の像素応答を使う閉ループ補償に置き換え、補償の残差を周期をまたいで保持するよう修正した。</p></div>
    </div>
    <div class="issue">
      <p class="issue-label">運動中に追跡が「止まる」（2026-09-19 実機）</p>
      <div class="issue-row"><span class="issue-tag problem">問題</span><p>動作ブロックの重ね合わせ実行は実機で動作したが、約 0.7 秒で「追跡不能」として停止した。同じ映像を離線で再生すると 1228 フレーム中 1208 フレームが追跡成功、喪失は 0 で、目標を見失ったわけではなかった。</p></div>
      <div class="issue-row"><span class="issue-tag fix">原因</span><p>Touch プロセス内の追跡タイマが約 6.45 秒実行されていなかった。診断用の小さなトピック（目標点・姿勢・マーカー）が、信頼性重視の配信設定で 0.5 秒周期に発行されており、配信のブロックが追跡処理を最大数秒止めていた。</p></div>
      <div class="issue-row"><span class="issue-tag fix">対策</span><p>診断トピックを BEST_EFFORT・最新 1 件のみに変更し、自動接近・視覚サーボ中・実行要求中は周期配信そのものを止めるようにした。</p></div>
    </div>
    <div class="issue">
      <p class="issue-label">停止後の余動</p>
      <div class="issue-row"><span class="issue-tag problem">問題</span><p>視覚制御が「危険」と判断して STOP しても、旧実装は最後の未到達目標を関節指令に残したまま。機構がその目標へ動き続ける可能性があった。</p></div>
      <div class="issue-row"><span class="issue-tag fix">対策</span><p>STOP 時は 6 軸すべての目標位置を現在の実測位置に書き換え、読み戻しで確認してから HOLDING を報告する。確立に失敗したらウォッチドッグ／フォールト経路へ進む。</p></div>
    </div>

    <h3 class="sub"><span class="tag">7.5</span>現在の検証状況</h3>
    <div class="tblwrap">
      <table class="spec">
        <thead><tr><th>項目</th><th>状況</th></tr></thead>
        <tbody>
          <tr><td>実機：動作ブロックの重ね合わせ実行</td><td>ログ上で確認（8 回の指令すべてに有効な 10 ステップ、再計画数が指令と共に増加）</td></tr>
          <tr><td>モック環境（START + 12 回の更新）</td><td>ブロック消費が指令間で進行、停止後の関節ドリフト 0.0 rad、ウォッチドッグの意図的な発火で HOLD を確認</td></tr>
          <tr><td>自動テスト</td><td>関連パッケージのテスト 155 件が通過</td></tr>
          <tr><td>実機での Press までの連続動作</td><td><strong>未検証</strong>（次の Isaac Sim 検証後に実施）</td></tr>
        </tbody>
      </table>
    </div>

    <h3 class="sub"><span class="tag">7.6</span>次の検証 — Isaac-first</h3>
    <p>実機試験は時間と安全のコストが高いため、まず Isaac Sim で実機と同じトピック・テレメトリ構成を再現して方式を固め、実機は 1 回の監督付き検証に絞る。</p>
    <ol class="plain">
      <li>Isaac Sim で Arm Camera・関節状態・TF・視覚サーボ用トピックを実機と同じスキーマで再現する（アクチュエータとカメラのバックエンドだけを差し替え、プロトコルは分岐させない）。</li>
      <li>画像遅延・IK 遅延・DDS の背圧・関節応答の遅れ・Z 方向のモデル誤差を注入し、動作ブロックの置換、追跡の締切遵守、STOP 直後の凍結を確認する。</li>
      <li>FAR → NEAR の全行程で追跡喪失・タイムアウト・Z 下振れが出なくなるまで、Z 補償・速度制限・ブロック長を調整する。</li>
      <li>同じパラメータを実機へ反映し、人が監督する FAR → NEAR を 1 回実施する（Press 実行前は確認待機で HOLD）。</li>
    </ol>
    <p class="caption">実機での合格条件：Z 下振れ 12 mm 以内、ウォッチドッグ不作動、再計画数の増加とブロック位置の進行が確認できること、実測先端との残差で Z 補償が収束すること。これらが揃うまでは、動作ブロックによって実際の位置精度が上がったとは判断しない。</p>
  </section>
"""
rep("  <footer>", sec + "\n  <footer>")

# 9. footer
rep("<p>作成日：2026-09-07</p>", "<p>作成日：2026-09-07 ／ 更新：2026-09-20（図・動画の追加、07 最終接近フェーズの改善を追記）</p>")

open(DST, "w", encoding="utf-8").write(s)
print("ok", len(s))
