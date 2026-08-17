/**
 * קומפוננטת השורש של האפליקציה:
 * מגדירה את כל נתיבי הניווט (Routes) במערכת,
 * מציגה את ה־Sidebar רק בדפים שאינם דפי התחברות,
 * ומחברת בין דפים שונים (Login, Dashboard, Campaign וכו').
 */

import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import Sidebar from './components/Sidebar.tsx';
import Campaign from './components/Campaign.tsx';
import Dashboard from './components/Dashboard.tsx';
import UploadExcel from './components/UploadExcel.tsx';

// קמפיין - שלבים
import AIPrompt from './pages/AIPrompt.tsx';
import DesignSelector from './pages/DesignSelector.tsx';
import DeliveryOptions from './pages/DeliveryOptions.tsx';

// קמפיינים כלליים
import CampaignList from './pages/CampaignList.tsx';
import CampaignPreview from './pages/CampaignPreview.tsx';
import CampaignAnalytics from './pages/CampaignAnalytics.tsx';

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

  // דפים שבהם לא נציג את ה־Sidebar (כמו התחברות, הרשמה וכו’)
  const hideSidebarRoutes = ['/login', '/register', '/forgot', '/reset-password', '/'];
  const isAuthPage = hideSidebarRoutes.includes(location.pathname);

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* מציגים את הסיידבר רק אם זה לא דף התחברות או דף דומה */}
      {!isAuthPage && <Sidebar />}

      <main className="flex-fill container py-4">
        <Routes>
          {/* דפי אימות */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* דפים ראשיים */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<UploadExcel />} />

          {/* שלבי קמפיין */}
          <Route path="/campaign" element={<Campaign />} />
          <Route path="/campaign/ai/:id" element={<AIPrompt />} />
          <Route path="/ai" element={<AIPrompt />} />
          <Route path="/design/:id" element={<DesignSelector />} />
          <Route path="/delivery/:id" element={<DeliveryOptions />} />
          <Route path="/delivery" element={<DeliveryOptions />} />
          <Route path="/preview/:id" element={<CampaignPreview />} />

          {/* קמפיינים קיימים */}
          <Route path="/campaigns" element={<CampaignList />} />
          <Route path="/campaigns/:id/preview" element={<CampaignPreview />} />
          <Route path="/campaigns/:id/analytics" element={<CampaignAnalytics />} />
          <Route path="/analytics" element={<CampaignAnalytics />} />

          {/* ניהול ומידע אישי */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/users" element={<Users />} />
          <Route path="/scheduled" element={<ScheduledCampaigns />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/groups" element={<GroupManagement />} />
          <Route path="/profile" element={<MyProfile />} />

          {/* דף שגיאה */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
