'use client';
import { useEffect, useState } from 'react';
import { useShoppingStore, type CurrencySymbol } from '../../store/useShoppingStore';
import { mergeFamily, validFamilySnapshot } from '../../utils/family';
import type { FamilySnapshot } from '../../types/planning';
import { Users, Link as LinkIcon } from 'lucide-react';

const snapshot = (): FamilySnapshot => {
  const s = useShoppingStore.getState();
  return { items: s.items, totalBudget: s.totalBudget, month: s.month, currency: s.currency };
};
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
export default function FamilySync({ onStatus }: { onStatus?: (status: string) => void }) {
  const family = useShoppingStore(s => s.family);
  const token = family?.token;
  const connectedListId = family?.listId;
  const activeListId = useShoppingStore(s => s.activeListId);
  const [invitation, setInvitation] = useState('');
  const [status, setStatus] = useState('');
  useEffect(() => { onStatus?.(status); }, [status, onStatus]);
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState<{ snapshot: FamilySnapshot; revision: number } | null>(null);
  useEffect(() => { const token = new URLSearchParams(window.location.hash.slice(1)).get('familia'); if (token) setInvitation(token); }, []);

  useEffect(() => {
    if (!token || connectedListId !== activeListId || conflict) return;
    let cancelled = false, running = false;
    const tick = async () => {
      if (running || cancelled) return;
      running = true;
      try {
        const initial = useShoppingStore.getState().family;
        if (!initial || initial.token !== token || useShoppingStore.getState().activeListId !== initial.listId) return;
        const response = await fetch('/api/family', { headers: { Authorization: `Bearer ${initial.token}` }, cache: 'no-store' });
        if (!response.ok) throw new Error('Sin conexión con la familia. Tus cambios siguen guardados aquí.');
        const remote = await response.json();
        if (!validFamilySnapshot(remote.snapshot)) throw new Error('La lista recibida no es válida.');
        if (cancelled || useShoppingStore.getState().family?.token !== initial.token || useShoppingStore.getState().activeListId !== initial.listId) return;
        const local = snapshot();
        const merged = mergeFamily(initial.baseline, local, remote.snapshot);
        if (!merged) { setConflict(remote); setStatus('Hay cambios simultáneos en el mismo dato.'); return; }
        if (!equal(merged, remote.snapshot)) {
          const sent = local;
          const put = await fetch('/api/family', { method: 'PUT', headers: { Authorization: `Bearer ${initial.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ revision: remote.revision, snapshot: merged }) });
          if (put.status === 409) return; // Another writer won: next poll performs a fresh merge.
          if (!put.ok) throw new Error('Cambios pendientes de enviar. Se reintentará automáticamente.');
          const saved = await put.json();
          if (cancelled || useShoppingStore.getState().family?.token !== initial.token || useShoppingStore.getState().activeListId !== initial.listId) return;
          const latest = snapshot();
          if (!equal(sent, latest)) {
            // Keep edits made during the request. Merge remote fields without marking new edits as sent.
            const next = mergeFamily(sent, latest, merged);
            if (!next) { setConflict(saved); return; }
            useShoppingStore.setState({ ...next, currency: next.currency as CurrencySymbol, family: { ...initial, revision: saved.revision, baseline: merged } });
          } else useShoppingStore.getState().applyFamilySnapshot(merged, saved.revision);
        } else if (!equal(local, remote.snapshot) || initial.revision !== remote.revision) {
          useShoppingStore.getState().applyFamilySnapshot(remote.snapshot, remote.revision);
        }
        setStatus('Al día · se actualiza cada 3 segundos');
      } catch (error) { if (!cancelled) setStatus(error instanceof Error ? error.message : 'No se pudo sincronizar.'); }
      finally { running = false; }
    };
    void tick(); const timer = setInterval(tick, 3000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [token, connectedListId, activeListId, conflict]); // Baseline is read fresh for every request.

  const connect = async (join: boolean) => {
    setBusy(true); setStatus('Conectando…');
    try {
      let token = invitation.trim();
      if (token.includes('#')) token = new URLSearchParams(token.split('#')[1]).get('familia') || '';
      const response = await fetch('/api/family', join ? { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(snapshot()) });
      const result = await response.json();
      if (!response.ok || !validFamilySnapshot(result.snapshot)) throw new Error(result.error || 'No se pudo conectar.');
      if (join) {
        useShoppingStore.getState().createList('Compra familiar');
        const list = useShoppingStore.getState().lists.at(-1)!;
        useShoppingStore.getState().switchList(list.id);
      }
      const connection = { token: join ? token : result.token, revision: result.revision, baseline: result.snapshot, listId: useShoppingStore.getState().activeListId };
      useShoppingStore.getState().setFamily(connection);
      useShoppingStore.getState().applyFamilySnapshot(result.snapshot, result.revision);
      setConflict(null); setStatus('Conectada. Comparte la invitación con tu familia.');
      window.history.replaceState({}, '', window.location.pathname + window.location.search);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'No se pudo conectar.'); }
    finally { setBusy(false); }
  };
  const revoke = async () => {
    if (!family || !window.confirm('¿Cerrar la lista compartida para todos? Las copias locales se conservarán.')) return;
    try {
      const result = await fetch('/api/family', { method: 'DELETE', headers: { Authorization: `Bearer ${family.token}` } });
      if (!result.ok && result.status !== 404) throw new Error('No se pudo cerrar. Intenta de nuevo.');
      useShoppingStore.getState().setFamily(null); setConflict(null); setStatus('Invitación revocada. Las copias locales se conservan.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Error al cerrar.'); }
  };
  const copyLink = async () => {
    const link = `${window.location.origin}/#familia=${family?.token}`;
    try { await navigator.clipboard.writeText(link); setStatus('Invitación copiada. Quien la tenga podrá editar esta lista.'); }
    catch { setInvitation(link); setStatus('Copia la invitación del campo de texto.'); }
  };
  return <details className="feature-panel" open={!!invitation || !!conflict}>
    <summary><Users size={18} /><span>Compra en familia<small>Una lista que se actualiza entre celulares</small></span></summary>
    <div className="feature-body">
      <p className="muted text-sm">La invitación permite ver y editar esta lista. Comparte solo con tu familia. Ambos dispositivos deben usar el mismo servidor.</p>
      {family ? <>
        <p className="text-sm">{family.listId === activeListId ? 'Esta lista está conectada.' : 'La sincronización está pausada: abre la lista conectada.'}</p>
        <div className="flex flex-wrap gap-2"><button className="btn-tonal" onClick={copyLink}><LinkIcon size={16} /> Copiar invitación</button><button className="btn-outline" onClick={() => { useShoppingStore.getState().setFamily(null); setConflict(null); setStatus('Desconectada. La copia local se conserva.'); }}>Desconectar</button></div>
        <button className="btn-outline" onClick={revoke}>Cerrar acceso para todos</button>
        {conflict && <div role="alert" className="notice-warning"><p>Otra persona cambió el mismo producto. Conservaremos tus cambios en una lista aparte antes de recibir la versión familiar.</p><button className="btn-filled mt-3" onClick={() => {
          const s = useShoppingStore.getState();
          useShoppingStore.setState({ lists: [...s.lists, { id: crypto.randomUUID(), name: 'Copia local · conflicto', items: [...s.items], totalBudget: s.totalBudget, createdAt: Date.now() }] });
          s.applyFamilySnapshot(conflict.snapshot, conflict.revision); setConflict(null);
        }}>Conservar copia y recibir cambios</button></div>}
      </> : <>
        <button className="btn-filled" disabled={busy} onClick={() => connect(false)}>Compartir esta lista en vivo</button>
        <label className="field-label">Invitación familiar<input className="field-input" value={invitation} onChange={e => setInvitation(e.target.value)} placeholder="Pega el enlace o código" /></label>
        <button className="btn-outline" disabled={busy || !invitation.trim()} onClick={() => connect(true)}>Unirme en una lista nueva</button>
      </>}
      {family && invitation && <input aria-label="Invitación para copiar" className="field-input" readOnly value={invitation} />}
      <p role="status" className="text-xs muted">{status}</p>
    </div>
  </details>;
}
