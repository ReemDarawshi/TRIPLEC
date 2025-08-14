import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import Navbar from './components/Navbar.tsx';
import Sidebar from './components/Sidebar.tsx';

import Dashboard from './components/Dashboard.tsx';
import UploadExcel from './components/UploadExcel.tsx';

// קמפיין - שלבים
import SendCampaign from './pages/SendCampaign.tsx';
import AIPrompt from './pages/AIPrompt.tsx';
import DesignSelector from './pages/DesignSelector.tsx';
import DeliveryOptions from './pages/DeliveryOptions.tsx';

// קמפיינים כלליים
import CampaignList from './pages/CampaignList.tsx';
import CampaignPreview from './pages/CampaignPreview.tsx';
import CampaignAnalytics from './pages/CampaignAnalytics.tsx';
import CampaignDetails from './pages/CampaignDetails.tsx'; // ✅ ייבוא חדש

// ניהול
import Settings from './pages/Settings.tsx';
import Users from './pages/Users.tsx';
import ScheduledCampaigns from './pages/ScheduledCampaigns.tsx';
import Contacts from './pages/Contacts.tsx';
import GroupManagement from './pages/GroupManagement.tsx';
import MyProfile from './pages/MyProfile.tsx';

// אימות משתמש
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import ForgotPassword from './pages/ForgotPassword.tsx';
import ResetPassword from './pages/ResetPassword.tsx';

import NotFound from './pages/NotFound.tsx';

const App: React.FC = () => {
  const location = useLocation();
  const hideSidebarRoutes = ['/login', '/register', '/forgot', '/reset'];
  const isAuthPage = hideSidebarRoutes.includes(location.pathname);

  return (
    <div className="d-flex flex-column min-vh-100">
      {!isAuthPage && <Navbar />}
      {!isAuthPage && <Sidebar />}

      <main className="flex-fill container py-4">
        <Routes>
          {/* התחברות – ברירת מחדל */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/reset" element={<ResetPassword />} />

          {/* דפים מרכזיים */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<UploadExcel />} />

          {/* יצירת קמפיין בשלבים */}
          <Route path="/campaign" element={<SendCampaign />} />
          <Route path="/ai" element={<AIPrompt />} />
          <Route path="/design" element={<DesignSelector />} />
          <Route path="/delivery" element={<DeliveryOptions />} />

          {/* קמפיינים */}
          <Route path="/campaigns" element={<CampaignList />} />
          <Route path="/campaigns/:id/preview" element={<CampaignPreview />} />
          <Route path="/campaigns/:id/analytics" element={<CampaignAnalytics />} />
          <Route path="/campaign/:id" element={<CampaignDetails />} /> {/* ✅ נתיב לעריכה */}

          {/* ניהול */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/users" element={<Users />} />
          <Route path="/scheduled" element={<ScheduledCampaigns />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/groups" element={<GroupManagement />} />
          <Route path="/profile" element={<MyProfile />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
