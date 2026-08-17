/**
 * GroupManagement.tsx
 * ----------------------------------------------------------------
 * רכיב לניהול קבוצות יעד במערכת שיווקית.
 * מאפשר יצירה, עריכה, מחיקה והוספת אנשי קשר (ידנית, מאנשי הקשר או מקובץ אקסל) עבור כל קבוצה.
 *
 * 🚀 פונקציונליות עיקרית:
 * - הצגת קבוצות יעד קיימות עבור עסק (Business ID).
 * - יצירת קבוצה חדשה עם שם, תיאור וצבע רקע (מגוון פסטלים).
 * - עריכת קבוצה קיימת והוספת אנשי קשר אליה:
 *    ✅ ידנית: טופס עם אימותים.
 *    ✅ מתוך אנשי קשר גלובליים של העסק (כולל חיפוש וסינון לפי תפקיד).
 *    ✅ העלאה מקובץ Excel – קריאה ל־backend לשמירה.
 * - שמירה של כל הקבוצות והקשרים מול השרת בלחיצה אחת.
 * - מחיקת קבוצה עם אישור מוקפץ.
 * - תצוגה ויזואלית אינטואיטיבית הכוללת כרטיסים לכל קבוצה ופופאפים להוספה/מחיקה.
 *
 * 💾 נתונים:
 * - אנשי הקשר וכל הקבוצות נטענים מהשרת (`/api/groups`, `/api/contacts`) לפי מזהה העסק (`business_id`) וה־token.
 * - אנשי קשר שנוספו לקבוצות מוסרים מהרשימה הגלובלית.
 * - כל קבוצה כוללת שם, תיאור, אנשי קשר וסטייל.
 *
 * 🧪 ולידציה:
 * - שם פרטי/משפחה בעברית או אנגלית בלבד.
 * - טלפון: ספרות בלבד באורך 7–15.
 * - אימייל תקני.
 * - חובה לבחור תפקיד מהרשימה: לקוח / ספק / סוכן.
 *
 *  שימוש בספריות:
 * - axios – לשליחת בקשות HTTP ל־backend.
 * - xlsx – לפריסת קובץ אקסל וטיפול בנתונים שבו.
 *
 *  הערות:
 * - השמירה הכוללת מתבצעת דרך `/api/groups/save-all`.
 * - אנשי קשר חדשים (מאקסל או ידנית) נשלחים ל־`/api/contacts/bulk`.
 * - לקוח חדש מאקסל נבדק לפי מבנה עמודות גמיש (עברית/אנגלית).
 *
 *  UI:
 * - תצוגת RTL מלאה.
 * - קובץ CSS נפרד (`GroupManagement.css`) שולט על צבעים, עימוד, כרטיסים, ופופאפים.
 *
 *  שיפור עתידי אפשרי:
 * - הוספת טעינת מצב (loading) לכל קריאה לשרת.
 * - טיפול שגיאות משופר בצד ה־UI.
 * - מעבר לניהול עם מודל גלובלי (Redux או Context) במקום useState.
 */

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './GroupManagement.css';
import axios from 'axios';

