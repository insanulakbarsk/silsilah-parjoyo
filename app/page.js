'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ReactFlow, ReactFlowProvider, Background, Controls, MiniMap, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { buildGraph, NODE_W, NODE_H } from '../lib/layout';
import PersonNode from '../components/PersonNode';
import PersonForm from '../components/PersonForm';
import PersonView from '../components/PersonView';

const nodeTypes = { person: PersonNode };
const newId = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function Tree() {
  const rf = useReactFlow();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null); // null | objek orang (kosong = baru)

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/people', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Gagal memuat data');
      setPeople(data.people || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setForm(null); setSelectedId(null); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const q = query.trim().toLowerCase();
  const matches = useMemo(() => (q ? people.filter((p) => p.nama.toLowerCase().includes(q)) : []), [people, q]);
  const matchIds = useMemo(() => new Set(matches.map((m) => m.id)), [matches]);

  const graph = useMemo(() => buildGraph(people), [people]);
  const nodes = useMemo(
    () => graph.nodes.map((n) => ({
      ...n,
      data: { person: n.data.person, selected: n.id === selectedId, dim: q ? !matchIds.has(n.id) : false },
    })),
    [graph, selectedId, q, matchIds]
  );

  const focus = useCallback((id) => {
    const n = graph.nodes.find((x) => x.id === id);
    if (n) rf.setCenter(n.position.x + NODE_W / 2, n.position.y + NODE_H / 2, { zoom: 1, duration: 500 });
  }, [graph, rf]);

  const select = (id) => { setForm(null); setSelectedId(id); focus(id); };
  const selected = people.find((p) => p.id === selectedId);

  async function call(body) {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Gagal menyimpan');
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function save(person) {
    const p = { ...person, id: person.id || newId() };
    if (!(await call({ action: 'upsert', person: p }))) return;

    // Pasangan saling terhubung: sinkronkan sisi sebaliknya
    const prev = people.find((x) => x.id === p.id);
    const updates = [];
    if (prev?.pasangan_id && prev.pasangan_id !== p.pasangan_id) {
      const old = people.find((x) => x.id === prev.pasangan_id);
      if (old && old.pasangan_id === p.id) updates.push({ ...old, pasangan_id: '' });
    }
    if (p.pasangan_id) {
      const sp = people.find((x) => x.id === p.pasangan_id);
      if (sp && sp.pasangan_id !== p.id) updates.push({ ...sp, pasangan_id: p.id });
    }
    for (const u of updates) await call({ action: 'upsert', person: u });

    setForm(null);
    setSelectedId(p.id);
    setToast('Tersimpan di spreadsheet');
    await load();
  }

  async function remove(id) {
    if (!(await call({ action: 'delete', id }))) return;
    setForm(null);
    setSelectedId(null);
    setToast('Data dihapus');
    await load();
  }

  const addChild = (p) => setForm(
    p.gender === 'P' ? { ibu_id: p.id, ayah_id: p.pasangan_id || '' } : { ayah_id: p.id, ibu_id: p.pasangan_id || '' }
  );
  const addSpouse = (p) => setForm({ pasangan_id: p.id, gender: p.gender === 'P' ? 'L' : 'P' });

  return (
    <div className="app">
      <header className="topbar">
        <h1>Silsilah Keluarga</h1>
        <span className="count">{people.length} orang</span>
        <input
          className="search"
          type="search"
          placeholder="Cari nama…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && matches[0]) select(matches[0].id); }}
          aria-label="Cari nama"
        />
        {error && <span className="status err">{error}</span>}
        <button className="btn" onClick={load} disabled={loading}>{loading ? 'Memuat…' : 'Muat ulang'}</button>
        <button className="btn primary" onClick={() => { setSelectedId(null); setForm({}); }}>+ Tambah orang</button>
      </header>

      <div className="main">
        <div className="canvas">
          <ReactFlow
            nodes={nodes}
            edges={graph.edges}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            onNodeClick={(_, n) => select(n.id)}
            onPaneClick={() => { if (!form) setSelectedId(null); }}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={24} />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable nodeColor={(n) => (n.data.person.gender === 'P' ? '#b04a6d' : '#3a6ea5')} />
          </ReactFlow>
          {!loading && people.length === 0 && !error && (
            <div className="empty">
              <div>Pohon masih kosong. Mulai dari anggota keluarga tertua yang Anda ketahui.</div>
              <button className="btn primary" onClick={() => setForm({})}>+ Tambah orang pertama</button>
            </div>
          )}
        </div>

        {form ? (
          <PersonForm
            key={form.id || 'baru' + (form.ayah_id || '') + (form.pasangan_id || '')}
            person={form}
            people={people}
            saving={saving}
            onSave={save}
            onDelete={remove}
            onClose={() => setForm(null)}
          />
        ) : selected ? (
          <PersonView
            person={selected}
            people={people}
            onPick={select}
            onEdit={() => setForm(selected)}
            onAddChild={() => addChild(selected)}
            onAddSpouse={() => addSpouse(selected)}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

export default function Page() {
  return (
    <ReactFlowProvider>
      <Tree />
    </ReactFlowProvider>
  );
}
