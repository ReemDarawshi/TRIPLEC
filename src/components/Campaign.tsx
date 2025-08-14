import React, { useState } from 'react';
import './Campaign.css';

const Campaign: React.FC = () => {
  const [campaignName, setCampaignName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [campaignType, setCampaignType] = useState('');
  const [nextStep, setNextStep] = useState('');

  return (
    <div className="campaign-container">
      <h2 className="campaign-title">יצירת קמפיין חדש</h2>

      <div className="campaign-form">
        <label htmlFor="campaign-name">שם הקמפיין:</label>
        <input
          id="campaign-name"
          type="text"
          placeholder="הכנס שם לקמפיין"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
        />

        <label htmlFor="sender-name">שם השולח:</label>
        <select
          id="sender-name"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
        >
          <option value="">בחר</option>
          <option value="Marketing Team">Marketing Team</option>
          <option value="Rami Abu Leil">Rami Abu Leil</option>
          <option value="Hotel Nazareth">Hotel Nazareth</option>
        </select>

        <label htmlFor="campaign-type">סוג הקמפיין:</label>
        <select
          id="campaign-type"
          value={campaignType}
          onChange={(e) => setCampaignType(e.target.value)}
        >
          <option value="">בחר</option>
          <option value="הודעה כללית">הודעה כללית</option>
          <option value="מבצע">מבצע</option>
          <option value="עדכון">עדכון</option>
          <option value="ברכה">ברכה</option>
          <option value="אחר">אחר</option>
        </select>

        <label htmlFor="next-step">המשך לשלב:</label>
        <select
          id="next-step"
          value={nextStep}
          onChange={(e) => setNextStep(e.target.value)}
        >
          <option value="">בחר</option>
          <option value="תיבת בינה">תיבת בינה</option>
          <option value="עיצוב">עיצוב</option>
        </select>

        <button className="campaign-button">הבא</button>
      </div>
    </div>
  );
};

export default Campaign;
