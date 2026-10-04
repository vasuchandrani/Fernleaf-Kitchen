'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';

export default function AddOptionToGroupDialog({ groupId, allOptions }: { groupId: number, allOptions: any[] }) {
  const [open, setOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/catalogue/dishes/0/option-groups/${groupId}/options`, { // Note: dishId is ignored by endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId: parseInt(selectedOption), displayOrder: parseInt(displayOrder) || 1 }),
      });
      if (res.ok) {
        setOpen(false);
        setSelectedOption('');
        router.refresh();
      } else {
        alert('Failed to add option');
      }
    } catch {
      alert('Error adding option');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="btn-secondary" onClick={() => setOpen(true)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
        <Plus size={14} style={{ marginRight: '4px' }} /> Add Option
      </button>

      {open && (
        <div className="glass-overlay animate-fade-in" onClick={(e) => { if(e.target === e.currentTarget) setOpen(false); }} style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="premium-card" style={{ position: 'relative', width: '100%', maxWidth: '400px', zIndex: 1001 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Add Option</h3>
              <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Select Global Option</label>
                <CustomSelect
                  value={selectedOption}
                  onChange={v => setSelectedOption(v as string)}
                  options={allOptions.map(o => ({ value: o.id.toString(), label: `${o.name} (+$${(o.costPrice/100).toFixed(2)})` }))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Display Order</label>
                <input required type="number" className="form-input" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} />
              </div>
              
              <button type="submit" className="btn-primary" disabled={loading || !selectedOption} style={{ marginTop: '16px', justifyContent: 'center' }}>
                {loading ? 'Adding...' : 'Add Option'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
