import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTeacherPayments, createTeacherPayment } from '../store/slices/teacherPaymentSlice';
import { fetchTeachers } from '../store/slices/academicSlice';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';
import api from '../services/api';
import toast from 'react-hot-toast';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'UPI'];

export default function TeacherPayments() {
  const dispatch = useDispatch();
  const { payments, loading } = useSelector((state) => state.teacherPayments);
  const { teachers } = useSelector((state) => state.academic);
  
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    teacherId: '',
    amount: '',
    month: MONTHS[new Date().getMonth()],
    year: new Date().getFullYear(),
    paymentMethod: 'Bank Transfer',
    transactionId: '',
    remarks: ''
  });
  const [auditTeacherId, setAuditTeacherId] = useState('');

  useEffect(() => {
    dispatch(fetchTeachers());
    dispatch(fetchTeacherPayments());
  }, [dispatch]);

  const handleTeacherChange = (e) => {
    const selectedId = e.target.value;
    const teacher = teachers.find(t => t.id === selectedId);
    
    setForm(prev => ({
      ...prev,
      teacherId: selectedId,
      amount: teacher && teacher.salary ? teacher.salary : prev.amount
    }));
  };

  const currentYearPayments = (auditTeacherId || form.teacherId) 
    ? payments.filter(p => p.teacherId === (auditTeacherId || form.teacherId) && p.year === parseInt(form.year))
    : [];

  const getMonthStatus = (month, targetTeacherId) => {
    const isPaid = (payments.filter(p => p.teacherId === targetTeacherId && p.year === parseInt(form.year)))
      .some(p => p.month === month);
    if (isPaid) return 'Paid';

    const teacher = teachers.find(t => t.id === targetTeacherId);
    if (!teacher) return '—';

    const joinDate = new Date(teacher.joiningDate);
    const monthIndex = MONTHS.indexOf(month);
    const currentDate = new Date();
    const checkDate = new Date(form.year, monthIndex, 1);

    if (checkDate > currentDate) return 'Upcoming';
    if (checkDate < new Date(joinDate.getFullYear(), joinDate.getMonth(), 1)) return '—';

    return 'Due';
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (!form.teacherId || !form.amount || !form.month || !form.year) {
        return toast.error("Please fill all required fields");
      }
      // Amount is expected as number
      const payload = { ...form, amount: parseFloat(form.amount), year: parseInt(form.year) };
      await dispatch(createTeacherPayment(payload)).unwrap();
      toast.success('Payment recorded successfully!');
      setShowModal(false);
      // Reset form
      setForm({
        teacherId: '', amount: '', month: MONTHS[new Date().getMonth()], year: new Date().getFullYear(), paymentMethod: 'Bank Transfer', transactionId: '', remarks: ''
      });
      dispatch(fetchTeacherPayments());
    } catch (err) {
      toast.error(err?.error || 'Failed to record payment');
    }
  };

  const handlePrint = async (paymentId) => {
    try {
      const response = await api.get(`/teacher-payments/receipt/${paymentId}`, {
        responseType: 'blob'
      });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const pdfWindow = window.open();
      pdfWindow.location.href = fileURL;
    } catch (err) {
      toast.error('Failed to open print preview');
    }
  };

  const columns = [
    { key: 'teacher', label: 'Teacher', render: (p) => p.teacher?.name || 'Unknown' },
    { key: 'monthYear', label: 'Period', render: (p) => `${p.month} ${p.year}` },
    { key: 'amount', label: 'Amount', render: (p) => `₹${p.amount}` },
    { key: 'paymentDate', label: 'Payment Date', render: (p) => new Date(p.paymentDate).toLocaleDateString() },
    { key: 'paymentMethod', label: 'Method' },
    { 
      key: 'actions', 
      label: 'Actions', 
      render: (p) => (
        <button 
          onClick={() => handlePrint(p.id)} 
          className="text-[10px] bg-primary-600/20 text-primary-400 hover:bg-primary-600 hover:text-white px-3 py-1 rounded border border-primary-600/30 transition-all font-bold uppercase tracking-tighter"
        >
          Print Receipt
        </button>
      ) 
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Payroll Payments</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-navy-800/50 px-3 py-1.5 rounded-lg border border-white/5 shadow-sm focus-within:border-primary-500 transition-all">
            <label className="text-[10px] font-bold text-blue-300/50 uppercase tracking-widest">Audit:</label>
            <select 
              className="bg-transparent border-none text-sm focus:ring-0 p-0 text-white outline-none min-w-[150px] cursor-pointer"
              value={auditTeacherId}
              onChange={(e) => setAuditTeacherId(e.target.value)}
            >
              <option value="" className="bg-navy-900 text-white">-- Select Teacher --</option>
              {teachers.map(t => <option key={t.id} value={t.id} className="bg-navy-900 text-white">{t.name}</option>)}
            </select>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            + Record Payment
          </button>
        </div>
      </div>

      {auditTeacherId && (
        <div className="glass p-6 rounded-2xl animate-fade-in relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-600/10 rounded-full blur-3xl"></div>
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {teachers.find(t => t.id === auditTeacherId)?.name}
              </h2>
              <p className="text-sm text-primary-400 font-medium">Monthly Payroll Status Audit • {form.year}</p>
            </div>
            <button 
              onClick={() => setAuditTeacherId('')} 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-white hover:bg-danger transition-all"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3 relative z-10">
            {MONTHS.map(m => {
              const status = getMonthStatus(m, auditTeacherId);
              let cardStyle = "border-gray-200 text-gray-500 bg-gray-100/30";
              let statusText = "gray-400";
              
              if (status === 'Paid') {
                cardStyle = "border-success/30 bg-success/5 text-success ring-1 ring-success/20";
                statusText = "text-success";
              } else if (status === 'Due') {
                cardStyle = "border-warning/30 bg-warning/5 text-warning ring-1 ring-warning/20";
                statusText = "text-warning";
              } else if (status === 'Upcoming') {
                cardStyle = "border-primary-500/20 bg-primary-500/5 text-primary-400 opacity-80";
                statusText = "text-primary-500/60";
              }
              
              return (
                <div key={m} className={`flex flex-col items-center justify-center py-3 px-1 rounded-xl text-center border transition-all hover:translate-y-[-2px] ${cardStyle}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">{m.substring(0, 3)}</span>
                  {status === 'Paid' ? (
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black leading-none">PAID</span>
                      <span className="text-xs mt-0.5">●</span>
                    </div>
                  ) : status === 'Due' ? (
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black leading-none">DUE</span>
                      <span className="text-xs mt-0.5 opacity-50">○</span>
                    </div>
                  ) : (
                    <span className="text-[9px] font-bold opacity-40 uppercase">{status === 'Upcoming' ? 'NEXT' : '—'}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="glass p-4 rounded-xl">
        <DataTable 
          data={auditTeacherId ? payments.filter(p => p.teacherId === auditTeacherId) : payments} 
          columns={columns} 
        />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Teacher Salary/Payment">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Teacher</label>
            <select className="input-field" value={form.teacherId} onChange={handleTeacherChange} required>
              <option value="">-- Choose a teacher --</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name} (Emp ID: {t.employeeId})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select className="input-field" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} required>
                {MONTHS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input type="number" className="input-field" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} required min="2000" max="2100" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
              <input type="number" className="input-field" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required min="1" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
              <select className="input-field" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} required>
                {METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID / Ref (Optional)</label>
            <input type="text" className="input-field" value={form.transactionId} onChange={(e) => setForm({ ...form, transactionId: e.target.value })} placeholder="e.g. UTR Number" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label>
            <textarea className="input-field" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Any notes..."></textarea>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
