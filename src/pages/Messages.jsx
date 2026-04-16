import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBroadcastHistory, sendBroadcast } from '../store/slices/messageSlice';
import { fetchClasses } from '../store/slices/academicSlice';
import { fetchStudents } from '../store/slices/studentSlice';
import toast from 'react-hot-toast';

export default function Messages() {
  const dispatch = useDispatch();
  const { broadcasts } = useSelector((s) => s.messages);
  const { classes } = useSelector((s) => s.academic);

  // Broadcast State
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    content: '',
    type: 'general',
    target: 'all', // 'all', 'class', 'fee_dues', 'single_student'
    targetClassId: '',
    targetStudentId: ''
  });

  const [studentSearch, setStudentSearch] = useState('');
  const { list: studentList } = useSelector((s) => s.students);

  useEffect(() => {
    dispatch(fetchClasses());
    dispatch(fetchBroadcastHistory());
  }, [dispatch]);

  // Handle student search
  useEffect(() => {
    if (broadcastForm.target === 'single_student' && studentSearch.length > 1) {
      const timer = setTimeout(() => {
        dispatch(fetchStudents({ search: studentSearch, limit: 10 }));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [studentSearch, broadcastForm.target, dispatch]);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.content.trim()) return toast.error("Message content is required");
    if (broadcastForm.target === 'class' && !broadcastForm.targetClassId) return toast.error("Please select a target class");

    try {
      await dispatch(sendBroadcast(broadcastForm)).unwrap();
      toast.success("Broadcast sent successfully");
      setBroadcastForm({
        title: '',
        content: '',
        type: 'general',
        target: 'all',
        targetClassId: '',
        targetStudentId: ''
      });
      setStudentSearch('');
    } catch (err) {
      toast.error(err?.error || "Failed to send broadcast");
    }
  };

  const handleFeeReminderTemplate = () => {
    setBroadcastForm({
      ...broadcastForm,
      title: 'Fee Payment Reminder',
      type: 'fee_reminder',
      target: 'fee_dues',
      content: 'Dear Parent, this is a reminder regarding the pending school fees for your ward. Please ensure payment is made at the earliest to avoid late fines. Thank you.'
    });
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parent Communication Center</h1>
          <p className="text-gray-500 text-sm mt-1">Broadcast important notifications and fee reminders to families</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Composer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-6 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-600/20 text-primary-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
              </div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Compose New Broadcast</h2>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Message Title</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Urgent Notice"
                    value={broadcastForm.title}
                    onChange={(e) => setBroadcastForm({...broadcastForm, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Notification Type</label>
                  <select 
                    className="input-field"
                    value={broadcastForm.type}
                    onChange={(e) => setBroadcastForm({...broadcastForm, type: e.target.value})}
                  >
                    <option value="general">General Notification</option>
                    <option value="fee_reminder">Fee Payment Reminder</option>
                    <option value="exam">Exam Schedule</option>
                    <option value="emergency">Emergency Alert</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Target Audience</label>
                  <select 
                    className="input-field"
                    value={broadcastForm.target}
                    onChange={(e) => setBroadcastForm({...broadcastForm, target: e.target.value, targetStudentId: '', targetClassId: ''})}
                  >
                    <option value="all">Every Student (Whole School)</option>
                    <option value="class">Specific Class</option>
                    <option value="single_student">Specific Student</option>
                    <option value="fee_dues">Only Fee Defaulters</option>
                  </select>
                </div>
                {broadcastForm.target === 'class' && (
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1.5">Select Class</label>
                    <select 
                      className="input-field"
                      value={broadcastForm.targetClassId}
                      onChange={(e) => setBroadcastForm({...broadcastForm, targetClassId: e.target.value})}
                      required
                    >
                      <option value="">-- Choose Class --</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
                {broadcastForm.target === 'single_student' && (
                  <div className="relative">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1.5">Search Student (Name / ID)</label>
                    <input 
                      type="text"
                      className="input-field"
                      placeholder="Type name or roll..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                    />
                    {broadcastForm.target === 'single_student' && studentList?.length > 0 && studentSearch.length > 1 && !broadcastForm.targetStudentId && (
                      <div className="absolute z-50 w-full mt-1 bg-navy-900 border border-white/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                        {studentList.map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setBroadcastForm({...broadcastForm, targetStudentId: s.id});
                              setStudentSearch(`${s.firstName} ${s.lastName} (${s.studentId})`);
                            }}
                            className="w-full text-left p-3 hover:bg-primary-600/20 border-b border-white/5 last:border-0"
                          >
                            <p className="text-sm font-bold text-white">{s.firstName} {s.lastName}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">ID: {s.studentId} • Class: {s.class?.name}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    {broadcastForm.targetStudentId && (
                      <button 
                        type="button"
                        onClick={() => {
                          setBroadcastForm({...broadcastForm, targetStudentId: ''});
                          setStudentSearch('');
                        }}
                        className="absolute right-3 top-9 text-[10px] text-red-500 font-bold uppercase hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Message Content</label>
                  <button 
                    type="button" 
                    onClick={handleFeeReminderTemplate}
                    className="text-[9px] font-black text-primary-400 uppercase tracking-tight hover:underline"
                  >
                    Use Fee Template
                  </button>
                </div>
                <textarea 
                  className="input-field min-h-[120px] py-3 leading-relaxed" 
                  placeholder="Type the message parents will receive..."
                  value={broadcastForm.content}
                  onChange={(e) => setBroadcastForm({...broadcastForm, content: e.target.value})}
                  required
                ></textarea>
              </div>

              <div className="pt-2">
                <button type="submit" className="btn btn-primary w-full py-3 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-600/20">
                  Send Broadcast to Families
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* History */}
        <div className="space-y-6">
          <div className="glass p-5 rounded-2xl border border-white/5">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 pb-3 border-b border-white/5">Broadcast history</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {broadcasts.length === 0 && <p className="text-center text-xs text-gray-600 py-4">No broadcasts sent yet.</p>}
              {broadcasts.map(b => (
                <div key={b.id} className="p-4 rounded-xl bg-navy-800/50 border border-white/5 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-tighter ${
                      b.type === 'fee_reminder' ? 'bg-warning/20 text-warning' : 
                      b.type === 'emergency' ? 'bg-danger/20 text-danger' : 'bg-primary-600/20 text-primary-400'
                    }`}>
                      {b.type.replace('_', ' ')}
                    </span>
                    <span className="text-[8px] text-gray-600 font-bold uppercase">{new Date(b.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[11px] font-black text-white leading-tight mb-1">{b.title}</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed truncate-2-lines line-clamp-2">{b.content}</p>
                  <div className="pt-2 flex items-center justify-between border-t border-white/5 mt-1">
                    <span className="text-[9px] text-primary-400 font-bold uppercase tracking-tighter">Target: {b.target === 'class' ? b.class?.name : b.target.toUpperCase()}</span>
                    <span className="text-[9px] text-success font-black uppercase tracking-tighter">{b.recipientCount} Recipients</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
