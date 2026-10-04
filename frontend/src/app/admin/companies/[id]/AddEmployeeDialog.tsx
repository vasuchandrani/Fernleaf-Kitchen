'use client';
import { useState, useActionState, useEffect } from 'react';
import { Plus } from 'lucide-react';

async function addEmployeeAction(prevState: any, formData: FormData) {
  const companyId = formData.get('companyId') as string;
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  try {
    const res = await fetch(`/api/proxy/companies/${companyId}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.message || 'Failed to add employee' };
    }
    // Force a hard refresh to re-fetch server component data
    window.location.reload();
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export default function AddEmployeeDialog({ companyId }: { companyId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(addEmployeeAction, null);

  useEffect(() => {
    if (state?.success) setIsOpen(false);
  }, [state]);

  return (
    <>
      <button className="btn-primary" onClick={() => setIsOpen(true)}>
        <Plus size={20} /> Add Employee
      </button>

      {isOpen && (
        <div className="glass-overlay animate-fade-in" onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }} style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="premium-card" style={{ width: '100%', maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Add Employee</h3>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="hidden" name="companyId" value={companyId} />
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Full Name</label>
                <input type="text" name="name" required className="input-field" placeholder="John Doe" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Email</label>
                <input type="email" name="email" required className="input-field" placeholder="john@company.com" />
              </div>
              {state?.error && <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#ef4444', fontSize: '0.9rem' }}>{state.error}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isPending}>{isPending ? 'Adding...' : 'Add Employee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
