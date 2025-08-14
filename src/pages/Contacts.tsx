import React, { useState } from 'react';
import './Contacts.css';

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'לקוח' | 'ספק' | 'סוכן';
  vip: boolean;
}

const initialContacts: Contact[] = [
  { id: 1, name: 'רים דארוושה', email: 'reem@example.com', phone: '050-1234567', role: 'לקוח', vip: true },
  { id: 2, name: 'אחמד סולטן', email: 'ahmad@example.com', phone: '052-8765432', role: 'סוכן', vip: false },
  { id: 3, name: 'יעל כהן', email: 'yael@example.com', phone: '053-4567890', role: 'ספק', vip: false },
];

const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [searchTerm, setSearchTerm] = useState('');
  const [newContact, setNewContact] = useState<Contact>({
    id: 0,
    name: '',
    email: '',
    phone: '',
    role: 'לקוח',
    vip: false,
  });

  const handleFieldChange = (id: number, field: keyof Contact, value: string | boolean) => {
    setContacts(prev =>
      prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleDelete = (id: number) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const handleSave = () => {
    alert('✅ השינויים נשמרו (כרגע בזיכרון בלבד)');
  };

  const handleAddContact = () => {
    if (!newContact.name.trim()) return;
    const newEntry = { ...newContact, id: Date.now() };
    setContacts(prev => [newEntry, ...prev]);
    setNewContact({ id: 0, name: '', email: '', phone: '', role: 'לקוח', vip: false });
  };

  const filteredContacts = contacts.filter(c =>
    [c.name, c.email, c.phone, c.role]
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
            <th>שם</th>
            <th>אימייל</th>
            <th>טלפון</th>
            <th>תפקיד</th>
            <th>פעולה</th>
          </tr>
        </thead>
        <tbody>
          {/* שורת הוספה – בראש */}
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
                placeholder="שם"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
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
                  value={c.name}
                  onChange={(e) => handleFieldChange(c.id, 'name', e.target.value)}
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
