import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginRegister.css';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [eyeImage, setEyeImage] = useState('/images/OPENED.JPG');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showMessage, setShowMessage] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    updateEye(value, showPassword);
    setErrors((prev) => ({ ...prev, password: '' }));
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setErrors((prev) => ({ ...prev, confirmPassword: '' }));
  };

  const updateEye = (pwd: string, isShown: boolean) => {
    if (isShown) {
      setEyeImage('/images/MIDDLE.JPG');
    } else if (pwd.length > 0) {
      setEyeImage('/images/CLOSED.JPG');
    } else {
      setEyeImage('/images/OPENED.JPG');
    }
  };

  const togglePasswordVisibility = () => {
    const newState = !showPassword;
    setShowPassword(newState);
    updateEye(password, newState);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'נא להזין שם מלא';
    }

    if (!validateEmail(email)) {
      newErrors.email = 'אנא הזן אימייל תקין';
    }

    if (password.length < 6) {
      newErrors.password = 'הסיסמה חייבת להכיל לפחות 6 תווים';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'הסיסמאות אינן תואמות';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // במקום רישום – נציג הודעה
      setShowMessage(true);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 className="form-title">הרשמה</h2>

        <div className="eye-wrapper">
          <img src={eyeImage} alt="הבעת עין" className="eye-image" />
        </div>

        {showMessage ? (
          <p className="error-text" style={{ textAlign: 'center' }}>
            ✋ ההרשמה סגורה – נא לפנות לצוות TRIPLE לרישום משתמשים חדשים
          </p>
        ) : (
          <>
            <label htmlFor="fullName">שם מלא:</label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            {errors.fullName && <p className="error-text">{errors.fullName}</p>}

            <label htmlFor="email">אימייל:</label>
            <input
              type="text"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {errors.email && <p className="error-text">{errors.email}</p>}

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
            {errors.password && <p className="error-text">{errors.password}</p>}

            <label htmlFor="confirmPassword">אישור סיסמה:</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              required
            />
            {errors.confirmPassword && (
              <p className="error-text">{errors.confirmPassword}</p>
            )}

            <div className="actions">
              <button type="submit" className="btn-primary">הרשמה</button>
              <a href="/login">יש לי כבר חשבון</a>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default Register;
