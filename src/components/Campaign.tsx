/** TRIPLE: יצירת קמפיין חדש או עריכת פרטי טיוטה קיימת. */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Campaign.css';
import Select from 'react-select';
import { useNavigate, useParams } from 'react-router-dom';

interface Group { id: number; name: string; }
interface Sender { id: number; full_name: string; }
interface CampaignDetails {
  name: string;
  type: string;
  sender_id: number | null;
  target_groups: number[];
  target_roles: string[];
  status: string;
}

const API = 'http://localhost:5000';
const roles = ['לקוחות', 'ספקים', 'סוכנים'];
const campaignObjectives = [
  'מכירה / קידום הצעה', 'החזרת לקוחות', 'השקת מוצר או שירות',
  'העלאת מודעות', 'יצירת לידים', 'תזכורת', 'ברכה / אירוע מיוחד',
  'עדכון ללקוחות', 'אחר'
];

const Campaign: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [senderId, setSenderId] = useState('');
  const [type, setType] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      const token = localStorage.getItem('token');
      if (!token) {
        if (active) { setLoadError('יש להתחבר למערכת.'); setLoading(false); }
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      try {
        // No business_id is sent by the frontend: backend derives it from JWT.
        const requests: Promise<any>[] = [
          axios.get(`${API}/api/campaigns/senders`, { headers }),
          axios.get(`${API}/api/groups`, { headers }),
        ];
        if (id) requests.push(axios.get(`${API}/api/campaigns/${id}`, { headers }));
        const [sendersResponse, groupsResponse, campaignResponse] = await Promise.all(requests);
        if (!active) return;
        if (!Array.isArray(sendersResponse.data) || !Array.isArray(groupsResponse.data)) {
          throw new Error('נתוני השולחים או הקבוצות אינם תקינים.');
        }
        setSenders(sendersResponse.data);
        setGroups(groupsResponse.data);
        if (id) {
          const campaign = campaignResponse.data as CampaignDetails;
          if (campaign.status !== 'draft') {
            throw new Error('אפשר לערוך כאן טיוטות בלבד.');
          }
          setName(campaign.name || '');
          setType(campaign.type || '');
          setSenderId(campaign.sender_id == null ? '' : String(campaign.sender_id));
          setSelectedGroups(Array.isArray(campaign.target_groups) ? campaign.target_groups : []);
          setSelectedRoles(Array.isArray(campaign.target_roles) ? campaign.target_roles : []);
        }
      } catch (error: any) {
        if (active) {
          setLoadError(error?.response?.data?.error || error?.message || 'לא ניתן לטעון את הקמפיין.');
          console.error('טעינת קמפיין נכשלה:', error);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || loading || loadError) return;
    if (!name.trim() || !type || !senderId) {
      alert('יש למלא שם, מטרה ושולח.');
      return;
    }
    if (selectedGroups.length === 0 && selectedRoles.length === 0) {
      alert('יש לבחור לפחות קבוצת יעד אחת או תפקיד אחד.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) { alert('יש להתחבר למערכת.'); return; }
    const payload = {
      name: name.trim(),
      sender_id: Number(senderId),
      type,
      target_groups: selectedGroups,
      target_roles: selectedRoles,
    };
    setSaving(true);
    try {
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      if (id) {
        // Dedicated endpoint: only an owned draft may be edited; no status changes or sending.
        await axios.put(`${API}/api/campaigns/${id}/draft-details`, payload, { headers });
        navigate(`/campaign/ai/${id}`);
      } else {
        const response = await axios.post(`${API}/api/campaigns`, payload, { headers });
        navigate(`/campaign/ai/${response.data.id}`);
      }
    } catch (error: any) {
      console.error('שמירת פרטי הקמפיין נכשלה:', error);
      alert(error?.response?.data?.error || 'שמירת הקמפיין נכשלה. נסי שוב.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="campaign-container fade-in" dir="rtl">
      <h2 className="page-title">{isEditing ? 'המשך עריכת טיוטה' : 'יצירת קמפיין חדש'}</h2>
      {loading ? <p role="status">טוען נתונים...</p> : loadError ? (
        <p role="alert">{loadError}</p>
      ) : (
        <form onSubmit={handleSubmit} className="form-container">
          <label htmlFor="campaign-name">שם הקמפיין:</label>
          <input id="campaign-name" type="text" value={name} onChange={e => setName(e.target.value)} required />

          <label htmlFor="campaign-type">מה מטרת הקמפיין?</label>
          <select id="campaign-type" value={type} onChange={e => setType(e.target.value)} required>
            <option value="">בחרי מטרת קמפיין</option>
            {campaignObjectives.map(objective => <option key={objective} value={objective}>{objective}</option>)}
          </select>

          <label>למי הקמפיין מיועד?</label>
          <div className="audience-box">
            <div className="group-section">
              <p className="mini-title">קבוצות יעד:</p>
              <Select isMulti closeMenuOnSelect={false}
                options={groups.map(group => ({ value: group.id, label: group.name }))}
                value={groups.filter(group => selectedGroups.includes(group.id)).map(group => ({ value: group.id, label: group.name }))}
                onChange={selected => setSelectedGroups(selected.map(item => item.value))}
                className="mb-4" classNamePrefix="rs" placeholder="בחר קבוצות..." />
            </div>
            <div className="role-section">
              <p className="mini-title">לפי תפקיד:</p>
              <Select isMulti closeMenuOnSelect={false}
                options={roles.map(role => ({ value: role, label: role }))}
                value={roles.filter(role => selectedRoles.includes(role)).map(role => ({ value: role, label: role }))}
                onChange={selected => setSelectedRoles(selected.map(item => item.value))}
                className="mb-4" classNamePrefix="rs" placeholder="בחר תפקידים..." />
            </div>
          </div>

          <label htmlFor="campaign-sender" className="block mb-2 text-sm font-medium text-gray-700">מי שולח את הקמפיין?</label>
          <select id="campaign-sender" value={senderId} onChange={e => setSenderId(e.target.value)} className="w-full p-2 border border-gray-300 rounded" required>
            <option value="">-- בחרי שולח --</option>
            {senders.map(sender => <option key={sender.id} value={sender.id}>{sender.full_name}</option>)}
          </select>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'שומר...' : isEditing ? 'שמור והמשך' : 'הבא'}
          </button>
        </form>
      )}
    </div>
  );
};

export default Campaign;
