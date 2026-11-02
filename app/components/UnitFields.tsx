'use client';
import type { SaleUnit, ContentUnit } from '../../types/planning';
export interface UnitValue { unit: SaleUnit; packSize?: number; packUnit?: ContentUnit }
export default function UnitFields({ value, onChange }: { value: UnitValue; onChange: (value: UnitValue) => void }) {
  return <div className="unit-fields">
    <label className="field-label">Unidad de compra<select className="field-input" value={value.unit} onChange={e => onChange({ ...value, unit: e.target.value as SaleUnit, packUnit: value.packUnit || 'g' })}>
      <option value="ud">Unidad</option><option value="kg">Kilogramo</option><option value="l">Litro</option><option value="paquete">Paquete</option>
    </select></label>
    {value.unit === 'paquete' && <>
      <label className="field-label">Contenido por paquete<input className="field-input" type="number" inputMode="decimal" min="0.001" step="any" required value={value.packSize ?? ''} onChange={e => onChange({ ...value, packSize: e.target.value ? Number(e.target.value) : undefined })} placeholder="500" /></label>
      <label className="field-label">Unidad del contenido<select className="field-input" value={value.packUnit || 'g'} onChange={e => onChange({ ...value, packUnit: e.target.value as ContentUnit })}>
        <option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="l">l</option><option value="ud">unidades</option>
      </select></label>
    </>}
  </div>;
}
