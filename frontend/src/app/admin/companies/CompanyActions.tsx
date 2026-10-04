'use client';

import { useState } from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ConfirmationDialog from '@/components/admin/ConfirmationDialog';

export function EditCompanyButton({ company }: { company: { id: number; name: string; billingEmail: string } }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(company.name);
  const [billingEmail, setBillingEmail] = useState(company.billingEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    const response = await fetch(`/api/proxy/companies/${company.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, billingEmail }) });
    if (!response.ok) { setError((await response.json().catch(() => ({}))).message || 'Could not update company'); setBusy(false); return; }
    setOpen(false); setBusy(false); router.refresh();
  };
  return <>
    <button className="btn-secondary icon-button" onClick={() => setOpen(true)} aria-label={`Edit ${company.name}`}><Edit3 size={15} /></button>
    {open && <div className="glass-overlay" style={overlay}><form className="premium-card" onSubmit={save} style={dialog}><h3>Edit company</h3><input className="input-field" value={name} onChange={e => setName(e.target.value)} required /><input className="input-field" type="email" value={billingEmail} onChange={e => setBillingEmail(e.target.value)} required />{error && <p style={{ color: '#b42318' }}>{error}</p>}<div style={actions}><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div></form></div>}
  </>;
}

export function DeleteCompanyButton({ companyId, companyName }: { companyId: number; companyName: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [open, setOpen] = useState(false); const [error, setError] = useState('');
  const remove = async () => {
    setBusy(true);
    const response = await fetch(`/api/proxy/companies/${companyId}`, { method: 'DELETE' });
    setBusy(false);
    if (!response.ok) { setError((await response.json().catch(() => ({}))).message || 'Could not delete company'); return; }
    setOpen(false);
    router.refresh();
  };
  return <>
    <button className="btn-secondary icon-button" onClick={() => { setError(''); setOpen(true); }} disabled={busy} aria-label={`Delete ${companyName}`}><Trash2 size={15} /></button>
    {open && <ConfirmationDialog title={`Delete ${companyName}?`} description="This removes the company, its employees, and its order history. This action cannot be undone." confirmLabel="Delete company" busy={busy} onConfirm={remove} onCancel={() => setOpen(false)} />}
    {error && <div className="glass-overlay" style={overlay}><div className="premium-card" style={dialog}><h3>Company could not be deleted</h3><p style={{ color: '#b42318' }}>{error}</p><button className="btn-primary" onClick={() => setError('')}>Close</button></div></div>}
  </>;
}

const overlay = { position: 'fixed' as const, inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(15,23,42,.35)' };
const dialog = { width: '100%', maxWidth: 440, display: 'grid', gap: 14 };
const actions = { display: 'flex', justifyContent: 'flex-end', gap: 10 };
