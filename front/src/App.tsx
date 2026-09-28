import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme } from 'antd';
import Login from './pages/Login';
import GuideDashboard from './pages/GuideDashboard';
import TouristHome from './pages/TouristHome';
import TouristExperiencesList from './pages/TouristExperiencesList';
import TouristExperienceDetail from './pages/TouristExperienceDetail';
import TouristBookingForm from './pages/TouristBookingForm';
import TouristMyBookings from './pages/TouristMyBookings';
import { useAuthStore } from './store/useAuthStore';
import { refreshTokenApi } from './services/auth.api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * Decodes a JWT and returns its expiry timestamp (seconds), or 0 if invalid.
 */
function getTokenExp(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Protects routes that require authentication.
 * Redirects to /login if user is not authenticated.
 */
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

/**
 * On mount: if the stored access token is expired (or about to expire in <60s),
 * silently attempt a refresh. This handles the F5 / page reload scenario.
 */
const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const { accessToken, refreshToken, setTokens, logout } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      if (accessToken && refreshToken) {
        const exp = getTokenExp(accessToken);
        const nowSec = Math.floor(Date.now() / 1000);
        const isExpiredOrSoon = exp - nowSec < 60; // refresh if <60s remaining

        if (isExpiredOrSoon) {
          try {
            const result = await refreshTokenApi({ refreshToken });
            if (result.success && result.data) {
              setTokens(result.data.accessToken, result.data.refreshToken);
            } else {
              logout();
            }
          } catch {
            logout();
          }
        }
      }
      setReady(true);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return null; // Wait for init before rendering routes

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#c2703d',
            colorBgBase: '#0f1419',
            colorTextBase: '#f5f5f0',
            borderRadius: 12,
            fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
          },
        }}
      >
        <BrowserRouter>
          <AppInitializer>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/guide/login" element={<Login />} />

              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Protected Guide Routes */}
              <Route
                path="/guide/dashboard"
                element={
                  <PrivateRoute>
                    <GuideDashboard />
                  </PrivateRoute>
                }
              />

              {/* Protected Tourist Routes */}
              <Route
                path="/home"
                element={
                  <PrivateRoute>
                    <TouristHome />
                  </PrivateRoute>
                }
              />
              <Route
                path="/experiences"
                element={
                  <PrivateRoute>
                    <TouristExperiencesList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/experiences/:id"
                element={
                  <PrivateRoute>
                    <TouristExperienceDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/booking/:experienceId"
                element={
                  <PrivateRoute>
                    <TouristBookingForm />
                  </PrivateRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <PrivateRoute>
                    <TouristMyBookings />
                  </PrivateRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </AppInitializer>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default App;