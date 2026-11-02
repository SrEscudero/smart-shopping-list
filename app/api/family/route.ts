import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, unlink, readdir, open } from 'node:fs/promises';
import path from 'node:path';
import { validFamilySnapshot } from '../../../utils/family';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const directory = () => process.env.SHOPPING_DATA_DIR || path.join(process.cwd(), '.shopping-data');
const headers = { 'Cache-Control': 'no-store' };
const respond = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });
const filename = (token: string) => path.join(directory(), createHash('sha256').update(token).digest('hex') + '.json');
function readToken(req: Request) {
  const token = req.headers.get('authorization')?.replace(/^Bearer /, '') || '';
  return /^[a-f0-9]{64}$/.test(token) ? token : null;
}
async function body(req: Request): Promise<unknown> {
  const reader = req.body?.getReader();
  if (!reader) throw new Error('empty');
  let size = 0; const chunks: Uint8Array[] = [];
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length;
    if (size > 256_000) { await reader.cancel(); throw new Error('too-large'); } chunks.push(value); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try {
    const incoming = new URL(origin);
    // Next may use its internal bind address in req.url. Host carries the public authority.
    return ['http:', 'https:'].includes(incoming.protocol) && incoming.host === (req.headers.get('host') || new URL(req.url).host);
  } catch { return false; }
}
export async function POST(req: Request) {
  if (!sameOrigin(req)) return respond({ error: 'Origen no permitido.' }, 403);
  try {
    const snapshot = await body(req);
    if (!validFamilySnapshot(snapshot)) return respond({ error: 'Lista inválida (máximo 500 productos).' }, 400);
    await mkdir(directory(), { recursive: true, mode: 0o700 });
    if ((await readdir(directory())).filter(f => f.endsWith('.json')).length >= 1000) return respond({ error: 'El servidor alcanzó su límite de listas.' }, 503);
    const token = randomBytes(32).toString('hex');
    const record = { revision: 1, snapshot, updatedAt: Date.now() };
    await writeFile(filename(token), JSON.stringify(record), { flag: 'wx', mode: 0o600 });
    return respond({ token, ...record }, 201);
  } catch (error) { return respond({ error: error instanceof SyntaxError ? 'JSON inválido.' : 'No se pudo crear la lista compartida.' }, 400); }
}
export async function GET(req: Request) {
  const token = readToken(req);
  if (!token) return respond({ error: 'Invitación inválida.' }, 401);
  try { return respond(JSON.parse(await readFile(filename(token), 'utf8'))); }
  catch { return respond({ error: 'La lista no está disponible en este servidor.' }, 404); }
}
export async function PUT(req: Request) {
  if (!sameOrigin(req)) return respond({ error: 'Origen no permitido.' }, 403);
  const token = readToken(req);
  if (!token) return respond({ error: 'Invitación inválida.' }, 401);
  let input;
  try { input = await body(req); } catch { return respond({ error: 'Solicitud inválida.' }, 400); }
  if (!input || typeof input !== 'object' || !('snapshot' in input) || !('revision' in input) || !validFamilySnapshot(input.snapshot) || !Number.isSafeInteger(input.revision)) return respond({ error: 'Lista inválida.' }, 400);
  const file = filename(token), lock = file + '.lock';
  let handle;
  try { handle = await open(lock, 'wx', 0o600); }
  catch { return respond({ error: 'Sincronización ocupada; reintentando.' }, 503); }
  const temporary = file + '.' + randomBytes(8).toString('hex') + '.tmp';
  try {
    const current = JSON.parse(await readFile(file, 'utf8'));
    if (current.revision !== input.revision) return respond(current, 409);
    const record = { revision: current.revision + 1, snapshot: input.snapshot, updatedAt: Date.now() };
    await writeFile(temporary, JSON.stringify(record), { mode: 0o600 });
    await rename(temporary, file);
    return respond(record);
  } catch { return respond({ error: 'No se pudo guardar. Tu copia local se conserva.' }, 503); }
  finally { await handle.close(); await unlink(lock).catch(() => {}); await unlink(temporary).catch(() => {}); }
}

export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return respond({ error: 'Origen no permitido.' }, 403);
  const token = readToken(req);
  if (!token) return respond({ error: 'Invitación inválida.' }, 401);
  const file = filename(token), lock = file + '.lock';
  let handle;
  try { handle = await open(lock, 'wx', 0o600); }
  catch { return respond({ error: 'Lista ocupada. Intenta de nuevo.' }, 503); }
  try { await unlink(file); return respond({ deleted: true }); }
  catch { return respond({ error: 'La lista ya no está disponible.' }, 404); }
  finally { await handle.close(); await unlink(lock).catch(() => {}); }
}
