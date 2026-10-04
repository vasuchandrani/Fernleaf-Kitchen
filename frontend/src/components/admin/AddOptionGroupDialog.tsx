'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';

export default function AddOptionGroupDialog({ dishId }: { dishId: number }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [displayOrder, setDisplayOrder] = useState('1');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/catalogue/dishes/${dishId}/option-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, isRequired, displayOrder: parseInt(displayOrder) || 1 }),
      });
      if (res.ok) {
        setOpen(false);
        setName('');
        setIsRequired(false);
        router.refresh();
      } else {
        alert('Failed to add option group');
      }
    } catch {
      alert('Error adding option group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
        <Plus size={16} style={{ marginRight: '4px' }} /> Add Group
      </button>

      {open && (
        <div className="glass-overlay animate-fade-in" onClick={(e) => { if(e.target === e.currentTarget) setOpen(false); }} style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="premium-card" style={{ position: 'relative', width: '100%', maxWidth: '400px', zIndex: 1001 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Add Option Group</h3>
              <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Group Name</label>
                <input required className="form-input" placeholder="e.g. Choose Protein" value={name} onChange={e => setName(e.target.value)} />
              </div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isRequired} onChange={e => setIsRequired(e.target.checked)} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Is Required? (Pick exactly 1)</span>
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Display Order</label>
                <input required type="number" className="form-input" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} />
              </div>
              
              <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '16px', justifyContent: 'center' }}>
                {loading ? 'Adding...' : 'Add Group'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
