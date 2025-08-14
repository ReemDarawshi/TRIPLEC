import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CampaignDetails.css';

interface Campaign {
  id: number;
  title: string;
  audience: string;
  channel: string;
  sendDate: string;
  sendTime: string;
  sender: string;
  messageText: string;
  imageUrl: string;
}

// 🔧 כרגע נתונים מקומיים – בעתיד יגיע מה־backend
const mockCampaigns: Campaign[] = [
  {
    id: 1,
    title: 'קמפיין שנה טובה',
    audience: 'לקוחות',
    channel: 'Email',
    sendDate: '2025-09-10',
    sendTime: '08:00',
    sender: 'רות כהן',
    messageText: 'שנה טובה ומתוקה לכולם 💚',
    imageUrl: '/images/design1.jpg',
  },
  {
    id: 2,
    title: 'עדכון אספקה',
    audience: 'ספקים',
    channel: 'WhatsApp',
    sendDate: '2025-09-12',
    sendTime: '14:30',
    sender: 'רים דארוושה',
    messageText: 'שינויים בלו״ז ההספקות השבועי',
    imageUrl: '/images/design2.jpg',
  },
];

const CampaignDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    const found = mockCampaigns.find((c) => c.id === Number(id));
    if (found) {
      setCampaign({ ...found });
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (campaign) {
      setCampaign({
        ...campaign,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleSave = () => {
    alert('✅ השינויים נשמרו (כרגע מקומית)');
    // בעתיד: שליחה ל־backend
  };

  if (!campaign) return <p>טוען פרטי קמפיין...</p>;

  return (
    <div className="campaign-details-container">
      <h2 className="page-title">עריכת קמפיין</h2>

      <div className="form-grid">
        <label>
          שם קמפיין:
          <input name="title" value={campaign.title} onChange={handleChange} />
        </label>

        <label>
          קהל יעד:
          <select name="audience" value={campaign.audience} onChange={handleChange}>
            <option value="לקוחות">לקוחות</option>
            <option value="ספקים">ספקים</option>
            <option value="סוכנים">סוכנים</option>
          </select>
        </label>

        <label>
          ערוץ שליחה:
          <select name="channel" value={campaign.channel} onChange={handleChange}>
            <option value="Email">Email</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="SMS">SMS</option>
          </select>
        </label>

        <label>
          תאריך שליחה:
          <input type="date" name="sendDate" value={campaign.sendDate} onChange={handleChange} />
        </label>

        <label>
          שעה:
          <input type="time" name="sendTime" value={campaign.sendTime} onChange={handleChange} />
        </label>

        <label>
          נשלח על ידי:
          <input name="sender" value={campaign.sender} onChange={handleChange} />
        </label>

        <label className="readonly-label">
          טקסט שנוצר בבינה:
          <textarea value={campaign.messageText} readOnly />
        </label>

        <div className="image-preview">
          <p>העיצוב הנבחר:</p>
          <img src={campaign.imageUrl} alt="עיצוב" />
        </div>
      </div>

      <div className="button-row">
        <button className="save-button" onClick={handleSave}>💾 שמור שינויים</button>
        <button className="back-button" onClick={() => navigate('/campaigns')}>⬅ חזרה</button>
      </div>
    </div>
  );
};

export default CampaignDetails;
