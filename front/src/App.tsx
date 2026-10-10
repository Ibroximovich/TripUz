import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme } from 'antd';
import Login from './pages/Login';
import GuideDashboard from './pages/GuideDashboard';
import TouristHome from './pages/TouristHome';
import TouristExperiencesList from './pages/TouristExperiencesList';
import TouristExperienceDetail from './pages/TouristExperienceDetail';
import TouristBookingForm from './pages/TouristBookingForm';
import TouristMyBookings from './pages/TouristMyBookings';
import { AdminLayout } from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminGuides from './pages/admin/AdminGuides';
import AdminExperiences from './pages/admin/AdminExperiences';
import AdminBookings from './pages/admin/AdminBookings';
import AdminReferrals from './pages/admin/AdminReferrals';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import { useAuthStore } from './store/useAuthStore';
import { refreshTokenApi } from './services/auth.api';
import { captureReferralFromUrl } from './utils/referral';

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
 * Protects admin routes — only allows users with role === 'ADMIN'.
 */
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/home" replace />;
  return <>{children}</>;
};

/**
 * Public routes (e.g. /login): if user is already logged in, redirect to their dashboard/home.
 */
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user) {
    const dest =
      user.role === 'ADMIN' ? '/admin' : user.role === 'GUIDE' ? '/guide/dashboard' : '/home';
    return <Navigate to={dest} replace />;
  }
  return <>{children}</>;
};

/**
 * Root URL (/) handler: redirects authenticated users to their dashboard/home,
 * and guests to /login.
 */
const RootRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user) {
    const dest =
      user.role === 'ADMIN' ? '/admin' : user.role === 'GUIDE' ? '/guide/dashboard' : '/home';
    return <Navigate to={dest} replace />;
  }
  return <Navigate to="/login" replace />;
};

/**
 * On mount: if the stored access token is expired (or about to expire in <60s),
 * silently attempt a refresh. This handles the F5 / page reload scenario.
 */
const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const { accessToken, refreshToken, setTokens, logout } = useAuthStore();

  useEffect(() => {
    // Capture referral code (?ref=...) on app load
    captureReferralFromUrl();

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
          } catch (err: any) {
            // Only log out if token was explicitly rejected (401 / 403).
            // Do NOT log out on temporary network issues or 5xx/404 during backend deploys.
            if (err?.response?.status === 401 || err?.response?.status === 403) {
              logout();
            }
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

/**
 * Monitors URL query params for ?ref=... on route changes and persists to localStorage.
 */
const ReferralTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    captureReferralFromUrl(location.search);
  }, [location.search]);

  return null;
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
          <ReferralTracker />
          <AppInitializer>
            <Routes>
              {/* Public Routes (redirects logged-in users away from /login) */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/guide/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />

              {/* Public Legal Pages (Terms & Privacy) */}
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/offer" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />

              {/* Root redirect */}
              <Route path="/" element={<RootRedirect />} />

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

              {/* Protected Admin Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="guides" element={<AdminGuides />} />
                <Route path="experiences" element={<AdminExperiences />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="referrals" element={<AdminReferrals />} />
              </Route>

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