import { api } from '@/lib/api';
import Link from 'next/link';
import { Users, Mail, Tag } from 'lucide-react';
import AddCompanyDialog from '@/components/admin/AddCompanyDialog';

export default async function CompaniesPage() {
  const companies = await api.get('/companies').catch(() => []);

  return (
    <div className="animate-fade-in">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Customers</p>
          <h1>Companies</h1>
          <p className="page-subtitle">Manage registered companies and their price tiers.</p>
        </div>
        <div className="page-heading-actions"><AddCompanyDialog /></div>
      </div>

      {companies.length === 0 ? (
        <div className="premium-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <h3>No companies yet</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Click &quot;Add Company&quot; to register your first client.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {companies.map((company: any) => (
            <Link key={company.id} href={`/admin/companies/${company.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="premium-card" style={{ cursor: 'pointer' }}>
                <h3 style={{ marginBottom: '8px', fontSize: '1.15rem' }}>{company.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                  <Mail size={14} /> {company.billingEmail}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Tag size={14} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                      {company.priceTier?.name || 'Standard'}
                    </span>
                  </div>
                  <span className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Manage →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
