import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudents } from '../store/slices/studentSlice';
import { fetchClasses } from '../store/slices/academicSlice';
import { fetchPayments, recordPayment, fetchFeeStructures } from '../store/slices/feeSlice';
import { fetchSettings } from '../store/slices/settingSlice';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Fees() {
  const dispatch = useDispatch();
  const { list: students, loading } = useSelector((s) => s.students);
  const { classes } = useSelector((s) => s.academic);
  const { payments, structures } = useSelector((s) => s.fees);
  const { school } = useSelector((s) => s.settings);
  
  const [classId, setClassId] = useState('');
  const [search, setSearch] = useState('');
  const [recentPayments, setRecentPayments] = useState([]);
  const [historyStudent, setHistoryStudent] = useState(null);
  const [historyPayments, setHistoryPayments] = useState([]);
  const searchTimeout = useRef(null);
  
  const [feeStudent, setFeeStudent] = useState(null);
  const [feeYear, setFeeYear] = useState(new Date().getFullYear());
  const [processFeeMonth, setProcessFeeMonth] = useState(null);
  const [feeForm, setFeeForm] = useState({ amount: '500', vehicleFee: '', examFee: '', pujaFee: '', electricityFee: '', paymentMethod: 'Cash' });
  const [receiptData, setReceiptData] = useState(null);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const fetchHistory = async (student) => {
    setHistoryStudent(student);
    const loadingToast = toast.loading('Fetching history...');
    try {
      const res = await dispatch(fetchPayments({ studentId: student.id, limit: 1000 })).unwrap();
      setHistoryPayments(res.payments);
      toast.dismiss(loadingToast);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to fetch history');
    }
  };

  useEffect(() => {
    dispatch(fetchClasses());
    dispatch(fetchFeeStructures());
    dispatch(fetchSettings());
    // Fetch global recent payments
    dispatch(fetchPayments({ limit: 10 })).unwrap().then(res => {
      setRecentPayments(res.payments);
    });
  }, [dispatch]);

  useEffect(() => {
    if (classId || search) {
      dispatch(fetchStudents({ page: 1, limit: 100, classId, search }));
    }
  }, [dispatch, classId, search]);

  useEffect(() => {
    if (feeStudent) {
      dispatch(fetchPayments({ studentId: feeStudent.id, year: feeYear, limit: 100 }));
    }
  }, [dispatch, feeStudent, feeYear]);

  const handlePayFeeClick = (monthStr) => {
    // Find tuition fee for this student's class
    const classId = feeStudent?.classId || feeStudent?.class?.id;
    const structure = structures?.find(s => s.classId === classId && s.feeType === 'Tuition');
    const defaultAmount = structure ? structure.amount : '0';

    setProcessFeeMonth(monthStr);
    setFeeForm({ amount: defaultAmount, vehicleFee: '', examFee: '', pujaFee: '', electricityFee: '', paymentMethod: 'Cash' });
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!feeForm.amount || isNaN(feeForm.amount) || Number(feeForm.amount) < 0) {
      return toast.error('Enter a valid amount');
    }
    
    const loadingToast = toast.loading('Processing payment...');
    try {
      const res = await dispatch(recordPayment({
        studentId: feeStudent.id,
        month: processFeeMonth,
        year: feeYear,
        amount: feeForm.amount,
        vehicleFee: feeForm.vehicleFee,
        examFee: feeForm.examFee,
        pujaFee: feeForm.pujaFee,
        electricityFee: feeForm.electricityFee,
        paymentMethod: feeForm.paymentMethod
      })).unwrap();
      
      toast.dismiss(loadingToast);
      toast.success(`Fee paid for ${processFeeMonth} ${feeYear}`);
      setProcessFeeMonth(null);
      
      setReceiptData({
        ...res.payment,
        student: feeStudent,
        studentName: `${feeStudent.firstName} ${feeStudent.lastName}`,
        month: processFeeMonth,
        year: feeYear
      });
      
      // refresh payments for current student
      dispatch(fetchPayments({ studentId: feeStudent.id, year: feeYear, limit: 100 }));
      
      // also refresh global recent collections
      dispatch(fetchPayments({ limit: 10 })).unwrap().then(res => {
        setRecentPayments(res.payments);
      });
    } catch(err) {
      toast.dismiss(loadingToast);
      toast.error(err.error || 'Payment failed');
    }
  };

  const totalFeeAmount = (parseFloat(feeForm.amount) || 0) + 
                         (parseFloat(feeForm.vehicleFee) || 0) + 
                         (parseFloat(feeForm.examFee) || 0) + 
                         (parseFloat(feeForm.pujaFee) || 0) + 
                         (parseFloat(feeForm.electricityFee) || 0);

  const columns = [
    { key: 'studentId', label: 'Student ID' },
    { key: 'name', label: 'Name & Roll', render: (r) => (
      <span>
        {r.firstName} {r.lastName} {r.rollNo && <span className="text-gray-500 text-sm ml-1">(Roll: {r.rollNo})</span>}
      </span>
    ) },
    { key: 'class', label: 'Class', render: (r) => r.class?.name || '-' },
    { key: 'fatherName', label: "Father's Name", render: (r) => r.fatherName || '-' },
    { key: 'parentPhone', label: 'Phone', render: (r) => r.parentPhone || '-' },
    { 
      key: 'dueAmount', 
      label: 'Fees Due', 
      render: (r) => (
        <div className="flex flex-col">
          <span className={`font-bold text-sm ${r.dueAmount > 0 ? 'text-red-500' : 'text-success'}`}>
            ₹{r.dueAmount}
          </span>
          <span className="text-[10px] text-gray-400 uppercase tracking-tighter">Current Session</span>
        </div>
      ) 
    },
    {
      key: 'actions', label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <button onClick={() => setFeeStudent(r)} className="text-[10px] bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white px-3 py-1 rounded border border-green-600/30 transition-all font-bold uppercase tracking-tighter">
            Collect Fee
          </button>
          <button onClick={() => fetchHistory(r)} className="text-[10px] bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-3 py-1 rounded border border-blue-600/30 transition-all font-bold uppercase tracking-tighter">
            History
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collect Student Fees</h1>
          <p className="text-gray-500 text-sm mt-1">Search and record fee payments for students</p>
        </div>
      </div>

      <div className="glass p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex-1">
          <label className="block text-sm text-gray-600 mb-1">Select Class</label>
          <select 
            className="input-field" 
            value={classId} 
            onChange={(e) => { 
               const newClassId = e.target.value;
               setClassId(newClassId); 
               setSearch(''); 
               if (newClassId) {
                 dispatch(fetchStudents({ page: 1, limit: 100, classId: newClassId, search: '' }));
               }
            }}
          >
            <option value="">Select a class...</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-600 mb-1">Search Student</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Search by name or ID..." 
            value={search} 
            onChange={(e) => { 
                const newSearch = e.target.value;
                setSearch(newSearch); 
                setClassId(''); 
                
                if (searchTimeout.current) clearTimeout(searchTimeout.current);
                searchTimeout.current = setTimeout(() => {
                  if(newSearch) dispatch(fetchStudents({ page: 1, limit: 100, classId: '', search: newSearch }));
                }, 300);
            }} 
          />
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        (classId || search) ? (
          <DataTable columns={columns} data={students} emptyMessage="No students found." />
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="w-2 h-6 bg-primary-500 rounded-full"></span>
              Recent Fee Collections
            </h2>
            <DataTable 
              columns={[
                { key: 'receiptNo', label: 'Receipt' },
                { key: 'student', label: 'Student', render: (r) => `${r.student?.firstName} ${r.student?.lastName}` },
                { key: 'class', label: 'Class', render: (r) => r.student?.class?.name || '-' },
                { key: 'month', label: 'Month', render: (r) => `${r.month} ${r.year}` },
                { key: 'totalPaid', label: 'Total', render: (r) => `₹${r.totalPaid}` },
                { key: 'paidDate', label: 'Date', render: (r) => new Date(r.paidDate || r.createdAt).toLocaleDateString('en-GB') },
                { 
                  key: 'actions', 
                  label: 'Actions', 
                  render: (r) => (
                    <button 
                      onClick={() => setReceiptData({...r, studentName: `${r.student?.firstName} ${r.student?.lastName}`})} 
                      className="text-[10px] bg-primary-600/20 text-primary-400 hover:bg-primary-600 hover:text-white px-3 py-1 rounded border border-primary-600/30 transition-all font-bold uppercase tracking-tighter"
                    >
                      View Receipt
                    </button>
                  ) 
                }
              ]} 
              data={recentPayments} 
              emptyMessage="No recent collections found." 
            />
          </div>
        )
      )}

      {/* History Modal */}
      <Modal isOpen={!!historyStudent} onClose={() => setHistoryStudent(null)} title={`${historyStudent?.firstName}'s Payment History`} maxWidth="max-w-5xl">
        <div className="space-y-4">
          <div className="flex justify-between items-center sm:px-2">
            <div>
              <p className="text-sm text-gray-500">Full payment records for {historyStudent?.firstName} {historyStudent?.lastName}</p>
              <p className="text-xs text-gray-400">Total Records: {historyPayments.length}</p>
            </div>
            <button onClick={() => setHistoryStudent(null)} className="btn btn-ghost">Close</button>
          </div>
          
          <DataTable 
            columns={[
              { key: 'receiptNo', label: 'Receipt' },
              { key: 'period', label: 'Period', render: (r) => `${r.month} ${r.year}` },
              { key: 'totalPaid', label: 'Amount', render: (r) => `₹${r.totalPaid}` },
              { key: 'paidDate', label: 'Paid On', render: (r) => new Date(r.paidDate || r.createdAt).toLocaleDateString('en-GB') },
              { key: 'method', label: 'Mode', render: (r) => r.paymentMethod },
              { 
                key: 'actions', 
                label: 'Actions', 
                render: (r) => (
                  <button 
                    onClick={() => setReceiptData({...r, student: historyStudent, studentName: `${historyStudent.firstName} ${historyStudent.lastName}`})} 
                    className="text-primary-500 hover:text-primary-700 font-bold text-xs bg-primary-50 px-3 py-1 rounded"
                  >
                    View Receipt
                  </button>
                ) 
              }
            ]} 
            data={historyPayments} 
            emptyMessage="No payment history found for this student."
          />
        </div>
      </Modal>

      {/* Fee Modal - Reused from Classes */}
      <Modal isOpen={!!feeStudent} onClose={() => setFeeStudent(null)} title="Student Fee Management" maxWidth="max-w-4xl">
        {feeStudent && (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 border-r border-white/5 pr-4">
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center shrink-0 border-2 border-primary-500/20 overflow-hidden mb-3">
                  {feeStudent.photo ? <img src={feeStudent.photo} alt="Student" className="w-full h-full object-cover" /> : <span className="text-3xl font-bold text-gray-400">{feeStudent.firstName?.charAt(0)}</span>}
                </div>
                <h3 className="text-lg font-bold text-white">{feeStudent.firstName} {feeStudent.lastName}</h3>
                <span className="px-3 py-1 bg-primary-500/10 text-primary-400 text-[10px] font-bold uppercase tracking-wider rounded-full mt-2 border border-primary-500/20">ID: {feeStudent.studentId}</span>
              </div>
              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex justify-between border-b border-white/5 pb-2"><span>Class</span> <strong className="text-white">{feeStudent.class?.name || '-'}</strong></div>
                <div className="flex justify-between border-b border-white/5 pb-2"><span>Roll No</span> <strong className="text-white">{feeStudent.rollNo || '-'}</strong></div>
                <div className="flex justify-between border-b border-white/5 pb-2"><span>Father</span> <strong className="text-white">{feeStudent.fatherName || '-'}</strong></div>
                
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Vehicle Transport</span> 
                  <strong className={feeStudent.hasVehicle ? 'text-success' : 'text-danger'}>
                    {feeStudent.hasVehicle ? 'Yes' : 'No'}
                  </strong>
                </div>

                <div className="pt-2 border-t border-primary-500/20 mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-500 uppercase">Total Due</span>
                    <strong className="text-xl text-red-500">₹{feeStudent.dueAmount || 0}</strong>
                  </div>
                  {feeStudent.dueAmount > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded p-2 mt-2">
                       <p className="text-[10px] text-red-400 font-bold uppercase mb-1">Pending Months:</p>
                       <div className="flex flex-wrap gap-1">
                         {months.map((m, idx) => {
                           const isPaid = payments?.some(p => p.month === m && parseInt(p.year) === feeYear);
                           const now = new Date();
                           
                           // Check if month is after admission
                           let meetsAdmission = true;
                           if (feeStudent.admissionDate) {
                             const adm = new Date(feeStudent.admissionDate);
                             if (feeYear < adm.getFullYear()) meetsAdmission = false;
                             if (feeYear === adm.getFullYear() && idx <= adm.getMonth()) meetsAdmission = false;
                           }

                           const isPast = feeYear < now.getFullYear() || (feeYear === now.getFullYear() && idx < now.getMonth());
                           if (isPast && !isPaid && meetsAdmission) {
                             return <span key={m} className="text-[9px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded font-bold border border-red-500/30">{m}</span>;
                           }
                           return null;
                         })}
                       </div>
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-start gap-2">
                      <svg className="w-3.5 h-3.5 text-primary-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <div>
                        <p className="text-[10px] text-gray-400 leading-relaxed">
                          <strong className="text-primary-400 uppercase tracking-tighter">Note:</strong> Fees are automatically calculated from the month <span className="text-white font-bold italic">after</span> admission. However, management can manually collect fees for any month if needed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                <h3 className="font-semibold text-white">Monthly Fees</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Year</span>
                  <select className="input-field py-1 px-2 text-sm" value={feeYear} onChange={(e) => setFeeYear(parseInt(e.target.value))}>
                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {months.map((month, idx) => {
                  const paymentRecord = payments?.find(p => p.month === month && parseInt(p.year) === feeYear);
                  const isPaid = !!paymentRecord;
                  
                  const now = new Date();
                  const currentMonthIdx = now.getMonth();
                  const curYear = now.getFullYear();
                  
                  // Start counting dues from NEXT month after admission
                  let afterAdmission = true;
                  if (feeStudent.admissionDate) {
                    const adm = new Date(feeStudent.admissionDate);
                    if (feeYear < adm.getFullYear()) afterAdmission = false;
                    if (feeYear === adm.getFullYear() && idx <= adm.getMonth()) afterAdmission = false;
                  }

                  const isDue = !isPaid && afterAdmission && (feeYear < curYear || (feeYear === curYear && idx < currentMonthIdx));
                  
                  return (
                    <div key={month} className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center transition-all ${isPaid ? 'border-success/30 bg-success/5' : isDue ? 'border-red-500/50 bg-red-500/5 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'border-white/5 bg-navy-800'}`}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{month}</span>
                        {isDue && <span className="text-[9px] bg-red-500 text-white px-1 rounded font-black animate-pulse">DUE</span>}
                      </div>
                      
                      {isPaid ? (
                        <div className="flex flex-col items-center">
                          <span className="text-success text-sm font-bold flex items-center gap-1 mb-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Paid
                          </span>
                          <button onClick={() => setReceiptData({...paymentRecord, student: feeStudent, studentName: `${feeStudent.firstName} ${feeStudent.lastName}`})} className="text-[10px] text-primary-400 underline hover:text-primary-300 font-bold uppercase tracking-tighter">View Receipt</button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handlePayFeeClick(month)} 
                          className={`px-3 py-1 text-white text-xs font-bold rounded transition-colors w-full ${isDue ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20' : 'bg-primary-600 hover:bg-primary-700'}`}
                        >
                          {isDue ? 'Pay Due Fee' : 'Pay Now'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Process Payment Modal */}
      <Modal isOpen={!!processFeeMonth} onClose={() => setProcessFeeMonth(null)} title={`Process Payment - ${processFeeMonth} ${feeYear}`} maxWidth="max-w-2xl">
        <form onSubmit={handleConfirmPayment} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tuition Fee (Required) (₹)</label>
              <input type="number" className="input-field font-semibold text-lg" value={feeForm.amount} onChange={(e) => setFeeForm({...feeForm, amount: e.target.value})} required min="0" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Vehicle Fee (Optional) (₹)</label>
              <input type="number" className="input-field" value={feeForm.vehicleFee} onChange={(e) => setFeeForm({...feeForm, vehicleFee: e.target.value})} min="0" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Exam Fee (Optional) (₹)</label>
              <input type="number" className="input-field" value={feeForm.examFee} onChange={(e) => setFeeForm({...feeForm, examFee: e.target.value})} min="0" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Saraswati Puja Fee (Optional) (₹)</label>
              <input type="number" className="input-field" value={feeForm.pujaFee} onChange={(e) => setFeeForm({...feeForm, pujaFee: e.target.value})} min="0" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Electricity Fee (Optional) (₹)</label>
              <input type="number" className="input-field" value={feeForm.electricityFee} onChange={(e) => setFeeForm({...feeForm, electricityFee: e.target.value})} min="0" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Payment Method</label>
              <select className="input-field" value={feeForm.paymentMethod} onChange={(e) => setFeeForm({...feeForm, paymentMethod: e.target.value})}>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="NetBanking">Net Banking</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          
          <div className="p-3 bg-gray-100 border border-gray-200 rounded flex justify-between items-center mt-2">
            <span className="font-semibold text-gray-400">Total Payable Amount:</span>
            <span className="text-xl font-bold text-gray-900">₹{totalFeeAmount}</span>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setProcessFeeMonth(null)} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary px-6">Confirm Payment</button>
          </div>
        </form>
      </Modal>

      {/* Printing Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #receipt-print, #receipt-print * { 
            visibility: visible !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            color: #000 !important;
          }
          #receipt-print { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            margin: 0 !important; 
            padding: 15px !important;
            border: none !important; 
            box-shadow: none !important; 
            background-color: white !important; 
          }
          .print-bg-blue { background-color: #2563eb !important; color: #fff !important; }
          #receipt-print h2 { font-size: 22px !important; margin-bottom: 2px !important; }
          #receipt-print .print-text-lg { font-size: 11px !important; }
          #receipt-print span, #receipt-print strong { font-size: 10px !important; }
          #receipt-print table td, #receipt-print table th { font-size: 10px !important; padding: 4px !important; }
          #receipt-print .inline-block { padding: 2px 8px !important; }
        }
      `}</style>

      {/* Receipt Modal */}
      <Modal isOpen={!!receiptData} onClose={() => setReceiptData(null)} title="Payment Receipt" maxWidth="max-w-2xl">
        {receiptData && (
          <div className="flex flex-col h-full">
            <div id="receipt-print" className="p-6 border border-gray-200 rounded-lg shrink-0 flex flex-col w-full" style={{ backgroundColor: '#ffffff', minHeight: '600px' }}>
                <div className="flex flex-col mb-4 shrink-0 border-b pb-4" style={{ borderColor: '#1e3a8a', color: '#000' }}>
                   <div className="flex justify-between items-start mb-2">
                      <div className="text-left flex-1">
                         <h2 className="text-2xl font-extrabold uppercase tracking-widest leading-tight" style={{ color: '#1e3a8a' }}>{school?.name || "ST. XAVIER'S SCHOOL"}</h2>
                         {school?.tagline && <p className="text-[10px] font-bold text-gray-500 mt-0.5 italic">{school.tagline}</p>}
                         <div className="mt-1 space-y-0.5">
                            <p className="text-[9px] text-gray-600">Email: {school?.email || '-'} | Phone: {school?.phone || '-'}</p>
                            <p className="text-[9px] text-gray-600">Address: {school?.address || '-'}</p>
                            <p className="text-[9px] text-gray-600">Principal: {school?.principalName || '-'}</p>
                         </div>
                      </div>
                      {school?.logo && <img src={school.logo} alt="School Logo" className="w-16 h-16 object-contain" />}
                   </div>
                   <div className="w-full text-center mt-2">
                     <div className="inline-block px-10 py-1 rounded-full bg-blue-600 text-white font-bold uppercase tracking-wider text-[9px] print-bg-blue">
                       Official Fee Receipt
                     </div>
                   </div>
                </div>
               
                <div className="space-y-4 text-sm sm:text-base p-6 rounded-xl flex-1 print-text-lg" style={{ backgroundColor: '#fcfcfc', color: '#111', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                   <div className="flex flex-col gap-y-2 mb-2 pb-4 border-b" style={{ borderColor: '#e2e8f0' }}>
                     <div className="flex justify-between border-b border-gray-100 pb-1"><span>Receipt No:</span> <strong style={{ color: '#000' }}>{receiptData.receiptNo}</strong></div>
                     <div className="flex justify-between border-b border-gray-100 pb-1"><span>Date:</span> <strong>{new Date(receiptData.paidDate || receiptData.createdAt).toLocaleDateString('en-GB')}</strong></div>
                     
                     <div className="flex justify-between border-b border-gray-100 pb-1"><span>Student Name:</span> <strong style={{ color: '#000', fontSize: '1.1em' }}>{receiptData.studentName}</strong></div>
                     <div className="flex justify-between border-b border-gray-100 pb-1"><span>Class:</span> <strong style={{ color: '#000' }}>{receiptData.student?.class?.name || '-'}</strong></div>
                     <div className="flex justify-between border-b border-gray-100 pb-1"><span>Student ID:</span> <strong style={{ color: '#000' }}>{receiptData.student?.studentId || '-'}</strong></div>
                     <div className="flex justify-between border-b border-gray-100 pb-1"><span>Student Aadhaar:</span> <strong style={{ color: '#000' }}>{receiptData.student?.studentAadhaar || '-'}</strong></div>
                     
                     <div className="flex justify-between border-b border-gray-100 pb-1"><span>Parent Name:</span> <strong style={{ color: '#000' }}>{receiptData.student?.fatherName || receiptData.student?.motherName || '-'}</strong></div>
                     <div className="flex justify-between border-b border-gray-100 pb-1"><span>Parent Phone:</span> <strong style={{ color: '#000' }}>{receiptData.student?.parentPhone || '-'}</strong></div>
                     <div className="flex justify-between border-b border-gray-100 pb-1"><span>Parent Aadhaar:</span> <strong style={{ color: '#000' }}>{receiptData.student?.parentAadhaar || '-'}</strong></div>
                     
                     <div className="flex justify-between border-b border-gray-100 pb-1"><span>Address:</span> <strong style={{ color: '#000', maxWidth: '300px', textAlign: 'right' }}>{receiptData.student?.address || '-'}</strong></div>
                     <div className="flex justify-between border-b border-gray-100 pb-1"><span>For Month:</span> <strong style={{ color: '#000' }}>{receiptData.month} {receiptData.year}</strong></div>
                   </div>

                  <div className="py-4">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b" style={{ borderColor: '#e2e8f0' }}>
                          <th className="py-2 font-semibold">Description</th>
                          <th className="py-2 text-right font-semibold">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: '#f1f5f9' }}>
                        <tr><td className="py-2">Tuition Fee</td> <td className="py-2 text-right">₹{receiptData.amount}</td></tr>
                        {receiptData.vehicleFee > 0 && <tr><td className="py-2">Vehicle Fee</td> <td className="py-2 text-right">₹{receiptData.vehicleFee}</td></tr>}
                        {receiptData.examFee > 0 && <tr><td className="py-2">Exam Fee</td> <td className="py-2 text-right">₹{receiptData.examFee}</td></tr>}
                        {receiptData.pujaFee > 0 && <tr><td className="py-2">Saraswati Puja Fee</td> <td className="py-2 text-right">₹{receiptData.pujaFee}</td></tr>}
                        {receiptData.electricityFee > 0 && <tr><td className="py-2">Electricity Fee</td> <td className="py-2 text-right">₹{receiptData.electricityFee}</td></tr>}
                        {receiptData.lateFee > 0 && <tr><td className="py-2 text-red-600">Late Fee</td> <td className="py-2 text-right text-red-600">₹{receiptData.lateFee}</td></tr>}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2" style={{ borderColor: '#1e3a8a' }}>
                          <td className="py-3 font-bold text-lg">Total Paid</td>
                          <td className="py-3 text-right font-bold text-xl" style={{ color: '#1e3a8a' }}>₹{receiptData.totalPaid}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="mt-8 flex justify-between items-end italic text-xs text-gray-500">
                    <div>
                      <p>Payment Mode: {receiptData.paymentMethod}</p>
                      <p>Status: {receiptData.status}</p>
                    </div>
                    <div className="text-center min-w-[150px]">
                      <div className="border-t border-gray-400 mt-12 pt-1 font-bold text-gray-800 uppercase tracking-tighter">Principal Signature</div>
                    </div>
                  </div>
               </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setReceiptData(null)} className="btn btn-ghost">Close</button>
              <button onClick={() => window.print()} className="btn btn-primary px-8 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Print Receipt
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Transaction History Modal */}
      <Modal isOpen={!!historyStudent} onClose={() => { setHistoryStudent(null); setHistoryPayments([]); }} title={`Payment History - ${historyStudent?.firstName} ${historyStudent?.lastName}`} maxWidth="max-w-4xl">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center bg-navy-800 p-4 rounded-xl border border-white/5">
            <div>
              <p className="text-gray-400 text-xs uppercase font-bold mb-1">Student Details</p>
              <h3 className="text-lg font-bold text-white">{historyStudent?.firstName} {historyStudent?.lastName}</h3>
              <p className="text-sm text-gray-500">ID: {historyStudent?.studentId} | Roll: {historyStudent?.rollNo || '-'}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs uppercase font-bold mb-1">Academic Info</p>
              <p className="text-white font-bold">{historyStudent?.class?.name || '-'}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-widest">
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Receipt No</th>
                  <th className="py-3 px-2">Month/Year</th>
                  <th className="py-3 px-2">Mode</th>
                  <th className="py-3 px-2 text-right">Total Paid</th>
                  <th className="py-3 px-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {historyPayments && historyPayments.length > 0 ? (
                  historyPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-2 text-gray-300">{new Date(p.paidDate || p.createdAt).toLocaleDateString('en-GB')}</td>
                      <td className="py-4 px-2 font-mono text-xs text-primary-400">{p.receiptNo}</td>
                      <td className="py-4 px-2 text-white font-semibold">{p.month} {p.year}</td>
                      <td className="py-4 px-2 text-gray-400 text-xs">{p.paymentMethod}</td>
                      <td className="py-4 px-2 text-right font-bold text-success">₹{p.totalPaid}</td>
                      <td className="py-4 px-2 text-center">
                        <button 
                          onClick={() => setReceiptData({ ...p, student: historyStudent, studentName: `${historyStudent.firstName} ${historyStudent.lastName}` })}
                          className="text-[10px] bg-primary-600/20 text-primary-400 hover:bg-primary-600 hover:text-white px-3 py-1 rounded-full border border-primary-600/30 transition-all font-bold uppercase tracking-tighter"
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-500 italic">No transactions found for this student.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-4">
            <button onClick={() => { setHistoryStudent(null); setHistoryPayments([]); }} className="btn btn-ghost px-8">Close History</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
