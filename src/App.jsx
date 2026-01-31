import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

/* Components */
import Layout from './components/Layout/Layout';

/* Pages */
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Users from './pages/Users';        // Antes mapeado para 'utentes'
import Hardware from './pages/Hardware';  // NOVO
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import Invoices from './pages/Invoices';
import Attendance from './pages/Attendance';
import WhatsAppConnect from './pages/WhatsAppConnect';

/* Outros (Legacy/Less Used) */
import Trainings from './pages/Trainings';
import Plans from './pages/Plans';
import Classes from './pages/Classes';
import Reports from './pages/Reports';
import Instructors from './pages/Instructors';
import MonthlyPayments from './pages/MonthlyPayments';
import Finance from './pages/Finance';

/* Admin */
import AdminGyms from './pages/AdminGyms';
import AdminUsers from './pages/AdminUsers';
import AdminFinance from './pages/AdminFinance';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root Route shows Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* Public Routes */}
        <Route path="/landing" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Rotas da Aplicação (Com Sidebar/Layout) */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Core Modules */}
          <Route path="/pos" element={<POS />} />
          <Route path="/users" element={<Users />} />
          <Route path="/hardware" element={<Hardware />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/invoices" element={<Invoices />} />

          {/* Secondary Modules */}
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/whatsapp" element={<WhatsAppConnect />} />
          <Route path="/payments" element={<MonthlyPayments />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/trainings" element={<Trainings />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/instructors" element={<Instructors />} />

          {/* Admin Modules */}
          <Route path="/admin/gyms" element={<AdminGyms />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/finance" element={<AdminFinance />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
