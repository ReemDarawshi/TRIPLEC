/**
 * קומפוננטת Sidebar
 * -----------------
 * קומפוננטה זו מציגה את סרגל הניווט הראשי של מערכת TRIPLE.
 * היא כוללת:
 * - כפתור המבורגר לפתיחה/סגירה של התפריט עבור מובייל/מסך קטן.
 * - לוגו המערכת (תמונה מתוך הנתיב `/images/TRIPLE.png`).
 * - קישורים לכל דפי המערכת (דשבורד, טעינת אנשי קשר, קמפיינים, קבוצות, פרופיל, הגדרות, ועוד).
 * - כפתור התנתקות שמנקה את הנתונים מה־localStorage ומפנה לדף ההתחברות.
 * 
 * תכונות עיקריות:
 * ----------------
 * - שימוש ב־useState עבור שליטה על פתיחת/סגירת הסיידבר.
 * - שימוש ב־NavLink מ־React Router לצורך ניווט והדגשת עמוד פעיל.
 * - ניתוב מחדש לדף login בעת לחיצה על "התנתק".
 * 
 * משתנים:
 * --------
 * - isOpen (boolean): האם התפריט פתוח (true) או סגור (false).
 * 
 * מחבר: רים דארווש
 * פרויקט: TRIPLE – מערכת אוטומציה שיווקית מבוססת בינה מלאכותית לעסקים קטנים
 */

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <>
      <div className={`sidebar-toggle ${isOpen ? 'open' : ''}`} onClick={toggleSidebar}>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </div>

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/images/TRIPLE.png" alt="Triple Logo" />
        </div>

        <nav className="sidebar-links">
          <NavLink to="/dashboard" end>דשבורד</NavLink>
          <NavLink to="/upload" end>טעינת אנשי קשר</NavLink>
          <NavLink to="/campaign" end>יצירת קמפיין</NavLink>
          <NavLink to="/campaigns" end>קמפיינים שנשלחו</NavLink>
          <NavLink to="/scheduled" end>קמפיינים מתוזמנים</NavLink>
          <NavLink to="/contacts" end>אנשי קשר</NavLink>
          <NavLink to="/groups" end>קבוצות יעד</NavLink>
          <NavLink to="/settings" end>הגדרות</NavLink>
          <NavLink to="/profile" end>הפרופיל שלי</NavLink>
          <NavLink to="/users" end>ניהול משתמשים</NavLink> 
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          התנתק
        </button>
      </div>
    </>
  );
};

export default Sidebar;
