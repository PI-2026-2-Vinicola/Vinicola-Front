import '@fontsource-variable/inter';
import '@fontsource-variable/fraunces';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/map.css';
import './styles/analysis.css';
import './styles/landing.css';
import './styles/pages.css';

// VITE_ROUTER=memory: navegação em memória, para publicar a demonstração embutida em outra página (iframe).
const Router = import.meta.env.VITE_ROUTER === 'memory' ? MemoryRouter : BrowserRouter;
const routerProps = import.meta.env.VITE_ROUTER === 'memory' ? {} : { basename: import.meta.env.BASE_URL };

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router {...routerProps}>
      <AuthProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </AuthProvider>
    </Router>
  </StrictMode>,
);
