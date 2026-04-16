import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudents, updateStudent, deleteStudent } from '../store/slices/studentSlice';
import { fetchClasses } from '../store/slices/academicSlice';
import { fetchPayments, recordPayment } from '../store/slices/feeSlice';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ImageCropper from '../components/ImageCropper';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Classes() {
  const dispatch = useDispatch();
  const { list: students, loading } = useSelector((s) => s.students);
  const { classes } = useSelector((s) => s.academic);
  const { payments } = useSelector((s) => s.fees);
  
  const [classId, setClassId] = useState('');
  const [search, setSearch] = useState('');
  const searchTimeout = useRef(null);
  
  const [infoStudent, setInfoStudent] = useState(null);
  const [transferStudent, setTransferStudent] = useState(null);
  const [feeStudent, setFeeStudent] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [isBulkTransfer, setIsBulkTransfer] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [form, setForm] = useState({});
  const [tempImage, setTempImage] = useState(null);
  const [feeYear, setFeeYear] = useState(new Date().getFullYear());
  const [processFeeMonth, setProcessFeeMonth] = useState(null);
  const [feeForm, setFeeForm] = useState({ amount: '500', vehicleFee: '', examFee: '', pujaFee: '', electricityFee: '', paymentMethod: 'Cash' });
  const [receiptData, setReceiptData] = useState(null);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    dispatch(fetchClasses());
  }, [dispatch]);

  useEffect(() => {
    // Only fetch if class selected OR global search entered
    if (classId || search) {
      dispatch(fetchStudents({ page: 1, limit: 100, classId, search }));
      setSelectedIds([]); // Clear selection when list changes
    }
  }, [dispatch, classId, search]);

  useEffect(() => {
    if (feeStudent) {
      dispatch(fetchPayments({ studentId: feeStudent.id, year: feeYear, limit: 100 }));
    }
  }, [dispatch, feeStudent, feeYear]);

  const handleSelectAll = (e) => {
    if (e.target.checked && students.length) setSelectedIds(students.map((s) => s.id));
    else setSelectedIds([]);
  };

  const handleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleStudentPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setTempImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this student?')) {
      await dispatch(deleteStudent(id)).unwrap();
      toast.success('Student deleted');
      dispatch(fetchStudents({ page: 1, limit: 100, classId, search }));
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected students? This action cannot be undone.`)) {
      try {
        const promises = selectedIds.map((id) => dispatch(deleteStudent(id)).unwrap());
        await Promise.all(promises);
        toast.success(`${selectedIds.length} students deleted!`);
        setSelectedIds([]);
        dispatch(fetchStudents({ page: 1, limit: 100, classId, search }));
      } catch (err) {
        toast.error('Failed to delete some students');
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form.id && editStudent) { 
        const payload = { ...form };
        if (payload.religion === 'Other' && payload.customReligion) payload.religion = payload.customReligion;
        if (payload.caste === 'Other' && payload.customCaste) payload.caste = payload.customCaste;
        if (payload.fatherName) payload.fatherName = `${payload.fatherTitle} ${payload.fatherName}`;
        if (payload.motherName) payload.motherName = `${payload.motherTitle} ${payload.motherName}`;
        if (payload.parentPhone) payload.parentPhone = `${payload.phoneCode} ${payload.parentPhone}`;

        delete payload.customReligion;
        delete payload.customCaste;
        delete payload.fatherTitle;
        delete payload.motherTitle;
        delete payload.phoneCode;

        await dispatch(updateStudent(payload)).unwrap();
        toast.success('Student info updated successfully!');
        setEditStudent(null);
      } else if (isBulkTransfer) {
        const promises = selectedIds.map(id => dispatch(updateStudent({ id, ...form })).unwrap());
        await Promise.all(promises);
        toast.success(`${selectedIds.length} students transferred successfully!`);
        setIsBulkTransfer(false);
        setSelectedIds([]);
      } else if (transferStudent) {
        await dispatch(updateStudent({ id: transferStudent.id, ...form })).unwrap();
        toast.success('Student transferred successfully!');
        setTransferStudent(null);
      }
      if (classId || search) {
        dispatch(fetchStudents({ page: 1, limit: 100, classId, search }));
      }
    } catch (err) {
      toast.error(err.error || 'Operation failed');
    }
  };

  const openTransfer = (student) => {
    setIsBulkTransfer(false);
    setTransferStudent(student);
    setForm({ classId: student.classId || '', status: student.status });
  };

  const openBulkTransfer = () => {
    setTransferStudent(null);
    setEditStudent(null);
    setIsBulkTransfer(true);
    setForm({ classId: '', status: 'active' });
  };

  const formatAadhaar = (val) => {
    return val.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().substring(0, 14);
  };

  const openEdit = (student) => {
    setIsBulkTransfer(false);
    setTransferStudent(null);
    setEditStudent(student);
    const predefinedReligions = ['Hindu', 'Muslim', 'Christian', 'Sikh', ''];
    const predefinedCastes = ['General', 'OBC', 'SC', 'ST', ''];
    
    const isCustomReligion = student.religion && !predefinedReligions.includes(student.religion);
    const isCustomCaste = student.caste && !predefinedCastes.includes(student.caste);

    let fTitle = 'Mr.', mTitle = 'Mrs.', pCode = '+91';
    let fName = student.fatherName || '', mName = student.motherName || '', pPhone = student.parentPhone || '';

    if (fName.startsWith('Mr. ')) { fTitle = 'Mr.'; fName = fName.substring(4); }
    else if (fName.startsWith('Late ')) { fTitle = 'Late'; fName = fName.substring(5); }

    if (mName.startsWith('Mrs. ')) { mTitle = 'Mrs.'; mName = mName.substring(5); }
    else if (mName.startsWith('Late ')) { mTitle = 'Late'; mName = mName.substring(5); }

    if (pPhone.startsWith('+')) {
      const parts = pPhone.split(' ');
      if (parts.length > 1) {
         pCode = parts[0];
         pPhone = parts.slice(1).join(' ');
      }
    }

    setForm({
      id: student.id, studentId: student.studentId, rollNo: student.rollNo || '', firstName: student.firstName, lastName: student.lastName,
      dob: student.dob || '', gender: student.gender || 'Male', classId: student.classId || '',
      fatherName: fName, motherName: mName, 
      parentPhone: pPhone,
      parentEmail: student.parentEmail || '', address: student.address || '', status: student.status,
      photo: student.photo || '',
      studentAadhaar: student.studentAadhaar || '', parentAadhaar: student.parentAadhaar || '',
      religion: isCustomReligion ? 'Other' : (student.religion || ''), 
      customReligion: isCustomReligion ? student.religion : '',
      caste: isCustomCaste ? 'Other' : (student.caste || ''),
      customCaste: isCustomCaste ? student.caste : '',
      postOffice: student.postOffice || '', policeStation: student.policeStation || '', pincode: student.pincode || '',
      fatherTitle: fTitle, motherTitle: mTitle, phoneCode: pCode
    });
  };

  const handlePayFeeClick = (monthStr) => {
    setProcessFeeMonth(monthStr);
    setFeeForm({ amount: '500', vehicleFee: '', examFee: '', pujaFee: '', electricityFee: '', paymentMethod: 'Cash' });
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
      
      // show receipt
      setReceiptData({
        ...res.payment,
        student: feeStudent,
        studentName: `${feeStudent.firstName} ${feeStudent.lastName}`,
        month: processFeeMonth,
        year: feeYear
      });
      
      // refresh payments
      dispatch(fetchPayments({ studentId: feeStudent.id, year: feeYear, limit: 100 }));
    } catch(err) {
      toast.dismiss(loadingToast);
      toast.error(err.error || 'Payment failed');
    }
  };

  const handlePrintAdmissionFromInfo = async () => {
    if (!infoStudent?.admissionPayment) return;
    try {
      const response = await api.get(`/fees/receipt/${infoStudent.admissionPayment}`, {
        responseType: 'blob'
      });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const pdfWindow = window.open();
      pdfWindow.location.href = fileURL;
    } catch (err) {
      toast.error('Failed to open receipt preview');
    }
  };

  const totalFeeAmount = (parseFloat(feeForm.amount) || 0) + 
                         (parseFloat(feeForm.vehicleFee) || 0) + 
                         (parseFloat(feeForm.examFee) || 0) + 
                         (parseFloat(feeForm.pujaFee) || 0) + 
                         (parseFloat(feeForm.electricityFee) || 0);

  const handleViewInfo = async (student) => {
    try {
      setInfoStudent(student);
      // Fetch current year payments for audit
      dispatch(fetchPayments({ studentId: student.id, year: new Date().getFullYear(), limit: 100 }));
    } catch (err) {
      toast.error('Failed to load payment history');
    }
  };

  const columns = [
    { 
      key: 'checkbox', 
      label: <input type="checkbox" onChange={handleSelectAll} checked={students.length > 0 && selectedIds.length === students.length} className="cursor-pointer" />, 
      render: (r) => <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => handleSelect(r.id)} className="cursor-pointer" /> 
    },
    { key: 'studentId', label: 'Student ID' },
    { key: 'name', label: 'Name & Roll', render: (r) => (
      <span>
        {r.firstName} {r.lastName} {r.rollNo && <span className="text-gray-500 text-sm ml-1">(Roll: {r.rollNo})</span>}
      </span>
    ) },
    { key: 'class', label: 'Class', render: (r) => r.class?.name || '-' },
    { key: 'fatherName', label: 'Father Name', render: (r) => r.fatherName || '-' },
    { key: 'parentPhone', label: 'Contact', render: (r) => r.parentPhone || '-' },
    {
      key: 'actions', label: 'Actions',
      render: (r) => (
        <div className="flex gap-2 items-center flex-wrap">
          <button onClick={() => handleViewInfo(r)} className="text-[10px] bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-3 py-1 rounded border border-blue-600/30 transition-all font-bold uppercase tracking-tighter">Info</button>
          <button onClick={() => openEdit(r)} className="text-[10px] bg-primary-600/20 text-primary-400 hover:bg-primary-600 hover:text-white px-3 py-1 rounded border border-primary-600/30 transition-all font-bold uppercase tracking-tighter">Edit</button>
          <button onClick={() => handleDelete(r.id)} className="text-[10px] bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1 rounded border border-red-600/30 transition-all font-bold uppercase tracking-tighter">Delete</button>
          <button onClick={() => openTransfer(r)} className="text-[10px] bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white px-3 py-1 rounded border border-purple-600/30 transition-all font-bold uppercase tracking-tighter">Transfer</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Classes</h1>
          {classId && (
            <p className="text-gray-500 text-sm mt-1">
              {students.length} student(s) currently in selected class
            </p>
          )}
        </div>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
            <span className="text-sm font-medium text-blue-800">{selectedIds.length} selected</span>
            <button onClick={openBulkTransfer} className="btn btn-primary text-sm py-1">Bulk Transfer</button>
            <button onClick={handleBulkDelete} className="btn px-4 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors border-0">Bulk Delete</button>
          </div>
        )}
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
               setSelectedIds([]);
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
          <label className="block text-sm text-gray-600 mb-1">Global Search</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Search by name or ID globally..." 
            value={search} 
            onChange={(e) => { 
                const newSearch = e.target.value;
                setSearch(newSearch); 
                setClassId(''); 
                setSelectedIds([]);
                
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
          <div className="glass p-8 text-center text-gray-500">
            Please select a class or use the global search to view students.
          </div>
        )
      )}

      {/* Info Modal */}
      <Modal isOpen={!!infoStudent} onClose={() => setInfoStudent(null)} title={`Student Info - ${infoStudent?.firstName} ${infoStudent?.lastName}`} isFullScreen={true}>
        {infoStudent && (
          <div className="flex flex-col gap-6">
            {/* Hero Card Section */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-navy-800 p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary-600/10 transition-all duration-700"></div>
              
              <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 w-full md:w-auto">
                {/* Photo in Hero */}
                <div className="relative group/photo">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/10 flex justify-center items-center bg-navy-900 shrink-0 shadow-lg">
                    {infoStudent.photo ? (
                      <img src={infoStudent.photo} alt="Student" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl text-gray-700 font-bold uppercase">{infoStudent.firstName ? infoStudent.firstName.charAt(0) : '?'}</span>
                    )}
                  </div>
                  <label className="absolute bottom-1 right-1 w-8 h-8 bg-primary-600 text-white rounded-lg flex items-center justify-center cursor-pointer shadow-lg hover:bg-primary-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setTempImage(reader.result);
                        reader.readAsDataURL(file);
                      }
                      e.target.value = '';
                    }} />
                  </label>
                </div>

                <div className="text-center md:text-left">
                  <p className="text-primary-400 text-[10px] uppercase font-black tracking-[0.2em] mb-1">Attendance Record Profile</p>
                  <h3 className="text-2xl font-black text-white leading-tight">{infoStudent.firstName} {infoStudent.lastName}</h3>
                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-3 gap-y-1 mt-2 font-mono text-xs">
                    <span className="text-gray-400">ID: <span className="text-white font-bold">{infoStudent.studentId}</span></span>
                    <span className="text-gray-600">|</span>
                    <span className="text-gray-400">ROLL: <span className="text-white font-bold">{infoStudent.rollNo || '-'}</span></span>
                  </div>
                </div>
              </div>

              <div className="mt-6 md:mt-0 text-center md:text-right relative z-10 bg-white/5 md:bg-transparent p-4 md:p-0 rounded-xl w-full md:w-auto">
                <p className="text-gray-500 text-[10px] uppercase font-black tracking-[0.2em] mb-1">Academic Info</p>
                <p className="text-xl font-black text-white">{infoStudent.class?.name || '-'}</p>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 ${infoStudent.status === 'active' ? 'bg-success/20 text-success border border-success/30' : 'bg-danger/20 text-danger border border-danger/30'}`}>
                   <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                   {infoStudent.status}
                </div>
              </div>
            </div>

            {/* Grid for categorized info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Identity Section */}
              <div className="bg-navy-800/50 p-5 rounded-2xl border border-white/5 space-y-4">
                <h4 className="text-primary-400 text-[10px] font-black uppercase tracking-[0.2em] pb-2 border-b border-white/5 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-4 0h4" /></svg>
                  Identification
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-blue-300/50 font-black uppercase block mb-0.5 tracking-wider">Aadhaar Number</span>
                    <span className="text-sm text-white font-bold">{infoStudent.studentAadhaar || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-300/50 font-black uppercase block mb-0.5 tracking-wider">Date of Birth</span>
                    <span className="text-sm text-white font-bold">{infoStudent.dob || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-300/50 font-black uppercase block mb-0.5 tracking-wider">Gender</span>
                    <span className="text-sm text-white font-bold">{infoStudent.gender || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-300/50 font-black uppercase block mb-0.5 tracking-wider">Religion / Caste</span>
                    <span className="text-sm text-white font-bold">{infoStudent.religion || '-'} / {infoStudent.caste || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Family Section */}
              <div className="bg-navy-800/50 p-5 rounded-2xl border border-white/5 space-y-4">
                <h4 className="text-primary-400 text-[10px] font-black uppercase tracking-[0.2em] pb-2 border-b border-white/5 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  Family Details
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-blue-300/50 font-black uppercase block mb-0.5 tracking-wider">Father's Name</span>
                    <span className="text-sm text-white font-bold whitespace-nowrap">{infoStudent.fatherName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-300/50 font-black uppercase block mb-0.5 tracking-wider">Mother's Name</span>
                    <span className="text-sm text-white font-bold whitespace-nowrap">{infoStudent.motherName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-300/50 font-black uppercase block mb-0.5 tracking-wider">Parent Email</span>
                    <span className="text-sm text-white font-bold break-all">{infoStudent.parentEmail || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-300/50 font-black uppercase block mb-0.5 tracking-wider">Guardian Aadhaar</span>
                    <span className="text-sm text-white font-bold">{infoStudent.parentAadhaar || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Location/Contact Section */}
              <div className="bg-navy-800/50 p-5 rounded-2xl border border-white/5 space-y-4 md:col-span-2">
                <h4 className="text-primary-400 text-[10px] font-black uppercase tracking-[0.2em] pb-2 border-b border-white/5 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Location & Contact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] text-blue-300/50 font-black uppercase block mb-0.5 tracking-wider">Emergency Phone</span>
                      <span className="text-sm text-white font-black">{infoStudent.parentPhone || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-300/50 font-black uppercase block mb-0.5 tracking-wider">Full Address</span>
                      <span className="text-sm text-white font-bold leading-relaxed">{infoStudent.address || '-'}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-blue-300/50 font-black uppercase block mb-0.5 tracking-wider">State</span>
                        <span className="text-sm text-white font-bold">{infoStudent.state || '-'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-blue-300/50 font-black uppercase block mb-0.5 tracking-wider">Pincode</span>
                        <span className="text-sm text-white font-bold">{infoStudent.pincode || '-'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-300/50 font-black uppercase block mb-0.5 tracking-wider">Post Office / P.S.</span>
                      <span className="text-sm text-white font-bold">{infoStudent.postOffice || '-'} / {infoStudent.policeStation || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Administrative/Other Info */}
              <div className="bg-navy-800/50 p-5 rounded-2xl border border-white/5 space-y-4 md:col-span-2">
                <h4 className="text-primary-400 text-[10px] font-black uppercase tracking-[0.2em] pb-2 border-b border-white/5 flex items-center gap-2">
                   <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                   Administrative Status
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <span className="text-[10px] text-blue-300/50 font-black uppercase block mb-0.5 tracking-wider">Admission Date</span>
                    <span className="text-sm text-white font-bold">{infoStudent.createdAt ? new Date(infoStudent.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-300/50 font-black uppercase block mb-0.5 tracking-wider">Vehicle Transport</span>
                    {infoStudent.hasVehicle ? (
                      <span className="inline-flex items-center gap-1 text-success text-xs font-black uppercase">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Opted In
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-500 text-xs font-black uppercase">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        Not Enrolled
                      </span>
                    )}
                  </div>
                  {infoStudent?.admissionPayment && (
                    <div>
                      <span className="text-[10px] text-blue-300/50 font-black uppercase block mb-0.5 tracking-wider">Admission Receipt</span>
                      <button onClick={handlePrintAdmissionFromInfo} className="text-xs text-primary-400 hover:text-primary-300 font-bold underline flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Download/Print
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Monthly Fee Status Audit */}
              <div className="bg-navy-800/50 p-5 rounded-2xl border border-white/5 space-y-4 md:col-span-full">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <h4 className="text-primary-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                    Monthly Fee Audit - {new Date().getFullYear()}
                  </h4>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success"></span><span className="text-[9px] font-bold text-gray-500 uppercase">Paid</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-warning"></span><span className="text-[9px] font-bold text-gray-500 uppercase">Due</span></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3 pt-2">
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => {
                    const payment = payments.find(p => p.month === month && p.studentId === infoStudent.id);
                    const isPaid = !!payment;
                    
                    const admissionDate = new Date(infoStudent.admissionDate || infoStudent.createdAt);
                    const currentMonthIndex = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(month);
                    const currentYear = new Date().getFullYear();
                    const checkDate = new Date(currentYear, currentMonthIndex, 1);
                    const now = new Date();
                    const isUpcoming = checkDate > now;
                    const isBeforeAdmission = checkDate < new Date(admissionDate.getFullYear(), admissionDate.getMonth(), 1);

                    let cardStyle = "border-white/5 text-gray-600 bg-white/5";
                    let statusLabel = "—";

                    if (isPaid) {
                      cardStyle = "border-success/30 bg-success/10 text-success shadow-lg shadow-success/5";
                      statusLabel = "PAID";
                    } else if (isUpcoming) {
                      cardStyle = "border-white/5 text-gray-700 bg-white/5 opacity-50";
                      statusLabel = "NEXT";
                    } else if (isBeforeAdmission) {
                      cardStyle = "border-white/5 text-gray-800 bg-transparent opacity-20";
                      statusLabel = "N/A";
                    } else {
                      cardStyle = "border-warning/30 bg-warning/10 text-warning shadow-lg shadow-warning/5 anim-pulse-subtle";
                      statusLabel = "DUE";
                    }

                    return (
                      <div key={month} className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all hover:scale-105 ${cardStyle}`}>
                        <span className="text-[9px] font-black uppercase tracking-tighter mb-1 opacity-60">{month.substring(0, 3)}</span>
                        <span className="text-[10px] font-black tracking-tight leading-none">{statusLabel}</span>
                        {isPaid && <span className="text-[8px] mt-1 opacity-80 font-mono">₹{payment.totalPaid}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/5">
          <button onClick={() => setInfoStudent(null)} className="btn btn-primary px-12 py-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-600/20">Close Profile</button>
        </div>
      </Modal>

      {/* Re-use Image Cropper for info modal photo change */}
      {tempImage && infoStudent && !editStudent && (
        <ImageCropper 
          image={tempImage} 
          onCropComplete={async (croppedImg) => {
            try {
               const updated = await dispatch(updateStudent({ id: infoStudent.id, photo: croppedImg })).unwrap();
               setInfoStudent(updated);
               if(classId || search) dispatch(fetchStudents({ page: 1, limit: 100, classId, search }));
               toast.success('Photo updated successfully');
               setTempImage(null);
            } catch (err) { 
              toast.error('Failed to change photo'); 
              setTempImage(null);
            }
          }}
          onCancel={() => setTempImage(null)}
        />
      )}

      {/* Transfer Modals */}
      <Modal isOpen={!!transferStudent || isBulkTransfer} onClose={() => { setTransferStudent(null); setIsBulkTransfer(false); }} title={isBulkTransfer ? "Bulk Transfer Students" : "Transfer Student"}>
        {(transferStudent || isBulkTransfer) && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {isBulkTransfer ? (
              <div className="p-3 bg-blue-50 text-blue-800 rounded text-sm mb-4 border border-blue-100">
                You are about to transfer <strong>{selectedIds.length} students</strong> to a new class.
              </div>
            ) : (
              <div className="p-3 bg-blue-50 text-blue-800 rounded text-sm mb-4 border border-blue-100">
                Transferring: <strong>{transferStudent.firstName} {transferStudent.lastName}</strong> (ID: {transferStudent.studentId})
                <br />
                Current Class: <strong>{transferStudent.class?.name || '-'}</strong>
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-600 mb-1">New Class</label>
              <select className="input-field" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} required>
                <option value="">Select New Class</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Update Status</label>
              <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="transferred">Transferred out of school</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => { setTransferStudent(null); setIsBulkTransfer(false); }} className="btn btn-ghost">Cancel</button>
              <button type="submit" className="btn btn-primary">{isBulkTransfer ? 'Transfer All' : 'Transfer Student'}</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Edit Student Modal */}
      <Modal isOpen={!!editStudent} onClose={() => setEditStudent(null)} title="Edit Student Info" isFullScreen={true}>
        {editStudent && (
          <form onSubmit={handleEditSubmit} className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Student ID (Cannot be modified)</label>
                <input className="input-field bg-gray-50 cursor-not-allowed" value={form.studentId} readOnly />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Roll Number</label>
                <input className="input-field" value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">First Name *</label>
                <input className="input-field" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Last Name *</label>
                <input className="input-field" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Date of Birth *</label>
                <input type="date" className="input-field" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Gender *</label>
                <select className="input-field" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Class</label>
                <select className="input-field" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
                  <option value="">Select Class</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Father Name</label>
                <div className="flex w-full">
                  <select className="input-field border-r-0 rounded-r-none flex-none !w-[4.8rem] px-2 bg-gray-50 focus:ring-0" value={form.fatherTitle} onChange={(e) => setForm({ ...form, fatherTitle: e.target.value })}>
                    <option value="Mr.">Mr.</option>
                    <option value="Late">Late</option>
                  </select>
                  <input className="input-field rounded-l-none flex-1" value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Mother Name</label>
                <div className="flex w-full">
                  <select className="input-field border-r-0 rounded-r-none flex-none !w-[4.8rem] px-2 bg-gray-50 focus:ring-0" value={form.motherTitle} onChange={(e) => setForm({ ...form, motherTitle: e.target.value })}>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Late">Late</option>
                  </select>
                  <input className="input-field rounded-l-none flex-1" value={form.motherName} onChange={(e) => setForm({ ...form, motherName: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Parent Phone</label>
                <div className="flex w-full">
                  <select className="input-field border-r-0 rounded-r-none flex-none !w-[6rem] px-2 bg-gray-50 focus:ring-0" value={form.phoneCode} onChange={(e) => setForm({ ...form, phoneCode: e.target.value })}>
                    <option value="+91">+91 (IN)</option>
                    <option value="+1">+1 (US)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+971">+971 (AE)</option>
                  </select>
                  <input className="input-field rounded-l-none flex-1" value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value.replace(/\D/g, '').substring(0, 10) })} placeholder="10-digit number" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Parent Email</label>
                <input type="email" className="input-field" value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Status</label>
                <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="transferred">Transferred</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Student Aadhaar</label>
                <input className="input-field" value={form.studentAadhaar} onChange={(e) => setForm({ ...form, studentAadhaar: formatAadhaar(e.target.value) })} placeholder="XXXX XXXX XXXX" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Parent Aadhaar</label>
                <input className="input-field" value={form.parentAadhaar} onChange={(e) => setForm({ ...form, parentAadhaar: formatAadhaar(e.target.value) })} placeholder="XXXX XXXX XXXX" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Religion</label>
                <select className="input-field" value={form.religion} onChange={(e) => setForm({ ...form, religion: e.target.value })}>
                  <option value="">Select Religion</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Christian">Christian</option>
                  <option value="Sikh">Sikh</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {form.religion === 'Other' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Specify Religion *</label>
                  <input className="input-field" value={form.customReligion} onChange={(e) => setForm({ ...form, customReligion: e.target.value })} required />
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Caste</label>
                <select className="input-field" value={form.caste} onChange={(e) => setForm({ ...form, caste: e.target.value })}>
                  <option value="">Select Caste</option>
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {form.caste === 'Other' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Specify Caste *</label>
                  <input className="input-field" value={form.customCaste} onChange={(e) => setForm({ ...form, customCaste: e.target.value })} required />
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Post Office</label>
                <input className="input-field" value={form.postOffice} onChange={(e) => setForm({ ...form, postOffice: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Police Station</label>
                <input className="input-field" value={form.policeStation} onChange={(e) => setForm({ ...form, policeStation: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Pincode</label>
                <input className="input-field" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-sm text-gray-600 mb-1">Address / Street</label>
                <textarea className="input-field" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setEditStudent(null)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </div>
            
            <div className="w-full md:w-56 mt-4 flex flex-col items-center">
              <label className="block text-sm text-gray-600 mb-2 font-semibold">Student Photo</label>
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden flex justify-center items-center mb-3 bg-gray-50">
                {form.photo ? (
                  <img src={form.photo} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-xs text-center px-2">No photo</span>
                )}
              </div>
              <label className="btn btn-ghost border border-gray-300 text-sm cursor-pointer hover:bg-gray-100">
                Change Photo
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                  handleStudentPhotoChange(e);
                  e.target.value = '';
                }} />
              </label>
            </div>
          </form>
        )}
      </Modal>

      {/* Image Cropper Modal for Edit Modal */}
      {tempImage && editStudent && (
        <ImageCropper 
          image={tempImage} 
          onCropComplete={(croppedImg) => {
            setForm({ ...form, photo: croppedImg });
            setTempImage(null);
          }}
          onCancel={() => setTempImage(null)}
        />
      )}

      {/* Fee Modal */}
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
                <div className="flex justify-between pb-2"><span>Mother</span> <strong className="text-white">{feeStudent.motherName || '-'}</strong></div>
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
                {months.map((month) => {
                  const paymentRecord = payments?.find(p => p.month === month && parseInt(p.year) === feeYear);
                  const isPaid = !!paymentRecord;
                  
                  return (
                    <div key={month} className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center transition-all ${isPaid ? 'border-success/30 bg-success/5' : 'border-white/5 bg-navy-800'}`}>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{month}</span>
                      {isPaid ? (
                        <div className="flex flex-col items-center">
                          <span className="text-success text-sm font-bold flex items-center gap-1 mb-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Paid
                          </span>
                          <button onClick={() => setReceiptData({...paymentRecord, student: feeStudent, studentName: `${feeStudent.firstName} ${feeStudent.lastName}`})} className="text-[10px] text-primary-400 underline hover:text-primary-300 font-bold uppercase tracking-tighter">View Receipt</button>
                        </div>
                      ) : (
                        <button onClick={() => handlePayFeeClick(month)} className="px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded hover:bg-primary-700 transition-colors w-full">
                          Pay Now
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

      {/* Dynamic Printing Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-print, #receipt-print * { visibility: visible; }
          #receipt-print { 
            position: fixed !important; 
            left: 0 !important; right: 0 !important; top: 0 !important; bottom: 0 !important; 
            width: 100vw !important; height: 100vh !important; 
            padding: 40px !important; margin: 0 !important; 
            border: none !important; box-shadow: none !important; 
            background-color: white !important; 
            z-index: 999999 !important; 
            display: flex !important; flex-direction: column !important; 
          }
          /* Ensure text is nicely sized in print */
          #receipt-print .print-text-lg { font-size: 1.1rem !important; }
        }
      `}</style>

      {/* Receipt Modal */}
      <Modal isOpen={!!receiptData} onClose={() => setReceiptData(null)} title="Payment Receipt" maxWidth="max-w-2xl">
        {receiptData && (
          <div className="flex flex-col h-full">
            <div id="receipt-print" className="p-6 border border-gray-200 rounded-lg shrink-0 flex flex-col w-full" style={{ backgroundColor: '#ffffff', minHeight: '600px' }}>
               <div className="text-center mb-8 shrink-0">
                  <h2 className="text-3xl font-extrabold uppercase tracking-widest mb-2" style={{ color: '#1e3a8a' }}>St.Xavier's School (Valmikinagar)</h2>
                  <div className="inline-block px-6 py-1.5 mt-2 rounded bg-blue-600 text-white font-bold uppercase tracking-wider text-sm">
                    Fee Receipt
                  </div>
               </div>
               
               <div className="space-y-4 text-sm sm:text-base p-6 rounded-xl flex-1 print-text-lg" style={{ backgroundColor: '#fcfcfc', color: '#111', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-2 pb-4 border-b" style={{ borderColor: '#e2e8f0' }}>
                    <div className="flex justify-between col-span-2 sm:col-span-1"><span>Receipt No:</span> <strong style={{ color: '#000' }}>{receiptData.receiptNo}</strong></div>
                    <div className="flex justify-between col-span-2 sm:col-span-1"><span>Date:</span> <strong>{new Date(receiptData.paidDate || receiptData.createdAt).toLocaleDateString('en-GB')}</strong></div>
                    
                    <div className="flex justify-between col-span-2 sm:col-span-1"><span>Student Name:</span> <strong style={{ color: '#000', fontSize: '1.1em' }}>{receiptData.studentName}</strong></div>
                    <div className="flex justify-between col-span-2 sm:col-span-1"><span>Class:</span> <strong style={{ color: '#000' }}>{receiptData.student?.class?.name || '-'}</strong></div>
                    
                    <div className="flex justify-between col-span-2 sm:col-span-1"><span>Parent Name:</span> <strong style={{ color: '#000' }}>{receiptData.student?.fatherName || receiptData.student?.motherName || '-'}</strong></div>
                    <div className="flex justify-between col-span-2 sm:col-span-1"><span>Parent Phone:</span> <strong style={{ color: '#000' }}>{receiptData.student?.parentPhone || '-'}</strong></div>
                    
                    <div className="flex justify-between col-span-2 sm:col-span-1"><span>Student Aadhaar:</span> <strong style={{ color: '#000' }}>{receiptData.student?.studentAadhaar || '-'}</strong></div>
                    <div className="flex justify-between col-span-2 sm:col-span-1"><span>For Month:</span> <strong style={{ color: '#000' }}>{receiptData.month} {receiptData.year}</strong></div>
                    
                    <div className="col-span-2 flex flex-col pt-1">
                      <span className="text-gray-600">Address:</span> 
                      <strong style={{ color: '#000' }}>{receiptData.student?.address || '-'} {receiptData.student?.postOffice ? `, PO: ${receiptData.student.postOffice}` : ''} {receiptData.student?.pincode ? `, Pin: ${receiptData.student.pincode}` : ''}</strong>
                    </div>
                  </div>
                  
                  <div className="flex justify-between border-b pb-3" style={{ borderColor: '#e2e8f0' }}><span>Payment Method:</span> <strong style={{ color: '#000' }}>{receiptData.paymentMethod}</strong></div>
                  
                  <div className="py-2">
                    <h4 className="font-bold mb-3 text-gray-800 uppercase tracking-wide">Fee Breakdown</h4>
                    <div className="space-y-2.5 pl-4 border-l-4" style={{ borderColor: '#cbd5e1' }}>
                      <div className="flex justify-between"><span>Tuition Fee</span> <strong style={{ color: '#000' }}>Rs.{receiptData.amount}</strong></div>
                      {parseFloat(receiptData.vehicleFee) > 0 && <div className="flex justify-between"><span>Vehicle Fee</span> <strong style={{ color: '#000' }}>Rs.{receiptData.vehicleFee}</strong></div>}
                      {parseFloat(receiptData.examFee) > 0 && <div className="flex justify-between"><span>Exam Fee</span> <strong style={{ color: '#000' }}>Rs.{receiptData.examFee}</strong></div>}
                      {parseFloat(receiptData.pujaFee) > 0 && <div className="flex justify-between"><span>Saraswati Puja Fee</span> <strong style={{ color: '#000' }}>Rs.{receiptData.pujaFee}</strong></div>}
                      {parseFloat(receiptData.electricityFee) > 0 && <div className="flex justify-between"><span>Electricity Fee</span> <strong style={{ color: '#000' }}>Rs.{receiptData.electricityFee}</strong></div>}
                    </div>
                  </div>
                  
                  <div className="flex justify-between pt-4 mt-2 border-t-2 text-xl" style={{ borderColor: '#cbd5e1', color: '#000' }}>
                    <span className="font-semibold">Total Paid:</span> 
                    <strong style={{ color: '#1e3a8a' }}>Rs. {receiptData.totalPaid}</strong>
                  </div>
               </div>
               
               <div className="mt-auto pt-16 flex flex-col items-end shrink-0">
                  <div className="w-56 border-b-2 border-gray-800"></div>
                  <span className="text-sm font-bold mt-2 mr-6" style={{ color: '#000' }}>Principal Signature</span>
               </div>

               <div className="text-center mt-6 text-xs shrink-0" style={{ color: '#64748b' }}>
                  <p>This receipt is valid only with the authorized signature and official school seal.</p>
               </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setReceiptData(null)} className="btn btn-ghost">Close</button>
              <button onClick={() => window.print()} className="btn btn-primary px-6 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Print Receipt
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
