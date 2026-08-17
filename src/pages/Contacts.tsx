/**
 * Contacts.tsx
 * ---------------------
 * רכיב לניהול אנשי קשר בעסק עבור מערכת TRIPLE.
 * 
 * תכונות עיקריות:
 * - שליפת אנשי קשר מהשרת לפי business_id.
 * - הצגה של טבלת אנשי קשר עם אפשרות לעריכה ישירה בטבלה (inline).
 * - אפשרות הוספה של איש קשר חדש בטבלה.
 * - חיפוש דינמי בטבלה לפי שם, מייל, טלפון או תפקיד.
 * - שמירה מרוכזת של כל העריכות דרך קריאה ל־bulk endpoint.
 * - מחיקת איש קשר בודד מהשרת.
 * 
 * ממשק ה־UI:
 * - שורת טופס להוספת איש קשר חדש בראש הטבלה.
 * - כפתור שמירה של כל השינויים.
 * - מחיקה בודדת לכל שורה קיימת.
 *  */

import React, { useEffect, useState } from 'react';
import './Contacts.css';
import axios from 'axios';

interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'לקוח' | 'ספק' | 'סוכן';
  vip: boolean;
}

const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newContact, setNewContact] = useState<Contact>({
    id: 0,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'לקוח',
    vip: false,
  });

  const token = localStorage.getItem("token");
  const businessId = localStorage.getItem("business_id");

  // הבאת אנשי קשר מהשרת
  useEffect(() => {
    if (!businessId) {
      console.error("חסר business_id");
      return;
    }

    fetch(`http://localhost:5000/api/contacts?business_id=${businessId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) {
          console.error("ציפיתי למערך אך קיבלתי:", data);
          return;
        }
        setContacts(data);
      })
      .catch(err => console.error('שגיאה בטעינת אנשי קשר:', err));
  }, [businessId, token]);

  const handleFieldChange = (id: number, field: keyof Contact, value: string | boolean) => {
    setContacts(prev =>
      prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleDelete = async (id: number) => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert("חסר טוקן");
    return;
  }

  try {
    await axios.delete(`http://localhost:5000/api/contacts/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setContacts(prev => prev.filter(c => c.id !== id));
    alert("🗑️ איש הקשר נמחק בהצלחה");
  } catch (error) {
    console.error("שגיאה במחיקת איש קשר:", error);
    alert(" שגיאה במחיקת איש קשר");
  }
};


const handleAddContact = async () => {
  const token = localStorage.getItem('token');
  const businessId = localStorage.getItem('business_id');

  if (!newContact.first_name.trim() || !businessId || !token) {
    alert("חסרים פרטים");
    return;
  }

  try {
    const response = await axios.post("http://localhost:5000/api/contacts", {
      ...newContact,
      business_id: businessId, 
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    const savedContact = {
      ...newContact,
      id: response.data.id
    };

    setContacts(prev => [savedContact, ...prev]);
    setNewContact({
      id: 0,
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'לקוח',
      vip: false,
    });
    alert("איש קשר נוסף בהצלחה!");
  } catch (err) {
    console.error("שגיאה בשמירת איש קשר:", err);
    alert("שגיאה בשמירה");
  }
};

    const handleSave = async () => {
  if (!token) {
    alert("חסר טוקן");
    return;
  }

  try {
    await Promise.all(
      contacts.map((contact) =>
        axios.put(
          `http://localhost:5000/api/contacts/${contact.id}`,
          {
            first_name: contact.first_name,
            last_name: contact.last_name,
            email: contact.email,
            phone: contact.phone,
            role: contact.role,
            vip: contact.vip,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
      )
    );

    alert("אנשי הקשר נשמרו בהצלחה!");
  } catch (error) {
    console.error("שגיאה בשמירת אנשי קשר:", error);
    alert("שמירת אנשי הקשר נכשלה");
  }
};

  const filteredContacts = contacts.filter(c =>
    [c.first_name, c.last_name, c.email, c.phone, c.role]
      .filter(Boolean)
      .some(field => field.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="contacts-container">
      <h2 className="page-title">ניהול אנשי קשר</h2>

      <div className="filters">
        <input
          type="text"
          placeholder="חפש לפי שם, טלפון, מייל או תפקיד..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <table className="contacts-table">
        <thead>
          <tr>
            <th>VIP</th>
            <th>שם פרטי</th>
            <th>שם משפחה</th>
            <th>אימייל</th>
            <th>טלפון</th>
            <th>תפקיד</th>
            <th>פעולה</th>
          </tr>
        </thead>
        <tbody>
          {/* שורת הוספה */}
          <tr className="add-row">
            <td>
              <input
                type="checkbox"
                checked={newContact.vip}
                onChange={(e) => setNewContact({ ...newContact, vip: e.target.checked })}
              />
            </td>
            <td>
              <input
                type="text"
                placeholder="שם פרטי"
                value={newContact.first_name}
                onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
              />
            </td>
            <td>
              <input
                type="text"
                placeholder="שם משפחה"
                value={newContact.last_name}
                onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
              />
            </td>
            <td>
              <input
                type="email"
                placeholder="אימייל"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              />
            </td>
            <td>
              <input
                type="tel"
                placeholder="טלפון"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              />
            </td>
            <td>
              <select
                value={newContact.role}
                onChange={(e) => setNewContact({ ...newContact, role: e.target.value as Contact['role'] })}
              >
                <option value="לקוח">לקוח</option>
                <option value="ספק">ספק</option>
                <option value="סוכן">סוכן</option>
              </select>
            </td>
            <td>
              <button className="add-btn" onClick={handleAddContact}>הוסף</button>
            </td>
          </tr>

          {/* אנשי קשר קיימים */}
          {filteredContacts.map((c) => (
            <tr key={c.id}>
              <td>
                <input
                  type="checkbox"
                  checked={c.vip}
                  onChange={(e) => handleFieldChange(c.id, 'vip', e.target.checked)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={c.first_name}
                  onChange={(e) => handleFieldChange(c.id, 'first_name', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={c.last_name}
                  onChange={(e) => handleFieldChange(c.id, 'last_name', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="email"
                  value={c.email}
                  onChange={(e) => handleFieldChange(c.id, 'email', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="tel"
                  value={c.phone}
                  onChange={(e) => handleFieldChange(c.id, 'phone', e.target.value)}
                />
              </td>
              <td>
                <select
                  value={c.role}
                  onChange={(e) => handleFieldChange(c.id, 'role', e.target.value)}
                >
                  <option value="לקוח">לקוח</option>
                  <option value="ספק">ספק</option>
                  <option value="סוכן">סוכן</option>
                </select>
              </td>
              <td>
                <button className="delete-btn" onClick={() => handleDelete(c.id)}>מחק</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="save-btn" onClick={handleSave}>💾 שמור שינויים</button>
    </div>
  );
};

export default Contacts;
