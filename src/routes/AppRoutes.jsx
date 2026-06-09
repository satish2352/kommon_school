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
import UpgradePlan from '../pages/UpgradePlan'
import AdminLayout from '../pages/admin/AdminLayout'
import Dashboard from '../pages/admin/Dashboard'
import Enrollments from '../pages/admin/Enrollments'
import InternalEnrollments from '../pages/admin/InternalEnrollments'
import Payments from '../pages/admin/Payments'
import FollowUps from '../pages/admin/FollowUps'
import Webhooks from '../pages/admin/Webhooks'
import SumagoUsers from '../pages/admin/SumagoUsers'
import Courses from '../pages/admin/Courses'
import DurationMaster from '../pages/admin/DurationMaster'
import Plans from '../pages/admin/Plans'
import PlanForm from '../pages/admin/PlanForm'
import PlanDetails from '../pages/admin/PlanDetails'
import PlanEnrollments from '../pages/admin/PlanEnrollments'
import InternalPlans from '../pages/admin/InternalPlans'
import InternalPlanForm from '../pages/admin/InternalPlanForm'
import AdminEnrollmentForm from '../pages/admin/AdminEnrollmentForm'
import AdminBulkEnrollment from '../pages/admin/AdminBulkEnrollment'
import CourseNames from '../pages/admin/CourseNames'
import EmailLogs from '../pages/admin/EmailLogs'
import RazorpayConfigs from '../pages/admin/RazorpayConfigs'
import StudentHistory from '../pages/admin/StudentHistory'
import PanelLayout from '../pages/panel/PanelLayout'
import PanelDashboard from '../pages/panel/PanelDashboard'
import PanelTransactions from '../pages/panel/PanelTransactions'
import PanelPurchase from '../pages/panel/PanelPurchase'
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

            {/* Shareable upgrade link — drops an existing student straight into
                plan selection (Step 3) → payment, by email. Public, standalone. */}
            <Route path="/upgrade/:email" element={<UpgradePlan />} />

            {/* Personal panel for provisioned end-users (role: student). */}
            <Route
              path="/panel"
              element={
                <RequireAuth>
                  <PanelLayout />
                </RequireAuth>
              }
            >
              <Route index element={<PanelDashboard />} />
              <Route path="purchase" element={<PanelPurchase />} />
              <Route path="transactions" element={<PanelTransactions />} />
            </Route>

            <Route
              path="/admin"
              element={
                <RequireAuth adminOnly>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="enrollments" element={<Enrollments />} />
              <Route path="students/:email" element={<StudentHistory />} />
              <Route path="internal-enrollments" element={<InternalEnrollments />} />
              <Route path="enrollments/new" element={<AdminEnrollmentForm />} />
              <Route path="enrollments/bulk" element={<AdminBulkEnrollment />} />
              <Route path="payments" element={<Payments />} />
              <Route path="follow-ups" element={<FollowUps />} />
              <Route path="webhooks" element={<Webhooks />} />
              <Route path="sumago-users" element={<SumagoUsers />} />
              <Route path="courses" element={<Courses />} />
              <Route path="duration-master" element={<DurationMaster />} />
              <Route path="plans" element={<Plans />} />
              <Route path="plans/new" element={<PlanForm />} />
              <Route path="plans/:id" element={<PlanForm />} />
              <Route path="plans/:id/view" element={<PlanDetails />} />
              <Route path="plans/:id/enrollments" element={<PlanEnrollments />} />
              <Route path="internal-plans" element={<InternalPlans />} />
              <Route path="internal-plans/new" element={<InternalPlanForm />} />
              <Route path="internal-plans/:id" element={<InternalPlanForm />} />
              <Route path="course-names" element={<CourseNames />} />
              <Route path="email-logs" element={<EmailLogs />} />
              <Route path="razorpay-configs" element={<RazorpayConfigs />} />
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
