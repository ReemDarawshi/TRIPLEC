import React, { useState } from 'react';
import './LoginRegister.css';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};
    setSuccessMessage('');

    if (newPassword.length < 6) {
      newErrors.newPassword = 'הסיסמה חייבת להכיל לפחות 6 תווים';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'הסיסמאות אינן תואמות';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // בעתיד: שליחה ל־backend עם token מה־URL
      setSuccessMessage('הסיסמה אופסה בהצלחה ✅');
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
