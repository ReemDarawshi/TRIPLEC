/**
 * MyProfile.tsx
 * ──────────────────────────────────────────────────────────────
 * רכיב דף פרופיל משתמש במערכת.
 *
 *  פונקציונליות עיקרית:
 * - שליפת פרטי המשתמש מהשרת (`/api/profile`) והצגתם בטופס.
 * - עריכת פרטים אישיים:
 *   - שם פרטי, שם משפחה, טלפון (שדה אימייל מוצג אך אינו ניתן לעריכה).
 *   - שמירה מתבצעת בבקשת PUT ל־`/api/profile`.
 * - שינוי סיסמה:
 *   - נפתח פופאפ להזנת סיסמה נוכחית וחדשה.
 *   - שליחה ל־`/api/profile/change_password`.
 *
 *  שימושים:
 * - מאפשר למשתמש לעדכן את פרטי הקשר שלו ולשמור שינויים.
 * - מאפשר שינוי סיסמה מתוך הדשבורד.
 *
 *  ניהול מצבים (useState):
 * - `user`: האובייקט הראשי של פרטי המשתמש.
 * - `showPasswordModal`: האם להציג את מודל שינוי הסיסמה.
 * - `currentPassword` / `newPassword`: שדות שינוי הסיסמה.
 *
 *  useEffect:
 * - עם עליית הקומפוננטה, נשלחת בקשת GET לשליפת פרטי המשתמש.
 *
 *  עיצוב:
 * - מבוסס על קובץ CSS נלווה: `MyProfile.css`.
 * - כולל תגית `badge` למצבים בהם `user.role === 'Admin'`.
 *
 *  שיפור עתידי:
 * - הוספת ולידציה לנתונים לפני שליחה.
 * - אישור סיסמה חדשה חוזרת.
 * - אפשרות לשינוי אימייל (אם יתמוך צד שרת).
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MyProfile.css';

const MyProfile = () => {
  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios
      .get('http://localhost:5000/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setUser(response.data);
      })
      .catch((error) => {
        console.error('שגיאה בקבלת הפרופיל', error);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    const token = localStorage.getItem('token');
    axios
      .put(
        'http://localhost:5000/api/profile',
        {
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then(() => {
        alert('הפרטים עודכנו בהצלחה');
      })
      .catch((error) => {
        alert('שגיאה בעדכון הפרופיל');
        console.error(error);
      });
  };

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword) {
      alert('נא למלא את כל השדות');
      return;
    }
    const token = localStorage.getItem('token');
    axios.put(
    'http://localhost:5000/api/profile/change_password',
    {
      current_password: currentPassword,  
      new_password: newPassword,          
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
)

      .then(() => {
        alert('הסיסמה עודכנה בהצלחה');
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
      })
      .catch((error) => {
        alert('שגיאה בעדכון הסיסמה');
        console.error(error);
      });
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
            value={user.phone || ''}
            onChange={handleChange}
          />
        </label>

        <h3>הרשאות</h3>
        <p>
          תפקיד במערכת: <strong>{user.role}</strong>
        </p>
        {user.role === 'Admin' && <p className="badge">בעל העסק</p>}

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