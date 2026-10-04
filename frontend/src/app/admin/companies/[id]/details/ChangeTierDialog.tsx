'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2 } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';

export default function ChangeTierDialog({ companyId, currentTierId, tiers = [] }: { companyId: number, currentTierId: number | null, tiers: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tierId, setTierId] = useState(currentTierId?.toString() || '');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/proxy/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceTierId: tierId ? parseInt(tierId) : null }),
      });
      
      if (!res.ok) throw new Error('Failed to update company tier');
      
      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '2px', marginLeft: '4px' }}
        title="Change Tier"
      >
        <Edit2 size={12} />
      </button>

      {isOpen && (
        <div className="glass-overlay animate-fade-in" onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }} style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="premium-card" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '16px' }}>Change Pricing Tier</h3>
            
            <form onSubmit={handleUpdate}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Select Tier</label>
                <CustomSelect 
                  value={tierId}
                  onChange={(v) => setTierId(v as string)}
                  options={[
                    { value: '', label: 'Default / Standard' },
                    ...tiers.map(t => ({ value: t.id.toString(), label: t.name }))
                  ]}
                />
              </div>

              {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '0.85rem' }}>{error}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
