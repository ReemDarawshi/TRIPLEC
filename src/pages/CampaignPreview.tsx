/**
 * CampaignPreview.tsx
 * ---------------------
 * רכיב React להצגת תצוגה מקדימה של קמפיין שנשלח או מתוזמן במערכת 
 * 
 * תיאור:
 * - מציג את הפוסטר שנבחר ואת הטקסט השיווקי של הקמפיין (אם קיימים).
 * - מבוסס על שליפת נתוני קמפיין מ־API לפי מזהה קמפיין (`id` מ־useParams).
 * - מאפשר למשתמש:
 *   - להוריד את הפוסטר כתמונה מקומית (כפתור "⬇ הורד פוסטר").
 *   - לבצע שליחה חוזרת מדומה של הקמפיין (כפתור " שלח שוב").
 * 
 * תלויות:
 * - React, React Router (useParams)
 * - CSS מותאם ב־CampaignPreview.css
 * - שרת Flask ב־/api/campaigns/:id (מחזיר image_path ו־message_text)
 * 
 * קהל יעד:
 * - מנהלי קמפיינים המעוניינים לצפות בפרטי קמפיין שכבר נוצר.
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './CampaignPreview.css';

const CampaignPreview: React.FC = () => {
  const { id } = useParams();
  const [posterImage, setPosterImage] = useState<string | null>(null);
  const [campaignText, setCampaignText] = useState<string>("");

     /* useEffect ראשי:
   * כאשר הקומפוננטה נטענת, מבצעת שליפה של נתוני הקמפיין מהשרת לפי מזהה הקמפיין.
      */
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/campaigns/${id}`);
        const data = await res.json();
        setPosterImage(data?.image_path || null);
        setCampaignText(data?.message_text || "");
      } catch (err) {
        console.error("שגיאה בשליפת קמפיין:", err);
      }
    };

    if (id) fetchCampaign();
  }, [id]);

   /* handleDownload:
   * מאפשר למשתמש להוריד את הפוסטר כתמונה למחשב המקומי.
*/
  const handleDownload = () => {
    if (posterImage) {
      const link = document.createElement('a');
      link.href = posterImage;
      link.download = 'campaign_poster.jpg';
      link.click();
    }
  };
 /**
   * handleResend:
   * פעולה מדומה לשליחה חוזרת של הקמפיין — כרגע מופיע רק alert.
   * ניתן להחליף בפונקציית שליחה אמיתית בעתיד.
   */
  const handleResend = () => {
    alert('הקמפיין נשלח שוב (מדומה)');
  };

  return (
    <div className="preview-page" dir="rtl">
      <h2>תצוגה מקדימה של הקמפיין</h2>

      {posterImage && (
        <div className="poster-box">
          <img src={posterImage} alt="Poster" />
        </div>
      )}

      <div className="text-box">
        <h4>תוכן ההודעה:</h4>
        <p>{campaignText}</p>
      </div>

      <div className="actions">
        {posterImage && (
          <button className="btn-primary" onClick={handleDownload}>⬇ הורד פוסטר</button>
        )}
        <button className="btn-outline" onClick={handleResend}>🔁 שלח שוב</button>
      </div>
    </div>
  );
};

export default CampaignPreview;
