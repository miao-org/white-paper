# Robotics Engineer Learning Plan

[简体中文](README.zh-CN.md) · [Website](https://miao-org.github.io/white-paper/)

Edit Markdown in `docs/en/` and `docs/zh-CN/` together, then open a PR against `main`. Both languages must stay in sync.

Docsify renders Markdown in the browser without a build step. The live site reads merged Markdown from `main`; GitHub synchronization may take a short time. GitHub Pages publishes the site shell from `main` → `/docs`.

Local preview: `python3 -m http.server 8000 --directory docs`, then open <http://localhost:8000>.

The `tree-brainstorm` prototype uses one bilingual graph in `docs/data/robotics-tree.json` for both the interactive map and agent exports. The Theory and Engineering views share node identities. Read the [experiment notes](docs/en/tree-notes.md) for source attribution, the data contract, and open design questions. Sample content and relationships are proposals for discussion.

Before submitting changes, run `python3 scripts/check_docs.py` and `python3 scripts/check_tree.py`. Both use the Python standard library; no build or package installation is needed.

[Contributing](CONTRIBUTING.md) · [Contributors](CONTRIBUTORS.md) · [Code of conduct](CODE_OF_CONDUCT.md) · [MIT license](LICENSE)
