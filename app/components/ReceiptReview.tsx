'use client';
import { useState } from 'react';
import { X, Plus, Camera, Trash2 } from 'lucide-react';
import { useShoppingStore } from '../../store/useShoppingStore';
import type { ReceiptLine } from '../../types/planning';
import UnitFields from './UnitFields';
import { roundMoney, unitContent } from '../../utils/planning';
import { useFocusTrap, useEscapeKey } from '../../utils/focusTrap';

const blank = (): ReceiptLine & { rowId: string } => ({ rowId: crypto.randomUUID(), name: '', price: 0, quantity: 1, category: 'Otros', unit: 'ud', packUnit: 'g' });
export default function ReceiptReview({ initialLines, receiptId, onDone, onScan }: { initialLines?: ReceiptLine[]; receiptId?: string; onDone: () => void; onScan?: () => void }) {
  const { items, currency, confirmReceipt } = useShoppingStore();
  const [lines, setLines] = useState(() => initialLines?.length ? initialLines.map(p => ({ ...p, rowId: crypto.randomUUID(), packUnit: p.packUnit || 'g' as const, unit: p.unit || 'ud' as const })) : [blank()]);
  const [id] = useState(() => receiptId || crypto.randomUUID());
  const [store, setStore] = useState('');
  const [subtotal, setSubtotal] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const focusRef = useFocusTrap(true); useEscapeKey(true, onDone);
  const total = roundMoney(lines.reduce((sum, p) => sum + p.price * p.quantity, 0));
  const mismatch = subtotal !== '' && Math.abs(Number(subtotal) - total) > .02;
  const update = (index: number, changes: Partial<ReceiptLine>) => setLines(lines.map((p, i) => i === index ? { ...p, ...changes } : p));
  const invalid = !lines.length || lines.some(p => !p.name.trim() || !Number.isFinite(p.price) || p.price < 0 || !Number.isFinite(p.quantity) || p.quantity <= 0 || !unitContent(p));
  return <div className="sheet-overlay"><div className="sheet-backdrop" onClick={onDone} /><div ref={focusRef} className="sheet-content" role="dialog" aria-modal="true" aria-labelledby="receipt-title">
    <div className="sheet-heading"><div><h2 id="receipt-title">Revisa tu ticket</h2><p>Confirma precios unitarios, cantidades y productos.</p></div><button className="btn-icon" aria-label="Cerrar ticket" onClick={onDone}><X size={18} /></button></div>
    {saved ? <div className="feature-body"><p role="status" className="notice-success">Ticket guardado. Actualizamos la lista, el gasto, los precios y la despensa.</p><button className="btn-filled" onClick={onDone}>Listo</button></div> : <form className="feature-body" onSubmit={e => {
      e.preventDefault();
      if (invalid || mismatch) return;
      const ok = confirmReceipt(id, store, lines);
      if (ok) setSaved(true); else setError('No se guardó. Revisa las unidades y las coincidencias: cada producto debe estar pendiente y aparecer una sola vez. Este ticket también podría estar ya registrado.');
    }}>
      {onScan && <button type="button" className="btn-tonal" onClick={onScan}><Camera size={18} /> Leer foto con IA</button>}
      <p className="text-xs muted">Puedes cargar el ticket manualmente. Si ya está en tu lista, selecciona la coincidencia para evitar duplicarlo. Descuentos: introduce el precio unitario realmente pagado.</p>
      <label className="field-label">Supermercado del ticket<input className="field-input" required value={store} onChange={e => setStore(e.target.value)} placeholder="Nombre de la tienda" /></label>
      {lines.map((line, index) => <fieldset key={line.rowId} className="receipt-line"><legend>Producto {index + 1}</legend>
        <label className="field-label">Nombre del producto {index + 1}<input className="field-input" required value={line.name} onChange={e => update(index, { name: e.target.value })} /></label>
        <div className="form-grid"><label className="field-label">Precio unitario pagado ({currency})<input className="field-input" required type="number" min="0" step="0.01" value={line.price} onChange={e => update(index, { price: Number(e.target.value) })} /></label><label className="field-label">Cantidad comprada<input className="field-input" required type="number" min="0.001" step="any" value={line.quantity} onChange={e => update(index, { quantity: Number(e.target.value) })} /></label></div>
        <UnitFields value={{ ...line, unit: line.unit || 'ud' }} onChange={v => update(index, v)} />
        <label className="field-label">Coincide con mi lista<select className="field-input" value={line.targetId || ''} onChange={e => {
          const target = items.find(i => i.id === e.target.value);
          update(index, { targetId: target?.id, ...(target ? { unit: target.unit || 'ud', packSize: target.packSize, packUnit: target.packUnit, category: target.category, name: target.name } : {}) });
        }}><option value="">Es un producto nuevo</option>{items.filter(p => !p.isPurchased).map(p => <option key={p.id} value={p.id}>{p.name} · {p.quantity} {p.unit || 'ud'}</option>)}</select></label>
        <div className="flex justify-between items-center"><strong>{currency} {(line.price * line.quantity).toFixed(2)}</strong><button type="button" className="btn-icon" aria-label={`Quitar línea ${index + 1}`} onClick={() => setLines(lines.filter((_, i) => i !== index))}><Trash2 size={16} /></button></div>
      </fieldset>)}
      <button type="button" className="btn-outline" onClick={() => setLines([...lines, blank()])}><Plus size={16} /> Añadir línea al ticket</button>
      <label className="field-label">Subtotal de productos del ticket (opcional)<input className="field-input" type="number" min="0" step="0.01" value={subtotal} onChange={e => setSubtotal(e.target.value)} placeholder="Para comprobar la suma" /></label>
      <p className="text-lg font-bold">Total revisado: {currency} {total.toFixed(2)}</p>
      {mismatch && <p role="alert" className="notice-warning">La suma no coincide con el subtotal. Revisa cantidades, precios y descuentos.</p>}
      {error && <p role="alert" className="notice-warning">{error}</p>}
      <p className="text-xs muted">Confirmar marca la compra como pagada y suma las cantidades a la despensa. No confirmes dos veces el mismo ticket.</p>
      <button className="btn-filled" disabled={invalid || mismatch || !store.trim()}>Confirmar compra y actualizar despensa</button>
    </form>}
  </div></div>;
}
