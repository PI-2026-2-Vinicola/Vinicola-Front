import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Footer } from './components/layout/Footer';
import { DataGate, RequireAccess } from './components/layout/Guards';
import { Navbar } from './components/layout/Navbar';
import Home from './pages/Home';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Sensors = lazy(() => import('./pages/Sensors'));
const SensorDetail = lazy(() => import('./pages/SensorDetail'));
const Analyses = lazy(() => import('./pages/Analyses'));
const History = lazy(() => import('./pages/History'));
const ReadingPage = lazy(() => import('./pages/ReadingPage'));
const Grapes = lazy(() => import('./pages/Grapes'));
const GrapeDetail = lazy(() => import('./pages/GrapeDetail'));
const About = lazy(() => import('./pages/About'));
const Integrations = lazy(() => import('./pages/Integrations'));
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

export default function App() {
  const { pathname } = useLocation();
  const showFooter = pathname !== '/login';
  return (
    <>
      <ScrollManager />
      <Navbar />
      <main>
        <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--wine-900)' }} />}>
          <Routes>
            <Route path="/" element={<DataGate><Home /></DataGate>} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<RequireAccess area="dashboard"><Dashboard /></RequireAccess>} />
            <Route path="/sensores" element={<RequireAccess area="sensores"><Sensors /></RequireAccess>} />
            <Route path="/sensores/:id" element={<RequireAccess area="sensores"><SensorDetail /></RequireAccess>} />
            <Route path="/analises" element={<RequireAccess area="analises"><Analyses /></RequireAccess>} />
            <Route path="/historico" element={<RequireAccess area="historico"><History /></RequireAccess>} />
            <Route path="/historico/:id" element={<RequireAccess area="historico"><ReadingPage /></RequireAccess>} />
            <Route path="/uvas" element={<Grapes />} />
            <Route path="/uvas/:id" element={<GrapeDetail />} />
            <Route path="/sobre" element={<About />} />
            <Route path="/integracoes" element={<RequireAccess area="integracoes"><Integrations /></RequireAccess>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {showFooter && <Footer />}
    </>
  );
}
