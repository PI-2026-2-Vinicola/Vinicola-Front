import { BarChart3, Cpu, Grape, History, House, Info, LayoutDashboard, Lock, LogIn, LogOut, Menu, Plug, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABEL } from '../../data/labels';
import { initials } from '../../lib/format';
import type { Area } from '../../services/api';
import { useScrolled } from '../../hooks/useScrolled';
import { Brand } from '../ui/Logo';

export const NAV_ITEMS: { to: string; label: string; icon: typeof House; area?: Area }[] = [
  { to: '/', label: 'Início', icon: House },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, area: 'dashboard' },
  { to: '/sensores', label: 'Sensores', icon: Cpu, area: 'sensores' },
  { to: '/analises', label: 'Análises', icon: BarChart3, area: 'analises' },
  { to: '/historico', label: 'Histórico', icon: History, area: 'historico' },
  { to: '/uvas', label: 'Uvas', icon: Grape },
  { to: '/sobre', label: 'Sobre', icon: Info },
];

export function Navbar() {
  const scrolled = useScrolled(16);
  const { user, logout, can } = useAuth();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
    setMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menu) return;
    const onDoc = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menu]);

  const locked = (area?: Area) => !!area && !can(area);
  const doLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className={`nav ${scrolled || open ? 'is-scrolled' : ''}`}>
      <div className="container nav-inner">
        <Link to="/" aria-label="OSAIS — página inicial">
          <Brand />
        </Link>

        <nav className="nav-links" aria-label="Navegação principal">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {item.label}
              {locked(item.area) && <Lock aria-label="requer acesso" />}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          {user ? (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button className="user-chip" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-haspopup="menu">
                <span className="avatar">{initials(user.name)}</span>
                <span className="user-chip-text">
                  <strong>{user.name.split(' ')[0]}</strong>
                  <span>{ROLE_LABEL[user.role]}</span>
                </span>
              </button>
              {menu && (
                <div className="dropdown" role="menu">
                  <div className="dropdown-head">
                    <strong>{user.name}</strong>
                    <span>
                      {user.email} · {ROLE_LABEL[user.role]}
                    </span>
                  </div>
                  {can('dashboard') && (
                    <Link to="/dashboard" role="menuitem">
                      <LayoutDashboard /> Dashboard
                    </Link>
                  )}
                  {can('integracoes') && (
                    <Link to="/integracoes" role="menuitem">
                      <Plug /> Integrações
                    </Link>
                  )}
                  <button onClick={doLogout} role="menuitem">
                    <LogOut /> Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" state={{ from: location.pathname }} className="btn btn-sm btn-enter">
              <LogIn /> Entrar
            </Link>
          )}
          <button className="icon-btn nav-toggle" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu />
          </button>
        </div>
      </div>

      {open && (
        <div className="drawer" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="drawer-panel" role="dialog" aria-label="Menu">
            <div className="row-between">
              <Brand />
              <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Fechar menu">
                <X />
              </button>
            </div>
            <nav className="drawer-links">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
                  <item.icon />
                  {item.label}
                  {locked(item.area) && <Lock className="lock" aria-label="requer acesso" />}
                </NavLink>
              ))}
              {can('integracoes') && (
                <NavLink to="/integracoes">
                  <Plug /> Integrações
                </NavLink>
              )}
            </nav>
            <div style={{ marginTop: 'auto' }}>
              {user ? (
                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={doLogout}>
                  <LogOut /> Sair ({user.name.split(' ')[0]})
                </button>
              ) : (
                <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
                  <LogIn /> Entrar
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
