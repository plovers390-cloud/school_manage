import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudents, createStudent, updateStudent, deleteStudent, getStudentById } from '../store/slices/studentSlice';
import { fetchClasses } from '../store/slices/academicSlice';
import { fetchPayments } from '../store/slices/feeSlice';
import { fetchSettings } from '../store/slices/settingSlice';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ImageCropper from '../components/ImageCropper';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export default function Students() {
  const dispatch = useDispatch();
  const { list, pagination, loading } = useSelector((s) => s.students);
  const { classes } = useSelector((s) => s.academic);
  const { payments } = useSelector((s) => s.fees);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [infoStudent, setInfoStudent] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    studentId: '', rollNo: '', firstName: '', lastName: '', dob: '', gender: 'Male',
    classId: '', fatherName: '', motherName: '', parentPhone: '', parentEmail: '', address: '', status: 'active', photo: '',
    studentAadhaar: '', parentAadhaar: '', religion: '', caste: '', postOffice: '', policeStation: '', pincode: '',
    fatherTitle: 'Mr.', motherTitle: 'Mrs.', phoneCode: '+91', hasVehicle: false, state: '',
    admissionFee: '', admissionPaymentMethod: 'Cash', payAdmissionFee: false
  });
  const [tempImage, setTempImage] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const school = useSelector((s) => s.settings.school);

  const formatAadhaar = (val) => {
    return val.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().substring(0, 14);
  };

  useEffect(() => {
    dispatch(fetchStudents({ page, limit: 20, search }));
    dispatch(fetchClasses());
    dispatch(fetchSettings());
  }, [dispatch, page, search]);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setShowModal(true);
      // Remove the parameter so it doesn't open again on page refresh
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const resetForm = () => {
    setForm({
      studentId: '', rollNo: '', firstName: '', lastName: '', dob: '', gender: 'Male', classId: '',
      fatherName: '', motherName: '', parentPhone: '', parentEmail: '', address: '', status: 'active', photo: '',
      studentAadhaar: '', parentAadhaar: '', religion: '', caste: '', postOffice: '', policeStation: '', pincode: '',
      customReligion: '', customCaste: '', fatherTitle: 'Mr.', motherTitle: 'Mrs.', phoneCode: '+91', hasVehicle: false, state: '',
      admissionFee: '', admissionPaymentMethod: 'Cash', payAdmissionFee: false
    });
    setEditingStudent(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (payload.religion === 'Other' && payload.customReligion) {
        payload.religion = payload.customReligion;
      }
      if (payload.caste === 'Other' && payload.customCaste) {
        payload.caste = payload.customCaste;
      }
      if (payload.fatherName) payload.fatherName = `${payload.fatherTitle} ${payload.fatherName}`;
      if (payload.motherName) payload.motherName = `${payload.motherTitle} ${payload.motherName}`;
      if (payload.parentPhone) payload.parentPhone = `${payload.phoneCode} ${payload.parentPhone}`;

      delete payload.customReligion;
      delete payload.customCaste;
      delete payload.fatherTitle;
      delete payload.motherTitle;
      delete payload.phoneCode;

      const formData = new FormData();
      Object.keys(payload).forEach(key => {
        // Handle photo specifically if it's a blob from the cropper
        if (key === 'photo' && payload[key] instanceof Blob) {
          formData.append('photo', payload[key], 'student-photo.jpg');
        } else if (payload[key] !== null && payload[key] !== undefined) {
          formData.append(key, payload[key]);
        }
      });

      if (editingStudent) {
        await dispatch(updateStudent({ id: editingStudent.id, formData })).unwrap();
        toast.success('Student updated!');
      } else {
        const res = await dispatch(createStudent(formData)).unwrap();
        toast.success('Student created!');
        
        // Handle admission receipt
        if (res.payment) {
          setReceiptData({
            ...res.payment,
            student: res.student,
            studentName: `${res.student.firstName} ${res.student.lastName}`
          });
        }
      }
      setShowModal(false);
      resetForm();
      dispatch(fetchStudents({ page, limit: 20, search }));
    } catch (err) {
      toast.error(err?.error || 'Failed');
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
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
      studentId: student.studentId, rollNo: student.rollNo || '', firstName: student.firstName, lastName: student.lastName,
      dob: student.dob, gender: student.gender, classId: student.classId || '',
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
      fatherTitle: fTitle, motherTitle: mTitle, phoneCode: pCode,
      hasVehicle: !!student.hasVehicle,
      state: student.state || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this student?')) {
      await dispatch(deleteStudent(id)).unwrap();
      toast.success('Student deleted');
    }
  };

  const handleViewInfo = async (student) => {
    try {
      const res = await dispatch(getStudentById(student.id)).unwrap();
      setInfoStudent(res.student);
      // Also fetch payments for current year audit
      dispatch(fetchPayments({ studentId: student.id, year: new Date().getFullYear(), limit: 100 }));
    } catch (err) {
      toast.error('Failed to load student details');
    }
  };

  const handlePrintAdmissionFromInfo = () => {
    if (!infoStudent?.admissionPayment) return;
    setReceiptData({
      ...infoStudent.admissionPayment,
      student: infoStudent,
      studentName: `${infoStudent.firstName} ${infoStudent.lastName}`
    });
  };

  const columns = [
    { key: 'studentId', label: 'Student ID' },
    { key: 'rollNo', label: 'Roll No', render: (r) => r.rollNo || '-' },
    { key: 'name', label: 'Name', render: (r) => `${r.firstName} ${r.lastName}` },
    { key: 'gender', label: 'Gender' },
    { key: 'class', label: 'Class', render: (r) => r.class?.name || '-' },
    { key: 'fatherName', label: 'Father Name', render: (r) => r.fatherName || '-' },
    { key: 'parentPhone', label: 'Contact', render: (r) => r.parentPhone || '-' },
    {
      key: 'status', label: 'Status',
      render: (r) => (
        <span className={`badge ${r.status === 'active' ? 'badge-success' : r.status === 'transferred' ? 'badge-warning' : 'badge-danger'}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <button onClick={() => handleViewInfo(r)} className="text-[10px] bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-3 py-1 rounded border border-blue-600/30 transition-all font-bold uppercase tracking-tighter">Info</button>
          <button onClick={() => handleEdit(r)} className="text-[10px] bg-primary-600/20 text-primary-400 hover:bg-primary-600 hover:text-white px-3 py-1 rounded border border-primary-600/30 transition-all font-bold uppercase tracking-tighter">Edit</button>
          <button onClick={() => handleDelete(r.id)} className="text-[10px] bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1 rounded border border-red-600/30 transition-all font-bold uppercase tracking-tighter">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Admission & Search</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination?.total || 0} total students</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary">
          + New Admission
        </button>
      </div>

      {/* Search */}
      <div className="glass p-4">
        <input
          type="text"
          className="input-field"
          placeholder="Search by name or roll number..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {loading ? <LoadingSpinner /> : <DataTable columns={columns} data={list} emptyMessage="No students found" />}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1.5 rounded-lg text-sm ${page === i + 1 ? 'btn-primary' : 'btn-ghost'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingStudent ? 'Edit Student' : 'Add New Student'} isFullScreen={true}>
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Student ID {editingStudent ? '' : '(Auto-generated)'}</label>
              <input 
                className="input-field bg-gray-50 cursor-not-allowed" 
                value={editingStudent ? form.studentId : 'AUTO'} 
                readOnly 
                placeholder="Auto-generated" 
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Roll Number (Optional)</label>
              <input className="input-field" value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} placeholder="Enter roll number" />
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
              <input type="date" className="input-field" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Gender *</label>
              <select className="input-field" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} required>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Class *</label>
              <select className="input-field" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} required>
                <option value="">Select Class</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Father Name *</label>
              <div className="flex w-full">
                <select className="input-field border-r-0 rounded-r-none flex-none !w-[4.8rem] px-2 bg-gray-50 focus:ring-0" value={form.fatherTitle} onChange={(e) => setForm({ ...form, fatherTitle: e.target.value })}>
                  <option value="Mr.">Mr.</option>
                  <option value="Late">Late</option>
                </select>
                <input className="input-field rounded-l-none flex-1" value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Mother Name *</label>
              <div className="flex w-full">
                <select className="input-field border-r-0 rounded-r-none flex-none !w-[4.8rem] px-2 bg-gray-50 focus:ring-0" value={form.motherTitle} onChange={(e) => setForm({ ...form, motherTitle: e.target.value })}>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Late">Late</option>
                </select>
                <input className="input-field rounded-l-none flex-1" value={form.motherName} onChange={(e) => setForm({ ...form, motherName: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Parent Phone *</label>
              <div className="flex w-full">
                <select className="input-field border-r-0 rounded-r-none flex-none !w-[6rem] px-2 bg-gray-50 focus:ring-0" value={form.phoneCode} onChange={(e) => setForm({ ...form, phoneCode: e.target.value })}>
                  <option value="+91">+91 (IN)</option>
                  <option value="+1">+1 (US)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+971">+971 (AE)</option>
                </select>
                <input className="input-field rounded-l-none flex-1" value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value.replace(/\D/g, '').substring(0, 10) })} placeholder="10-digit number" required />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Parent Email *</label>
              <input type="email" className="input-field" value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} required />
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
              <label className="block text-sm text-gray-600 mb-2">Uses Vehicle Transport?</label>
              <div className="flex gap-4 p-2.5 border border-gray-200 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="hasVehicle" 
                    className="w-4 h-4 text-primary-600 accent-primary-600"
                    checked={form.hasVehicle === true} 
                    onChange={() => setForm({ ...form, hasVehicle: true })} 
                  />
                  <span className="text-sm font-medium text-gray-700">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="hasVehicle" 
                    className="w-4 h-4 text-primary-600 accent-primary-600"
                    checked={form.hasVehicle === false} 
                    onChange={() => setForm({ ...form, hasVehicle: false })} 
                  />
                  <span className="text-sm font-medium text-gray-700">No</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Student Aadhaar *</label>
              <input className="input-field" value={form.studentAadhaar} onChange={(e) => setForm({ ...form, studentAadhaar: formatAadhaar(e.target.value) })} placeholder="XXXX XXXX XXXX" required />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Parent Aadhaar *</label>
              <input className="input-field" value={form.parentAadhaar} onChange={(e) => setForm({ ...form, parentAadhaar: formatAadhaar(e.target.value) })} placeholder="XXXX XXXX XXXX" required />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Religion *</label>
              <select className="input-field" value={form.religion} onChange={(e) => setForm({ ...form, religion: e.target.value })} required>
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
                <input className="input-field" value={form.customReligion} onChange={(e) => setForm({ ...form, customReligion: e.target.value })} required placeholder="Enter religion" />
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Caste *</label>
              <select className="input-field" value={form.caste} onChange={(e) => setForm({ ...form, caste: e.target.value })} required>
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
                <input className="input-field" value={form.customCaste} onChange={(e) => setForm({ ...form, customCaste: e.target.value })} required placeholder="Enter caste" />
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Post Office *</label>
              <input className="input-field" value={form.postOffice} onChange={(e) => setForm({ ...form, postOffice: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Police Station *</label>
              <input className="input-field" value={form.policeStation} onChange={(e) => setForm({ ...form, policeStation: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Pincode *</label>
              <input className="input-field" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">State *</label>
              <select className="input-field" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required>
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm text-gray-600 mb-1">Address / Street *</label> 
              <textarea 
                className="input-field w-full h-24" 
                value={form.address} 
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
                placeholder="Enter full address"
              ></textarea>
            </div>
            <div className="sm:col-span-2 lg:col-span-3 border-t border-gray-100 pt-6 mt-2">
              <h3 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Admission Fee Payment (Optional)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-primary-50/30 p-4 rounded-xl border border-primary-100/50">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="payAdmissionFee"
                    className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500" 
                    checked={form.payAdmissionFee} 
                    onChange={(e) => setForm({ ...form, payAdmissionFee: e.target.checked })} 
                  />
                  <label htmlFor="payAdmissionFee" className="text-sm font-semibold text-gray-700 cursor-pointer">Collect Admission Fee?</label>
                </div>
                {form.payAdmissionFee && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Amount (₹) *</label>
                      <input 
                        type="number" 
                        className="input-field" 
                        value={form.admissionFee} 
                        onChange={(e) => setForm({ ...form, admissionFee: e.target.value })} 
                        required={form.payAdmissionFee}
                        placeholder="e.g. 500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Payment Method</label>
                      <select className="input-field" value={form.admissionPaymentMethod} onChange={(e) => setForm({ ...form, admissionPaymentMethod: e.target.value })}>
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Card">Card</option>
                        <option value="NetBanking">Net Banking</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn btn-ghost">Cancel</button>
              <button type="submit" className="btn btn-primary">{editingStudent ? 'Update' : 'Create'} Student</button>
            </div>
          </div>
          <div className="w-full md:w-56 mt-4 flex flex-col items-center">
            <label className="block text-sm text-gray-600 mb-2 font-semibold">Student Photo</label>
            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden flex justify-center items-center mb-3 bg-gray-50">
              {form.photo ? (
                <img src={form.photo} alt="Student preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-xs text-center px-2">No photo selected</span>
              )}
            </div>
            <label className="btn btn-ghost border border-gray-300 text-sm cursor-pointer hover:bg-gray-100">
              Upload Photo
              <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setTempImage(reader.result);
                  reader.readAsDataURL(file);
                }
                e.target.value = ''; // Reset input to allow same file selection
              }} />
            </label>
          </div>
        </form>
      </Modal>

      {/* Image Cropper Modal */}
      {tempImage && (
        <ImageCropper 
          image={tempImage} 
          onCropComplete={(croppedImg) => {
            setForm({ ...form, photo: croppedImg });
            setTempImage(null);
          }}
          onCancel={() => setTempImage(null)}
        />
      )}      {/* Info Modal */}
      <Modal isOpen={!!infoStudent} onClose={() => setInfoStudent(null)} title={`Student Information - ${infoStudent?.firstName} ${infoStudent?.lastName}`} isFullScreen={true}>
        {infoStudent && (
          <div className="flex flex-col gap-6">
            {/* Hero Section Card */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-navy-800 p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary-600/10 transition-all duration-700"></div>
              
              <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 w-full md:w-auto">
                {/* Photo in Hero */}
                <div className="relative group/photo">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/10 flex justify-center items-center bg-navy-900 shrink-0 shadow-lg">
                    {infoStudent.photo ? (
                      <img 
                        src={infoStudent.photo instanceof Blob ? URL.createObjectURL(infoStudent.photo) : infoStudent.photo} 
                        alt="Student" 
                        className="w-full h-full object-cover" 
                      />
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
                  <p className="text-primary-400 text-[10px] uppercase font-black tracking-[0.2em] mb-1">Student Details</p>
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
              {/* Identification Section */}
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
                    <span className="text-sm text-white font-bold">{infoStudent.dob}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-300/50 font-black uppercase block mb-0.5 tracking-wider">Gender</span>
                    <span className="text-sm text-white font-bold">{infoStudent.gender}</span>
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

              {/* Contact/Address Section */}
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
          <button onClick={() => setInfoStudent(null)} className="btn btn-primary px-12 py-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-600/20">Close Info</button>
        </div>
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
            page-break-inside: avoid !important;
          }
          .print-bg-blue { background-color: #2563eb !important; color: #fff !important; }
          #receipt-print h2 { font-size: 22px !important; margin-bottom: 2px !important; }
          #receipt-print .print-text-lg { font-size: 11px !important; }
          #receipt-print span, #receipt-print strong { font-size: 10px !important; }
          #receipt-print table td, #receipt-print table th { font-size: 10px !important; padding: 4px !important; }
          #receipt-print .inline-block { padding: 2px 8px !important; }
          
          @page {
            size: A4;
            margin: 0mm;
          }
        }
      `}</style>

      {/* Admission Receipt Modal */}
      <Modal isOpen={!!receiptData} onClose={() => setReceiptData(null)} title="Admission Fee Receipt" maxWidth="max-w-2xl">
        {receiptData && (
          <div className="flex flex-col h-full">
            <div id="receipt-print" className="p-6 border border-gray-200 rounded-lg shrink-0 flex flex-col w-full" style={{ backgroundColor: '#ffffff', minHeight: '750px' }}>
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
                       Admission Fee Receipt
                     </div>
                   </div>
                </div>
               
               <div className="space-y-4 text-sm sm:text-base p-6 rounded-xl flex-1" style={{ backgroundColor: '#fcfcfc', color: '#111', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div className="flex flex-col gap-y-2 mb-3 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>
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
                    <div className="flex justify-between border-b border-gray-100 pb-1"><span>For:</span> <strong style={{ color: '#000' }}>Admission {new Date().getFullYear()}</strong></div>
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
                        <tr><td className="py-2">Admission Fee</td> <td className="py-2 text-right">₹{receiptData.admissionFee}</td></tr>
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
                    <div className="space-y-0.5">
                      <p>Payment Mode: <span className="font-bold text-gray-700">{receiptData.paymentMethod}</span></p>
                      <p>Transaction Type: <span className="font-bold text-gray-700">New Admission Fee</span></p>
                      <p>Status: <span className="text-success font-bold">{receiptData.status}</span></p>
                    </div>
                    <div className="text-center min-w-[180px] flex flex-col items-center">
                      <div className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-full flex items-center justify-center text-[7px] text-gray-300 font-bold mb-2 uppercase tracking-tighter text-center leading-tight">
                        School Seal <br/> Area
                      </div>
                      <div className="w-full border-t-2 pt-1 font-black text-gray-900 uppercase tracking-widest text-[9px]" style={{ borderColor: '#1e3a8a' }}>
                        Principal Signature
                      </div>
                      <p className="text-[8px] text-gray-400 mt-0.5 not-italic font-bold tracking-tight">(Authorised Signatory)</p>
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

      {/* Re-use Image Cropper for info modal photo change */}
      {tempImage && infoStudent && !showModal && (
        <ImageCropper 
          image={tempImage} 
          onCropComplete={async (croppedImg) => {
            try {
              const updated = await dispatch(updateStudent({ id: infoStudent.id, photo: croppedImg })).unwrap();
              setInfoStudent(updated);
              dispatch(fetchStudents({ page, limit: 20, search }));
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
    </div>
  );
}
