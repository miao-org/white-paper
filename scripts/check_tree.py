#!/usr/bin/env python3
"""Validate the bilingual brainstorm graph using only Python's standard library."""

import argparse
from collections import deque
import json
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PATH = ROOT / "docs/data/robotics-tree.json"
STAGES = ["foundations", "models", "autonomy", "integration"]
TRACKS = {"theory", "engineering"}
ID_PATTERN = re.compile(r"[a-z][a-z0-9]*(?:-+[a-z0-9]+)*\Z")


def check(data):
    """Return actionable errors; malformed records must not crash validation."""
    errors = []

    def text(value, label):
        if not isinstance(value, str) or not value.strip():
            errors.append(f"{label}: expected nonempty text")
            return False
        return True

    def bilingual(value, label):
        if not isinstance(value, dict):
            errors.append(f"{label}: expected an object with en and zh-CN text")
            return
        for language in ("en", "zh-CN"):
            text(value.get(language), f"{label}.{language}")

    def records(key):
        value = data.get(key)
        if not isinstance(value, list) or not value:
            errors.append(f"{key}: expected a nonempty list")
            return []
        result = []
        for index, item in enumerate(value):
            if isinstance(item, dict):
                result.append(item)
            else:
                errors.append(f"{key}[{index}]: expected an object")
        return result

    def index_records(items, label):
        result = {}
        for index, item in enumerate(items):
            identifier = item.get("id")
            if not isinstance(identifier, str) or not ID_PATTERN.fullmatch(identifier):
                errors.append(f"{label}[{index}].id: expected a stable lowercase ASCII identifier")
            elif identifier in result:
                errors.append(f"{label}: duplicate id {identifier}")
            else:
                result[identifier] = item
        return result

    def member(value, choices, label):
        if not isinstance(value, str) or value not in choices:
            errors.append(f"{label}: expected one of {', '.join(sorted(choices))}")
            return False
        return True

    if not isinstance(data, dict):
        return ["graph: expected a JSON object"]
    if data.get("schemaVersion") != "0.1.0":
        errors.append("schemaVersion: expected 0.1.0")
    if data.get("status") != "brainstorm":
        errors.append("status: expected brainstorm")
    bilingual(data.get("title"), "title")
    bilingual(data.get("description"), "description")

    sources = records("sources")
    source_index = index_records(sources, "sources")
    for index, source in enumerate(sources):
        label = f"sources[{index}]"
        bilingual(source.get("title"), f"{label}.title")
        url = source.get("url")
        if text(url, f"{label}.url"):
            try:
                parsed = urlsplit(url)
                valid = parsed.scheme in {"http", "https"} and bool(parsed.netloc)
            except ValueError:
                valid = False
            if not valid:
                errors.append(f"{label}.url: expected an absolute HTTP(S) URL")

    stages = records("stages")
    stage_index = index_records(stages, "stages")
    if [stage.get("id") for stage in stages] != STAGES:
        errors.append("stages: expected foundations, models, autonomy, integration in that order")
    for index, stage in enumerate(stages):
        bilingual(stage.get("title"), f"stages[{index}].title")
        bilingual(stage.get("description"), f"stages[{index}].description")

    nodes = records("nodes")
    node_index = index_records(nodes, "nodes")
    positions = set()
    used_tracks = set()
    has_shared_node = False
    for index, node in enumerate(nodes):
        label = f"nodes[{index}] ({node.get('id', '?')})"
        for field in ("title", "summary", "evidence"):
            bilingual(node.get(field), f"{label}.{field}")
        member(node.get("provenance"), {"adapted", "proposal"}, f"{label}.provenance")
        valid_stage = member(node.get("stage"), stage_index, f"{label}.stage")
        slot = node.get("slot")
        valid_slot = type(slot) is int and slot in {0, 1}
        if not valid_slot:
            errors.append(f"{label}.slot: expected integer 0 or 1")
        tracks = node.get("tracks")
        valid_tracks = (
            isinstance(tracks, list)
            and 1 <= len(tracks) <= 2
            and all(isinstance(track, str) and track in TRACKS for track in tracks)
            and len(set(tracks)) == len(tracks)
        )
        if not valid_tracks:
            errors.append(f"{label}.tracks: expected theory, engineering, or both without duplicates")
        else:
            used_tracks.update(tracks)
            has_shared_node |= len(tracks) == 2
            if valid_stage and valid_slot:
                position = (node["stage"], tuple(sorted(tracks)), slot)
                if position in positions:
                    errors.append(f"{label}: duplicate stage/track-group/slot position {position}")
                positions.add(position)
        topics = node.get("topics")
        if not isinstance(topics, list) or not topics:
            errors.append(f"{label}.topics: expected a nonempty list")
        else:
            for topic_index, topic in enumerate(topics):
                text(topic, f"{label}.topics[{topic_index}]")
        outcomes = node.get("outcomes")
        if not isinstance(outcomes, list) or not outcomes:
            errors.append(f"{label}.outcomes: expected a nonempty list")
        else:
            for outcome_index, outcome in enumerate(outcomes):
                bilingual(outcome, f"{label}.outcomes[{outcome_index}]")
        source_ids = node.get("sourceIds")
        if not isinstance(source_ids, list) or not source_ids:
            errors.append(f"{label}.sourceIds: expected a nonempty list")
        else:
            seen_sources = set()
            for source_id in source_ids:
                if member(source_id, source_index, f"{label}.sourceIds"):
                    if source_id in seen_sources:
                        errors.append(f"{label}.sourceIds: duplicate source {source_id}")
                    seen_sources.add(source_id)
    if used_tracks != TRACKS:
        errors.append("nodes: both theory and engineering tracks must be represented")
    if not has_shared_node:
        errors.append("nodes: include at least one shared theory/engineering bridge")

    edges = records("edges")
    index_records(edges, "edges")
    seen_edges = set()
    adjacency = {identifier: [] for identifier in node_index}
    indegree = {identifier: 0 for identifier in node_index}
    for index, edge in enumerate(edges):
        label = f"edges[{index}] ({edge.get('id', '?')})"
        bilingual(edge.get("rationale"), f"{label}.rationale")
        member(edge.get("provenance"), {"proposal"}, f"{label}.provenance")
        source, target, kind = edge.get("from"), edge.get("to"), edge.get("type")
        valid_source = member(source, node_index, f"{label}.from")
        valid_target = member(target, node_index, f"{label}.to")
        valid_kind = member(kind, {"prerequisite", "application"}, f"{label}.type")
        if not (valid_source and valid_target and valid_kind):
            continue
        if source == target:
            errors.append(f"{label}: self-edge is not allowed")
        identity = (source, target, kind)
        if identity in seen_edges:
            errors.append(f"{label}: duplicate {kind} edge {source} -> {target}")
        seen_edges.add(identity)
        if kind == "prerequisite":
            adjacency[source].append(target)
            indegree[target] += 1

    # Only prerequisite edges constrain learning order. Application edges explain
    # transfer between concepts and may form cycles without invalidating the DAG.
    ready = deque(identifier for identifier, count in indegree.items() if count == 0)
    visited = 0
    while ready:
        identifier = ready.popleft()
        visited += 1
        for target in adjacency[identifier]:
            indegree[target] -= 1
            if indegree[target] == 0:
                ready.append(target)
    if visited != len(node_index):
        blocked = ", ".join(sorted(identifier for identifier, count in indegree.items() if count))
        errors.append(f"prerequisite graph has a cycle; blocked nodes: {blocked}")
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", nargs="?", type=Path, default=DEFAULT_PATH, help="Graph JSON path")
    args = parser.parse_args()
    try:
        data = json.loads(args.path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        print(f"Tree check failed: {error}", file=sys.stderr)
        return 1
    errors = check(data)
    if errors:
        print(f"Tree check failed ({len(errors)} errors):\n" + "\n".join(f"- {error}" for error in errors), file=sys.stderr)
        return 1
    print(f"Tree check passed: {len(data['nodes'])} bilingual nodes, {len(data['edges'])} edges, 4 stages; prerequisite graph is acyclic.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
