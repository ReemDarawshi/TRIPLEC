import React from 'react';
import './CampaignPreview.css';

const CampaignPreview: React.FC = () => {
  const posterImage = '/images/design3.jpg'; // תמונה לדוגמה
  const campaignText = 'לקוחות יקרים, שעות הפעילות שלנו התעדכנו. נשמח לראותכם גם במתכונת החדשה!';

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = posterImage;
    link.download = 'campaign_poster.jpg';
    link.click();
  };

  const handleResend = () => {
    alert('הקמפיין נשלח שוב (מדומה)');
    // בעתיד: שליחה ל־API
  };

  return (
    <div className="preview-page" dir="rtl">
      <h2>תצוגה מקדימה של הקמפיין</h2>

      <div className="poster-box">
        <img src={posterImage} alt="Poster" />
      </div>

      <div className="text-box">
        <h4>תוכן ההודעה:</h4>
        <p>{campaignText}</p>
      </div>

      <div className="actions">
        <button className="btn-primary" onClick={handleDownload}>⬇ הורד פוסטר</button>
        <button className="btn-outline" onClick={handleResend}>🔁 שלח שוב</button>
      </div>
    </div>
  );
};

export default CampaignPreview;
