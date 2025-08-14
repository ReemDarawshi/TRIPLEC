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
    setSuccessMessage('קישור לשחזור סיסמה נשלח למייל 🎉');
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
