import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotices, createNotice, deleteNotice } from '../store/slices/noticeSlice';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Notices() {
  const dispatch = useDispatch();
  const { list } = useSelector((s) => s.notices);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', targetRole: 'all' });

  useEffect(() => { dispatch(fetchNotices()); }, [dispatch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createNotice(form)).unwrap();
      toast.success('Notice posted!');
      setShowModal(false);
      setForm({ title: '', content: '', targetRole: 'all' });
    } catch (err) { toast.error(err?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this notice?')) {
      await dispatch(deleteNotice(id));
      toast.success('Deleted');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notices</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Create Notice</button>
      </div>

      <div className="space-y-4">
        {list.length === 0 ? (
          <div className="glass p-10 text-center text-gray-400">No notices yet</div>
        ) : (
          list.map((notice, i) => (
            <div key={notice.id} className="glass p-5 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{notice.title}</h3>
                    <span className="badge badge-info">{notice.targetRole}</span>
                  </div>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{notice.content}</p>
                  <p className="text-gray-400 text-xs mt-3">
                    By {notice.creator?.name || 'Unknown'} • {new Date(notice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <button onClick={() => handleDelete(notice.id)} className="text-gray-400 hover:text-red-600 transition-colors text-sm ml-4">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Notice">
        <form onSubmit={handleCreate} className="space-y-4">
          <input className="input-field" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea className="input-field" rows={4} placeholder="Content..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
          <select className="input-field" value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })}>
            <option value="all">All</option>
            <option value="school_management">School Management</option>
          </select>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary">Post Notice</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
