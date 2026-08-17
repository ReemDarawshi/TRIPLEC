/**
 * קובץ: ScheduledCampaigns.tsx
 * תיאור: קומפוננטת React המציגה את רשימת הקמפיינים המתוזמנים במערכת TRIPLE.
 * 
 * הפונקציונליות כוללת:
 * - שליפה מהשרת של כל הקמפיינים העתידיים שנקבע להם תזמון שליחה.
 * - הצגה של טבלת נתונים כולל: כותרת הקמפיין, ערוץ השליחה, תאריך, סטטוס, מי שלח.
 * - אפשרות לבטל תזמון של קמפיין (שליחת בקשת DELETE לשרת).
 * - שימוש ב־Bearer Token לשם אימות מול ה־API.
 * 
 * הקובץ משתמש ב־CSS חיצוני לעיצוב: ScheduledCampaigns.css
 * ומתחבר ל־endpoint: /api/campaigns/scheduled
 * 
 */


import React, { useEffect, useState } from 'react';
import './ScheduledCampaigns.css';

interface ScheduledCampaign {
  id: number;
  title: string;
  channel: string;
  date: string;
  time: string;
  status: string;
  sender: string;
}

const ScheduledCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<ScheduledCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/campaigns/scheduled', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('שגיאה בטעינת הקמפיינים');
      }

      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error('שגיאה בשליפת קמפיינים מתוזמנים:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCampaign = async (id: number) => {
    const confirmCancel = window.confirm('האם את בטוחה שברצונך לבטל את תזמון הקמפיין הזה?');
    if (!confirmCancel) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/campaigns/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('שגיאה בביטול הקמפיין');
      }

      setCampaigns(prev => prev.filter(c => c.id !== id));
      alert('הקמפיין בוטל בהצלחה ✅');
    } catch (error) {
      console.error('שגיאה בביטול הקמפיין:', error);
      alert('שגיאה בביטול הקמפיין ❌');
    }
  };

return (
  <div className="campaign-list-container">
    <h2 className="page-title">קמפיינים מתוזמנים</h2>
    <p className="subtitle">כל הקמפיינים הצפויים להישלח בתאריכים עתידיים</p>

    {loading ? (
      <p>טוען נתונים...</p>
    ) : campaigns.length === 0 ? (
      <p>לא נמצאו קמפיינים מתוזמנים.</p>
    ) : (
      <table className="campaign-table">
        <thead>
          <tr>
            <th>כותרת</th>
            <th>ערוץ</th>
            <th>תאריך</th>
            <th>סטטוס</th>
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
              <td>{c.status}</td>
              <td>{c.sender}</td>
              <td className="actions-cell">
                <button className="delete-btn" onClick={() => handleCancelCampaign(c.id)}>
                  🗑 בטל תזמון
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);}
export default ScheduledCampaigns;
