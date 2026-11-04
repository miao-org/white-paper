/* One graph, two reading modes. No framework, build step, or remote API. */
(() => {
  'use strict';
  const strings = {
    en: {
      experiment: 'A working map, open for discussion', draft: 'BRAINSTORM',
      intro: 'A small starting set, not a complete curriculum. Select a node to explore what it means and what connects to it.',
      all: 'All knowledge', theory: 'Theory', engineering: 'Engineering', shared: 'Shared foundations',
      search: 'Find a concept or skill…', searchLabel: 'Search concepts in English or Chinese', clear: 'Clear search',
      graph: 'Map', list: 'List', export: 'Export graph', exportTitle: 'Download the complete bilingual JSON graph',
      prerequisites: 'Prerequisites', application: 'Application', stages: 'Stages are a way to browse, not a fixed timetable.',
      nodeCount: 'concepts', edgeCount: 'connections', visible: 'visible', focus: 'Trace prerequisites', reset: 'Reset view',
      zoomIn: 'Zoom in', zoomOut: 'Zoom out', mapLabel: 'Knowledge map. Scroll horizontally to explore; use Tab to select nodes.',
      hint: 'Select a card to follow its connections', sharedHint: 'Shared nodes appear in both views.',
      learn: 'Overview', agent: 'Agent context', outcomes: 'What you will be able to do', evidence: 'Try it / show it',
      needs: 'Builds on', next: 'Opens a path to', connections: 'Theory meets practice', noNeeds: 'No prerequisites proposed in this sample.',
      source: 'Source & provenance', adapted: 'Adapted topic', proposal: 'Proposed topic', edgesNote: 'Connections are proposed learning relationships, ready for review.',
      context: 'Stable IDs, prerequisite closure, and connected applications. The same data powers this map in both languages.',
      contextDownload: 'Download node context', contextNote: 'Context export includes bilingual content and source references. It contains no personal learning data.',
      empty: 'No concepts match this view.', emptyHelp: 'Try a different term or reset the filters.',
      error: 'The knowledge graph could not be loaded.', retry: 'Try again',
      footer: 'Seeded by the 2016 learning plan · Reimagined together for 2026',
      stage: 'Stage', chosen: 'Selected', countLabel: 'Proposed graph', outside: 'Some prerequisites are outside this view; select one below to reveal it.',
      collapse: 'Node details', local: 'Draft relationships · No fixed learning order',
    },
    'zh-CN': {
      experiment: '一张可以共同讨论、持续完善的地图', draft: '头脑风暴',
      intro: '这是一组起始样例，还不是完整课程。选择一个节点，探索它的含义及与其他知识的联系。',
      all: '全部知识', theory: '理论体系', engineering: '工程能力', shared: '共享基础',
      search: '查找知识点或技能……', searchLabel: '用中文或英文搜索知识点', clear: '清除搜索',
      graph: '地图', list: '列表', export: '导出图谱', exportTitle: '下载完整的双语 JSON 知识图谱',
      prerequisites: '前置知识', application: '应用联系', stages: '阶段只用于浏览，不是固定的学习时间表。',
      nodeCount: '个知识点', edgeCount: '条联系', visible: '个可见', focus: '追溯前置知识', reset: '重置视图',
      zoomIn: '放大', zoomOut: '缩小', mapLabel: '知识地图。横向滚动浏览，使用 Tab 选择节点。',
      hint: '选择卡片，探索知识之间的联系', sharedHint: '共享节点同时出现在两个视图中。',
      learn: '学习概览', agent: 'Agent 上下文', outcomes: '你将能够做到', evidence: '动手试试 / 展示成果',
      needs: '基于这些知识', next: '通向这些知识', connections: '理论联系实践', noNeeds: '本样例尚未提出前置知识。',
      source: '来源与编写依据', adapted: '改编知识点', proposal: '提议知识点', edgesNote: '这些联系是待讨论的学习关系，欢迎一起修订。',
      context: '稳定 ID、完整前置知识集合和相邻应用节点。两种语言的地图使用同一份数据。',
      contextDownload: '下载节点上下文', contextNote: '导出内容包含双语文本与来源引用，不含个人学习数据。',
      empty: '当前视图没有匹配的知识点。', emptyHelp: '请尝试其他关键词，或重置筛选。',
      error: '知识图谱加载失败。', retry: '重试',
      footer: '以 2016 学习计划为起点 · 共同探索 2026 版本',
      stage: '阶段', chosen: '已选择', countLabel: '提议中的图谱', outside: '部分前置知识位于当前视图之外，点击下方节点即可查看。',
      collapse: '节点详情', local: '关系尚待讨论 · 没有固定学习顺序',
    },
  };
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const group = node => node.tracks.length > 1 ? 'shared' : node.tracks[0];
  function ancestors(graph, id) {
    const found = new Set();
    const visit = current => graph.edges.filter(e => e.type === 'prerequisite' && e.to === current).forEach(e => {
      if (e.from !== id && !found.has(e.from)) { found.add(e.from); visit(e.from); }
    });
    visit(id);
    return found;
  }
  function contextFor(graph, id) {
    const required = ancestors(graph, id);
    const included = new Set([...required, id]);
    graph.edges.filter(e => e.type === 'application' && (e.from === id || e.to === id)).forEach(e => {
      included.add(e.from); included.add(e.to);
    });
    return {
      schemaVersion: graph.schemaVersion, status: graph.status,
      contextType: 'node-with-prerequisites-and-applications', subjectNodeId: id,
      prerequisiteIds: [...required].sort(),
      applicationNeighborIds: [...included].filter(key => key !== id && !required.has(key)).sort(),
      note: 'Prerequisite closure is complete for the subject node only. Application neighbors are included for reference; their own prerequisites may be omitted. Stage is a browse coordinate, not a prerequisite. All edges are editorial proposals. This sample is not a complete curriculum.',
      sources: graph.sources.filter(s => graph.nodes.some(n => included.has(n.id) && n.sourceIds.includes(s.id))),
      stages: graph.stages,
      nodes: graph.nodes.filter(n => included.has(n.id)),
      edges: graph.edges.filter(e => included.has(e.from) && included.has(e.to)),
    };
  }
  function download(value, name) {
    const blob = new Blob([JSON.stringify(value, null, 2) + '\n'], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement('a'), {href: url, download: name});
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  let cached;
  let activeCleanup;
  async function mount(root, locale) {
    activeCleanup?.();
    activeCleanup = null;
    if (!root) return;
    const t = strings[locale] || strings.en;
    const lang = value => value[locale] || value.en;
    let cancelled = false;
    activeCleanup = () => { cancelled = true; };
    let data;
    try {
      cached ||= fetch('data/robotics-tree.json').then(response => {
        if (!response.ok) throw new Error(`Graph HTTP ${response.status}`);
        return response.json();
      }).catch(error => { cached = null; throw error; });
      data = await cached;
    } catch {
      if (!cancelled && root.isConnected) {
        root.innerHTML = `<div class="tree-error"><p>${t.error}</p><button type="button">${t.retry}</button></div>`;
        root.querySelector('button').onclick = () => mount(root, locale);
      }
      return;
    }
    if (cancelled || !root.isConnected) return;
    const nodes = new Map(data.nodes.map(n => [n.id, n]));
    const requested = new URLSearchParams(location.hash.split('?')[1] || '').get('node');
    const state = {selected: nodes.has(requested) ? requested : 'stress-analysis', lens:'all', search:'', mode:'graph', focus:false, zoom:1, tab:'learn'};
    if (!nodes.has(state.selected)) state.selected = data.nodes[0].id;
    root.innerHTML = `
      <div class="tree-intro"><div><span class="tree-badge">${t.draft}</span><strong>${t.experiment}</strong><p>${t.intro}</p></div>
      <div class="tree-counts" aria-label="${t.countLabel}"><span><b>${data.nodes.length}</b>${t.nodeCount}</span><span><b>${data.edges.length}</b>${t.edgeCount}</span></div></div>
      <div class="tree-toolbar">
        <div class="tree-lenses" role="group" aria-label="${t.all}">${['all','theory','engineering'].map(l => `<button type="button" data-lens="${l}" aria-pressed="${l==='all'}">${t[l]}</button>`).join('')}</div>
        <div class="tree-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input type="search" aria-label="${t.searchLabel}" placeholder="${t.search}"></div>
        <button type="button" class="tree-export" title="${t.exportTitle}">${t.export} <span aria-hidden="true">↗</span></button>
      </div>
      <div class="tree-workspace">
        <section class="tree-map-shell" aria-label="${t.graph}">
          <div class="tree-map-controls"><div class="tree-modes" role="group" aria-label="${t.graph} / ${t.list}"><button type="button" data-mode="graph" aria-pressed="true">▦ ${t.graph}</button><button type="button" data-mode="list" aria-pressed="false">☷ ${t.list}</button></div><button type="button" class="tree-focus" aria-pressed="false">${t.focus}</button><span class="tree-visible" role="status"></span></div>
          <div class="tree-viewport" tabindex="0" role="region" aria-label="${t.mapLabel}"><div class="tree-canvas-wrap"><div class="tree-canvas"><svg class="tree-edges" aria-hidden="true"></svg><div class="tree-stages"></div><div class="tree-lanes"></div><div class="tree-cards"></div></div></div><div class="tree-empty" hidden><strong>${t.empty}</strong><p>${t.emptyHelp}</p><button type="button" data-reset>${t.reset}</button></div></div>
          <div class="tree-list" hidden></div>
          <div class="tree-map-bottom"><span>${t.hint}</span><div class="tree-zoom"><button type="button" data-zoom="-1" aria-label="${t.zoomOut}">−</button><output>100%</output><button type="button" data-zoom="1" aria-label="${t.zoomIn}">+</button></div><button type="button" data-reset>${t.reset}</button></div>
          <div class="tree-legend"><span><i class="theory"></i>${t.theory}</span><span><i class="shared"></i>${t.shared}</span><span><i class="engineering"></i>${t.engineering}</span><span><i class="edge"></i>${t.prerequisites}</span><span><i class="edge application"></i>${t.application}</span></div>
        </section>
        <aside class="tree-inspector" aria-label="${t.collapse}"></aside>
      </div>
      <div class="tree-footnote"><span>${t.stages} ${t.sharedHint}</span><span>${t.footer}</span></div>`;
    const $ = selector => root.querySelector(selector);
    const $$ = selector => [...root.querySelectorAll(selector)];
    const stageIndex = new Map(data.stages.map((s, i) => [s.id, i]));
    const positions = new Map(data.nodes.map(n => [n.id, {x:64 + stageIndex.get(n.stage)*228, y:76 + ['theory','shared','engineering'].indexOf(group(n))*228 + n.slot*104}]));
    const width = 988, height = 760, cardWidth = 204, cardHeight = 90;
    $('.tree-canvas').style.width = `${width}px`;
    $('.tree-canvas').style.height = `${height}px`;
    $('.tree-edges').setAttribute('viewBox', `0 0 ${width} ${height}`);
    $('.tree-stages').innerHTML = data.stages.map((s,i) => `<div class="tree-stage" style="left:${64+i*228}px;width:${cardWidth}px"><span>0${i+1}</span><strong>${escape(lang(s.title))}</strong></div>`).join('');
    $('.tree-lanes').innerHTML = ['theory','shared','engineering'].map((g,i) => `<div class="tree-lane ${g}" style="top:${64+i*228}px"><span>${t[g]}</span></div>`).join('');
    $('.tree-cards').innerHTML = data.nodes.map(n => {
      const p = positions.get(n.id), g = group(n);
      const mark = g === 'theory' ? '∑' : g === 'shared' ? '◇' : '⌘';
      return `<button type="button" class="tree-node ${g}" data-node="${n.id}" style="left:${p.x}px;top:${p.y}px" aria-pressed="false" aria-label="${escape(lang(n.title))} · ${t[g]}"><span class="node-top"><span class="node-symbol" aria-hidden="true">${mark}</span><span class="node-kind">${t[g]}</span><span class="node-arrow" aria-hidden="true">↗</span></span><strong>${escape(lang(n.title))}</strong></button>`;
    }).join('');
    function eligible(n) {
      if (state.lens !== 'all' && !n.tracks.includes(state.lens)) return false;
      if (state.focus && n.id !== state.selected && !ancestors(data,state.selected).has(n.id)) return false;
      const haystack = [n.id, ...Object.values(n.title), ...Object.values(n.summary), ...n.topics].join(' ').toLowerCase();
      return !state.search || haystack.includes(state.search.toLowerCase().trim());
    }
    function updateView() {
      const visible = new Set(data.nodes.filter(eligible).map(n => n.id));
      const related = new Set([state.selected, ...ancestors(data,state.selected)]);
      data.edges.filter(e => e.from === state.selected || e.to === state.selected).forEach(e => { related.add(e.from); related.add(e.to); });
      $$('.tree-node').forEach(card => {
        card.hidden = !visible.has(card.dataset.node);
        card.classList.toggle('selected',card.dataset.node===state.selected);
        card.classList.toggle('connected',related.has(card.dataset.node));
        card.setAttribute('aria-pressed',String(card.dataset.node===state.selected));
      });
      const edges = data.edges.filter(e => visible.has(e.from) && visible.has(e.to));
      const emphasized = e => (e.from===state.selected || e.to===state.selected || (ancestors(data,state.selected).has(e.from) && ancestors(data,state.selected).has(e.to)));
      $('.tree-edges').innerHTML = `<defs><marker id="tree-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 6 3 0 6Z" fill="context-stroke"/></marker></defs>` + edges.sort((a,b)=>Number(emphasized(a))-Number(emphasized(b))).map(e => {
        const a = positions.get(e.from), b = positions.get(e.to);
        let path;
        if (a.x === b.x) {
          const right = a.x+cardWidth;
          path = `M${right} ${a.y+45} C${right+18} ${a.y+45},${right+18} ${b.y+45},${right} ${b.y+45}`;
        } else {
          const x1=a.x+cardWidth, y1=a.y+45, x2=b.x-4, y2=b.y+45;
          // Route long links through the gaps between rows, not through cards.
          const direction = y2>=y1 ? 1 : -1;
          const rail = a.y + (direction>0 ? cardHeight+9 : -9);
          path = Math.abs(b.x-a.x)>228 ? `M${x1} ${y1} H${x1+10} V${rail} H${x2-10} V${y2} H${x2}` : `M${x1} ${y1} C${x1+13} ${y1},${x2-13} ${y2},${x2} ${y2}`;
        }
        return `<path class="tree-edge ${e.type} ${emphasized(e)?'emphasized':''}" d="${path}" marker-end="url(#tree-arrow)"/>`;
      }).join('');
      $('.tree-visible').textContent = `${visible.size} / ${data.nodes.length} ${t.visible}`;
      $('.tree-empty').hidden = visible.size !== 0;
      $('.tree-canvas-wrap').hidden = visible.size === 0;
      $('.tree-viewport').hidden = state.mode !== 'graph';
      $('.tree-list').hidden = state.mode !== 'list';
      $('.tree-zoom').hidden = state.mode !== 'graph';
      $('.tree-list').innerHTML = visible.size ? data.stages.map(stage => {
        const items = data.nodes.filter(n=>visible.has(n.id) && n.stage===stage.id);
        return items.length ? `<section><h3>${escape(lang(stage.title))}</h3>${items.map(n=>`<button type="button" class="tree-list-node ${group(n)} ${n.id===state.selected?'selected':''}" data-node="${n.id}" aria-pressed="${n.id===state.selected}"><span><strong>${escape(lang(n.title))}</strong><small>${t[group(n)]}</small></span><p>${escape(lang(n.summary))}</p></button>`).join('')}</section>` : '';
      }).join('') : `<div class="tree-empty"><strong>${t.empty}</strong><p>${t.emptyHelp}</p><button type="button" data-reset>${t.reset}</button></div>`;
      $$('.tree-lenses button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lens===state.lens)));
      $$('.tree-modes button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));
      $('.tree-focus').setAttribute('aria-pressed',String(state.focus));
      $('.tree-canvas').style.transform = `scale(${state.zoom})`;
      $('.tree-canvas-wrap').style.width = `${width*state.zoom}px`;
      $('.tree-canvas-wrap').style.height = `${height*state.zoom}px`;
      $('.tree-zoom output').textContent = `${Math.round(state.zoom*100)}%`;
      updateInspector();
    }
    function nodeLink(id) { return `<button type="button" class="tree-related" data-node="${id}"><span>${escape(lang(nodes.get(id).title))}</span><span aria-hidden="true">↗</span></button>`; }
    function updateInspector() {
      const n = nodes.get(state.selected), g=group(n);
      const required = data.edges.filter(e=>e.type==='prerequisite' && e.to===n.id);
      const next = data.edges.filter(e=>e.type==='prerequisite' && e.from===n.id);
      const applications = data.edges.filter(e=>e.type==='application' && (e.to===n.id || e.from===n.id));
      const context = contextFor(data,n.id);
      $('.tree-inspector').innerHTML = `
        <div class="inspector-heading ${g}"><span class="tree-badge">${t[g]}</span><code>${n.id}</code><h2>${escape(lang(n.title))}</h2><p>${escape(lang(n.summary))}</p></div>
        <div class="inspector-tabs" role="group" aria-label="${t.collapse}"><button type="button" data-tab="learn" aria-pressed="${state.tab==='learn'}">${t.learn}</button><button type="button" data-tab="agent" aria-pressed="${state.tab==='agent'}">${t.agent} <span aria-hidden="true">{ }</span></button></div>
        <div class="inspector-body">${state.tab==='agent' ? `<p>${t.context}</p><button type="button" class="context-download">${t.contextDownload} ↓</button><pre class="agent-json" tabindex="0" aria-label="JSON"><code>${escape(JSON.stringify(context,null,2))}</code></pre><p class="inspector-note">${t.contextNote}</p>` : `
          <h3>${t.outcomes}</h3><ul class="tree-outcomes">${n.outcomes.map(o=>`<li>${escape(lang(o))}</li>`).join('')}</ul>
          <div class="tree-evidence"><h3>${t.evidence}</h3><p>${escape(lang(n.evidence))}</p></div>
          <h3>${t.needs} <span>${required.length}</span></h3>${required.length ? required.map(e=>nodeLink(e.from)).join('') : `<p class="inspector-note">${t.noNeeds}</p>`}
          ${required.some(e=>!eligible(nodes.get(e.from)))?`<p class="inspector-note">${t.outside}</p>`:''}
          ${applications.length ? `<h3>${t.connections}</h3>${applications.map(e=>`<div class="tree-application">${nodeLink(e.from===n.id?e.to:e.from)}<p>${escape(lang(e.rationale))}</p></div>`).join('')}`:''}
          ${next.length ? `<h3>${t.next}</h3>${next.map(e=>nodeLink(e.to)).join('')}`:''}
          <details class="tree-sources"><summary>${t.source}</summary><p>${n.provenance==='adapted'?t.adapted:t.proposal} · ${t.edgesNote}</p>${n.sourceIds.map(id=>data.sources.find(s=>s.id===id)).map(s=>`<a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(lang(s.title))} ↗</a>`).join('')}</details>`}</div>`;
    }
    function select(id, reveal = false) {
      if (!nodes.has(id)) return;
      state.selected = id;
      if (!eligible(nodes.get(id))) { state.lens='all'; state.search=''; $('input').value=''; }
      const route = location.hash.split('?')[0];
      history.replaceState(null,'',`${route}?node=${encodeURIComponent(id)}`);
      const switcher = document.querySelector('#language-toggle');
      switcher.href = `${switcher.getAttribute('href').split('?')[0]}?node=${encodeURIComponent(id)}`;
      updateView();
      // Keep keyboard focus on the equivalent control after replacing detail/list markup.
      const card = root.querySelector(`${state.mode==='list'?'.tree-list-node':'.tree-node'}[data-node="${id}"]`);
      card?.focus({preventScroll:true});
      if (reveal) card?.scrollIntoView({block:'nearest',inline:'nearest'});
      if (matchMedia('(max-width: 760px)').matches) $('.tree-inspector').scrollIntoView({block:'start'});
    }
    root.addEventListener('input',event=>{
      if(event.target.matches('input')) { state.search=event.target.value; updateView(); }
    });
    root.addEventListener('click',event=>{
      const button=event.target.closest('button');
      if(!button) return;
      if(button.dataset.node) { select(button.dataset.node, button.matches('.tree-related')); return; }
      if(button.dataset.lens) state.lens=button.dataset.lens;
      if(button.dataset.mode) state.mode=button.dataset.mode;
      if(button.dataset.tab) { state.tab=button.dataset.tab; updateInspector(); $(`[data-tab="${state.tab}"]`).focus({preventScroll:true}); return; }
      if(button.matches('.tree-focus')) state.focus=!state.focus;
      if(button.dataset.zoom) state.zoom=Math.max(.6,Math.min(1.2,Math.round((state.zoom+Number(button.dataset.zoom)*.1)*10)/10));
      if(button.hasAttribute('data-reset')) { Object.assign(state,{lens:'all',search:'',focus:false,zoom:1}); $('input').value=''; $('.tree-viewport').scrollLeft=0; }
      if(button.matches('.tree-export')) { download(data,'robotics-tree.json'); return; }
      if(button.matches('.context-download')) { download(contextFor(data,state.selected),`${state.selected}.context.json`); return; }
      updateView();
    });
    updateView();
    const switcher=document.querySelector('#language-toggle');
    switcher.href=`${switcher.getAttribute('href').split('?')[0]}?node=${encodeURIComponent(state.selected)}`;
  }
  window.RoboticsTree = {mount, ancestors, contextFor};
})();
