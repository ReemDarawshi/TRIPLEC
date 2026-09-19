import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CampaignList.css';

interface Campaign {
  id: number;
  title: string;
  channel: string | null;
  date?: string;
  time?: string;
  status: 'טיוטה' | 'נשלח' | 'מתוזמן' | 'נכשל' | 'לא ידוע';
  status_code: 'draft' | 'scheduled' | 'sent' | string;
  sender: string;
}

const CampaignList: React.FC = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('אין טוקן, המשתמש לא מחובר');
          return;
        }

        const res = await fetch('http://localhost:5000/api/campaigns/summary', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          console.error('שגיאה בשליפת קמפיינים:', res.status);
          return;
        }

        const data = await res.json();
        if (!Array.isArray(data)) {
          console.error('הנתונים שהתקבלו אינם מערך:', data);
          return;
        }

        setCampaigns(data);
      } catch (err) {
        console.error('שגיאה בקבלת קמפיינים:', err);
      }
    };

    fetchCampaigns();
  }, []);

  const handleView = (id: number) => {
    navigate(`/preview/${id}`);
  };

  const handleDelete = (id: number) => {
    alert(`מחיקת קמפיין ID: ${id}`);
  };

  const filteredCampaigns = campaigns.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="campaign-list-container">
      <h2 className="page-title">רשימת קמפיינים</h2>

      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 חיפוש לפי כותרת..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <table className="campaign-table">
        <thead>
          <tr>
            <th>כותרת</th>
            <th>ערוץ</th>
            <th>סטטוס</th>
            <th>על ידי</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {filteredCampaigns.map((c) => (
            <tr key={c.id}>
              <td>{c.title}</td>
              <td>{c.channel || '—'}</td>
              <td>
                <span className={`status-badge ${
                  c.status === 'נשלח'
                    ? 'sent'
                    : c.status === 'מתוזמן'
                    ? 'scheduled'
                    : c.status === 'טיוטה'
                    ? 'draft'
                    : 'failed'
                }`}>
                  {c.status}
                </span>
              </td>
              <td>{c.sender}</td>
              <td className="actions">
                {c.status_code === 'draft' ? (
                  <button className="view-btn" onClick={() => navigate(`/campaign/edit/${c.id}`)}>
                    המשך עריכה
                  </button>
                ) : (
                  <button className="view-btn" onClick={() => handleView(c.id)}>צפייה</button>
                )}
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
