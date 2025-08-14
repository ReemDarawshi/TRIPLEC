import React, { useState } from 'react';
import './UploadExcel.css';

const UploadExcel: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setMessage('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setMessage('יש לבחור קובץ Excel לפני שליחה.');
      return;
    }

    // 🔧 כאן יתחבר ל־Backend בהמשך
    setMessage(`הקובץ "${file.name}" מוכן לשליחה ✅`);
  };

  return (
    <div className="upload-excel">
      <h2>טעינת אנשי קשר מקובץ Excel</h2>
      <p className="instructions">
        נא לטעון קובץ מסוג Excel המכיל עמודות: <strong>שם, אימייל, טלפון, תפקיד</strong>
      </p>

      <form onSubmit={handleSubmit}>
        <div className="file-input-wrapper">
          <label htmlFor="excel-file" className="file-label">
            בחר קובץ Excel
          </label>
          <input
            id="excel-file"
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
          />
        </div>

        {file && (
          <p className="file-name">קובץ נבחר: <strong>{file.name}</strong></p>
        )}

        <button type="submit" className="submit-btn">העלה קובץ</button>
        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
};

export default UploadExcel;
