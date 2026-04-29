import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from '@/layout/AuthLayout'
import AppLayout from '@/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ProviderGatePage from '@/pages/ProviderGatePage'
import BecomeProviderPage from '@/pages/BecomeProviderPage'
import UploadEvidencePage from '@/pages/UploadEvidencePage'
import MySubmissionsPage from '@/pages/MySubmissionsPage'
import AccountSuspendedPage from '@/pages/AccountSuspendedPage'
import DashboardPage from '@/pages/DashboardPage'
import TransactionPage from '@/pages/TransactionPage'
import DemandPage from '@/pages/DemandPage'
import ProfilePage from '@/pages/ProfilePage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/provider-check"  element={<ProviderGatePage />} />
          <Route path="/become-provider" element={<BecomeProviderPage />} />
          <Route path="/upload-evidence" element={<UploadEvidencePage />} />
          <Route path="/my-submissions"  element={<MySubmissionsPage />} />
          <Route path="/account-suspended" element={<AccountSuspendedPage />} />
        </Route>

        {/* Protected app routes (APPROVED providers) */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/giao-dich" element={<TransactionPage />} />
          <Route path="/nhu-cau"   element={<DemandPage />} />
          <Route path="/profile"   element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
