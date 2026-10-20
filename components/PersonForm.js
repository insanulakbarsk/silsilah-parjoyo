'use client';

import { useState } from 'react';

const EMPTY = {
  id: '',
  nama: '',
  gender: 'L',
  ayah_id: '',
  ibu_id: '',
  pasangan_id: '',
  lahir: '',
  wafat: '',
  catatan: '',
};

export default function PersonForm({ person, people, saving, onSave, onDelete, onClose }) {
  const isNew = !person?.id;
  const [f, setF] = useState({ ...EMPTY, ...(person || {}) });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const others = people.filter((p) => p.id !== f.id);
  const ayahOpts = others.filter((p) => p.gender !== 'P');
  const ibuOpts = others.filter((p) => p.gender === 'P');

  function submit(e) {
    e.preventDefault();
    if (!f.nama.trim()) return;
    onSave({ ...f, nama: f.nama.trim() });
  }

  return (
    <aside className="drawer">
      <form onSubmit={submit}>
        <div className="drawer-head">
          <h2>{isNew ? 'Tambah orang' : 'Edit data'}</h2>
          <button type="button" className="close" onClick={onClose} aria-label="Tutup">×</button>
        </div>

        <div className="field">
          <label>Nama lengkap</label>
          <input value={f.nama} onChange={set('nama')} required autoFocus maxLength={100} />
        </div>

        <div className="field">
          <label>Jenis kelamin</label>
          <select value={f.gender} onChange={set('gender')}>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>

        <div className="row2">
          <div className="field">
            <label>Ayah</label>
            <select value={f.ayah_id} onChange={set('ayah_id')}>
              <option value="">—</option>
              {ayahOpts.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Ibu</label>
            <select value={f.ibu_id} onChange={set('ibu_id')}>
              <option value="">—</option>
              {ibuOpts.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Pasangan</label>
          <select value={f.pasangan_id} onChange={set('pasangan_id')}>
            <option value="">—</option>
            {others.map((p) => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </select>
        </div>

        <div className="row2">
          <div className="field">
            <label>Lahir</label>
            <input value={f.lahir} onChange={set('lahir')} placeholder="1950 atau 1950-03-21" maxLength={30} />
          </div>
          <div className="field">
            <label>Wafat</label>
            <input value={f.wafat} onChange={set('wafat')} placeholder="kosong jika masih hidup" maxLength={30} />
          </div>
        </div>

        <div className="field">
          <label>Catatan</label>
          <textarea rows={2} value={f.catatan} onChange={set('catatan')} maxLength={500} />
        </div>

        <div className="actions">
          {!isNew && (
            <button
              type="button"
              className="btn danger left"
              disabled={saving}
              onClick={() => {
                if (confirm(`Hapus ${f.nama}?`)) onDelete(f.id);
              }}
            >
              Hapus
            </button>
          )}
          <button type="button" className="btn" onClick={onClose}>Batal</button>
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </form>
    </aside>
  );
}
