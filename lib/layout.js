import dagre from 'dagre';

export const NODE_W = 210;
export const NODE_H = 68;

// Mengubah daftar orang menjadi node + edge (garis) untuk React Flow,
// dengan posisi otomatis dari dagre.
export function buildGraph(people) {
  const ids = new Set(people.map((p) => p.id));
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 90 });
  g.setDefaultEdgeLabel(() => ({}));

  people.forEach((p) => g.setNode(p.id, { width: NODE_W, height: NODE_H }));

  const rels = [];
  const seenSpouse = new Set();

  people.forEach((p) => {
    [p.ayah_id, p.ibu_id].forEach((pid) => {
      if (pid && ids.has(pid) && pid !== p.id) {
        g.setEdge(pid, p.id);
        rels.push({ kind: 'parent', source: pid, target: p.id });
      }
    });
    if (p.pasangan_id && ids.has(p.pasangan_id) && p.pasangan_id !== p.id) {
      const key = [p.id, p.pasangan_id].sort().join('|');
      if (!seenSpouse.has(key)) {
        seenSpouse.add(key);
        // minlen 0 = pasangan berada di baris (generasi) yang sama
        g.setEdge(p.id, p.pasangan_id, { minlen: 0, weight: 5 });
        rels.push({ kind: 'spouse', source: p.id, target: p.pasangan_id });
      }
    }
  });

  dagre.layout(g);

  const pos = {};
  const nodes = people.map((p) => {
    const n = g.node(p.id);
    pos[p.id] = { x: n.x - NODE_W / 2, y: n.y - NODE_H / 2 };
    return { id: p.id, type: 'person', position: pos[p.id], data: { person: p } };
  });

  const edges = rels.map((r, i) => {
    if (r.kind === 'parent') {
      return {
        id: `e${i}-${r.source}-${r.target}`,
        source: r.source,
        target: r.target,
        sourceHandle: 'b',
        targetHandle: 't',
        type: 'smoothstep',
        style: { stroke: 'var(--edge)', strokeWidth: 2 },
      };
    }
    // garis pasangan: selalu dari node kiri ke node kanan
    const leftFirst = pos[r.source].x <= pos[r.target].x;
    return {
      id: `s${i}-${r.source}-${r.target}`,
      source: leftFirst ? r.source : r.target,
      target: leftFirst ? r.target : r.source,
      sourceHandle: 'r',
      targetHandle: 'l',
      type: 'straight',
      style: { stroke: 'var(--spouse)', strokeWidth: 2, strokeDasharray: '6 4' },
    };
  });

  return { nodes, edges };
}
