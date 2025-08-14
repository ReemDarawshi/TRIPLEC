import React, { useState } from 'react';
import './MyProfile.css';

const MyProfile = () => {
  const [user, setUser] = useState({
    firstName: 'רים',
    lastName: 'דראושה',
    email: 'reem@example.com',
    phone: '050-1234567',
    role: 'Marketing',
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    alert('הפרטים עודכנו בהצלחה (מדומה)');
  };

  const handlePasswordChange = () => {
    if (currentPassword && newPassword) {
      alert('סיסמה שונתה (מדומה)');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
    } else {
      alert('נא למלא את כל השדות');
    }
  };

  return (
    <div className="profile-page">
      <h2>הפרופיל שלי</h2>

      <div className="form-section">
        <h3>פרטי קשר</h3>
        <label>
          שם פרטי:
          <input
            type="text"
            name="firstName"
            value={user.firstName}
            onChange={handleChange}
          />
        </label>

        <label>
          שם משפחה:
          <input
            type="text"
            name="lastName"
            value={user.lastName}
            onChange={handleChange}
          />
        </label>

        <label className="disabled-label">
          אימייל (לא ניתן לשינוי):
          <input type="email" value={user.email} disabled />
        </label>

        <label>
          טלפון:
          <input
            type="text"
            name="phone"
            value={user.phone}
            onChange={handleChange}
          />
        </label>

        <h3>הרשאות</h3>
        <p>
          תפקיד במערכת: <strong>{user.role}</strong>
        </p>
        {user.role === 'Admin' && (
          <p className="badge">בעל העסק</p>
        )}

        <h3>אבטחה</h3>
        <button
          type="button"
          className="btn-password"
          onClick={() => setShowPasswordModal(true)}
        >
          שינוי סיסמה
        </button>

        <button className="btn-save" onClick={handleSave}>
          שמור שינויים
        </button>
      </div>

      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>שינוי סיסמה</h4>
            <input
              type="password"
              placeholder="סיסמה נוכחית"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="סיסמה חדשה"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={handlePasswordChange}>אשר</button>
              <button
                className="cancel"
                onClick={() => setShowPasswordModal(false)}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfile;
