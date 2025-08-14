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
        <h2 className="sidebar-title">Smart Marketing</h2>
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
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          התנתק
        </button>
      </div>
    </>
  );
};

export default Sidebar;
