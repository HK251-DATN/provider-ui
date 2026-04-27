import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from '@/layout/AuthLayout'
import AppLayout from '@/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import TransactionPage from '@/pages/TransactionPage'
import DemandPage from '@/pages/DemandPage'
import ProfilePage from '@/pages/ProfilePage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/giao-dich" element={<TransactionPage />} />
          <Route path="/nhu-cau"   element={<DemandPage />} />
          <Route path="/profile"   element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
