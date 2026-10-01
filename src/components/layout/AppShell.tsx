import { BookOpen, Cpu, FileUp, Grape, History, LayoutDashboard, LogOut, Menu, ScanSearch, Settings, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABEL } from '../../data/labels';
import { initials } from '../../lib/format';
import type { Area } from '../../services/api';
import { Brand } from '../ui/Logo';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Cpu;
  area?: Area;
}

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Monitoramento',
    items: [
      { to: '/dashboard', label: 'Painel', icon: LayoutDashboard, area: 'dashboard' },
      { to: '/sensores', label: 'Sensores', icon: Cpu, area: 'sensores' },
    ],
  },
  {
    title: 'Análises',
    items: [
      { to: '/analises', label: 'Análises', icon: ScanSearch, area: 'analises' },
      { to: '/classificacao', label: 'Classificação', icon: Grape, area: 'classificacao' },
      { to: '/historico', label: 'Histórico', icon: History, area: 'historico' },
    ],
  },
  {
    title: 'Dados',
    items: [
      { to: '/importacao', label: 'Importação', icon: FileUp, area: 'importacao' },
      { to: '/uvas', label: 'Biblioteca de uvas', icon: BookOpen },
    ],
  },
  {
    title: 'Sistema',
    items: [{ to: '/administracao', label: 'Administração', icon: Settings, area: 'administracao' }],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, can, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const doLogout = () => {
    logout();
    navigate('/login');
  };
  return (
    <>
      <Link to="/" className="sidebar-brand" onClick={onNavigate} aria-label="OASIS — página inicial">
        <Brand />
      </Link>
      <nav className="sidebar-nav" aria-label="Navegação da plataforma">
        {SECTIONS.map((section) => {
          const items = section.items.filter((i) => !i.area || can(i.area));
          if (!items.length) return null;
          return (
            <div key={section.title} className="sidebar-section">
              <span className="sidebar-title">{section.title}</span>
              {items.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={onNavigate} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                  <item.icon aria-hidden="true" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>
      <div className="sidebar-user">
        <NavLink to="/conta" onClick={onNavigate} className={({ isActive }) => `sidebar-account ${isActive ? 'active' : ''}`}>
          <span className="avatar">{initials(user.name)}</span>
          <span className="sidebar-account-text">
            <strong>{user.name}</strong>
            <span>{ROLE_LABEL[user.role]}</span>
          </span>
          <UserRound aria-hidden="true" />
        </NavLink>
        <button className="sidebar-link" onClick={doLogout}>
          <LogOut aria-hidden="true" /> Sair
        </button>
      </div>
    </>
  );
}

/** Estrutura das páginas internas: menu lateral fixo (desktop) ou gaveta (celular). */
export function AppShell() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="app">
      <aside className="sidebar">
        <SidebarContent />
      </aside>
      <header className="app-topbar">
        <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Abrir menu">
          <Menu />
        </button>
        <Link to="/" aria-label="OASIS — página inicial">
          <Brand />
        </Link>
      </header>
      {open && (
        <div className="sidebar-drawer" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <aside className="sidebar is-open" role="dialog" aria-label="Menu">
            <button className="icon-btn sidebar-close" onClick={() => setOpen(false)} aria-label="Fechar menu">
              <X />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
      <main className="app-main" id="conteudo">
        <Outlet />
      </main>
    </div>
  );
}
