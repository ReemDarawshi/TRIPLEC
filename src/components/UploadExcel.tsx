import React, { useState } from 'react';
import './UploadExcel.css';

// קומפוננטת העלאת קובץ Excel המיועדת לטעינת אנשי קשר למערכת
const UploadExcel: React.FC = () => {
  // הגדרת state לשמירת הקובץ שנבחר
  const [file, setFile] = useState<File | null>(null);

  // הודעה למשתמש (שגיאה / הצלחה / סטטוס)
  const [message, setMessage] = useState('');

  // משתנה לבדיקה אם מתבצעת העלאה כרגע (בשימוש לשיקוף למשתמש)
  const [isUploading, setIsUploading] = useState(false);

  // שליפת מזהה העסק מה־localStorage (נדרש לצורך שיוך הנתונים)
  const businessId = localStorage.getItem("business_id");

  // פונקציה שמופעלת כאשר המשתמש בוחר קובץ חדש
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);     // שמירת הקובץ
      setMessage('');                 // איפוס הודעה קודמת
    }
  };

  // שליחת הקובץ לשרת בעת לחיצה על "העלה קובץ"
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // בדיקה אם קובץ נבחר והמשתמש מחובר עם מזהה עסק
    if (!file || !businessId) {
      setMessage('יש לבחור קובץ ולהיות מחוברת לחשבון עם Business ID.');
      return;
    }

    // יצירת אובייקט FormData לשליחת הקובץ
    const formData = new FormData();
    formData.append("file", file);                // הקובץ עצמו
    formData.append("business_id", businessId);   // מזהה העסק (נדרש בצד שרת)

    setIsUploading(true);                         // מציין שמשתמש מעלה כעת קובץ
    setMessage('מעלה את הקובץ...');              // הודעת סטטוס למשתמש

    try {
      const token = localStorage.getItem('token'); // טוקן לזיהוי המשתמש

      // שליחת הבקשה לשרת (POST)
      const response = await fetch('http://localhost:5000/api/upload_excel', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`  // טוקן לאימות
        },
        body: formData                             // גוף הבקשה – כולל קובץ ו־business_id
      });

      const data = await response.json(); // פענוח תגובת השרת

      // אם השרת החזיר שגיאה – זרוק חריג
      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בהעלאת הקובץ');
      }

      // הצלחה: עדכון הודעה, איפוס קובץ, רענון נתוני אנשי קשר
      setMessage(`✅ ${data.message}`);
      setFile(null);
      window.location.reload(); // רענון הדף כדי לטעון את אנשי הקשר החדשים

    } catch (error: any) {
      // טיפול בשגיאה כללית
      setMessage(`❌ שגיאה: ${error.message || 'השרת לא מגיב. ודאי שהוא פעיל ושה־CORS מופעל'}`);
    } finally {
      setIsUploading(false); // סיום תהליך העלאה
    }
  };

  return (
    <div className="upload-excel">
      <h2>טעינת אנשי קשר מקובץ Excel</h2>

      {/* הוראות למשתמש לגבי מבנה הקובץ הנדרש */}
      <p className="instructions">
        נא לטעון קובץ Excel עם עמודות באנגלית: <strong>first_name, last_name, email, phone, role, vip</strong>
      </p>

      {/* טופס העלאה */}
      <form onSubmit={handleSubmit}>
        <div className="file-input-wrapper">
          <label htmlFor="excel-file" className="file-label">בחר קובץ Excel</label>
          <input
            id="excel-file"
            type="file"
            accept=".xlsx, .xls" // סינון לפי סוגי קבצים נתמכים
            onChange={handleFileChange}
          />
        </div>

        {/* הצגת שם הקובץ שנבחר */}
        {file && (
          <p className="file-name">📎 קובץ נבחר: <strong>{file.name}</strong></p>
        )}

        {/* כפתור שליחה */}
        <button type="submit" className="submit-btn" disabled={isUploading}>
          {isUploading ? 'מעלה...' : 'העלה קובץ'}
        </button>

        {/* הצגת הודעה (שגיאה/סטטוס/הצלחה) */}
        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
};

export default UploadExcel;
