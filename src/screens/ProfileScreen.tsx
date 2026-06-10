import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Trash2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import HumanAvatar, { HUMAN_AVATARS } from '../components/HumanAvatars';
import UserAvatar from '../components/UserAvatar';
import './ProfileScreen.css';

export default function ProfileScreen() {
  const { profileName, profileAvatar, updateProfileInfo, deleteAccount, user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(profileName);
  const [selectedAvatar, setSelectedAvatar] = useState(profileAvatar);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingState, setDeletingState] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateProfileInfo(name.trim(), selectedAvatar);
      // Brief visual delay for nice UX feedback
      setTimeout(() => {
        setSaving(false);
        navigate(-1);
      }, 500);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText.toUpperCase() !== 'DELETE') return;
    setDeletingState(true);
    try {
      await deleteAccount();
    } catch (err) {
      console.error(err);
      setDeletingState(false);
      alert('Failed to delete account. You may need to sign in again to perform this sensitive action.');
    }
  };

  return (
    <div className="profile-screen screen-container">
      {/* Header */}
      <div className="profile-header">
        <button className="btn-icon" onClick={() => navigate(-1)} title="Go Back">
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <h1 className="profile-title">Profile Settings</h1>
      </div>

      {/* Main Form */}
      <form className="profile-form animate-fade-in-up" onSubmit={handleSave}>
        {/* Current Avatar Card */}
        <div className="profile-card avatar-preview-card">
          <div className="avatar-preview-container">
            <UserAvatar avatarUrlOrId={selectedAvatar} displayName={name} size={96} />
          </div>
          <div className="avatar-preview-info">
            <h2>{name || 'Grinder'}</h2>
            <p>{user?.email || 'Offline Local Account'}</p>
          </div>
        </div>

        {/* Display Name Input */}
        <div className="profile-card input-card">
          <label htmlFor="displayName" className="profile-label">
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            className="profile-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            maxLength={25}
            required
            disabled={saving || deletingState}
          />
        </div>

        {/* Profile Avatar Selection */}
        <div className="profile-card avatar-selection-card">
          <span className="profile-label">Choose your Profile Avatar</span>
          <div className="avatars-grid">
            {HUMAN_AVATARS.map((avatar) => {
              const isSelected = selectedAvatar === avatar.id;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  className={`avatar-select-btn ${isSelected ? 'avatar-selected' : ''}`}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  disabled={saving || deletingState}
                >
                  <HumanAvatar avatarId={avatar.id} size={56} />
                  <span className="avatar-select-name">{avatar.name}</span>
                  {isSelected && (
                    <div className="avatar-check-badge">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="profile-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(-1)}
            disabled={saving || deletingState}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving || deletingState || !name.trim()}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="danger-zone animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="danger-zone-header">
          <ShieldAlert size={20} strokeWidth={2.5} />
          <h2>Danger Zone</h2>
        </div>
        <p className="danger-zone-desc">
          Deleting your account is permanent. This wipes all your scheduled tasks, weekly reviews, EOD journals, and Firestore documents.
        </p>

        {!showDeleteConfirm ? (
          <button
            type="button"
            className="btn-danger"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={saving || deletingState}
          >
            <Trash2 size={16} strokeWidth={2.5} />
            Delete My Account
          </button>
        ) : (
          <div className="delete-confirm-box">
            <label className="delete-confirm-label">
              Type <strong>DELETE</strong> in the box below to confirm:
            </label>
            <input
              type="text"
              className="delete-confirm-input"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              disabled={deletingState}
            />
            <div className="delete-confirm-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                disabled={deletingState}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDelete}
                disabled={deleteConfirmText.toUpperCase() !== 'DELETE' || deletingState}
              >
                {deletingState ? 'Deleting Account...' : 'Confirm Permanent Deletion'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
