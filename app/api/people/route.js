import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SCRIPT_URL = process.env.APPS_SCRIPT_URL;

const clip = (v, n) => String(v ?? '').trim().slice(0, n);

function cleanPerson(p) {
  if (!p || typeof p !== 'object') return null;
  const id = clip(p.id, 40);
  if (!/^[a-zA-Z0-9_-]{1,40}$/.test(id)) return null;
  const nama = clip(p.nama, 100);
  if (!nama) return null;
  return {
    id,
    nama,
    gender: p.gender === 'P' ? 'P' : 'L',
    ayah_id: clip(p.ayah_id, 40),
    ibu_id: clip(p.ibu_id, 40),
    pasangan_id: clip(p.pasangan_id, 40),
    lahir: clip(p.lahir, 30),
    wafat: clip(p.wafat, 30),
    catatan: clip(p.catatan, 500),
  };
}

function missingEnv() {
  return NextResponse.json(
    { error: 'APPS_SCRIPT_URL belum diatur di environment variables.' },
    { status: 500 }
  );
}

export async function GET() {
  if (!SCRIPT_URL) return missingEnv();
  try {
    const res = await fetch(SCRIPT_URL, { cache: 'no-store', redirect: 'follow' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Gagal membaca spreadsheet.' }, { status: 502 });
  }
}

export async function POST(req) {
  if (!SCRIPT_URL) return missingEnv();
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid.' }, { status: 400 });
  }

  let payload;
  if (body.action === 'upsert') {
    const person = cleanPerson(body.person);
    if (!person) return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
    payload = { action: 'upsert', person };
  } else if (body.action === 'delete') {
    const id = clip(body.id, 40);
    if (!/^[a-zA-Z0-9_-]{1,40}$/.test(id)) {
      return NextResponse.json({ error: 'ID tidak valid.' }, { status: 400 });
    }
    payload = { action: 'delete', id };
  } else {
    return NextResponse.json({ error: 'Aksi tidak dikenal.' }, { status: 400 });
  }

  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });
    const data = await res.json();
    if (data.error) return NextResponse.json(data, { status: 400 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Gagal menulis ke spreadsheet.' }, { status: 502 });
  }
}
