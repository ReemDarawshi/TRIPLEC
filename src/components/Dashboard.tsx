import React, { useState } from 'react';
import './Dashboard.css';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'bar' | 'pie'>('bar');

  const channelData = [
    { channel: 'Email', sent: 230 },
    { channel: 'SMS', sent: 170 },
    { channel: 'WhatsApp', sent: 290 },
  ];

  const pieData = [
    { name: 'Email', value: 230 },
    { name: 'SMS', value: 170 },
    { name: 'WhatsApp', value: 290 },
  ];

  const COLORS = ['#0d6efd', '#198754', '#ffc107'];

  const lastCampaign = {
    name: 'קמפיין סתיו',
    date: '03/08/2025',
    sent: 1200,
    opened: 860,
  };

  const nextCampaign = {
    name: 'קמפיין חג',
    date: '10/08/2025',
    channel: 'WhatsApp',
  };

  return (
    <div className="dashboard-container">
      <h2>שלום רים 🌟</h2>
      <p className="sub-title">כאן תמצאי סיכום על ביצועי הקמפיינים שלך</p>

      <div className="cards-row">
        <div className="stat-card">
          <h3>💌 קמפיינים שנשלחו</h3>
          <p>32</p>
        </div>
        <div className="stat-card">
          <h3>📬 נפתחו</h3>
          <p>24</p>
        </div>
        <div className="stat-card">
          <h3>❌ נכשלו</h3>
          <p>3</p>
        </div>
      </div>

      <div className="cards-row">
        <div className="stat-card">
          <h3>📤 קמפיין אחרון</h3>
          <p>{lastCampaign.name}</p>
          <small>📅 {lastCampaign.date}</small><br />
          <small>נשלחו: {lastCampaign.sent} | נפתחו: {lastCampaign.opened}</small>
        </div>

        <div className="stat-card">
          <h3>🕒 הקמפיין הבא</h3>
          <p>{nextCampaign.name}</p>
          <small>📅 {nextCampaign.date}</small><br />
          <small>ערוץ: {nextCampaign.channel}</small>
        </div>

        <div className="stat-card">
          <h3>⚡ קיצורי דרך</h3>
          <button onClick={() => navigate('/campaign')} className="quick-btn">+ יצירת קמפיין</button><br />
          <button onClick={() => navigate('/upload')} className="quick-btn">👥 טעינת אנשי קשר</button><br />
          <button onClick={() => navigate('/campaigns')} className="quick-btn">📊 צפייה בקמפיינים</button>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-header">
          <h4>פילוח לפי ערוצים</h4>
          <button
            onClick={() => setViewMode(viewMode === 'bar' ? 'pie' : 'bar')}
            className="toggle-chart-btn"
          >
            {viewMode === 'bar' ? 'הצג כעוגה' : 'הצג כעמודות'}
          </button>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          {viewMode === 'bar' ? (
            <BarChart data={channelData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="channel" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sent">
                {channelData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                verticalAlign="bottom"
                formatter={(value, entry, index) => (
                  <span style={{ color: COLORS[index] }}>{value}</span>
                )}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
