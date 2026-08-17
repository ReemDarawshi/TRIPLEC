/**
 * ForgotPassword.tsx
 * ---------------------------------------------------------
 * רכיב React עבור עמוד שחזור סיסמה במערכת.
 * זהו עמוד עצמאי בו המשתמש מזין כתובת אימייל כדי לקבל קישור לאיפוס סיסמה.
 *
 * פונקציונליות עיקרית:
 * 1. אימות פורמטי של כתובת האימייל בעזרת ביטוי רגולרי.
 * 2. הצגת הודעת שגיאה במקרה של אימייל לא תקין.
 * 3. הצגת הודעת הצלחה אם הפורמט תקין – בעתיד ישולב כאן קריאת API.
 * 4. ניווט חזרה לעמוד ההתחברות דרך קישור בתחתית הטופס.
 *
 * מצב (state):
 * - email: האימייל שהוזן.
 * - emailError: הודעת שגיאה על פורמט לא תקין.
 * - successMessage: הודעה על הצלחה בשליחת קישור לאיפוס.
 *
 * סגנונות:
 * - הקובץ משתמש ב־LoginRegister.css עבור עיצוב אחיד עם עמודי ההתחברות וההרשמה.
 *
 * שפות:
 * - העמוד כולו מיושר לימין (`dir="rtl"`) ותומך בעברית.
 *
 * הערות לפיתוח עתידי:
 * - יש לשלב קריאה ל־backend לשליחת קישור איפוס סיסמה בפועל.
 * - ייתכן ויידרש אימות קיום משתמש לפי האימייל.
 */

import React, { useState } from 'react';
import './LoginRegister.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setSuccessMessage('');

    if (!validateEmail(email)) {
      setEmailError('אנא הזן אימייל תקין');
      return;
    }

    // בעתיד: שליחת בקשת API ל-backend
    setSuccessMessage('קישור לשחזור סיסמה נשלח למייל ');
  };

  return (
    <div className="login-container" dir="rtl">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 className="form-title">שחזור סיסמה</h2>

        <label htmlFor="email">כתובת אימייל:</label>
        <input
          type="text"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {emailError && <p className="error-text">{emailError}</p>}
        {successMessage && <p className="success-text">{successMessage}</p>}

        <div className="actions">
          <button type="submit" className="btn-primary">שלח קישור איפוס</button>
          <a href="/login">חזרה להתחברות</a>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;
