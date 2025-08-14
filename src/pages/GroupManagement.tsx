// GroupManagement.tsx
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './GroupManagement.css';

interface Contact {
  id: number;
  name: string;
  phone: string;
  email: string;
  role: string;
}

interface Group {
  id: number;
  name: string;
  description?: string;
  contacts: Contact[];
  colorClass: string;
  isEditing: boolean;
}

  const pastelColors = ['pastel-blue', 'pastel-pink', 'pastel-green', 'pastel-lilac', 'pastel-yellow', 'pastel-mint'];
  const roles = ['לקוח', 'ספק', 'סוכן'];
  const GroupManagement = () => {
  const [globalContacts, setGlobalContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [pendingGroups, setPendingGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualRole, setManualRole] = useState('');
  const [errors, setErrors] = useState({ name: '', phone: '', email: '', role: '' });
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [popupGroupId, setPopupGroupId] = useState<number | null>(null);
  const [contactSearch, setContactSearch] = useState('');
  const [contactFilterRole, setContactFilterRole] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem('contacts');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setGlobalContacts(parsed);
      } catch (e) {
        console.error("שגיאה בקריאת אנשי קשר מלשונית Contacts", e);
      }
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('contacts');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setGlobalContacts(parsed);
      } catch (e) {
        console.error("שגיאה בקריאת אנשי קשר מלשונית Contacts", e);
      }
    }
  }, []);

  useEffect(() => {
  const stored = localStorage.getItem('contacts');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      setGlobalContacts(parsed);
    } catch (e) {
      console.error("שגיאה בקריאת אנשי קשר מלשונית Contacts", e);
    }
  }
}, [])

  useEffect(() => {
    const stored = localStorage.getItem('groups');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setGroups(parsed);
          setPendingGroups(parsed.map(g => ({ ...g })));
        }
      } catch (e) {
        console.error("שגיאה בקריאת groups מ־localStorage", e);
      }
    }
  }, []);

  useEffect(() => {
    if (groups.length > 0) {
      localStorage.setItem('groups', JSON.stringify(groups));
    }
  }, [groups]);

  const addGroup = () => {
    if (!newGroupName.trim()) return;
    const newGroup: Group = {
      id: Date.now(),
      name: newGroupName,
      description: newGroupDesc,
      contacts: [],
      colorClass: pastelColors[groups.length % pastelColors.length],
      isEditing: false,
    };
    setGroups([...groups, newGroup]);
    setPendingGroups([...pendingGroups, { ...newGroup }]);
    setNewGroupName('');
    setNewGroupDesc('');
  };

  const toggleEdit = (groupId: number) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, isEditing: !g.isEditing } : g));
    setPendingGroups(prev => prev.map(g => g.id === groupId ? { ...g, isEditing: !g.isEditing } : g));
  };

  const validateInputs = () => {
    let isValid = true;
    const newErrors: any = { name: '', phone: '', email: '', role: '' };

    if (!/^[א-תa-zA-Z\s]+$/.test(manualName)) {
      newErrors.name = 'יש להזין שם תקין (ללא מספרים)';
      isValid = false;
    }
    if (!/^\d{7,15}$/.test(manualPhone)) {
      newErrors.phone = 'מספר טלפון לא תקין';
      isValid = false;
    }
    if (!/^\S+@\S+\.\S+$/.test(manualEmail)) {
      newErrors.email = 'אימייל לא תקין';
      isValid = false;
    }
    if (!roles.includes(manualRole)) {
      newErrors.role = 'יש לבחור תפקיד מהרשימה';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const addManualContact = (groupId: number) => {
    if (!validateInputs()) return;

    const newContact: Contact = {
      id: Date.now(),
      name: manualName,
      phone: manualPhone,
      email: manualEmail,
      role: manualRole,
    };

    setPendingGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? { ...group, contacts: [...group.contacts, newContact] }
          : group
      )
    );

    setManualName('');
    setManualPhone('');
    setManualEmail('');
    setManualRole('');
    setErrors({ name: '', phone: '', email: '', role: '' });
  };

  const removeContact = (groupId: number, contactId: number) => {
    setPendingGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? { ...group, contacts: group.contacts.filter(c => c.id !== contactId) }
          : group
      )
    );
  };

  const handleExcelUpload = (file: File, groupId: number) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      const newContacts: Contact[] = [];

      for (const r of json) {
        const row = r as any;
        const name = (row['שם'] || '').toString().trim();
        const phone = (row['טלפון'] || '').toString().trim();
        const email = (row['אימייל'] || '').toString().trim();
        const role = (row['תפקיד'] || '').toString().trim();

        if (
          /^[א-תa-zA-Z\s]+$/.test(name) &&
          /^\d{7,15}$/.test(phone) &&
          /^\S+@\S+\.\S+$/.test(email) &&
          roles.includes(role)
        ) {
          newContacts.push({
            id: Date.now() + Math.random(),
            name,
            phone,
            email,
            role,
          });
        }
      }

      setPendingGroups(prev =>
        prev.map(group =>
          group.id === groupId
            ? { ...group, contacts: [...group.contacts, ...newContacts] }
            : group
        )
      );
    };
    reader.readAsBinaryString(file);
  };

  const openContactsPopup = (groupId: number) => {
    setPopupGroupId(groupId);
    setSelectedContacts(new Set());
    setContactSearch('');
    setContactFilterRole('');
  };

  const confirmAddFromPopup = () => {
    if (popupGroupId === null) return;

    const selected = globalContacts.filter(c => selectedContacts.has(c.id));
    setPendingGroups(prev =>
      prev.map(group =>
        group.id === popupGroupId
          ? { ...group, contacts: [...group.contacts, ...selected] }
          : group
      )
    );

    setPopupGroupId(null);
  };

  const confirmDeleteGroup = () => {
    if (groupToDelete) {
      setGroups(groups.filter(g => g.id !== groupToDelete.id));
      setPendingGroups(pendingGroups.filter(g => g.id !== groupToDelete.id));
      setShowDeletePopup(false);
      setGroupToDelete(null);
    }
  };

  const saveGroupChanges = (groupId: number) => {
    const updatedGroup = pendingGroups.find(g => g.id === groupId);
    if (!updatedGroup) return;
    updatedGroup.isEditing = false;
    const updatedGroups = groups.map(g => g.id === groupId ? updatedGroup : g);
    setGroups(updatedGroups);
    setPendingGroups(updatedGroups.map(g => ({ ...g })));
  };

  const filteredGlobalContacts = globalContacts.filter(c =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) &&
    (contactFilterRole === '' || c.role === contactFilterRole)
  );

  return (
    <div className="group-management-container">
      <h2 className="page-title">ניהול קבוצות יעד</h2>

      {pendingGroups.map(group => (
        <div key={group.id} className={`group-card ${group.colorClass}`}>
          <div className="group-header">
            <div>
              <h3>{group.name}</h3>
              <p>{group.description}</p>
            </div>
            <div>
              <button className="delete-btn" onClick={() => { setGroupToDelete(group); setShowDeletePopup(true); }}>מחק</button>
              <button onClick={() => toggleEdit(group.id)}>עריכה</button>
            </div>
          </div>

          <div className="group-contacts">
            {group.contacts.map(contact => (
              <div key={contact.id} className="contact-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    <strong>{contact.name}</strong> - {contact.role}<br />
                    טלפון: {contact.phone} | אימייל: {contact.email}
                  </span>
                  <button onClick={() => removeContact(group.id, contact.id)} style={{ background: 'none', border: 'none', color: 'red', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
                </div>
              </div>
            ))}
          </div>

          {group.isEditing && (
            <>
              <div className="manual-add-form">
                <input placeholder="שם" value={manualName} onChange={e => setManualName(e.target.value)} />
                <input placeholder="טלפון" value={manualPhone} onChange={e => setManualPhone(e.target.value)} />
                <input placeholder="אימייל" value={manualEmail} onChange={e => setManualEmail(e.target.value)} />
                <select value={manualRole} onChange={e => setManualRole(e.target.value)}>
                  <option value="">בחר תפקיד</option>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button onClick={() => addManualContact(group.id)}>הוסף</button>
              </div>

              <div className="error-row">
                <div>{errors.name && <span className="error">{errors.name}</span>}</div>
                <div>{errors.phone && <span className="error">{errors.phone}</span>}</div>
                <div>{errors.email && <span className="error">{errors.email}</span>}</div>
                <div>{errors.role && <span className="error">{errors.role}</span>}</div>
              </div>

              <div className="upload-excel">
                <label>העלאת אנשי קשר מאקסל:</label>
                <input type="file" accept=".xlsx,.xls" onChange={(e) => {
                  if (e.target.files?.length) handleExcelUpload(e.target.files[0], group.id);
                }} />
              </div>

              <button onClick={() => openContactsPopup(group.id)} className="add-from-contacts-btn">
                הוסף מאנשי קשר
              </button>

              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '1rem' }}>
                <button className="save-changes-btn" onClick={() => saveGroupChanges(group.id)}>
                  💾 שמור שינויים
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      <div className="add-group-card">
        <input placeholder="שם קבוצה" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
        <textarea placeholder="תיאור (לא חובה)" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} />
        <button onClick={addGroup}>הוסף קבוצה</button>
      </div>

      {showDeletePopup && groupToDelete && (
        <div className="popup-overlay">
          <div className="popup-content">
            <p>האם אתה בטוח שתרצה למחוק את הקבוצה "{groupToDelete.name}"?</p>
            <div className="popup-buttons">
              <button className="confirm-delete" onClick={confirmDeleteGroup}>מחק</button>
              <button className="cancel-delete" onClick={() => setShowDeletePopup(false)}>בטל</button>
            </div>
          </div>
        </div>
      )}

      {popupGroupId !== null && (
        <div className="popup-overlay">
          <div className="popup-content" style={{ maxWidth: '500px', textAlign: 'right' }}>
            <h3>בחר אנשי קשר</h3>
            <input
              type="text"
              placeholder="חפש לפי שם"
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
            />
            <select value={contactFilterRole} onChange={(e) => setContactFilterRole(e.target.value)}>
              <option value="">הצג הכל</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '1rem' }}>
              {filteredGlobalContacts.map(c => (
                <div key={c.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedContacts.has(c.id)}
                      onChange={() => {
                        const copy = new Set(selectedContacts);
                        copy.has(c.id) ? copy.delete(c.id) : copy.add(c.id);
                        setSelectedContacts(copy);
                      }}
                    />
                    {c.name} ({c.role}) - {c.phone}
                  </label>
                </div>
              ))}
            </div>
            <div className="popup-buttons" style={{ marginTop: '1rem' }}>
              <button onClick={confirmAddFromPopup} className="confirm-delete">הוסף לקבוצה</button>
              <button onClick={() => setPopupGroupId(null)} className="cancel-delete">סגור</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupManagement;
