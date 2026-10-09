import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { AppStateProvider } from './contexts/AppStateContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
);
