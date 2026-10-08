import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { DepositProvider } from './context/DepositContext';
import { OrderHistoryProvider } from './context/OrderHistoryContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SiteSettingsProvider>
        <AuthProvider>
          <OrderHistoryProvider>
            <DepositProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </DepositProvider>
          </OrderHistoryProvider>
        </AuthProvider>
      </SiteSettingsProvider>
    </ThemeProvider>
  </StrictMode>,
);
