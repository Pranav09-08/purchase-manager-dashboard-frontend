

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import VendorRegister from './pages/VendorRegister';
import PurchaseManagerDashboard from './components/purchase_manager/PurchaseManagerDashboard';
import VendorDashboard from './components/vendor/VendorDashboard';
import ProtectedRoute from './ProtectedRoute';

function AppRoutes() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/vendor/register" element={<VendorRegister />} />

        {/* Redirect old routes to purchase-manager routes for backward compatibility */}
        <Route path="/admin/*" element={<Navigate to={location => location.pathname.replace('/admin/', '/purchase-manager/')} replace />} />

        {/* Purchase Manager Dashboard Routes (Protected) */}
        <Route path="/purchase-manager/dashboard" element={
          <ProtectedRoute requiredRole="purchase_manager">
            <PurchaseManagerDashboard />
          </ProtectedRoute>
        } />

        <Route path="/purchase-manager/dashboard/overview" element={
          <ProtectedRoute requiredRole="purchase_manager">
            <PurchaseManagerDashboard currentPage="overview" />
          </ProtectedRoute>
        } />

        <Route path="/purchase-manager/dashboard/products" element={
          <ProtectedRoute requiredRole="purchase_manager">
            <PurchaseManagerDashboard currentPage="products" />
          </ProtectedRoute>
        } />

        <Route path="/purchase-manager/dashboard/components" element={
          <ProtectedRoute requiredRole="purchase_manager">
            <PurchaseManagerDashboard currentPage="components" />
          </ProtectedRoute>
        } />

        <Route path="/purchase-manager/dashboard/registrations" element={
          <ProtectedRoute requiredRole="purchase_manager">
            <PurchaseManagerDashboard currentPage="registrations" />
          </ProtectedRoute>
        } />

        <Route path="/purchase-manager/dashboard/vendor-products" element={
          <ProtectedRoute requiredRole="purchase_manager">
            <PurchaseManagerDashboard currentPage="vendor-products" />
          </ProtectedRoute>
        } />

        <Route path="/purchase-manager/dashboard/purchase-enquiries" element={
          <ProtectedRoute requiredRole="purchase_manager">
            <PurchaseManagerDashboard currentPage="purchase-enquiries" />
          </ProtectedRoute>
        } />

        <Route path="/purchase-manager/dashboard/purchase-quotations" element={
          <ProtectedRoute requiredRole="purchase_manager">
            <PurchaseManagerDashboard currentPage="purchase-quotations" />
          </ProtectedRoute>
        } />

        <Route path="/purchase-manager/dashboard/purchase-lois" element={
          <ProtectedRoute requiredRole="purchase_manager">
            <PurchaseManagerDashboard currentPage="purchase-lois" />
          </ProtectedRoute>
        } />

        <Route path="/purchase-manager/dashboard/purchase-orders" element={
          <ProtectedRoute requiredRole="purchase_manager">
            <PurchaseManagerDashboard currentPage="purchase-orders" />
          </ProtectedRoute>
        } />
        <Route path="/purchase-manager/dashboard/purchase-payments" element={
          <ProtectedRoute requiredRole="purchase_manager">
            <PurchaseManagerDashboard currentPage="purchase-payments" />
          </ProtectedRoute>
        } />
        <Route path="/purchase-manager/dashboard/payment-receipts" element={
          <ProtectedRoute requiredRole="purchase_manager">
            <PurchaseManagerDashboard currentPage="payment-receipts" />
          </ProtectedRoute>
        } />
        <Route path="/purchase-manager/dashboard/vendor-invoices" element={
          <ProtectedRoute requiredRole="purchase_manager">
            <PurchaseManagerDashboard currentPage="vendor-invoices" />
          </ProtectedRoute>
        } />
        <Route path="/purchase-manager/dashboard/analytics" element={
          <ProtectedRoute requiredRole="purchase_manager">
            <PurchaseManagerDashboard currentPage="analytics" />
          </ProtectedRoute>
        } />
        <Route path="/purchase-manager/dashboard/purchase-requests" element={
          <ProtectedRoute requiredRole="purchase_manager">
            <PurchaseManagerDashboard currentPage="purchase-requests" />
          </ProtectedRoute>
        } />
        

        {/* Vendor Dashboard Routes (Protected) */}
        <Route path="/vendor/dashboard" element={
          <ProtectedRoute requiredRole="vendor">
            <VendorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/vendor/dashboard/overview" element={
          <ProtectedRoute requiredRole="vendor">
            <VendorDashboard currentPage="overview" />
          </ProtectedRoute>
        } />
        <Route path="/vendor/dashboard/analytics" element={
          <ProtectedRoute requiredRole="vendor">
            <VendorDashboard currentPage="analytics" />
          </ProtectedRoute>
        } />
        <Route path="/vendor/dashboard/components" element={
          <ProtectedRoute requiredRole="vendor">
            <VendorDashboard currentPage="components" />
          </ProtectedRoute>
        } />
        <Route path="/vendor/dashboard/enquiries" element={
          <ProtectedRoute requiredRole="vendor">
            <VendorDashboard currentPage="enquiries" />
          </ProtectedRoute>
        } />
        <Route path="/vendor/dashboard/quotations" element={
          <ProtectedRoute requiredRole="vendor">
            <VendorDashboard currentPage="quotations" />
          </ProtectedRoute>
        } />
        <Route path="/vendor/dashboard/lois" element={
          <ProtectedRoute requiredRole="vendor">
            <VendorDashboard currentPage="lois" />
          </ProtectedRoute>
        } />
        <Route path="/vendor/dashboard/orders" element={
          <ProtectedRoute requiredRole="vendor">
            <VendorDashboard currentPage="orders" />
          </ProtectedRoute>
        } />
        <Route path="/vendor/dashboard/payments" element={
          <ProtectedRoute requiredRole="vendor">
            <VendorDashboard currentPage="payments" />
          </ProtectedRoute>
        } />
        <Route path="/vendor/dashboard/invoices" element={
          <ProtectedRoute requiredRole="vendor">
            <VendorDashboard currentPage="invoices" />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
