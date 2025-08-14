import React from 'react';
import './CampaignList.css';

interface Campaign {
  id: number;
  title: string;
  channel: string;
  date: string;
  time: string;
  status: 'נשלח' | 'מתוזמן' | 'נכשל';
  sender: string;
}

const campaigns: Campaign[] = [
  {
    id: 1,
    title: 'מבצע סוף שנה ללקוחות',
    channel: 'Email',
    date: '2025-08-10',
    time: '14:00',
    status: 'נשלח',
    sender: 'רות כהן',
  },
  {
    id: 2,
    title: 'עדכון שעות פעילות לספקים',
    channel: 'WhatsApp',
    date: '2025-08-12',
    time: '09:30',
    status: 'מתוזמן',
    sender: 'רים דארוושה',
  },
  {
    id: 3,
    title: 'קמפיין שנכשל ב־SMS',
    channel: 'SMS',
    date: '2025-08-05',
    time: '18:00',
    status: 'נכשל',
    sender: 'דוד לוי',
  },
];

const CampaignList: React.FC = () => {
  const handleView = (id: number) => {
    alert(`צפייה בקמפיין ID: ${id}`);
    // בעתיד: navigate(`/campaigns/${id}/preview`)
  };

  const handleDelete = (id: number) => {
    alert(`מחיקת קמפיין ID: ${id}`);
    // בעתיד: שליחה ל־backend למחיקה
  };

  return (
    <div className="campaign-list-container">
      <h2 className="page-title">רשימת קמפיינים</h2>

      <table className="campaign-table">
        <thead>
          <tr>
            <th>כותרת</th>
            <th>ערוץ</th>
            <th>תאריך</th>
            <th>סטטוס</th>
            <th>על ידי</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.id}>
              <td>{c.title}</td>
              <td>{c.channel}</td>
              <td>{`${c.date} ${c.time}`}</td>
              <td>
                <span className={`status ${c.status === 'נשלח' ? 'sent' : c.status === 'מתוזמן' ? 'scheduled' : 'failed'}`}>
                  {c.status}
                </span>
              </td>
              <td>{c.sender}</td>
              <td className="actions">
                <button className="view-btn" onClick={() => handleView(c.id)}>צפייה</button>
                <button className="delete-btn" onClick={() => handleDelete(c.id)}>מחיקה</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CampaignList;
