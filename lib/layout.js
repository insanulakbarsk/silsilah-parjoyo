// Tata letak silsilah: pasangan = satu unit, anak di bawah titik tengah pasangan,
// lebar tiap cabang dihitung dulu sehingga tidak ada kartu yang bertumpuk.
export const NODE_W = 210;
export const NODE_H = 68;
const GAP_S = 48; // jarak antar pasangan
const GAP_C = 36; // jarak antar cabang saudara
const ROW = NODE_H + 96; // jarak antar generasi
const DOT = 10;

const year = (s) => {
  const m = String(s || '').match(/\d{4}/);
  return m ? +m[0] : 9999;
};

export function buildGraph(people) {
  const byId = new Map(people.map((p) => [p.id, p]));
  const has = (id, self) => id && id !== self && byId.has(id);

  // 1. Generasi: anak = orang tua + 1, pasangan selalu sebaris
  const gen = {};
  people.forEach((p) => (gen[p.id] = 0));
  for (let i = 0; i < people.length + 2; i++) {
    let changed = false;
    for (const p of people) {
      for (const pid of [p.ayah_id, p.ibu_id]) {
        if (has(pid, p.id) && gen[p.id] < gen[pid] + 1) { gen[p.id] = gen[pid] + 1; changed = true; }
      }
      if (has(p.pasangan_id, p.id)) {
        const g = Math.max(gen[p.id], gen[p.pasangan_id]);
        if (gen[p.id] !== g || gen[p.pasangan_id] !== g) { gen[p.id] = g; gen[p.pasangan_id] = g; changed = true; }
      }
    }
    if (!changed) break;
  }

  // 2. Unit: satu orang, atau sepasang (laki-laki di kiri)
  const unitOf = {};
  const units = [];
  for (const p of people) {
    if (unitOf[p.id]) continue;
    const sp = has(p.pasangan_id, p.id) && !unitOf[p.pasangan_id] ? byId.get(p.pasangan_id) : null;
    const members = sp ? [p, sp].sort((a, b) => (a.gender === 'P') - (b.gender === 'P')) : [p];
    const u = { id: 'u' + units.length, members, kids: [], gen: gen[p.id], seen: false };
    members.forEach((m) => (unitOf[m.id] = u));
    units.push(u);
  }

  // 3. Unit induk: unit orang tua dari salah satu anggota
  for (const u of units) {
    u.parent = null;
    for (const m of u.members) {
      for (const pid of [m.ayah_id, m.ibu_id]) {
        if (has(pid, m.id) && unitOf[pid] !== u && !u.parent) u.parent = unitOf[pid];
      }
    }
    if (u.parent) u.parent.kids.push(u);
  }
  const born = (u) => Math.min(...u.members.map((m) => year(m.lahir)));
  units.forEach((u) => u.kids.sort((a, b) => born(a) - born(b)));

  // 4. Ukur lebar cabang lalu tempatkan
  const UW = (u) => u.members.length * NODE_W + (u.members.length - 1) * GAP_S;
  const measure = (u) => {
    u.seen = true;
    u.kids = u.kids.filter((k) => !k.seen);
    u.kids.forEach(measure);
    u.cw = u.kids.reduce((s, k) => s + k.w, 0) + Math.max(0, u.kids.length - 1) * GAP_C;
    u.w = Math.max(UW(u), u.cw);
  };
  const pos = {};
  const place = (u, left) => {
    const y = u.gen * ROW;
    const x0 = left + (u.w - UW(u)) / 2;
    u.members.forEach((m, i) => (pos[m.id] = { x: x0 + i * (NODE_W + GAP_S), y }));
    let cx = left + (u.w - u.cw) / 2;
    for (const k of u.kids) { place(k, cx); cx += k.w + GAP_C; }
  };

  let cursor = 0;
  const roots = units.filter((u) => !u.parent).sort((a, b) => born(a) - born(b));
  const layoutRoot = (u) => { measure(u); place(u, cursor); cursor += u.w + GAP_C * 3; };
  roots.forEach(layoutRoot);
  units.filter((u) => !u.seen).forEach((u) => { if (!u.seen) layoutRoot(u); }); // data berputar (jaga-jaga)

  // 5. Node + garis
  const nodes = people.map((p) => ({ id: p.id, type: 'person', position: pos[p.id], data: { person: p } }));
  const edges = [];
  const anchor = (pid) => {
    const u = unitOf[pid];
    return u.members.length === 2 ? 'j' + u.id : pid;
  };

  for (const u of units) {
    if (u.members.length !== 2) continue;
    const [a, b] = u.members;
    nodes.push({
      id: 'j' + u.id,
      type: 'person',
      position: { x: pos[a.id].x + NODE_W + GAP_S / 2 - DOT / 2, y: pos[a.id].y + NODE_H / 2 - DOT / 2 },
      data: { person: { id: 'j' + u.id, nama: '', gender: 'L', junction: true } },
      style: { pointerEvents: 'none' },
      zIndex: 2,
    });
    edges.push({
      id: `s-${a.id}-${b.id}`, source: a.id, target: b.id, sourceHandle: 'r', targetHandle: 'l',
      type: 'straight', style: { stroke: 'var(--spouse)', strokeWidth: 2 },
    });
  }

  for (const p of people) {
    const from = [...new Set([p.ayah_id, p.ibu_id].filter((id) => has(id, p.id)).map(anchor))];
    for (const src of from) {
      edges.push({
        id: `c-${src}-${p.id}`, source: src, target: p.id, sourceHandle: 'b', targetHandle: 't',
        type: 'smoothstep', style: { stroke: 'var(--edge)', strokeWidth: 2 },
      });
    }
  }

  return { nodes, edges };
}