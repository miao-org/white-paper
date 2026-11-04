# 机器人工程师学习计划

[English](README.md) · [在线阅读](https://miao-org.github.io/white-paper/#/zh-CN/)

同步编辑 `docs/en/` 与 `docs/zh-CN/` 中的 Markdown，向 `main` 提交 PR。中英文必须保持一致。

Docsify 在浏览器中渲染 Markdown，无需编译。线上正文直接读取 `main` 中已合并的 Markdown；GitHub 同步可能有短暂延迟。站点外壳由 GitHub Pages 从 `main` → `/docs` 发布。

本地预览：运行 `python3 -m http.server 8000 --directory docs`，打开 <http://localhost:8000>。

`tree-brainstorm` 原型使用 `docs/data/robotics-tree.json` 中的同一份双语图谱，同时驱动交互地图和 Agent 导出。理论与工程视图共享节点身份。[实验说明](docs/zh-CN/tree-notes.md)介绍了来源、数据约定和待讨论的设计问题。样例内容与节点关系均是供讨论的提议。

提交更改前，运行 `python3 scripts/check_docs.py` 和 `python3 scripts/check_tree.py`。两项检查仅使用 Python 标准库，无需编译或安装依赖。

[贡献指南](CONTRIBUTING.zh-CN.md) · [贡献者](CONTRIBUTORS.md) · [行为准则](CODE_OF_CONDUCT.md) · [MIT 许可证](LICENSE)