interface Contact {
  id: number;
  first_name: string;
  last_name: string;
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
  const [pendingGroups, setPendingGroups] = useState<Group[]>([]);
  const [globalContacts, setGlobalContacts] = useState<Contact[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [manualFirstName, setManualFirstName] = useState('');
  const [manualLastName, setManualLastName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualRole, setManualRole] = useState('');
  const [errors, setErrors] = useState({ name: '', phone: '', email: '', role: '' });
  const [popupGroupId, setPopupGroupId] = useState<number | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());
  const [contactSearch, setContactSearch] = useState('');
  const [contactFilterRole, setContactFilterRole] = useState('');
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const token = localStorage.getItem('token');
  const businessId = localStorage.getItem('business_id');
  
useEffect(() => {
  const token = localStorage.getItem("token");
  const businessId = localStorage.getItem("business_id");

  if (businessId && token) {
    fetch(`http://localhost:5000/api/contacts?business_id=${businessId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setGlobalContacts)
      .catch(console.error);
  }
}, []);
  useEffect(() => {
  const token = localStorage.getItem('token');
  const businessId = localStorage.getItem('business_id');

  if (!token || !businessId) {
    alert("חסרים פרטי התחברות. נסי להתחבר מחדש.");
    return;
  }

  axios.get("http://localhost:5000/api/groups", {
    headers: { Authorization: `Bearer ${token}` },
    params: { business_id: businessId },
  })
  .then((response) => {
    const fetched = response.data.map((g: any) => ({ ...g, isEditing: false }));
    setPendingGroups(fetched);
  })
  .catch((error) => console.error("שגיאה בטעינת קבוצות:", error));
}, []);


useEffect(() => {
  if (!token || !businessId) return;

  axios.get("http://localhost:5000/api/contacts", {
    headers: { Authorization: `Bearer ${token}` },
    params: { business_id: businessId }
  })
  .then((res) => setGlobalContacts(res.data))
  .catch((err) => console.error("שגיאה בטעינת אנשי קשר:", err));
}, []);


  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return alert("אנא הזן שם קבוצה");
    if (!businessId) return alert("לא נמצא מזהה עסק");

    const groupToAdd = {
      name: newGroupName,
      description: newGroupDesc,
      colorClass: pastelColors[pendingGroups.length % pastelColors.length],
      contacts: [],
      business_id: businessId,
    };

    try {
      const response = await axios.post("http://localhost:5000/api/groups", groupToAdd, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const addedGroup: Group = {
        ...response.data,
        contacts: [],
        isEditing: false,
      };

      setPendingGroups([...pendingGroups, addedGroup]);
      setNewGroupName('');
      setNewGroupDesc('');
    } catch (error) {
      console.error("שגיאה בהוספת קבוצה:", error);
      alert("שגיאה בהוספת קבוצה");
    }
  };

const handleSaveGroups = async () => {
  if (!businessId) return alert("לא נמצא מזהה עסק");

  try {
    setIsSaving(true); 

    const response = await axios.post("http://localhost:5000/api/groups/save-all", {
      groups: pendingGroups,
      business_id: businessId,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // איסוף כל אנשי הקשר שהתווספו לקבוצות
    const allAddedContacts = pendingGroups.flatMap(group => group.contacts || []);
    const addedIds = new Set(allAddedContacts.map(c => c.id));

    // הסרת אנשי קשר מ־globalContacts
    const updatedGlobal = globalContacts.filter(c => !addedIds.has(c.id));
    setGlobalContacts(updatedGlobal);

    alert("✔ הקבוצות נשמרו בהצלחה!");
  } catch (error) {
    console.error("שגיאה בשמירת קבוצות:", error);
    alert("❌ שגיאה בשמירה לשרת");
  } finally {
    setIsSaving(false);
  }
};


  const toggleEdit = (groupId: number) => {
    setPendingGroups(prev => prev.map(g => g.id === groupId ? { ...g, isEditing: !g.isEditing } : g));
  };

  const validateInputs = () => {
    let isValid = true;
    const newErrors = { name: '', phone: '', email: '', role: '' };

    if (!/^[א-תa-zA-Z\s]+$/.test(manualFirstName)) {
      newErrors.name = 'יש להזין שם פרטי תקין';
      isValid = false;
    }
    if (!/^[א-תa-zA-Z\s]+$/.test(manualLastName)) {
      newErrors.name += ' יש להזין שם משפחה תקין';
      isValid = false;
    }
    if (!/^\d{7,15}$/.test(manualPhone)) {
      newErrors.phone = 'טלפון לא תקין';
      isValid = false;
    }
    if (!/^\S+@\S+\.\S+$/.test(manualEmail)) {
      newErrors.email = 'אימייל לא תקין';
      isValid = false;
    }
    if (!roles.includes(manualRole)) {
      newErrors.role = 'יש לבחור תפקיד';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const addManualContact = (groupId: number) => {
    if (!validateInputs()) return;

    const newContact: Contact = {
      id: Date.now(),
      first_name: manualFirstName,
      last_name: manualLastName,
      phone: manualPhone,
      email: manualEmail,
      role: manualRole,
    };

    setPendingGroups(prev =>
      prev.map(g => g.id === groupId ? { ...g, contacts: [...g.contacts, newContact] } : g)
    );

    setManualFirstName('');
    setManualLastName('');
    setManualPhone('');
    setManualEmail('');
    setManualRole('');
    setErrors({ name: '', phone: '', email: '', role: '' });
  };

  const removeContact = (groupId: number, contactId: number) => {
    setPendingGroups(prev =>
      prev.map(g => g.id === groupId ? {
        ...g,
        contacts: g.contacts.filter(c => c.id !== contactId),
      } : g)
    );
  };

const handleExcelUpload = async (file: File, groupId: number) => {
  const reader = new FileReader();

  reader.onload = async (e) => {
    const data = e.target?.result;
    if (!data) return;

    try {
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      const validContacts: Contact[] = [];

      for (const r of json) {
        const row = r as any;

        const first_name = (row['שם פרטי'] || row['first_name'] || '')
          .toString()
          .trim();

        const last_name = (row['שם משפחה'] || row['last_name'] || '')
          .toString()
          .trim();

        const phone = (row['טלפון'] || row['phone'] || '')
          .toString()
          .trim();

        const email = (row['אימייל'] || row['email'] || '')
          .toString()
          .trim()
          .toLowerCase();

        const role = (row['תפקיד'] || row['role'] || '')
          .toString()
          .trim();

        if (
          /^[א-תa-zA-Z\s]+$/.test(first_name) &&
          /^[א-תa-zA-Z\s]+$/.test(last_name) &&
          /^\d{7,15}$/.test(phone) &&
          /^\S+@\S+\.\S+$/.test(email) &&
          roles.includes(role)
        ) {
          validContacts.push({
            id: 0,
            first_name,
            last_name,
            phone,
            email,
            role
          });
        }
      }

      if (validContacts.length === 0) {
        alert("לא נמצאו אנשי קשר תקינים בקובץ");
        return;
      }

      const uniqueContacts = validContacts.filter((contact, index, array) => {
        return (
          array.findIndex(
            c =>
              c.email.toLowerCase() === contact.email.toLowerCase() ||
              c.phone === contact.phone
          ) === index
        );
      });

      const existingContactsFromFile = globalContacts.filter(existing =>
        uniqueContacts.some(
          excelContact =>
            existing.email?.toLowerCase() === excelContact.email.toLowerCase() ||
            existing.phone === excelContact.phone
        )
      );

      const res = await axios.post(
        "http://localhost:5000/api/contacts/bulk",
        {
          contacts: uniqueContacts,
          business_id: businessId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const savedContacts: Contact[] = res.data.saved_contacts || [];

      const contactsToAdd = [
        ...existingContactsFromFile,
        ...savedContacts,
      ];

      setPendingGroups(prev =>
        prev.map(group => {
          if (group.id !== groupId) {
            return group;
          }

          const existingGroupIds = new Set(
            group.contacts.map(contact => contact.id)
          );

          const newGroupContacts = contactsToAdd.filter(
            contact => !existingGroupIds.has(contact.id)
          );

          return {
            ...group,
            contacts: [
              ...group.contacts,
              ...newGroupContacts,
            ],
          };
        })
      );

      alert(
        `${contactsToAdd.length} אנשי קשר נטענו לקבוצה. לחצי "שמור שינויים" לשמירה.`
      );

    } catch (error) {
      console.error("שגיאה בהעלאת אנשי קשר מהאקסל:", error);
      alert("שגיאה בהעלאת אנשי קשר מהאקסל");
    }
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
      prev.map(g => g.id === popupGroupId
        ? { ...g, contacts: [...g.contacts, ...selected] }
        : g)
    );
    setPopupGroupId(null);
  };

const confirmDeleteGroup = async () => {
  if (!groupToDelete) return;

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("אין טוקן");
      return;
    }

    await axios.delete(`http://localhost:5000/api/groups/${groupToDelete.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setPendingGroups(pendingGroups.filter(g => g.id !== groupToDelete.id));
    setGroupToDelete(null);
    setShowDeletePopup(false);
    alert("הקבוצה נמחקה בהצלחה");

  } catch (error) {
    console.error("שגיאה במחיקת קבוצה:", error);
    alert("אירעה שגיאה במחיקה");
  }
};
const filteredGlobalContacts = globalContacts.filter(c =>
  `${c.first_name} ${c.last_name}`.toLowerCase().includes(contactSearch.toLowerCase()) &&
  (contactFilterRole === '' || c.role === contactFilterRole)
);

  const removeContactsFromGlobal = (addedContacts: Contact[]) => {
  const addedIds = new Set(addedContacts.map(c => c.id));
  const updatedGlobal = globalContacts.filter(c => !addedIds.has(c.id));
  setGlobalContacts(updatedGlobal);
};

return (
  <div className="group-management-container fade-in">
    <h2 className="page-title">ניהול קבוצות יעד</h2>

    {pendingGroups.map(group => (
      <div key={group.id} className={`group-card elevated-card ${group.colorClass}`}>
        <div className="group-header">
          <div>
            <h3>{group.name}</h3>
            <p>{group.description}</p>
          </div>
          <div className="group-actions">
            <button className="btn btn-danger" onClick={() => { setGroupToDelete(group); setShowDeletePopup(true); }}>🗑 מחק</button>
            <button className="btn btn-secondary" onClick={() => toggleEdit(group.id)}>✏ עריכה</button>
          </div>
        </div>

        {group.isEditing && (
          <>
            {/* אנשי קשר */}
            <div className="group-contacts">
              {group.contacts.map(contact => (
                <div key={contact.id} className="contact-item">
                  <span className="contact-name">{contact.first_name} {contact.last_name}</span> - {contact.role}<br />
                  <span className="contact-info">טלפון: {contact.phone} | אימייל: {contact.email}</span>
                  <button className="btn btn-icon" onClick={() => removeContact(group.id, contact.id)}>❌</button>
                </div>
              ))}
            </div>

            {/* טופס הוספה ידני */}
            <div className="group-edit-section slide-in">
              <div className="manual-add-form">
                <input placeholder="שם פרטי" value={manualFirstName} onChange={e => setManualFirstName(e.target.value)} />
                <input placeholder="שם משפחה" value={manualLastName} onChange={e => setManualLastName(e.target.value)} />
                <input placeholder="טלפון" value={manualPhone} onChange={e => setManualPhone(e.target.value)} />
                <input placeholder="אימייל" value={manualEmail} onChange={e => setManualEmail(e.target.value)} />
                <select value={manualRole} onChange={e => setManualRole(e.target.value)}>
                  <option value="">בחר תפקיד</option>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button className="btn btn-success" onClick={() => addManualContact(group.id)}>➕ הוסף</button>
              </div>

              {/* הודעות שגיאה */}
              <div className="error-row">
                {Object.entries(errors).map(([field, error]) => (
                  <div key={field}>{error && <span className="error">{error}</span>}</div>
                ))}
              </div>

              {/* העלאת אקסל */}
              <div className="upload-excel">
                <label htmlFor={`group-excel-${group.id}`}>
                       העלאת אנשי קשר מאקסל:
                </label>

                <input
                  id={`group-excel-${group.id}`}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                   if (e.target.files?.length) {
                      handleExcelUpload(e.target.files[0], group.id);
                    }
                  }}
                />
              </div>
              
              {/* הוספה ממסך אנשי קשר */}
              <button className="btn btn-secondary" onClick={() => openContactsPopup(group.id)}>
                📇 הוסף מאנשי קשר
              </button>

              <button className="btn btn-primary save-changes-btn" onClick={handleSaveGroups}>💾 שמור שינויים</button>
            </div>
          </>
        )}
      </div>
    ))}

    {/* יצירת קבוצה חדשה */}
    <div className="add-group-card elevated-card">
      <input placeholder="שם קבוצה" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
      <textarea placeholder="תיאור (לא חובה)" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} />
      <button className="btn btn-success" onClick={handleAddGroup}>➕ הוסף קבוצה</button>
    </div>

