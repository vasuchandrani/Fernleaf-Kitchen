import { api } from '@/lib/api';
import CompanyOrderFlow from './CompanyOrderFlow';

export default async function CompanyOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [company, catalogue, settings] = await Promise.all([
    api.get(`/companies/${id}`).catch(() => null),
    api.get(`/pricing/menu/${id}`).catch(() => []),
    api.get('/settings').catch(() => ({}))
  ]);

  if (!company) {
    return <div>Company not found</div>;
  }

  return <CompanyOrderFlow company={company} catalogue={catalogue} settings={settings} />;
}
