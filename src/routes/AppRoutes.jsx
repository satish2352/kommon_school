import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import ScrollToTop from '../components/common/ScrollToTop'
import Home from '../pages/Home'
import Solutions from '../pages/Solutions'
import Pricing from '../pages/Pricing'
import Contact from '../pages/Contact'
import Institution from '../pages/Institution'
import Login from '../pages/Login'
import AdminLayout from '../pages/admin/AdminLayout'
import Dashboard from '../pages/admin/Dashboard'
import Enrollments from '../pages/admin/Enrollments'
import Payments from '../pages/admin/Payments'
import FollowUps from '../pages/admin/FollowUps'
import RequireAuth from '../components/auth/RequireAuth'
import { EnrollModalProvider } from '../context/EnrollModalContext'
import EnrollModal from '../components/common/EnrollModal'
import { InstitutionModalProvider } from '../context/InstitutionModalContext'
import InstitutionModal from '../components/common/InstitutionModal'

function MainLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/solutions" element={<Solutions />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <EnrollModalProvider>
        <InstitutionModalProvider>
          <ScrollToTop />
          <Routes>
            <Route path="/institutions" element={<Institution />} />
            <Route path="/institution" element={<Navigate to="/institutions" replace />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="enrollments" element={<Enrollments />} />
              <Route path="payments" element={<Payments />} />
              <Route path="follow-ups" element={<FollowUps />} />
            </Route>
            <Route path="/*" element={<MainLayout />} />
          </Routes>
          <EnrollModal />
          <InstitutionModal />
        </InstitutionModalProvider>
      </EnrollModalProvider>
    </BrowserRouter>
  )
}
