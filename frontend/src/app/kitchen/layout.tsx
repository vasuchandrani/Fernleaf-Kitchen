import KitchenNav from './KitchenNav';
import { Utensils, LogOut } from 'lucide-react';
import Link from 'next/link';
import styles from '../admin/layout.module.css';

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`admin-theme ${styles.adminContainer}`}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}><Utensils className={styles.logoIcon} /><span>Fernleaf</span></div>
        <KitchenNav />
        <div className={styles.sidebarFooter}>
          <Link href="/api/auth/logout" className={styles.logoutBtn}><LogOut size={20} /> Logout</Link>
        </div>
      </aside>
      <main className={styles.mainContent}>
        <header className="page-heading" style={{ marginBottom: '24px' }}>
          <div>
            <p className="eyebrow">Kitchen workspace</p>
            <h1>Kitchen</h1>
            <p className="page-subtitle">Prepare confirmed orders and hand completed dishes to packing.</p>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
