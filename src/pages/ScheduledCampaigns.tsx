import React from 'react';
import './ScheduledCampaigns.css';
import { useNavigate } from 'react-router-dom';

interface ScheduledCampaign {
  id: number;
  title: string;
  channel: string;
  date: string;
  time: string;
  audience: string;
  sender: string;
}

const campaigns: ScheduledCampaign[] = [
  {
    id: 1,
    title: 'קמפיין שנה טובה',
    channel: 'Email',
    date: '2025-09-10',
    time: '08:00',
    audience: 'לקוחות',
    sender: 'רות כהן',
  },
  {
    id: 2,
    title: 'עדכון אספקה',
    channel: 'WhatsApp',
    date: '2025-09-12',
    time: '14:30',
    audience: 'ספקים',
    sender: 'רים דארוושה',
  },
];

const ScheduledCampaigns: React.FC = () => {
  const navigate = useNavigate();

  const handleEdit = (id: number) => {
    navigate(`/campaign/${id}`); // ניווט לדף פרטי קמפיין
  };

  return (
    <div className="campaign-list-container">
      <h2 className="page-title">קמפיינים מתוזמנים</h2>
      <p className="subtitle">כל הקמפיינים הצפויים להישלח בתאריכים עתידיים</p>

      <table className="campaign-table">
        <thead>
          <tr>
            <th>כותרת</th>
            <th>ערוץ</th>
            <th>תאריך</th>
            <th>קהל יעד</th>
            <th>על ידי</th>
            <th>פעולה</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.id}>
              <td>{c.title}</td>
              <td>{c.channel}</td>
              <td>{`${c.date} ${c.time}`}</td>
              <td>{c.audience}</td>
              <td>{c.sender}</td>
              <td className="actions">
                <button className="edit-btn" onClick={() => handleEdit(c.id)}>עריכה</button>
                <button className="delete-btn">מחק</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduledCampaigns;