    {/* פופ-אפ מחיקה */}
    {showDeletePopup && groupToDelete && (
      <div className="popup-overlay fade-in">
        <div className="popup-content">
          <p>האם אתה בטוח שתרצה למחוק את הקבוצה "{groupToDelete.name}"?</p>
          <div className="popup-buttons">
            <button className="btn btn-danger" onClick={confirmDeleteGroup}>מחק</button>
            <button className="btn btn-secondary" onClick={() => setShowDeletePopup(false)}>בטל</button>
          </div>
        </div>
      </div>
    )}

    {/* פופ-אפ אנשי קשר */}
    {popupGroupId !== null && (
      <div className="popup-overlay fade-in">
        <div className="popup-content">
          <h3>בחר אנשי קשר</h3>
          <input type="text" placeholder="חפש לפי שם" value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} />
          <select value={contactFilterRole} onChange={(e) => setContactFilterRole(e.target.value)}>
            <option value="">הצג הכל</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="contact-list">
            {filteredGlobalContacts.filter(c => !pendingGroups.find(g => g.id === popupGroupId)?.contacts.some(gc => gc.id === c.id))
                .map(c => ( //סינון שלא יציג אנשי קשר שכבר קיימים בקבוצה, כדי שלא יהיו כפולים.
              <label key={c.id} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedContacts.has(c.id)}
                  onChange={() => {
                    const copy = new Set(selectedContacts);
                    copy.has(c.id) ? copy.delete(c.id) : copy.add(c.id);
                    setSelectedContacts(copy);
                  }}
                />
                {c.first_name} {c.last_name} ({c.role}) - {c.phone}
              </label>
            ))}
          </div>
          <div className="popup-buttons">
            <button className="btn btn-primary" onClick={confirmAddFromPopup}>הוסף לקבוצה</button>
            <button className="btn btn-secondary" onClick={() => setPopupGroupId(null)}>סגור</button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
export default GroupManagement;
