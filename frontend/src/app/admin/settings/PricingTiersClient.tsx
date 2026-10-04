'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';

export default function PricingTiersClient({ tiers = [] }: { tiers: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // New Tier form
  const [name, setName] = useState('');
  const [derivationType, setDerivationType] = useState('ADD_AMOUNT');
  const [derivationValue, setDerivationValue] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    let val = parseFloat(derivationValue);
    if (isNaN(val)) val = 0;
    
    // For ADD/SUBTRACT we need to convert to cents
    if (derivationType === 'ADD_AMOUNT' || derivationType === 'SUBTRACT_AMOUNT') {
      val = Math.round(val * 100);
    }

    try {
      const res = await fetch('/api/proxy/pricing/tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, derivationType, derivationValue: val }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to create tier');
      }
      setName('');
      setDerivationValue('');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRuleDescription = (tier: any) => {
    if (!tier.derivationType || tier.derivationValue === null) return 'Default (No changes)';
    const val = tier.derivationValue;
    switch (tier.derivationType) {
      case 'ADD_AMOUNT': return `+$${(val / 100).toFixed(2)} to base`;
      case 'SUBTRACT_AMOUNT': return `-$${(val / 100).toFixed(2)} from base`;
      case 'MULTIPLY': return `Base × ${val}`;
      case 'MARKUP_PERCENT': return `+${val}% markup`;
      default: return 'Custom';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {tiers.map(tier => (
          <div key={tier.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <div>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {tier.name}
                {tier.isDefault && <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--bg-light)', borderRadius: '4px' }}>DEFAULT</span>}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {getRuleDescription(tier)}
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {tier._count?.companies || 0} Companies
            </div>
          </div>
        ))}
        {tiers.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No pricing tiers configured.</p>}
      </div>

      <form onSubmit={handleCreate} style={{ padding: '16px', background: 'var(--bg-light)', borderRadius: '12px' }}>
        <h4 style={{ marginBottom: '16px', fontSize: '1rem' }}>Create New Tier</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 500 }}>Tier Name</label>
            <input type="text" className="input-field" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Enterprise Tier" />
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 500 }}>Adjustment Type</label>
              <CustomSelect 
                value={derivationType} 
                onChange={(v) => setDerivationType(v as string)}
                options={[
                  { value: 'ADD_AMOUNT', label: 'Add Fixed Amount (+)' },
                  { value: 'SUBTRACT_AMOUNT', label: 'Subtract Fixed Amount (-)' },
                  { value: 'MARKUP_PERCENT', label: 'Markup Percentage (%)' },
                ]}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 500 }}>Value</label>
              <input type="number" step="0.01" required className="input-field" value={derivationValue} onChange={e => setDerivationValue(e.target.value)} placeholder="e.g., 2.50 or 15" />
            </div>
          </div>

          {error && <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading || !name} style={{ justifyContent: 'center' }}>
            <Plus size={16} style={{ marginRight: '4px' }} /> {loading ? 'Creating...' : 'Create Tier'}
          </button>
        </div>
      </form>
    </div>
  );
}
