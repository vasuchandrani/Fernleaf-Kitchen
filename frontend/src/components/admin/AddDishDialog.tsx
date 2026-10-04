'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CustomSelect from '@/components/CustomSelect';

export default function AddDishDialog({ stations = [], tierId, onCreated }: { stations?: any[]; tierId?: number; onCreated?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [temperature, setTemperature] = useState('HOT');
  const [stationId, setStationId] = useState<string>('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const sku = formData.get('sku') as string;
    const temperature = formData.get('temperature') as string;
    const costPriceDollars = parseFloat(formData.get('costPrice') as string);
    const costPrice = Math.round(costPriceDollars * 100); // Convert to cents
    
    const payload: any = { name, sku, temperature, costPrice, ...(tierId ? { tierId } : {}) };
    if (stationId) {
      payload.kitchenStationId = parseInt(stationId);
    }
    
    try {
      const res = await fetch('/api/proxy/catalogue/dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to create dish');
      }
      setIsOpen(false);
      if (onCreated) onCreated();
      else router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="btn-primary" onClick={() => setIsOpen(true)}>
        <Plus size={20} /> Add Dish
      </button>

      {isOpen && (
        <div className="glass-overlay animate-fade-in" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="premium-card" style={{ width: '100%', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Add New Dish</h3>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Dish Name</label>
                  <input type="text" name="name" required className="input-field" placeholder="Margherita Pizza" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>SKU</label>
                  <input type="text" name="sku" required className="input-field" placeholder="PZA-01" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Cost Price ($)</label>
                  <input type="number" step="0.01" name="costPrice" required className="input-field" placeholder="12.50" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Temperature</label>
                  <input type="hidden" name="temperature" value={temperature} />
                  <CustomSelect 
                    value={temperature}
                    onChange={(v) => setTemperature(v as string)}
                    options={[
                      { value: 'HOT', label: 'Hot' },
                      { value: 'COLD', label: 'Cold' }
                    ]}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Kitchen Station (Optional)</label>
                <CustomSelect 
                  value={stationId}
                  onChange={(v) => setStationId(v as string)}
                  options={[
                    { value: '', label: 'None' },
                    ...stations.map(st => ({ value: st.id.toString(), label: st.name }))
                  ]}
                  placeholder="Select a station..."
                />
              </div>

              {error && <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#ef4444', fontSize: '0.9rem' }}>{error}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
