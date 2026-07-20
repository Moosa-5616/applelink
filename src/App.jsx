import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ReviewProvider } from './contexts/ReviewContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RoleSelectPage from './pages/auth/RoleSelectPage';
import Home from './pages/Home';
import Marketplace from './pages/buyer/Marketplace';
import ListingDetail from './pages/buyer/ListingDetail';
import CreateListing from './pages/farmer/CreateListing';
import OffersReceived from './pages/farmer/OffersReceived';
import MyOffers from './pages/buyer/MyOffers';
import Dashboard from './pages/dashboard/Dashboard';
import NotificationsPage from './pages/NotificationsPage';
import Profile from './pages/profile/Profile';
import PayBrokerage from './pages/PayBrokerage';
import PendingReviews from './pages/PendingReviews';

export default function App() {
  return (
    <AuthProvider>
      <ReviewProvider>
        <Router>
          <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/select-role" element={
            <ProtectedRoute>
              <RoleSelectPage />
            </ProtectedRoute>
          } />

          {/* Core App Shield */}
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            {/* Authenticated home routes */}
            <Route path="/" element={<Home />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace/:id" element={<ListingDetail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/pending-reviews" element={<PendingReviews />} />

            {/* Farmer Exclusive Routes */}
            <Route path="/create-listing" element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <CreateListing />
              </ProtectedRoute>
            } />
            <Route path="/offers" element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <OffersReceived />
              </ProtectedRoute>
            } />

            {/* Buyer Exclusive Routes */}
            <Route path="/my-offers" element={
              <ProtectedRoute allowedRoles={['buyer']}>
                <MyOffers />
              </ProtectedRoute>
            } />

            {/* Brokerage Payment Route (both roles) */}
            <Route path="/pay-brokerage/:offerId" element={<PayBrokerage />} />
          </Route>

          {/* Backup redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </ReviewProvider>
    </AuthProvider>
  );
}
