# About this tree experiment

[Back to the tree](README.md) · [Graph JSON](../data/robotics-tree.json ':ignore')

This prototype explores one question: can a robotics learning map be pleasant to browse and precise enough for an AI agent to use? It is a small sample for discussion, not a complete curriculum or an assessment of anyone's skills.

## Reading the map

The theory and engineering lenses expose two overlapping ways into the same graph. A shared node belongs to both lenses. Cards move through four browsing stages—foundations, models, autonomy, and integration—but these are editorial coordinates, not a fixed learning schedule or hard gates.

Like a Civilization technology tree, the view uses cards and connections to make relationships visible. Robotics is a graph: a topic can have several prerequisites, support several projects, and be revisited at greater depth. Selecting a node brings its outcomes, suggested evidence, and relationships into focus. Evidence describes a possible demonstration of learning; it does not mean the learner has completed it.

All connections in this sample are proposals. A `prerequisite` edge means “learn the source before the target”; an `application` edge means “the target applies the source.” Each has a rationale. These relationships, and the four-stage grouping, are hypotheses to debate rather than dependencies asserted by the original article.

## One graph, two audiences

The authoritative graph is [robotics-tree.json](../data/robotics-tree.json ':ignore'). The visual map and agent exports should read this same file. English and Chinese Markdown provide context; they do not maintain separate copies of the graph.

The version `0.1.0` contract uses:

- `schemaVersion` and `status: "brainstorm"` to identify the format and maturity; `sources` hold attribution.
- Nodes with stable `id`, bilingual `title`, `summary`, `outcomes`, and `evidence`; `tracks` (`theory`, `engineering`, or both); `topics`; and `sourceIds`. `provenance` distinguishes `adapted` content from a new `proposal`.
- `stage` and `slot` for presentation. Agents must not derive dependencies from card position.
- Edges with `id`, `from`, `to`, `type`, bilingual `rationale`, and `provenance: "proposal"`. Follow explicit edges, not similar titles or nearby cards.

The intended agent entry points are a full-graph download and a selected-node context export containing its transitive prerequisites. An agent should retain identifiers, edge meanings, provenance, and source attribution when summarizing or proposing a path. Application edges must not silently become prerequisite edges. A suggested path is a proposal for the learner to review.

## Sources and limits

[Issue #1](https://github.com/miao-org/white-paper/issues/1) frames this experiment. The learning seed is [机器人工程师学习计划](https://github.com/ShuoYangRobotics/personal-ai-space/blob/main/zhihu-writing/articles/2016-09-08_机器人工程师学习计划.md), originally [published on Zhihu on September 8, 2016](https://zhuanlan.zhihu.com/p/22266788). Its emphasis on physical interaction, parallel theory and practice, repeated fundamentals, and whole-system engineering informs this sample.

The article describes six academic years; our four stages are a compact adaptation. Its dated tools, hardware advice, and research-frontier claims have not been audited or updated into a current curriculum. Proposed outcomes, evidence, and dependencies need review. Civilization technology trees inform the browsing metaphor, not the subject matter.

## Questions for the next iteration

1. Should a card represent a concept, a practical capability, or a project—and when should these be separate node types?
2. Which proposed prerequisites are essential, which are helpful, and where are alternative routes valid?
3. What evidence would make a capability useful to an agent planning the next step: code, a simulation, measurements, or an explanation?
4. Does browsing by theory/engineering work best, or should the next view start from a goal such as building a mobile robot?

## Preview and checks

Run from the repository root:

```sh
python3 -m http.server 8000 --directory docs
python3 scripts/check_docs.py
python3 scripts/check_tree.py
```

Open [the local preview](http://localhost:8000). The checks validate the documentation and graph structure; they do not establish that the proposed learning relationships are correct.
