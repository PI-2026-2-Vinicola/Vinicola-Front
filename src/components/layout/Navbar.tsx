import { BarChart3, BookOpen, Cpu, FileUp, Grape, History, House, Info, LayoutDashboard, Lock, LogIn, LogOut, Menu, Settings, UserRound, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABEL } from '../../data/labels';
import { useScrolled } from '../../hooks/useScrolled';
import { initials } from '../../lib/format';
import type { Area } from '../../services/api';
import { Brand } from '../ui/Logo';

interface NavItem {
  to: string;
  label: string;
  icon: typeof House;
  area?: Area;
}

/** Menu do visitante: áreas da plataforma aparecem com cadeado. */
const PUBLIC_ITEMS: NavItem[] = [
  { to: '/', label: 'Início', icon: House },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, area: 'dashboard' },
  { to: '/sensores', label: 'Sensores', icon: Cpu, area: 'sensores' },
  { to: '/analises', label: 'Análises', icon: BarChart3, area: 'analises' },
  { to: '/historico', label: 'Histórico', icon: History, area: 'historico' },
  { to: '/uvas', label: 'Uvas', icon: Grape },
  { to: '/sobre', label: 'Sobre', icon: Info },
];

/** Menu de quem entrou: só as áreas liberadas para o perfil. */
const APP_ITEMS: NavItem[] = [
  { to: '/', label: 'Início', icon: House },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, area: 'dashboard' },
  { to: '/sensores', label: 'Sensores', icon: Cpu, area: 'sensores' },
  { to: '/analises', label: 'Análises', icon: BarChart3, area: 'analises' },
  { to: '/classificacao', label: 'Classificação', icon: Grape, area: 'classificacao' },
  { to: '/historico', label: 'Histórico', icon: History, area: 'historico' },
  { to: '/importacao', label: 'Importação', icon: FileUp, area: 'importacao' },
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
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const items = user ? APP_ITEMS.filter((i) => !i.area || can(i.area)) : PUBLIC_ITEMS;
  const locked = (area?: Area) => !user && !!area;
  const doLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className={`nav ${user ? 'nav--app' : ''} ${scrolled || open ? 'is-scrolled' : ''}`}>
      <div className="container nav-inner">
        <Link to="/" aria-label="OASIS — página inicial">
          <Brand />
        </Link>

        <nav className="nav-links" aria-label="Navegação principal">
          {items.map((item) => (
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
                  <Link to="/conta" role="menuitem">
                    <UserRound /> Minha conta
                  </Link>
                  {can('administracao') && (
                    <Link to="/administracao" role="menuitem">
                      <Settings /> Administração
                    </Link>
                  )}
                  <Link to="/uvas" role="menuitem">
                    <BookOpen /> Biblioteca de uvas
                  </Link>
                  <Link to="/sobre" role="menuitem">
                    <Info /> Sobre a OASIS
                  </Link>
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
              {items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
                  <item.icon />
                  {item.label}
                  {locked(item.area) && <Lock className="lock" aria-label="requer acesso" />}
                </NavLink>
              ))}
              {user && (
                <>
                  <span className="drawer-sep" />
                  <NavLink to="/uvas">
                    <BookOpen /> Biblioteca de uvas
                  </NavLink>
                  <NavLink to="/sobre">
                    <Info /> Sobre
                  </NavLink>
                  <NavLink to="/conta">
                    <UserRound /> Minha conta
                  </NavLink>
                  {can('administracao') && (
                    <NavLink to="/administracao">
                      <Settings /> Administração
                    </NavLink>
                  )}
                </>
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
