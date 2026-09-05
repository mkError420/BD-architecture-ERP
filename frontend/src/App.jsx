import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/Projects/ProjectDetails';
import Clients from './pages/Clients';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Materials from './pages/Materials';
import Suppliers from './pages/Suppliers';
import WorkOrders from './pages/WorkOrders';
import Expenses from './pages/Finance/Expenses';
import Invoices from './pages/Finance/Invoices';
import Salary from './pages/Finance/Salary';
import Documents from './pages/Documents';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';

// Project sub-pages
import ProjectInfo from './pages/Projects/ProjectInfo';
import ClientPayments from './pages/Projects/ClientPayments';
import SecurityDeposits from './pages/Projects/SecurityDeposits';
import BOQ from './pages/Projects/BOQ';
import ProjectScheduling from './pages/Projects/ProjectScheduling';
import Purchases from './pages/Projects/Purchases';
import StockManagement from './pages/Projects/StockManagement';
import LabourWages from './pages/Projects/LabourWages';
import SalarySlips from './pages/Projects/SalarySlips';
import ToolsManagement from './pages/Projects/ToolsManagement';
import VehicleWorkSlips from './pages/Projects/VehicleWorkSlips';

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetails />} />
            
            {/* Project sub-routes */}
            <Route path="projects/:projectId/info" element={<ProjectInfo />} />
            <Route path="projects/:projectId/payments/history" element={<ClientPayments />} />
            <Route path="projects/:projectId/payments/plans" element={<ClientPayments />} />
            <Route path="projects/:projectId/payments/invoices" element={<ClientPayments />} />
            <Route path="projects/:projectId/security-deposits" element={<SecurityDeposits />} />
            <Route path="projects/:projectId/boq/items" element={<BOQ />} />
            <Route path="projects/:projectId/boq/estimates" element={<BOQ />} />
            <Route path="projects/:projectId/boq/rates" element={<BOQ />} />
            <Route path="projects/:projectId/scheduling" element={<ProjectScheduling />} />
            <Route path="projects/:projectId/purchases/orders" element={<Purchases />} />
            <Route path="projects/:projectId/purchases/requests" element={<Purchases />} />
            <Route path="projects/:projectId/purchases/quotations" element={<Purchases />} />
            <Route path="projects/:projectId/stock/inventory" element={<StockManagement />} />
            <Route path="projects/:projectId/stock/transfers" element={<StockManagement />} />
            <Route path="projects/:projectId/stock/adjustments" element={<StockManagement />} />
            <Route path="projects/:projectId/labour-wages" element={<LabourWages />} />
            <Route path="projects/:projectId/salary" element={<SalarySlips />} />
            <Route path="projects/:projectId/salary-slips" element={<SalarySlips />} />
            <Route path="projects/:projectId/tools/inventory" element={<ToolsManagement />} />
            <Route path="projects/:projectId/tools/assignments" element={<ToolsManagement />} />
            <Route path="projects/:projectId/tools/maintenance" element={<ToolsManagement />} />
            <Route path="projects/:projectId/vehicles" element={<VehicleWorkSlips />} />
            
            <Route path="clients" element={<Clients />} />
            <Route path="employees" element={<Employees />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="materials" element={<Materials />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="work-orders" element={<WorkOrders />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="salary" element={<Salary />} />
            <Route path="documents" element={<Documents />} />
            <Route path="reports" element={<Reports />} />
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
