'use client';

import { useState, useEffect, useMemo } from 'react';
import { Layers, Plus, Copy, ArrowRight, Shield, Percent, Tag, Settings2, ChevronLeft, Search, ToggleLeft, ToggleRight, Edit3, Check, X, Utensils, DollarSign } from 'lucide-react';
import Link from 'next/link';
import AddDishDialog from '@/components/admin/AddDishDialog';

/**
 * Catalogue page — shows all price tiers (catalogues).
 * Default tier is always present. Clicking a tier shows all dishes with their prices for that tier.
 * 
 * Design Pattern: Prototype Pattern for creating new catalogues from existing ones.
 */
export default function CataloguePage() {
  const [tiers, setTiers] = useState<any[]>([]);
  const [dishes, setDishes] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [tierDishes, setTierDishes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dishesLoading, setDishesLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [cloneSource, setCloneSource] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPrice, setEditingPrice] = useState<number | null>(null);
  const [editPriceValue, setEditPriceValue] = useState('');

  useEffect(() => {
    fetchTiers();
    fetchStations();
  }, []);

  const fetchTiers = async () => {
    try {
      const res = await fetch('/api/proxy/pricing/tiers');
      if (res.ok) {
        const data = await res.json();
        setTiers(data);
      }
    } catch { /* */ }
    setLoading(false);
  };

  const fetchStations = async () => {
    try {
      const res = await fetch('/api/proxy/catalogue/stations');
      if (res.ok) setStations(await res.json());
    } catch { /* */ }
  };

  const fetchTierDishes = async (tierId: number) => {
    setDishesLoading(true);
    try {
      const res = await fetch(`/api/proxy/pricing/tiers/${tierId}/dishes`);
      if (res.ok) {
        setTierDishes(await res.json());
      }
    } catch { /* */ }
    setDishesLoading(false);
  };

  const handleSelectTier = (tier: any) => {
    setSelectedTier(tier);
    setSearchQuery('');
    fetchTierDishes(tier.id);
  };

  const handleBack = () => {
    setSelectedTier(null);
    setTierDishes([]);
    setSearchQuery('');
    fetchTiers();
  };

  const handleToggleDishActive = async (dishId: number, currentActive: boolean) => {
    try {
      await fetch(`/api/proxy/catalogue/dishes/${dishId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      // Refresh
      if (selectedTier) fetchTierDishes(selectedTier.id);
    } catch { /* */ }
  };

  const handleSavePrice = async (dishId: number) => {
    if (!selectedTier) return;
    const cents = Math.round(parseFloat(editPriceValue) * 100);
    if (isNaN(cents)) return;
    try {
      await fetch(`/api/proxy/pricing/tiers/${selectedTier.id}/dishes/${dishId}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: cents }),
      });
      setEditingPrice(null);
      fetchTierDishes(selectedTier.id);
    } catch { /* */ }
  };

  const filteredTierDishes = useMemo(() => {
    if (!searchQuery) return tierDishes;
    const q = searchQuery.toLowerCase();
    return tierDishes.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.sku.toLowerCase().includes(q) ||
      d.kitchenStation?.name?.toLowerCase().includes(q)
    );
  }, [tierDishes, searchQuery]);

  /* ====== TIER LIST VIEW ====== */
  if (!selectedTier) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Each catalogue represents a price tier. The <strong>Default</strong> catalogue is always present.
          </p>
          <button className="btn-primary" onClick={() => setShowCreateDialog(true)}>
            <Plus size={16} /> New Catalogue
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner-lg" />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {tiers.map(tier => (
              <div
                key={tier.id}
                className="premium-card"
                onClick={() => handleSelectTier(tier)}
                style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
              >
                {tier.isDefault && (
                  <div style={{
                    position: 'absolute', top: '12px', right: '12px',
                    background: '#ecfdf5', color: '#059669', padding: '2px 10px',
                    borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700,
                  }}>
                    DEFAULT
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    padding: '12px', borderRadius: '12px',
                    background: tier.isDefault ? '#ecfdf5' : '#eff6ff',
                    color: tier.isDefault ? '#10b981' : '#3b82f6',
                  }}>
                    <Layers size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '2px' }}>{tier.name}</h3>
                    {tier.derivationType && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {tier.derivationType === 'MARKUP_PERCENT' ? `+${tier.derivationValue}%` :
                         tier.derivationType === 'MULTIPLY' ? `×${tier.derivationValue}` :
                         tier.derivationType === 'ADD_AMOUNT' ? `+$${(tier.derivationValue / 100).toFixed(2)}` :
                         tier.derivationType === 'SUBTRACT_AMOUNT' ? `-$${(tier.derivationValue / 100).toFixed(2)}` :
                         ''}
                        {' from base'}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {tier._count?.companies || 0} companies
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn-secondary"
                      onClick={(e) => { e.stopPropagation(); setCloneSource(tier); setShowCloneDialog(true); }}
                      style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                    >
                      <Copy size={12} /> Clone
                    </button>
                    <span style={{ color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      View <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {tiers.length === 0 && (
              <div className="premium-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px' }}>
                <Layers size={48} style={{ margin: '0 auto 16px', opacity: 0.15 }} />
                <h3>No catalogues found</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Create your first catalogue to get started.</p>
              </div>
            )}
          </div>
        )}

        {/* Create Tier Dialog */}
        {showCreateDialog && (
          <CreateTierDialog onClose={() => setShowCreateDialog(false)} onCreated={() => { setShowCreateDialog(false); fetchTiers(); }} />
        )}

        {/* Clone Tier Dialog */}
        {showCloneDialog && cloneSource && (
          <CloneTierDialog source={cloneSource} onClose={() => { setShowCloneDialog(false); setCloneSource(null); }} onCreated={() => { setShowCloneDialog(false); setCloneSource(null); fetchTiers(); }} />
        )}
      </div>
    );
  }

  /* ====== TIER DETAIL VIEW (dishes with prices) ====== */
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={handleBack} style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: '8px',
            padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
            color: 'var(--text-muted)', fontSize: '0.85rem',
          }}>
            <ChevronLeft size={14} /> All Catalogues
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0 }}>{selectedTier.name}</h2>
              {selectedTier.isDefault && (
                <span style={{ background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>DEFAULT</span>
              )}
            </div>
            {selectedTier.derivationType && (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Pricing rule: {selectedTier.derivationType === 'MARKUP_PERCENT' ? `+${selectedTier.derivationValue}%` :
                 selectedTier.derivationType === 'MULTIPLY' ? `×${selectedTier.derivationValue}` :
                 selectedTier.derivationType === 'ADD_AMOUNT' ? `+$${(selectedTier.derivationValue / 100).toFixed(2)}` :
                 `-$${(selectedTier.derivationValue / 100).toFixed(2)}`} from cost
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text" placeholder="Search dishes..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '32px', padding: '7px 12px 7px 32px', fontSize: '0.85rem', width: '220px' }}
            />
          </div>
          {selectedTier.isDefault && <AddDishDialog stations={stations} />}
        </div>
      </div>

      {dishesLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner-lg" />
        </div>
      ) : filteredTierDishes.length === 0 ? (
        <div className="premium-card" style={{ textAlign: 'center', padding: '60px' }}>
          <Utensils size={48} style={{ margin: '0 auto 16px', opacity: 0.15 }} />
          <h3>No dishes found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            {searchQuery ? 'No dishes match your search.' : 'Add dishes to the Default catalogue first.'}
          </p>
        </div>
      ) : (
        <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={thStyle}>Dish</th>
                  <th style={thStyle}>SKU</th>
                  <th style={thStyle}>Temp</th>
                  <th style={thStyle}>Station</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Cost Price</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                      <DollarSign size={12} /> Tier Price
                    </div>
                  </th>
                  <th style={thStyle}>Status</th>
                  <th style={{ ...thStyle, width: '120px' }}>Options</th>
                </tr>
              </thead>
              <tbody>
                {filteredTierDishes.map(dish => (
                  <tr key={dish.id} style={{ borderBottom: '1px solid var(--border)', opacity: dish.isActive ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                    <td style={tdStyle}>
                      <Link href={`/admin/catalogue/${dish.id}`} style={{ fontWeight: 600, color: 'var(--text-main)', textDecoration: 'none' }}>
                        {dish.name}
                      </Link>
                      {dish.optionGroups?.length > 0 && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                          ({dish.optionGroups.reduce((total: number, group: any) => total + (group.options?.length || 0), 0)} options)
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: '0.78rem', padding: '2px 8px', background: 'var(--bg-light)', borderRadius: '4px', fontWeight: 600 }}>{dish.sku}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', fontWeight: 600,
                        background: dish.temperature === 'HOT' ? '#fef3c7' : '#e0f2fe',
                        color: dish.temperature === 'HOT' ? '#d97706' : '#0284c7',
                      }}>
                        {dish.temperature}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{dish.kitchenStation?.name || '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      ${(dish.costPrice / 100).toFixed(2)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      {editingPrice === dish.id ? (
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.9rem' }}>$</span>
                          <input
                            type="number" step="0.01" value={editPriceValue}
                            onChange={e => setEditPriceValue(e.target.value)}
                            className="input-field"
                            style={{ width: '80px', padding: '4px 6px', fontSize: '0.85rem', textAlign: 'right' }}
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') handleSavePrice(dish.id); if (e.key === 'Escape') setEditingPrice(null); }}
                          />
                          <button onClick={() => handleSavePrice(dish.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}><Check size={14} /></button>
                          <button onClick={() => setEditingPrice(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>${(dish.finalPrice / 100).toFixed(2)}</span>
                          {dish.hasOverride && (
                            <span style={{ fontSize: '0.65rem', padding: '1px 5px', background: '#fef3c7', color: '#d97706', borderRadius: '4px', fontWeight: 600 }}>OVERRIDE</span>
                          )}
                          <button
                            onClick={() => { setEditingPrice(dish.id); setEditPriceValue((dish.finalPrice / 100).toFixed(2)); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                          >
                            <Edit3 size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleToggleDishActive(dish.id, dish.isActive)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '4px',
                          color: dish.isActive ? '#059669' : '#ef4444', fontSize: '0.8rem', fontWeight: 600,
                        }}
                      >
                        {dish.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        {dish.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={tdStyle}>
                      <Link href={`/admin/catalogue/${dish.id}`} style={{
                        color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600,
                        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px',
                      }}>
                        <Settings2 size={12} /> Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{
            padding: '12px 20px', borderTop: '1px solid var(--border)',
            background: 'var(--bg-light)', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500,
          }}>
            {filteredTierDishes.length} dish{filteredTierDishes.length !== 1 ? 'es' : ''} in this catalogue
          </div>
        </div>
      )}
    </div>
  );
}

/* ====== CREATE TIER DIALOG ====== */
function CreateTierDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [derivationType, setDerivationType] = useState('');
  const [derivationValue, setDerivationValue] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const body: any = { name: name.trim() };
      if (derivationType) {
        body.derivationType = derivationType;
        body.derivationValue = parseFloat(derivationValue) || 0;
      }
      const res = await fetch('/api/proxy/pricing/tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) onCreated();
    } catch { /* */ } finally { setSaving(false); }
  };

  return (
    <DialogOverlay onClose={onClose}>
      <h3 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>Create New Catalogue</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Catalogue Name *</label>
          <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Enterprise, Partner, Tier 2" />
        </div>
        <div>
          <label style={labelStyle}>Pricing Rule (optional)</label>
          <select className="input-field" value={derivationType} onChange={e => setDerivationType(e.target.value)} style={{ appearance: 'auto' }}>
            <option value="">None (manual prices)</option>
            <option value="MARKUP_PERCENT">Markup % from cost</option>
            <option value="MULTIPLY">Multiply cost by</option>
            <option value="ADD_AMOUNT">Add fixed amount (cents)</option>
            <option value="SUBTRACT_AMOUNT">Subtract fixed amount (cents)</option>
          </select>
        </div>
        {derivationType && (
          <div>
            <label style={labelStyle}>Value</label>
            <input className="input-field" type="number" step="0.01" value={derivationValue} onChange={e => setDerivationValue(e.target.value)}
              placeholder={derivationType === 'MARKUP_PERCENT' ? 'e.g. 15 for +15%' : derivationType === 'MULTIPLY' ? 'e.g. 2.4' : 'Amount in cents'} />
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving || !name.trim()} style={{ flex: 1, justifyContent: 'center' }}>
            {saving ? 'Creating...' : 'Create Catalogue'}
          </button>
          <button className="btn-secondary" onClick={onClose} style={{ justifyContent: 'center' }}>Cancel</button>
        </div>
      </div>
    </DialogOverlay>
  );
}

/* ====== CLONE TIER DIALOG (Prototype Pattern) ====== */
function CloneTierDialog({ source, onClose, onCreated }: { source: any; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState(`${source.name} (Copy)`);
  const [derivationType, setDerivationType] = useState('MARKUP_PERCENT');
  const [derivationValue, setDerivationValue] = useState('5');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/proxy/pricing/tiers/${source.id}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          derivationType: derivationType || undefined,
          derivationValue: derivationType ? parseFloat(derivationValue) || 0 : undefined,
        }),
      });
      if (res.ok) onCreated();
    } catch { /* */ } finally { setSaving(false); }
  };

  return (
    <DialogOverlay onClose={onClose}>
      <h3 style={{ marginBottom: '4px', fontSize: '1.2rem' }}>Clone Catalogue</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
        Creating a new catalogue based on <strong>{source.name}</strong>. All dish prices will be cloned.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={labelStyle}>New Catalogue Name *</label>
          <input className="input-field" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Price Adjustment Rule</label>
          <select className="input-field" value={derivationType} onChange={e => setDerivationType(e.target.value)} style={{ appearance: 'auto' }}>
            <option value="">No adjustment (exact copy)</option>
            <option value="MARKUP_PERCENT">Increase by % (e.g. +5%)</option>
            <option value="SUBTRACT_AMOUNT">Decrease by amount (cents)</option>
            <option value="MULTIPLY">Multiply by factor</option>
          </select>
        </div>
        {derivationType && (
          <div>
            <label style={labelStyle}>Value</label>
            <input className="input-field" type="number" step="0.01" value={derivationValue} onChange={e => setDerivationValue(e.target.value)}
              placeholder={derivationType === 'MARKUP_PERCENT' ? 'e.g. 5 for +5%' : 'Value'} />
            {derivationType === 'MARKUP_PERCENT' && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                E.g. &quot;5&quot; means all prices will be 5% higher than {source.name}
              </p>
            )}
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving || !name.trim()} style={{ flex: 1, justifyContent: 'center' }}>
            <Copy size={14} /> {saving ? 'Cloning...' : 'Clone Catalogue'}
          </button>
          <button className="btn-secondary" onClick={onClose} style={{ justifyContent: 'center' }}>Cancel</button>
        </div>
      </div>
    </DialogOverlay>
  );
}

/* ====== DIALOG OVERLAY ====== */
function DialogOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="glass-overlay animate-fade-in" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="premium-card" style={{ width: '100%', maxWidth: '480px', maxHeight: '80vh', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600,
  fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', background: 'var(--bg-light)',
};
const tdStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '0.88rem' };
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' };
