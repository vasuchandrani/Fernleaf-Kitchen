'use client';
import { useState } from 'react';
import { FileUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BulkAddEmployeesDialog({ companyId }: { companyId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [csvData, setCsvData] = useState('');
  const router = useRouter();

  const handleBulkSubmit = async () => {
    setLoading(true);
    setError('');
    
    // Simple CSV parser
    const lines = csvData.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const employees = [];
    
    for (const line of lines) {
      const parts = line.split(',');
      if (parts.length >= 2) {
        employees.push({ name: parts[0].trim(), email: parts[1].trim() });
      }
    }
    
    if (employees.length === 0) {
      setError('No valid data found. Use format: Name, Email');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/proxy/companies/${companyId}/employees/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to bulk import employees');
      }
      setIsOpen(false);
      setCsvData('');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="btn-secondary" onClick={() => setIsOpen(true)}>
        <FileUp size={20} /> Bulk Import CSV
      </button>

      {isOpen && (
        <div className="glass-overlay animate-fade-in" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="premium-card" style={{ width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Bulk Import Employees</h3>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>Paste CSV Data (Name, Email)</label>
                <textarea 
                  className="input-field" 
                  rows={8} 
                  placeholder={"John Doe, john@acme.com\nJane Smith, jane@acme.com"}
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
              {error && <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#ef4444', fontSize: '0.9rem' }}>{error}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsOpen(false)}>Cancel</button>
                <button type="button" className="btn-primary" onClick={handleBulkSubmit} disabled={loading || !csvData.trim()}>
                  {loading ? 'Importing...' : 'Import Data'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
