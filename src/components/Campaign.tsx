/**
 * קומפוננטת יצירת קמפיין חדש במערכת TRIPLE.
 * 
 * פונקציונליות עיקרית:
 * - שליפת קבוצות ותפקידים מהשרת לפי מזהה העסק (JWT).
 * - טופס להזנת פרטי קמפיין כולל:
 *   - שם, סוג, שולח, קבוצות יעד, תפקידי יעד.
 * - שימוש ב־React Select לבחירה מרובה (קבוצות ותפקידים).
 * - שליחת הנתונים לשרת ליצירת קמפיין חדש והפניה למסך ההמשך (AI).
 * 
 * טכנולוגיות בשימוש:
 * - React + TypeScript
 * - axios לשליחת בקשות
 * - fetch ל־GET
 * - useEffect לשליפות ראשוניות
 * - useState לניהול מצב מקומי
 * - useNavigate לניווט לאחר יצירה
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Campaign.css';
import Select from 'react-select'
import { useNavigate } from 'react-router-dom';


interface Group {
  id: number;
  name: string;
}

  const Campaign: React.FC = () => {
  const [name, setName] = useState('');
  const [senderId, setSenderId] = useState('');
  const [type, setType] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [senders, setSenders] = useState<{ id: number; full_name: string }[]>([]);
  const navigate = useNavigate();
  
const token = localStorage.getItem("token");
let business_id;

if (token) {
  const userData = JSON.parse(atob(token.split('.')[1]));
  business_id = userData.business_id;
} else {
  alert("לא נמצא טוקן ");
}

  const campaignData = {
  name,
  sender_id: senderId,
  type,
  target_groups: selectedGroups,
  target_roles: selectedRoles,
  business_id,  
  };

  const campaignObjectives = [
  "מכירה / קידום הצעה",
  "החזרת לקוחות",
  "השקת מוצר או שירות",
  "העלאת מודעות",
  "יצירת לידים",
  "תזכורת",
  "ברכה / אירוע מיוחד",
  "עדכון ללקוחות",
  "אחר"
];

useEffect(() => {
  const fetchSenders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/campaigns/senders", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setSenders(data);
    } catch (error) {
      console.error("Error fetching senders:", error);
    }
  };

  fetchSenders();
}, []);

useEffect(() => {
  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("לא נמצא טוקן");
        return;
      }

      const userData = JSON.parse(atob(token.split('.')[1])); // פענוח JWT
      const businessId = userData.business_id;

      const response = await fetch(`http://localhost:5000/api/groups?business_id=${businessId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setGroups(data);
    } catch (error) {
      console.error("שגיאה בשליפת קבוצות:", error);
    }
  };

  fetchGroups();
}, []);


  const roles = ['לקוחות', 'ספקים', 'סוכנים'];
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const token = localStorage.getItem("token");

  if (!token) {
    alert("לא נמצא טוקן");
    return;
  }
    if (selectedGroups.length === 0 && selectedRoles.length === 0) {
    alert("יש לבחור לפחות קבוצת יעד אחת או תפקיד אחד.");
    return;
  }

  const userData = JSON.parse(atob(token.split('.')[1]));
  const business_id = userData.business_id;

  const campaignData = {
    name,
    sender_id: senderId,
    type,
    target_groups: selectedGroups,
    target_roles: selectedRoles,
    business_id,
  };

  console.log("📤 Data sent to backend:", campaignData);

  try {
    const response = await axios.post("http://localhost:5000/api/campaigns", campaignData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const campaignId = response.data.id;
    alert("קמפיין נוצר בהצלחה!");
    navigate(`/campaign/ai/${campaignId}`);

  } catch (error) {
    alert("שגיאה ביצירת הקמפיין.");
    console.error("❌ Error creating campaign:", error);
  }
};


  const toggleGroup = (id: number) => {
    setSelectedGroups(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

return (
  <div className="campaign-container fade-in" dir="rtl">
    <h2 className="page-title">יצירת קמפיין חדש</h2>

    <form onSubmit={handleSubmit} className="form-container">

      <label>שם הקמפיין:</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <label>מה מטרת הקמפיין?</label>
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        required
      >
        <option value="">בחרי מטרת קמפיין</option>

        {campaignObjectives.map((objective, index) => (
          <option key={index} value={objective}>
            {objective}
          </option>
        ))}
      </select>

      <label>למי הקמפיין מיועד?</label>

      <div className="audience-box">

        <div className="group-section">
          <p className="mini-title">קבוצות יעד:</p>

          <Select
            isMulti
            closeMenuOnSelect={false}
            options={groups.map((group) => ({
              value: group.id,
              label: group.name
            }))}
            value={groups
              .filter((group) => selectedGroups.includes(group.id))
              .map((group) => ({
                value: group.id,
                label: group.name
              }))
            }
            onChange={(selectedOptions) => {
              setSelectedGroups(
                selectedOptions.map((option) => option.value)
              );
            }}
            className="mb-4"
            classNamePrefix="rs"
            placeholder="בחר קבוצות..."
          />
        </div>

        <div className="role-section">
          <p className="mini-title">לפי תפקיד:</p>

          <Select
            isMulti
            closeMenuOnSelect={false}
            options={roles.map((role) => ({
              value: role,
              label: role
            }))}
            value={roles
              .filter((role) => selectedRoles.includes(role))
              .map((role) => ({
                value: role,
                label: role
              }))
            }
            onChange={(selectedOptions) => {
              setSelectedRoles(
                selectedOptions.map((option) => option.value)
              );
            }}
            className="mb-4"
            classNamePrefix="rs"
            placeholder="בחר תפקידים..."
          />
        </div>

      </div>

      <label className="block mb-2 text-sm font-medium text-gray-700">
        מי שולח את הקמפיין?
      </label>

      <select
        value={senderId}
        onChange={(e) => setSenderId(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded"
        required
      >
        <option value="">-- בחרי שולח --</option>

        {senders.map((sender) => (
          <option key={sender.id} value={sender.id}>
            {sender.full_name}
          </option>
        ))}
      </select>

      <button type="submit" className="btn btn-primary">
        הבא
      </button>

    </form>
  </div>
);
}

export default Campaign;