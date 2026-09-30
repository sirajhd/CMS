import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { Login } from '../pages/auth/Login';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { ResetPassword } from '../pages/auth/ResetPassword';
import { RegisterCompanyPage } from '../pages/auth/RegisterCompanyPage';
import { SuperAdminDashboard } from '../pages/superadmin/SuperAdminDashboard';
import { SuperAdminCompanies } from '../pages/superadmin/SuperAdminCompanies';
import { SuperAdminAuditLogs } from '../pages/superadmin/SuperAdminAuditLogs';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { HouseHolderDashboard } from '../pages/houseHolder/HouseHolderDashboard';
import { EngineerDashboard } from '../pages/engineer/EngineerDashboard';
import { ManagerDashboard } from '../pages/manager/ManagerDashboard';
import { ProjectsPage } from '../pages/projects/ProjectsPage';
import { ProjectDetails } from '../pages/projects/ProjectDetails';
import { RequestsPage } from '../pages/requests/RequestsPage';
import { UsersPage } from '../pages/users/UsersPage';
import { PaymentsPage } from '../pages/payments/PaymentsPage';
import { MaterialsPage } from '../pages/materials/MaterialsPage';
import { DocumentsPage } from '../pages/Documents/DocumentsPage';
import { ActivitiesPage } from '../pages/Activities/ActivitiesPage';
import { ProtectedRoute, getHomeRouteForRole } from './ProtectedRoute';

export function HomeRedirect() {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={getHomeRouteForRole(user.role)} replace />;
}

export function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route 
        path="/login" 
        element={user ? <HomeRedirect /> : <Login />} 
      />
      <Route 
        path="/register-company" 
        element={user ? <HomeRedirect /> : <RegisterCompanyPage />} 
      />
      <Route 
        path="/forgot-password" 
        element={user ? <HomeRedirect /> : <ForgotPassword />} 
      />
      <Route 
        path="/reset-password" 
        element={user ? <HomeRedirect /> : <ResetPassword />} 
      />
      <Route 
        path="/reset-password/:token" 
        element={user ? <HomeRedirect /> : <ResetPassword />} 
      />

      {/* Authenticated Application Shell with Persistent AppLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Dynamic Root Redirection */}
        <Route index element={<HomeRedirect />} />

        {/* Super Admin Platform Routes */}
        <Route 
          path="superadmin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['SuperAdmin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="superadmin/companies" 
          element={
            <ProtectedRoute allowedRoles={['SuperAdmin']}>
              <SuperAdminCompanies />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="superadmin/audit-logs" 
          element={
            <ProtectedRoute allowedRoles={['SuperAdmin']}>
              <SuperAdminAuditLogs />
            </ProtectedRoute>
          } 
        />

        {/* Role-Specific Dashboards */}
        <Route 
          path="admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="householder/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['House Holder']}>
              <HouseHolderDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="engineer/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['Engineer']}>
              <EngineerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="manager/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['Manager']}>
              <ManagerDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Operational Modules with RBAC Route Matrix */}
        <Route 
          path="projects" 
          element={
            <ProtectedRoute allowedRoles={['Admin', 'House Holder', 'Engineer', 'Manager']}>
              <ProjectsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="projects/:id" 
          element={
            <ProtectedRoute allowedRoles={['Admin', 'House Holder', 'Engineer', 'Manager']}>
              <ProjectDetails />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="requests" 
          element={
            <ProtectedRoute allowedRoles={['Admin', 'House Holder', 'Engineer', 'Manager']}>
              <RequestsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="users" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <UsersPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="payments" 
          element={
            <ProtectedRoute allowedRoles={['Admin', 'House Holder', 'Engineer', 'Manager']}>
              <PaymentsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="materials" 
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Engineer', 'Manager']}>
              <MaterialsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="documents" 
          element={
            <ProtectedRoute allowedRoles={['Admin', 'House Holder', 'Engineer', 'Manager']}>
              <DocumentsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="activities" 
          element={
            <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin', 'House Holder', 'Engineer', 'Manager']}>
              <ActivitiesPage />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

export default AppRoutes;

