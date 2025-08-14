import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AllPages.css';

const AllPages: React.FC = () => {
  const navigate = useNavigate();

  const pages = [
    { path: '/', label: '🏠 דשבורד' },
    { path: '/ai', label: '🧠 תיבת בינה' },
    { path: '/design', label: '🎨 בחירת עיצוב' },
    { path: '/delivery', label: '✉️ בחירת ערוץ שליחה' },
    { path: '/send', label: '🚀 שליחת קמפיין' },
    { path: '/campaigns', label: '📬 קמפיינים שנשלחו' },
    { path: '/campaigns/1/preview', label: '👁️ תצוגה של קמפיין' },
    { path: '/campaigns/1/analytics', label: '📊 ניתוח קמפיין' },
    { path: '/settings', label: '⚙️ הגדרות' },
    { path: '/users', label: '👥 ניהול משתמשים' },
    { path: '/scheduled', label: '⏱️ קמפיינים עתידיים' },
    { path: '/contacts', label: '📇 אנשי קשר' },
    { path: '/groups', label: '📂 קבוצות יעד' },
    { path: '/profile', label: '👤 הפרופיל שלי' },
    { path: '/login', label: '🔐 התחברות' },
    { path: '/register', label: '📝 הרשמה' },
    { path: '/forgot', label: '🔁 שחזור סיסמה' },
    { path: '/reset', label: '🔑 איפוס סיסמה' },
    { path: '/not-found', label: '❌ דף לא קיים (404)' },
  ];

  return (
    <div className="allpages-container">
      <h2>🔍 בדיקת כל דפי המערכת</h2>
      <div className="page-buttons">
        {pages.map((p) => (
          <button key={p.path} onClick={() => navigate(p.path)}>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AllPages;
