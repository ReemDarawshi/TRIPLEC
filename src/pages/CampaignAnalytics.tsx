/**
 * CampaignAnalytics.tsx
 *
 *  Component: CampaignAnalytics
 *  Purpose: Displays visual analytics for marketing campaigns using graphs.
 *
 * Features:
 * - Fetches campaign statistics from the backend (/api/dashboard).
 * - Renders a PieChart for campaign status (sent, scheduled, failed).
 * - Renders a BarChart for channel usage (Email, SMS, WhatsApp, etc.).
 * - Responsive design using Recharts and Flex layout.
 *
 * Dependencies:
 * - Recharts (PieChart, BarChart, Tooltip, Legend)
 * - React hooks (useEffect, useState)
 * - Authentication token from localStorage
 *

 */

import React, { useEffect, useState } from 'react';
import './CampaignAnalytics.css';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer
} from 'recharts';

// טיפוסים ל־useState
type PieEntry = {
  name: string;
  value: number;
};

type BarEntry = {
  channel: string;
  count: number;
};

const COLORS = ['#4caf50', '#f44336', '#ff9800']; // ירוק = נשלח, אדום = נכשל, כתום = מתוזמן

const CampaignAnalytics: React.FC = () => {
  const [pieData, setPieData] = useState<PieEntry[]>([]);
  const [barData, setBarData] = useState<BarEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        const pie: PieEntry[] = [
          { name: 'נשלח', value: data.sent_count },
          { name: 'נכשל', value: data.failed_count },
          { name: 'מתוזמן', value: data.scheduled_count },
        ];

        const bar: BarEntry[] = data.channels_stats.map((item: any) => ({
          channel: item.channel,
          count: item.sent
        }));

        setPieData(pie);
        setBarData(bar);
        setLoading(false);
      } catch (error) {
        console.error('שגיאה בטעינת נתוני דשבורד:', error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="analytics-page">
      <h2>📊 ניתוח קמפיינים</h2>

      {loading ? (
        <p>טוען נתונים...</p>
      ) : (
        <div className="charts-grid">
          <div className="chart-card">
            <h4>📌 התפלגות סטטוסים</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h4>📬 קמפיינים לפי ערוץ</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0d47a1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignAnalytics;
