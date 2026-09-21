# Web 3D 导出区

v003 已实现本目录的主模型、移动端模型、导出清单与本地预览页面。运行项目根目录的 `serve.py` 后打开 `/web/`；Node.js 仅用于开发验证，浏览网页无需安装。下列规则继续适用。

计划产物：

```text
web/
├── robot_web.glb
├── robot_web_lod1.glb
├── export-manifest.json
└── textures/
```

网页不要根据显示名称猜测零件。GLB node 名中的 `part__<component_id>` 必须与 `../data/components.json` 的 `id` 精确一致。

网页侧建议把以下内容作为独立数据，不烘焙进模型：

- 多语言显示文本；
- 规格、设计理由和证据链接；
- 爆炸偏移；
- 传感器 FOV/运动范围开关；
- Dashboard 实时状态与部件 ID 的映射。

这样修改文字或运行数据时不需要重新导出 GLB。
