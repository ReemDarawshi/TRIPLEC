import React from 'react';
import './CampaignAnalytics.css';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, ResponsiveContainer
} from 'recharts';

const CampaignAnalytics = () => {
  const pieData = [
    { name: 'נשלח', value: 70 },
    { name: 'נכשל', value: 10 },
    { name: 'מתוזמן', value: 20 },
  ];

  const COLORS = ['#4caf50', '#f44336', '#ff9800'];

  const barData = [
    { channel: 'Email', count: 220 },
    { channel: 'SMS', count: 150 },
    { channel: 'WhatsApp', count: 310 },
  ];

  const lineData = [
    { date: '01.08', count: 2 },
    { date: '02.08', count: 4 },
    { date: '03.08', count: 1 },
    { date: '04.08', count: 6 },
    { date: '05.08', count: 3 },
  ];

  return (
    <div className="analytics-page">
      <h2>ניתוח קמפיינים</h2>
      <div className="charts-grid">
        <div className="chart-card">
          <h4>התפלגות סטטוסים</h4>
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
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h4>קמפיינים לפי ערוץ</h4>
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

        <div className="chart-card full-width">
          <h4>קמפיינים לפי ימים</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#2196f3" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CampaignAnalytics;
