/**
 * קומפוננטת ניהול משתמשים במערכת TRIPLE.
 * מאפשרת לצפות, להוסיף ולמחוק משתמשים (admin/marketing/viewer).
 * כולל קריאות API ל-GET, POST, DELETE עם טוקן אימות.
 * מיועדת לשימוש ע"י משתמשים עם הרשאות ניהול בלבד.
 */

import React, { useState, useEffect } from 'react';
import './Users.css';
import axios from 'axios';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState<User>({
    id: 0,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('אין הרשאת התחברות');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('שגיאה בטעינת המשתמשים:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleAddUser = async () => {
    if (!newUser.firstName || !newUser.email) {
      alert('נא למלא שם פרטי ודוא"ל');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('אין טוקן התחברות');
        return;
      }

      const fullName = `${newUser.firstName} ${newUser.lastName}`.trim();

      await axios.post(
        'http://localhost:5000/api/users',
        {
          full_name: fullName,
          email: newUser.email,
          role: newUser.role || 'viewer',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert('המשתמש נוסף ונשלח אליו מייל');
      setNewUser({ id: 0, firstName: '', lastName: '', email: '', phone: '', role: '' });

      fetchUsers(); // ריענון רשימה
    } catch (error: any) {
      alert(error.response?.data?.error || 'שגיאה בהוספת משתמש');
      console.error(error);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const confirmDelete = window.confirm(`האם את בטוחה שברצונך למחוק את המשתמש ${name}?`);
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('אין טוקן התחברות');
        return;
      }

      await axios.delete(`http://localhost:5000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('המשתמש נמחק');
      fetchUsers(); // טען את הרשימה מחדש
    } catch (error) {
      alert('שגיאה במחיקה');
      console.error(error);
    }
  };

  return (
    <div className="users-page">
      <h2>ניהול משתמשים</h2>

      <table>
        <thead>
          <tr>
            <th>שם פרטי</th>
            <th>שם משפחה</th>
            <th>אימייל</th>
            <th>טלפון</th>
            <th>תפקיד</th>
            <th>פעולה</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.firstName}</td>
              <td>{user.lastName}</td>
              <td>{user.email}</td>
              <td>{user.phone}</td>
              <td>{user.role}</td>
              <td>
                <button className="btn-danger" onClick={() => handleDelete(user.id, user.firstName)}>
                  מחק
                </button>
              </td>
            </tr>
          ))}

          <tr className="new-user-row">
            <td>
              <input type="text" name="firstName" value={newUser.firstName} onChange={handleChange} />
            </td>
            <td>
              <input type="text" name="lastName" value={newUser.lastName} onChange={handleChange} />
            </td>
            <td>
              <input type="email" name="email" value={newUser.email} onChange={handleChange} />
            </td>
            <td>
              <input type="text" name="phone" value={newUser.phone} onChange={handleChange} />
            </td>
            <td>
              <select name="role" value={newUser.role} onChange={handleChange}>
                <option value="">בחר</option>
                <option value="admin">מנהל</option>
                <option value="marketing">שיווק</option>
                <option value="viewer">צפייה בלבד</option>
              </select>
            </td>
            <td>
              <button className="btn-outline" onClick={handleAddUser}>
                הוסף
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Users;
