/**
 * קומפוננטת Dashboard (לוח בקרה) למשתמש במערכת TRIPLE.
 * 
 * תפקיד עיקרי:
 * - שליפת נתונים סטטיסטיים על קמפיינים לפי `business_id` מה־JWT בטוקן.
 * - הצגת מידע סטטיסטי כללי:
 *   - מספר קמפיינים שנשלחו, מתוזמנים ונכשלו.
 *   - הקמפיין האחרון והבא לפי תאריך.
 *   - פילוח ערוצים (email, sms, whatsapp) לפי שליחה.
 * 
 * פיצ'רים:
 * - תצוגה גרפית (BarChart / PieChart) לבחירת המשתמש.
 * - כפתורי קיצור ליצירת קמפיין חדש, ניהול קבוצות ואנשי קשר.
 * - שימוש ב־Recharts להצגת גרפים אינטראקטיביים.
 * 
 * טכנולוגיות בשימוש:
 * - React + TypeScript
 * - fetch API לשליפת נתונים עם Authorization
 * - useEffect, useState לניהול זרימת נתונים והצגה
 * - ספריית Recharts לציור גרפים
 */

import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell, PieChart, Pie
} from 'recharts';

interface CampaignStats {
  sent_count: number;
  scheduled_count: number;
  failed_count: number;
  last_campaign: {
    name: string;
    date: string;
    sent: number;
    opened: number;
  };
  next_campaign: {
    name: string;
    date: string;
    channel: string;
  };
  channels_stats: {
    channel: string;
    sent: number;
  }[];
}

const COLORS_MAP: Record<string, string> = {
  email: '#007bff',
  sms: '#28a745',
  whatsapp: '#dab441',
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:5000/api/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("שגיאה בשליפת נתוני הדשבורד", err);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard-container">
      <h2 className="page-title">👋 שלום רים, ברוכה הבאה</h2>
      <p className="dashboard-subtitle">כאן תוכלי לעקוב אחרי כל מה שקורה בקמפיינים שלך 🎯</p>

      {/* סטטיסטיקות כלליות */}
      <div className="dashboard-grid">
        <div className="stat-card sent">
          <h3>💌 קמפיינים שנשלחו</h3>
          <p>{stats?.sent_count ?? '-'}</p>
        </div>
        <div className="stat-card opened">
          <h3>📅 מתוזמנים</h3>
          <p>{stats?.scheduled_count ?? '-'}</p>
        </div>
        <div className="stat-card failed">
          <h3>⚠️ נכשלו</h3>
          <p>{stats?.failed_count ?? '-'}</p>
        </div>
        <div className="stat-card last">
          <h3>📤 אחרון שנשלח</h3>
          <p>{stats?.last_campaign?.name ?? '-'}</p>
          <small>{stats?.last_campaign?.date}</small>
        </div>
        <div className="stat-card next">
          <h3>📨 הבא בתור</h3>
          <p>{stats?.next_campaign?.name ?? '-'}</p>
          <small>{stats?.next_campaign?.date} | {stats?.next_campaign?.channel}</small>
        </div>
        <div className="stat-card shortcut">
          <h3>⚡ קיצורי דרך</h3>
          <div className="shortcut-buttons">
            <button onClick={() => window.location.href = '/campaign'}>➕ קמפיין חדש</button>
            <button onClick={() => window.location.href = '/groups'}>👥 נהל קבוצות</button>
            <button onClick={() => window.location.href = '/contacts'}>📇 אנשי קשר</button>
          </div>
        </div>
      </div>

      {/* גרפים */}
      <div className="chart-container">
        <h3>📊 פילוח ערוצים לפי שליחה</h3>
        <div style={{ marginBottom: '15px' }}>
          <button className={`toggle-btn ${chartType === 'bar' ? 'active' : ''}`} onClick={() => setChartType('bar')}>
            גרף עמודות
          </button>
          <button className={`toggle-btn ${chartType === 'pie' ? 'active' : ''}`} onClick={() => setChartType('pie')}>
            גרף עוגה
          </button>
        </div>

        {stats?.channels_stats && chartType === 'bar' && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.channels_stats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="channel" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sent">
                {stats.channels_stats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS_MAP[entry.channel] || '#8884d8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {stats?.channels_stats && chartType === 'pie' && (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.channels_stats}
                dataKey="sent"
                nameKey="channel"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {stats.channels_stats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS_MAP[entry.channel] || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
