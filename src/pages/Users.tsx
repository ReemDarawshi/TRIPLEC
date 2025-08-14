import React, { useState, useEffect } from 'react';
import './Users.css';

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
    const storedUsers = localStorage.getItem('local_users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    }
  }, []);

  const saveToStorage = (list: User[]) => {
    localStorage.setItem('local_users', JSON.stringify(list));
    setUsers(list);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleAddUser = () => {
    if (!newUser.firstName || !newUser.email) {
      alert('נא למלא שם פרטי ודוא"ל');
      return;
    }

    if (users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
      alert('האימייל כבר קיים במערכת');
      return;
    }

    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const updatedList = [...users, { ...newUser, id: newId }];
    saveToStorage(updatedList);

    setNewUser({ id: 0, firstName: '', lastName: '', email: '', phone: '', role: '' });
  };

  const handleDelete = (id: number, name: string) => {
    const confirmDelete = window.confirm(`האם את בטוחה שברצונך למחוק את המשתמש ${name}?`);
    if (!confirmDelete) return;

    const updatedList = users.filter((u) => u.id !== id);
    saveToStorage(updatedList);
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
