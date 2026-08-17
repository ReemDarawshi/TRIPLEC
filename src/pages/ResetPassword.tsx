/**
 * ResetPassword.tsx
 * קומפוננטת איפוס סיסמה במערכת TRIPLE
 * 
 * דף זה מופעל כאשר משתמש מקבל לינק עם טוקן דרך המייל (לאחר בקשת "שכחתי סיסמה").
 * המשתמש מתבקש להזין סיסמה חדשה ואישור סיסמה.
 * 
 * תהליך:
 * 1. ולידציה בסיסית: הסיסמה באורך תקין, תואמת בשני השדות.
 * 2. שליחת הטוקן והסיסמה החדשה לשרת דרך POST ל־/api/auth/reset_password.
 * 3. הצגת הודעת הצלחה או שגיאה בהתאם לתשובת השרת.
 * 
 * הקובץ משתמש ב־React hooks: useState, useSearchParams.
 * קובץ העיצוב: LoginRegister.css.
 */

import React, { useState } from 'react';
import './LoginRegister.css';
import { useSearchParams } from 'react-router-dom';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};
    setSuccessMessage('');
    setErrors({});

    // שלב 1: ולידציה
    if (newPassword.length < 6) {
      newErrors.newPassword = 'הסיסמה חייבת להכיל לפחות 6 תווים';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'הסיסמאות אינן תואמות';
    }

    setErrors(newErrors);

    // שלב 2: אם אין שגיאות – שולחים לשרת
    if (Object.keys(newErrors).length === 0) {
      fetch('http://localhost:5000/api/auth/reset_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          new_password: newPassword
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error('שגיאה באיפוס הסיסמה');
          return res.json();
        })
        .then(() => {
          setSuccessMessage('הסיסמה אופסה בהצלחה ✅');
        })
        .catch(() => {
          setErrors({ general: 'שגיאה באיפוס הסיסמה, נסי שוב' });
        });
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 className="form-title">איפוס סיסמה</h2>

        <label htmlFor="newPassword">סיסמה חדשה:</label>
        <input
          type="password"
          id="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        {errors.newPassword && <p className="error-text">{errors.newPassword}</p>}

        <label htmlFor="confirmPassword">אישור סיסמה:</label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}

        {errors.general && <p className="error-text">{errors.general}</p>}
        {successMessage && <p className="success-text">{successMessage}</p>}

        <div className="actions">
          <button type="submit" className="btn-primary">אפס סיסמה</button>
          <a href="/login">חזרה להתחברות</a>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
