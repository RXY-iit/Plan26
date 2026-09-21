# Blender ワークスペース

現在の主ファイルは `robot_master_v003.blend`。`scripts/build_robot.py` で構築し、Web 用モデルは `../web/` に出力する。以下の v001 ファイル名は初期計画の記録であり、保存済みの旧シーンは現在の入口として使用しない。

推奨ファイル：

- `robot_master_v001.blend`：唯一のメインシーン。高品質な階層構造とマテリアルを保持します。
- `robot_review_v001.glb`：段階的なレビューエクスポート。
- `scripts/`：後続で自動的に URDF をインポートしたり、バッチ命名やエクスポートを行う場合、ここにスクリプトを追加できます。

開始設定：Metric、Unit Scale `1.0`、Length `Meters`、座標は X 前、Y 左、Z 上を使用します。

`../references/meshes/` 内の元メッシュは直接変更しないでください。インポート後に生成されるクリーニング版メッシュは、Blender ファイルに保存するか、または本ディレクトリの`derived/`に別名で保存し、出典と拡大・縮小を記録してください。

ROS 環境がない場合は、以下の展開ファイルから直接インポートできます。

- `../references/urdf/expanded/robot_runtime_simplified.urdf`
- `../references/urdf/expanded/so_arm101.urdf`

その中では、移動ロボット URDF の車体 box はプレースホルダーとして使用されており、`../MEASUREMENTS.md` を用いて 4040/2020 で再構築する必要があります。

オブジェクト命名、Collection および分解 transform 規則については、[../GUIDELINE.md](../GUIDELINE.md) を参照してください。
