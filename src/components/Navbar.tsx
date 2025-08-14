import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { FaBars } from 'react-icons/fa';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('user');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const hideNavbarRoutes = ['/login', '/register', '/forgot', '/reset'];
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (shouldHideNavbar) return null;

  return (
    <>
      <nav className="navbar">
        <div
          className="navbar-logo"
          onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
        >
          <span>TRIPLE</span>
        </div>
        <FaBars className="hamburger" onClick={toggleSidebar} />
      </nav>

      <div className={`sidebar-menu ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-links">
          <NavLink to="/dashboard" end>דשבורד</NavLink>
          <NavLink to="/upload" end>עדכון אנשי קשר</NavLink>
          <NavLink to="/campaign" end>יצירת קמפיין</NavLink>
          <NavLink to="/campaignlist" end>קמפיינים שנשלחו</NavLink>
          <NavLink to="/scheduled" end>קמפיינים מתוזמנים</NavLink>
          <NavLink to="/contacts" end>אנשי קשר</NavLink>
          <NavLink to="/groups" end>קבוצות יעד</NavLink>
          <NavLink to="/settings" end>הגדרות</NavLink>
          <NavLink to="/profile" end>הפרופיל שלי</NavLink>
        </div>

        {isAuthenticated && (
          <button onClick={handleLogout} className="logout-button">
            התנתק
          </button>
        )}
      </div>
    </>
  );
};

export default Navbar;
