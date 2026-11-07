import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { VerifyOtpPage } from './pages/public/VerifyOtpPage';
import { CustomerPassportPage } from './pages/public/CustomerPassportPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Mechanic Pages
import { MechanicDashboard } from './pages/mechanic/MechanicDashboard';
import { MechanicProfile } from './pages/mechanic/MechanicProfile';
import { FitmentListPage } from './pages/mechanic/FitmentListPage';
import { CreateFitmentPage } from './pages/mechanic/CreateFitmentPage';
import { FitmentDetailPage } from './pages/mechanic/FitmentDetailPage';
import { AcademyCatalogPage } from './pages/mechanic/AcademyCatalogPage';
import { CourseDetailPage } from './pages/mechanic/CourseDetailPage';
import { CourseQuizPage } from './pages/mechanic/CourseQuizPage';
import { ToolBankCatalogPage } from './pages/mechanic/ToolBankCatalogPage';
import { MyReservationsPage } from './pages/mechanic/MyReservationsPage';
import { CreditsHistoryPage } from './pages/mechanic/CreditsHistoryPage';

// Dealer Pages
import { DealerDashboard } from './pages/dealer/DealerDashboard';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { MechanicsListPage } from './pages/admin/MechanicsListPage';
import { AdminFitmentsPage } from './pages/admin/AdminFitmentsPage';
import { AdminCoursesPage } from './pages/admin/AdminCoursesPage';
import { AdminToolBankPage } from './pages/admin/AdminToolBankPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Unauthenticated Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/passport/:passportId" element={<CustomerPassportPage />} />

            {/* Authenticated Mechanic Routes */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['mechanic']}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<MechanicDashboard />} />
              <Route path="/profile" element={<MechanicProfile />} />
              <Route path="/fitments" element={<FitmentListPage />} />
              <Route path="/fitments/create" element={<CreateFitmentPage />} />
              <Route path="/fitments/:passportId" element={<FitmentDetailPage />} />
              <Route path="/academy" element={<AcademyCatalogPage />} />
              <Route path="/academy/:id" element={<CourseDetailPage />} />
              <Route path="/academy/:id/quiz" element={<CourseQuizPage />} />
              <Route path="/toolbank" element={<ToolBankCatalogPage />} />
              <Route path="/toolbank/my-reservations" element={<MyReservationsPage />} />
              <Route path="/credits" element={<CreditsHistoryPage />} />
            </Route>

            {/* Authenticated Dealer Routes */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['dealer', 'regional_manager', 'super_admin']}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dealer" element={<DealerDashboard />} />
              <Route path="/dealer/reservations" element={<DealerDashboard />} />
            </Route>

            {/* Authenticated Admin & Regional Manager Routes */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['regional_manager', 'super_admin']}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/mechanics" element={<MechanicsListPage />} />
              <Route path="/admin/fitments" element={<AdminFitmentsPage />} />
              <Route path="/admin/courses" element={<AdminCoursesPage />} />
              <Route path="/admin/toolbank" element={<AdminToolBankPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
