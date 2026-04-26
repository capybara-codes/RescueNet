import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth & Public pages
import Home      from './pages/Home';
import Login     from './pages/Login';
import Signup    from './pages/Signup';
import Onboarding from './pages/Onboarding';

// Dashboard pages
import RestaurantDashboard from './pages/RestaurantDashboard';
import DonateFoodForm      from './pages/DonateFoodForm';
import MyDonations         from './pages/MyDonations';
import NGODashboard        from './pages/NGODashboard';
import VolunteerDashboard  from './pages/VolunteerDashboard';
import ImpactDashboard     from './pages/ImpactDashboard';
import AdminDashboard      from './pages/AdminDashboard';

// Smart role-based dashboard redirect
import { useAuth } from './contexts/AuthContext';

function DashboardRedirect() {
  const { profile } = useAuth();
  const role = profile?.role;
  if (role === 'ngo')       return <NGODashboard />;
  if (role === 'volunteer') return <VolunteerDashboard />;
  if (role === 'admin')     return <AdminDashboard />;
  return <RestaurantDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"      element={<Login />} />
          <Route path="/signup"     element={<Signup />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Protected — all roles */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          } />

          <Route path="/donate" element={
            <ProtectedRoute roles={['restaurant','college','bakery']}>
              <DonateFoodForm />
            </ProtectedRoute>
          } />

          <Route path="/my-donations" element={
            <ProtectedRoute roles={['restaurant','college','bakery']}>
              <MyDonations />
            </ProtectedRoute>
          } />

          {/* NGO routes */}
          <Route path="/available-food" element={
            <ProtectedRoute roles={['ngo']}>
              <NGODashboard />
            </ProtectedRoute>
          } />
          <Route path="/accepted" element={
            <ProtectedRoute roles={['ngo']}>
              <NGODashboard />
            </ProtectedRoute>
          } />

          {/* Volunteer routes */}
          <Route path="/missions" element={
            <ProtectedRoute roles={['volunteer']}>
              <VolunteerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/my-missions" element={
            <ProtectedRoute roles={['volunteer']}>
              <VolunteerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/leaderboard" element={
            <ProtectedRoute roles={['volunteer']}>
              <VolunteerDashboard />
            </ProtectedRoute>
          } />

          {/* Rewards — donor roles */}
          <Route path="/rewards" element={
            <ProtectedRoute>
              <RestaurantDashboard />
            </ProtectedRoute>
          } />

          {/* Impact — all roles */}
          <Route path="/impact" element={
            <ProtectedRoute>
              <ImpactDashboard />
            </ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin/users"      element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/donations"  element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />

          {/* Default → login */}
          <Route path="/"   element={<Home />} />
          <Route path="*"   element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
