'use client';

import { Handle, Position } from '@xyflow/react';

const tahun = (s) => (String(s || '').match(/\d{4}/) || [''])[0];

export default function PersonNode({ data }) {
  if (data.person?.junction) {
    return (
      <div className="junction">
        <Handle id="b" type="source" position={Position.Bottom} className="handle" />
        <Handle id="t" type="target" position={Position.Top} className="handle" />
      </div>
    );
  }
  const { person: p, selected, dim } = data;
  const lahir = tahun(p.lahir);
  const wafat = tahun(p.wafat);
  const meta = lahir || wafat ? `${lahir || '?'} – ${wafat || (p.wafat ? '?' : '')}` : '';
  const cls = ['person-node', p.gender === 'P' ? 'P' : 'L', p.wafat && 'deceased', selected && 'selected', dim && 'dim']
    .filter(Boolean).join(' ');

  return (
    <div className={cls} title={p.catatan || ''}>
      <Handle id="t" type="target" position={Position.Top} className="handle" />
      <Handle id="b" type="source" position={Position.Bottom} className="handle" />
      <Handle id="l" type="target" position={Position.Left} className="handle" />
      <Handle id="r" type="source" position={Position.Right} className="handle" />
      <div className="avatar">{p.nama.trim().charAt(0).toUpperCase()}</div>
      <div>
        <div className="nama">{p.nama}</div>
        {meta && <div className="meta">{meta}</div>}
      </div>
    </div>
  );
}