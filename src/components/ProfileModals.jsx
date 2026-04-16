import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from './Modal';
import { updateProfile, updateEmail, updatePassword } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL.replace('/api', '');

export function AccountInfoModal({ isOpen, onClose }) {
  const { user } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const dispatch = useDispatch();

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateProfile({ name })).unwrap();
      toast.success('Name updated successfully');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.error || 'Failed to update name');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account Information" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex justify-center mb-4">
          {user?.photo ? (
            <img 
              src={`${BASE_URL}/${user.photo}`} 
              alt="Profile" 
              className="w-20 h-20 rounded-full object-cover shadow-lg border-2 border-primary-500" 
            />
          ) : (
            <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
            {isEditing ? (
              <input 
                className="input-field" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                autoFocus 
                required
              />
            ) : (
              <p className="text-gray-900 font-medium text-lg">{user?.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
            <p className="text-gray-900 font-medium">{user?.email}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Role</label>
            <p className="text-gray-900 font-medium capitalize">
               {user?.role?.replace('_', ' ')}
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            {isEditing ? (
              <>
                <button type="button" onClick={() => { setIsEditing(false); setName(user?.name); }} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary px-6">Save</button>
              </>
            ) : (
              <>
                <button type="button" onClick={onClose} className="btn btn-ghost">Close</button>
                <button type="button" onClick={() => setIsEditing(true)} className="btn btn-primary px-6">Edit Name</button>
              </>
            )}
          </div>
        </form>
      </div>
    </Modal>
  );
}

export function ChangeEmailModal({ isOpen, onClose }) {
  const { user } = useSelector((state) => state.auth);
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatch(updateEmail({ email, password })).unwrap();
      toast.success('Email updated successfully');
      setPassword('');
      onClose();
    } catch (err) {
      toast.error(err.error || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Email Address" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500 mb-2">Enter your new email and provide your current password to verify your identity.</p>
        <div>
          <label className="block text-sm text-gray-600 mb-1">New Email Address</label>
          <input 
            type="email" 
            className="input-field" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Current Password</label>
          <input 
            type="password" 
            className="input-field" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button type="submit" className="btn btn-primary px-6" disabled={loading}>
            {loading ? 'Updating...' : 'Update Email'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ChangePasswordModal({ isOpen, onClose }) {
  const [data, setData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (data.newPassword !== data.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      await dispatch(updatePassword({ 
        currentPassword: data.currentPassword, 
        newPassword: data.newPassword 
      })).unwrap();
      toast.success('Password changed successfully');
      setData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      onClose();
    } catch (err) {
      toast.error(err.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Current Password</label>
          <input 
            type="password" 
            className="input-field" 
            value={data.currentPassword} 
            onChange={(e) => setData({ ...data, currentPassword: e.target.value })} 
            required 
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">New Password</label>
          <input 
            type="password" 
            className="input-field" 
            value={data.newPassword} 
            onChange={(e) => setData({ ...data, newPassword: e.target.value })} 
            required 
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Confirm New Password</label>
          <input 
            type="password" 
            className="input-field" 
            value={data.confirmPassword} 
            onChange={(e) => setData({ ...data, confirmPassword: e.target.value })} 
            required 
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button type="submit" className="btn btn-primary px-6" disabled={loading}>
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function ChangePhotoModal({ isOpen, onClose }) {
  const { user } = useSelector((state) => state.auth);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return toast.error('File size must be less than 5MB');
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return toast.error('Please select a photo');

    const formData = new FormData();
    formData.append('photo', selectedFile);

    setLoading(true);
    try {
      await dispatch(updateProfile(formData)).unwrap();
      toast.success('Profile photo updated successfully');
      setSelectedFile(null);
      setPreviewUrl(null);
      onClose();
    } catch (err) {
      toast.error(err.error || 'Failed to update photo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Profile Photo" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative group">
            {previewUrl || user?.photo ? (
              <img 
                src={previewUrl || `${BASE_URL}/${user.photo}`} 
                alt="Preview" 
                className="w-32 h-32 rounded-full object-cover border-4 border-primary-500/30 shadow-xl" 
              />
            ) : (
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-4xl border-4 border-dashed border-gray-300">
                ?
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-semibold"
            >
              Change
            </button>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
          
          <div className="text-center">
            <p className="text-xs text-gray-500">Allowed formats: JPG, PNG, WEBP</p>
            <p className="text-xs text-gray-500">Max size: 5MB</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button type="submit" className="btn btn-primary px-6" disabled={loading || !selectedFile}>
            {loading ? 'Uploading...' : 'Upload Photo'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
