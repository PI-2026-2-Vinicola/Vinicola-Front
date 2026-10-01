import { lazy, Suspense, useEffect } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Footer } from './components/layout/Footer';
import { RequireAccess, RequireAuth } from './components/layout/Guards';
import { Navbar } from './components/layout/Navbar';
import { LoadingBlock } from './components/ui/States';
import Home from './pages/Home';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Sensors = lazy(() => import('./pages/Sensors'));
const SensorDetail = lazy(() => import('./pages/SensorDetail'));
const Analyses = lazy(() => import('./pages/Analyses'));
const Classification = lazy(() => import('./pages/Classification'));
const History = lazy(() => import('./pages/History'));
const ReadingPage = lazy(() => import('./pages/ReadingPage'));
const Import = lazy(() => import('./pages/Import'));
const Admin = lazy(() => import('./pages/Admin'));
const Account = lazy(() => import('./pages/Account'));
const Grapes = lazy(() => import('./pages/Grapes'));
const GrapeDetail = lazy(() => import('./pages/GrapeDetail'));
const About = lazy(() => import('./pages/About'));
const NotFound = lazy(() => import('./pages/NotFound'));

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 60);
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash]);
  return null;
}

/** Páginas públicas: barra de navegação transparente + rodapé. */
function PublicLayout() {
  const { pathname } = useLocation();
  return (
    <>
      <Navbar />
      <main>
        <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--wine-900)' }} />}>
          <Outlet />
        </Suspense>
      </main>
      {pathname !== '/login' && <Footer />}
    </>
  );
}

/** Páginas da plataforma: sessão obrigatória + menu lateral. */
function PrivateLayout() {
  return (
    <RequireAuth>
      <Suspense fallback={<LoadingBlock height={480} />}>
        <AppShell />
      </Suspense>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/uvas" element={<Grapes />} />
          <Route path="/uvas/:id" element={<GrapeDetail />} />
          <Route path="/sobre" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route element={<PrivateLayout />}>
          <Route path="/dashboard" element={<RequireAccess area="dashboard"><Dashboard /></RequireAccess>} />
          <Route path="/sensores" element={<RequireAccess area="sensores"><Sensors /></RequireAccess>} />
          <Route path="/sensores/:id" element={<RequireAccess area="sensores"><SensorDetail /></RequireAccess>} />
          <Route path="/analises" element={<RequireAccess area="analises"><Analyses /></RequireAccess>} />
          <Route path="/classificacao" element={<RequireAccess area="classificacao"><Classification /></RequireAccess>} />
          <Route path="/historico" element={<RequireAccess area="historico"><History /></RequireAccess>} />
          <Route path="/historico/:id" element={<RequireAccess area="historico"><ReadingPage /></RequireAccess>} />
          <Route path="/importacao" element={<RequireAccess area="importacao"><Import /></RequireAccess>} />
          <Route path="/administracao" element={<RequireAccess area="administracao"><Admin /></RequireAccess>} />
          <Route path="/conta" element={<Account />} />
        </Route>
      </Routes>
    </>
  );
}
