'use client';
import { useState } from 'react';
import { useShoppingStore, type Product } from '../../store/useShoppingStore';
import { planMonth, unitPrice, priceChange, roundMoney } from '../../utils/planning';
import type { BaseUnit } from '../../types/planning';
import { CalendarPlus, Package, Scale, TrendingUp, Trash2, ReceiptText } from 'lucide-react';
import UnitFields, { type UnitValue } from './UnitFields';

function MonthPlanner() {
  const { items, history, pantry, totalBudget, currency, createPlannedList } = useShoppingStore();
  const [source, setSource] = useState('active');
  const [recurringOnly, setRecurringOnly] = useState(false);
  const [month, setMonth] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() + 1, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; });
  const [budget, setBudget] = useState(String(totalBudget));
  const [preview, setPreview] = useState<Product[] | null>(null);
  const [message, setMessage] = useState('');
  const selected = source === 'active' ? items : history.find(h => h.id === source)?.items || [];
  return <details className="feature-panel" open>
    <summary><CalendarPlus size={18} /><span>Prepara el próximo mes<small>Reutiliza tus compras y descuenta lo que tienes</small></span></summary>
    <div className="feature-body">
      <div className="form-grid"><label className="field-label">Mes de la compra<input className="field-input" type="month" value={month} onChange={e => setMonth(e.target.value)} /></label>
      <label className="field-label">Presupuesto ({currency})<input className="field-input" type="number" min="0" step="0.01" value={budget} onChange={e => setBudget(e.target.value)} /></label></div>
      <label className="field-label">Usar como referencia<select className="field-input" value={source} onChange={e => { setSource(e.target.value); setPreview(null); }}><option value="active">Lista actual ({items.length} productos)</option>{history.map(h => <option key={h.id} value={h.id}>{h.month} · {h.items.length} productos</option>)}</select></label>
      <label className="check-label"><input type="checkbox" checked={recurringOnly} onChange={e => { setRecurringOnly(e.target.checked); setPreview(null); }} /> Solo productos recurrentes</label>
      <p className="text-xs muted">Se descuentan existencias con el mismo nombre y unidad. Los paquetes se redondean hacia arriba. Revisa la propuesta antes de crearla.</p>
      <button className="btn-tonal" disabled={!selected.length} onClick={() => { setPreview(planMonth(recurringOnly ? selected.filter(p => p.isRecurring) : selected, pantry)); setMessage(''); }}>Calcular mi compra</button>
      {preview && <div className="space-y-3">
        <p className="text-sm font-semibold">{preview.length ? `${preview.length} productos por comprar` : 'No hay productos por comprar con esta selección.'}</p>
        {preview.map((p, index) => <div key={p.id} className="planning-row"><span>{p.name}<small>{currency} {p.estimatedPrice.toFixed(2)} / {p.unit || 'ud'}</small></span><input aria-label={`Cantidad planificada de ${p.name}`} type="number" min="0" step={p.unit === 'kg' || p.unit === 'l' ? '0.001' : '1'} className="field-input quantity-input" value={p.quantity} onChange={e => setPreview(preview.map((row, i) => i === index ? { ...row, quantity: Number(e.target.value) } : row))} /></div>)}
        <p className="font-semibold">Previsto: {currency} {roundMoney(preview.reduce((n, p) => n + p.estimatedPrice * p.quantity, 0)).toFixed(2)}</p>
        <button className="btn-filled" disabled={!month || !preview.some(p => p.quantity > 0) || !Number.isFinite(Number(budget)) || Number(budget) < 0 || preview.some(p => !Number.isFinite(p.quantity) || p.quantity < 0 || (!['kg', 'l'].includes(p.unit || 'ud') && !Number.isInteger(p.quantity)))} onClick={() => {
          const label = new Date(`${month}-01T12:00:00`).toLocaleDateString('es', { month: 'long', year: 'numeric' });
          createPlannedList(label, preview.filter(p => p.quantity > 0), Number(budget)); setPreview(null); setMessage(`Lista de ${label} creada. La anterior se conserva.`);
        }}>Crear lista del mes</button>
      </div>}
      <p role="status" className="text-sm text-accent">{message}</p>
    </div>
  </details>;
}
function Pantry() {
  const { pantry, setPantryItem, removePantryItem } = useShoppingStore();
  const [name, setName] = useState(''), [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<BaseUnit>('ud');
  return <details className="feature-panel">
    <summary><Package size={18} /><span>Lo que hay en casa<small>{pantry.length} productos en tu despensa</small></span></summary>
    <div className="feature-body"><p className="text-xs muted">Anota las existencias actuales; al guardar el mismo producto y unidad se actualiza la cantidad. Los tickets confirmados suman sus compras aquí.</p>
      <form className="space-y-3" onSubmit={e => { e.preventDefault(); setPantryItem({ name, quantity: Number(quantity), unit }); setName(''); setQuantity('1'); }}>
        <label className="field-label">Producto en despensa<input className="field-input" required value={name} onChange={e => setName(e.target.value)} placeholder="Arroz" /></label>
        <div className="form-grid"><label className="field-label">Existencias<input className="field-input" type="number" required min="0" step="0.001" value={quantity} onChange={e => setQuantity(e.target.value)} /></label><label className="field-label">Unidad en despensa<select className="field-input" value={unit} onChange={e => setUnit(e.target.value as BaseUnit)}><option value="ud">unidades</option><option value="kg">kg</option><option value="l">litros</option></select></label></div>
        <button className="btn-tonal" disabled={!name.trim()}>Guardar existencias</button>
      </form>
      {pantry.map(p => <div className="planning-row" key={p.id}><span>{p.name}<small>{p.unit} disponibles</small></span><input className="field-input quantity-input" aria-label={`Existencias de ${p.name}`} type="number" min="0" step="0.001" value={p.quantity} onChange={e => setPantryItem({ ...p, quantity: Number(e.target.value) })} /><button className="btn-icon" aria-label={`Quitar ${p.name} de despensa`} onClick={() => removePantryItem(p.id)}><Trash2 size={16} /></button></div>)}
      {!pantry.length && <p className="text-sm muted">Empieza por lo que queda en tu cocina.</p>}
    </div>
  </details>;
}
function PriceCompare() {
  const currency = useShoppingStore(s => s.currency);
  const [offers, setOffers] = useState([{ price: '5', unit: 'paquete', packSize: 500, packUnit: 'g' }, { price: '8', unit: 'paquete', packSize: 1, packUnit: 'kg' }] as (UnitValue & { price: string })[]);
  const prices = offers.map(p => Number.isFinite(Number(p.price)) && Number(p.price) >= 0 && p.price !== '' ? unitPrice({ ...p, estimatedPrice: Number(p.price), isPurchased: false }) : null);
  const comparable = prices[0] && prices[1] && prices[0].unit === prices[1].unit;
  const winner = comparable ? (prices[0]!.price === prices[1]!.price ? -1 : prices[0]!.price < prices[1]!.price ? 0 : 1) : -1;
  return <details className="feature-panel"><summary><Scale size={18} /><span>¿Qué presentación conviene?<small>Compara por kilo, litro o unidad</small></span></summary><div className="feature-body"><p className="text-xs muted">Ejemplo editable. Compara productos equivalentes en calidad y contenido.</p>
    <div className="comparison-grid">{offers.map((offer, index) => <fieldset key={index} className="offer-card"><legend>Opción {index + 1}</legend><label className="field-label">Precio opción {index + 1} ({currency})<input className="field-input" type="number" min="0" step="0.01" value={offer.price} onChange={e => setOffers(offers.map((p, i) => i === index ? { ...p, price: e.target.value } : p))} /></label><UnitFields value={offer} onChange={v => setOffers(offers.map((p, i) => i === index ? { ...p, ...v } : p))} /><p className="font-semibold text-accent">{prices[index] ? `${currency} ${prices[index]!.price.toFixed(2)} / ${prices[index]!.unit}` : 'Completa el contenido'}</p></fieldset>)}</div>
    <p role="status" className="notice-success">{!comparable ? 'Usa unidades compatibles para comparar.' : winner === -1 ? 'Las dos opciones cuestan lo mismo por unidad.' : `Conviene la opción ${winner + 1}: ahorras ${currency} ${Math.abs(prices[0]!.price - prices[1]!.price).toFixed(2)} por ${prices[0]!.unit}.`}</p>
  </div></details>;
}
function Prices() {
  const { priceHistory, items, currency } = useShoppingStore();
  const changes = items.map(p => ({ p, change: priceChange(p, priceHistory, currency) })).filter(row => row.change && Math.abs(row.change.percent) >= .1);
  const entries = [...priceHistory].filter(p => p.currency === currency).sort((a, b) => b.recordedAt - a.recordedAt);
  return <details className="feature-panel"><summary><TrendingUp size={18} /><span>Precios que recuerdas<small>Aumentos y precios pagados por tienda</small></span></summary><div className="feature-body">
    <p className="text-xs muted">Comparamos el mismo nombre y unidad, en la misma moneda. Las compras que marques a partir de ahora alimentan este historial.</p>
    {changes.map(({ p, change }) => <div className="planning-row" key={p.id}><span>{p.name}<small>Anterior: {currency} {change!.previous.price.toFixed(2)} / {change!.unit} · {change!.previous.store}</small></span><strong style={{ color: change!.percent > 0 ? 'var(--danger)' : 'var(--success)' }}>{change!.percent > 0 ? '+' : ''}{change!.percent.toFixed(1)}%</strong></div>)}
    {entries.slice(0, 30).map(e => <div className="planning-row" key={e.id}><span>{e.name}<small>{e.store} · {new Date(e.recordedAt).toLocaleDateString('es')}</small></span><strong>{currency} {e.price.toFixed(2)}<small>/ {e.unit}</small></strong></div>)}
    {!entries.length && <p className="text-sm muted">Al marcar una compra o confirmar un ticket, guardaremos su precio.</p>}
  </div></details>;
}
export default function PlanningHub({ onReceipt }: { onReceipt: () => void }) {
  return <div className="space-y-4"><div className="section-heading"><span>COMPRA CON INTENCIÓN</span><h2>Planifica y ahorra</h2><p>Tu despensa, tus precios y el próximo mes, en un lugar.</p></div><MonthPlanner /><Pantry /><PriceCompare /><Prices /><button className="btn-filled w-full" onClick={onReceipt}><ReceiptText size={18} /> Registrar un ticket</button></div>;
}
