// src/pages/SendCampaign.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SendCampaign.css';

interface CampaignDraft {
  campaignName: string;
  senderName: string;
  campaignType: string;
  createdAt: string;
}

const DRAFT_KEY = 'campaignDraft';

const staticSenders = ['רמי', 'אינה', 'מחלקת שיווק', 'תמיכה'];

const SendCampaign: React.FC = () => {
  const [campaignName, setCampaignName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [campaignType, setCampaignType] = useState('');
  const [senders, setSenders] = useState<string[]>(staticSenders);

  const navigate = useNavigate();

  const isValid = campaignName.trim() && senderName.trim() && campaignType.trim();

  const saveDraft = () => {
    const draft: CampaignDraft = {
      campaignName: campaignName.trim(),
      senderName: senderName.trim(),
      campaignType: campaignType.trim(),
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  };

  const handleNext = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isValid) {
      alert('יש למלא את כל השדות');
      return;
    }
    saveDraft();
    navigate('/ai');
  };

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const prev: CampaignDraft = JSON.parse(raw);
        setCampaignName(prev.campaignName || '');
        setSenderName(prev.senderName || '');
        setCampaignType(prev.campaignType || '');
      } catch {
        // טיוטה לא תקינה – מתעלמים
      }
    }
  }, []);

  return (
    <div className="send-campaign-container" dir="rtl">
      <form className="send-campaign-form" onSubmit={handleNext}>
        <h2 className="page-title">יצירת קמפיין חדש</h2>

        <div className="form-group">
          <label htmlFor="campaignName">שם הקמפיין:</label>
          <input
            id="campaignName"
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="לדוגמה: קמפיין קיץ ללקוחות"
            autoComplete="off"
          />
        </div>

        <div className="form-group">
          <label htmlFor="senderName">שם השולח:</label>
          <select
            id="senderName"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
          >
            <option value="">בחר</option>
            {senders.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="campaignType">סוג הקמפיין:</label>
          <select
            id="campaignType"
            value={campaignType}
            onChange={(e) => setCampaignType(e.target.value)}
          >
            <option value="">בחר</option>
            <option value="מבצע">מבצע</option>
            <option value="עדכון">עדכון</option>
            <option value="ברכה">ברכה</option>
            <option value="הודעה כללית">הודעה כללית</option>
            <option value="אחר">אחר</option>
          </select>
        </div>

        <button
          type="submit"
          className="next-button"
          disabled={!isValid}
          title={!isValid ? 'נא למלא את כל השדות' : 'המשך'}
        >
          המשך לשלב הבא
        </button>
      </form>
    </div>
  );
};

export default SendCampaign;
