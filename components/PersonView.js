'use client';

const tahun = (s) => (String(s || '').match(/\d{4}/) || [''])[0];

function Rel({ label, list, onPick }) {
  return (
    <div className="rel">
      <dt>{label}</dt>
      <div className="chips">
        {list.length === 0 && <span className="none">Belum ada</span>}
        {list.map((x) => (
          <button key={x.id} className="chip" onClick={() => onPick(x.id)}>{x.nama}</button>
        ))}
      </div>
    </div>
  );
}

export default function PersonView({ person: p, people, onPick, onEdit, onAddChild, onAddSpouse, onClose }) {
  const byId = (id) => people.find((x) => x.id === id);
  const parents = [byId(p.ayah_id), byId(p.ibu_id)].filter(Boolean);
  const spouse = [byId(p.pasangan_id)].filter(Boolean);
  const children = people.filter((c) => c.ayah_id === p.id || c.ibu_id === p.id);
  const siblings = people.filter(
    (s) => s.id !== p.id && ((p.ayah_id && s.ayah_id === p.ayah_id) || (p.ibu_id && s.ibu_id === p.ibu_id))
  );
  const l = tahun(p.lahir), w = tahun(p.wafat);
  const life = [l && `Lahir ${p.lahir}`, p.wafat && `Wafat ${p.wafat}`].filter(Boolean).join(', ') || (l || w ? '' : 'Tanggal belum diisi');

  return (
    <aside className="drawer">
      <div className="drawer-head">
        <div>
          <h2>{p.nama}</h2>
          <p className="sub">{p.gender === 'P' ? 'Perempuan' : 'Laki-laki'} · {life}</p>
        </div>
        <button className="close" onClick={onClose} aria-label="Tutup">×</button>
      </div>
      {p.catatan && <div className="note">{p.catatan}</div>}
      <Rel label="Orang tua" list={parents} onPick={onPick} />
      <Rel label="Pasangan" list={spouse} onPick={onPick} />
      <Rel label="Anak" list={children} onPick={onPick} />
      <Rel label="Saudara" list={siblings} onPick={onPick} />
      <div className="quick">
        <button className="btn sm" onClick={onAddChild}>+ Tambah anak</button>
        {!p.pasangan_id && <button className="btn sm" onClick={onAddSpouse}>+ Tambah pasangan</button>}
        <button className="btn sm primary" onClick={onEdit}>Edit data</button>
      </div>
    </aside>
  );
}
