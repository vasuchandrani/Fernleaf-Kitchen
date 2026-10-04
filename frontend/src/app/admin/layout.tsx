'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Utensils, ClipboardList, ChefHat, Settings, LogOut } from 'lucide-react';
import styles from './layout.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
    { href: '/admin/kitchen', label: 'Kitchen', icon: ChefHat },
    { href: '/admin/catalogue', label: 'Catalogue', icon: Utensils },
    { href: '/admin/companies', label: 'Companies', icon: Users },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    window.location.href = '/api/auth/logout';
  };

  return (
    <div className={`admin-theme ${styles.adminContainer}`}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <Utensils className={styles.logoIcon} />
          <span>Fernleaf</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.navLink}
              style={isActive(item.href, item.exact) ? {
                background: '#ecfdf5',
                color: 'var(--primary)',
                fontWeight: 600,
              } : {}}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
