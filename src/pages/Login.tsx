/**
 * Login.tsx
 * ──────────────────────────────────────────────────────────────
 * רכיב ההתחברות הראשי של המערכת.
 *
 * 🧩 פונקציונליות עיקרית:
 * - טופס התחברות עם אימות שדות אימייל וסיסמה.
 * - אימות מקומי:
 *    ✅ אימייל בפורמט תקין.
 *    ✅ סיסמה באורך מינימלי (6 תווים).
 * - חוויית משתמש משופרת:
 *    👁️ החלפת תמונת עין בהתאם לאורך הסיסמה וסטטוס ההצגה.
 *    👁️ כפתור להצגת/הסתרת הסיסמה בלחיצה.
 * - שליחת בקשת `POST` ל־`/auth/login` ב־backend לצורך התחברות.
 * - שמירת המידע המקומי ב־`localStorage`: טוקן, פרטי משתמש, מזהה עסק (`business_id`).
 * - מעבר ל־`/dashboard` לאחר התחברות מוצלחת.
 * - הצגת שגיאה אם ההתחברות נכשלת.
 *
 *  נתונים מאוחסנים ב־localStorage:
 * - token – לצורך אימות בבקשות הבאות.
 * - user – אובייקט JSON מלא עם פרטי המשתמש.
 * - business_id – משויך למשתמש לצורך שאילתות.
 *
 *  UI:
 * - שדה אימייל וסיסמה עם תגי שגיאה.
 * - תמונת עין מתחלפת בהתאם למצב הקלט.
 * - קישורים ל־"שכחתי סיסמה" ו־"אין לי חשבון".
 * *
 * ⚠️ שיפור עתידי:
 * - טיפול שגיאות מדויק יותר מהשרת (שגיאות מותאמות).
 * - מעבר למערכת ניהול טפסים (כגון Formik).
 * - אנימציה חלקה יותר לעין.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginRegister.css';


export const API_BASE_URL = "http://localhost:5000/api";

  const Login = () => {
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [eyeImage, setEyeImage] = useState('/images/OPENED.JPG');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const navigate = useNavigate();
    
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (showPassword) {
      setEyeImage('/images/MIDDLE.JPG');
    } else if (value.length > 0) {
      setEyeImage('/images/CLOSED.JPG');
    } else {
      setEyeImage('/images/OPENED.JPG');
    }
    setPasswordError('');
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError('');
  };

  const togglePasswordVisibility = () => {
    const newState = !showPassword;
    setShowPassword(newState);
    setEyeImage(
      password.length === 0
        ? '/images/OPENED.JPG'
        : newState
        ? '/images/MIDDLE.JPG'
        : '/images/CLOSED.JPG'
    );
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');

    let valid = true;
    if (!validateEmail(email)) {
      setEmailError('אנא הזן אימייל תקין');
      valid = false;
    }
    if (password.length < 6) {
      setPasswordError('הסיסמה חייבת להכיל לפחות 6 תווים');
      valid = false;
    }

    if (valid) {
      fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Invalid credentials');
          return res.json();
        })
        .then((data) => {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('business_id', data.user.business_id);
          console.log("Business ID from login:", data.user.business_id);

          navigate('/dashboard');
        })
        .catch((err) => {
          console.error('LOGIN ERROR:', err);
          alert('אימייל או סיסמה שגויים');
        });
    }
  };
  

  return (
    <div className="login-container" dir="rtl">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 className="form-title">התחברות</h2>

        <div className="eye-wrapper">
          <img src={eyeImage} alt="הבעת עין" className="eye-image" />
        </div>

        <label htmlFor="email">אימייל:</label>
        <input
          type="text"
          id="email"
          value={email}
          onChange={handleEmailChange}
          required
        />
        {emailError && <p className="error-text">{emailError}</p>}

        <label htmlFor="password">סיסמה:</label>
        <div className="password-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={password}
            onChange={handlePasswordChange}
            required
          />
          <button
            type="button"
            className="show-btn"
            onClick={togglePasswordVisibility}
            aria-label="הצג סיסמה"
          >
            👁
          </button>
        </div>
        {passwordError && <p className="error-text">{passwordError}</p>}

        <div className="actions">
          <button type="submit" className="btn-primary">התחבר</button>
          <a href="/forgot">שכחתי סיסמה</a>
          <a href="/register">אין לי חשבון</a>
        </div>
      </form>
    </div>
  );
};

export default Login;
