import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings, updateSettings } from '../store/slices/settingSlice';
import { fetchClasses, createClass, updateClass, deleteClass, fetchTeachers, createTeacher, updateTeacher, deleteTeacher } from '../store/slices/academicSlice';
import { fetchFeeStructures, createFeeStructure } from '../store/slices/feeSlice';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Setup() {
  const dispatch = useDispatch();
  const { school, loading: settingLoading } = useSelector((s) => s.settings);
  const { classes, teachers, loading: academicLoading } = useSelector((s) => s.academic);
  const { structures, loading: feeLoading } = useSelector((s) => s.fees);
  
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({ name: '', address: '', phone: '', email: '', principalName: '', tagline: '', currentSession: '', logo: '' });
  
  // Modals
  const [showClassModal, setShowClassModal] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [classForm, setClassForm] = useState({ name: '', grade: '', maxStudents: 40, sectionName: '' });

  const [showFeeModal, setShowFeeModal] = useState(false);
  const [feeForm, setFeeForm] = useState({ feeType: 'Tuition', classId: '', amount: 0, frequency: 'Monthly' });

  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editTeacher, setEditTeacher] = useState(null);
  const [teacherForm, setTeacherForm] = useState({ employeeId: '', name: '', email: '', phone: '', qualification: '', subjects: '', salary: '', photo: '' });

  
  const [infoTeacher, setInfoTeacher] = useState(null);

  useEffect(() => {
    dispatch(fetchSettings());
    dispatch(fetchClasses());
    dispatch(fetchTeachers());
    dispatch(fetchTeachers());
    dispatch(fetchFeeStructures());
  }, [dispatch]);

  useEffect(() => {
    if (school) {
      setProfileForm({ 
        name: school.name || '', 
        address: school.address || '', 
        phone: school.phone || '', 
        email: school.email || '', 
        principalName: school.principalName || '', 
        tagline: school.tagline || '', 
        currentSession: school.currentSession || '',
        logo: school.logo || ''
      });
    }
  }, [school]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(profileForm).forEach(key => {
        if (profileForm[key] !== null && profileForm[key] !== undefined) {
          formData.append(key, profileForm[key]);
        }
      });
      await dispatch(updateSettings(formData)).unwrap();
      toast.success('School profile updated!');
    } catch (err) {
      const msg = err.details ? err.details.join(', ') : (err.error || 'Failed to update profile');
      toast.error(msg);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileForm({ ...profileForm, logo: file });
    }
  };

  const handleClassSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editClass) {
        await dispatch(updateClass({ id: editClass.id, ...classForm })).unwrap();
        toast.success('Class updated!');
      } else {
        await dispatch(createClass(classForm)).unwrap();
        toast.success('Class created!');
      }
      setShowClassModal(false);
    } catch (err) { toast.error('Failed to save class'); }
  };

  const handleFeeSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createFeeStructure(feeForm)).unwrap();
      toast.success('Fee structure created!');
      setShowFeeModal(false);
    } catch (err) { toast.error('Failed to create fee structure'); }
  };

  const deleteClassItem = async (id) => {
    if (window.confirm('Delete this class?')) {
      try {
        await dispatch(deleteClass(id)).unwrap();
        toast.success('Class deleted!');
      } catch (err) { toast.error('Failed to delete'); }
    }
  };

  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(teacherForm).forEach(key => {
        if (key === 'subjects') {
          const subjects = teacherForm.subjects ? teacherForm.subjects.split(',').map(s => s.trim()) : [];
          subjects.forEach(s => formData.append('subjects[]', s));
        } else if (teacherForm[key] !== null && teacherForm[key] !== undefined) {
          formData.append(key, teacherForm[key]);
        }
      });

      if (editTeacher) {
        await dispatch(updateTeacher({ id: editTeacher.id, formData })).unwrap();
        toast.success('Teacher updated!');
      } else {
        await dispatch(createTeacher(formData)).unwrap();
        toast.success('Teacher added!');
      }
      setShowTeacherModal(false);
    } catch (err) { toast.error(err?.error || 'Failed to save teacher'); }
  };

  const deleteTeacherItem = async (id) => {
    if (window.confirm('Delete this teacher?')) {
      try {
        await dispatch(deleteTeacher(id)).unwrap();
        toast.success('Teacher deleted!');
      } catch (err) { toast.error('Failed to delete'); }
    }
  };


  const handleTeacherPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTeacherForm({ ...teacherForm, photo: file });
    }
  };

  const tabs = [
    { id: 'profile', label: 'School Profile', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { id: 'classes', label: 'Classes & Sections', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id: 'teachers', label: 'Teachers', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'fees', label: 'Fee Structure', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Setup</h1>
          <p className="text-gray-500 text-sm mt-1">Configure global school settings and academic structure</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-all font-medium text-sm
              ${activeTab === t.id 
                ? 'border-primary-600 text-primary-400 bg-primary-500/10' 
                : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} /></svg>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="glass p-8 max-w-4xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">School Name *</label>
                    <input className="input-field text-lg font-bold" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Official Email</label>
                    <input className="input-field" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} placeholder="info@school.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Number</label>
                    <input className="input-field" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+91 ..." />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">School Address</label>
                    <textarea className="input-field text-sm" rows="2" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Principal Name</label>
                    <input className="input-field" value={profileForm.principalName} onChange={(e) => setProfileForm({ ...profileForm, principalName: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Current Session</label>
                    <input className="input-field" value={profileForm.currentSession} onChange={(e) => setProfileForm({ ...profileForm, currentSession: e.target.value })} placeholder="2024-2025" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-start py-4 space-y-4">
                <div className="w-full text-center">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">School Logo</label>
                  <div className="w-48 h-48 mx-auto border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center bg-gray-50 overflow-hidden group relative">
                    {profileForm.logo ? (
                      <img 
                        src={profileForm.logo instanceof File ? URL.createObjectURL(profileForm.logo) : profileForm.logo} 
                        alt="School Logo" 
                        className="w-full h-full object-contain p-2" 
                      />
                    ) : (
                      <div className="text-center p-4">
                        <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <p className="text-xs text-gray-400 mt-2 italic">Upload high-res PNG or JPG</p>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <span className="text-white text-xs font-bold bg-white/20 backdrop-blur px-3 py-1.5 rounded-full border border-white/40">Change Logo</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-6">
              <button type="submit" disabled={settingLoading} className="btn btn-primary px-10 flex items-center gap-2">
                {settingLoading ? <LoadingSpinner size="sm" /> : 'Save Global Settings'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'classes' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-white">Classes Management</h2>
              <button onClick={() => { setEditClass(null); setClassForm({ name: '', grade: '', maxStudents: 40, sectionName: '' }); setShowClassModal(true); }} className="btn btn-primary btn-sm">+ Add Class</button>
            </div>
            <DataTable 
              columns={[
                { key: 'name', label: 'Class Name' },
                { key: 'grade', label: 'Grade' },
                { key: 'maxStudents', label: 'Capacity' },
                { key: 'sections', label: 'Sections', render: (r) => (
                  <div className="flex flex-wrap gap-1">
                    {r.sections?.length > 0 ? r.sections.map(s => <span key={s.id} className="px-2 py-0.5 bg-white/5 rounded text-[10px] uppercase font-bold">{s.name}</span>) : '-'}
                  </div>
                )},
                { key: 'actions', label: 'Actions', render: (r) => (
                  <div className="flex gap-2">
                    <button onClick={() => { setEditClass(r); setClassForm({ name: r.name, grade: r.grade, maxStudents: r.maxStudents, sectionName: '' }); setShowClassModal(true); }} className="text-[10px] bg-primary-600/20 text-primary-400 hover:bg-primary-600 hover:text-white px-3 py-1 rounded border border-primary-600/30 transition-all font-bold uppercase tracking-tighter">Edit</button>
                    <button onClick={() => deleteClassItem(r.id)} className="text-[10px] bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1 rounded border border-red-600/30 transition-all font-bold uppercase tracking-tighter">Delete</button>
                  </div>
                )}
              ]} 
              data={classes} 
              loading={academicLoading}
            />
          </div>
        )}

        {activeTab === 'teachers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-white">Teacher Profiles</h2>
              <button onClick={() => { setEditTeacher(null); setTeacherForm({ employeeId: '', name: '', email: '', phone: '', qualification: '', subjects: '', salary: '', photo: '' }); setShowTeacherModal(true); }} className="btn btn-primary btn-sm">+ Add Teacher</button>
            </div>
            <DataTable 
              columns={[
                { key: 'employeeId', label: 'ID' },
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email' },
                { key: 'subjects', label: 'Subjects', render: (r) => (r.subjects || []).join(', ') },
                { key: 'actions', label: 'Actions', render: (r) => (
                  <div className="flex gap-2">
                    <button onClick={() => setInfoTeacher(r)} className="text-[10px] bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-3 py-1 rounded border border-blue-600/30 transition-all font-bold uppercase tracking-tighter">Info</button>
                    <button onClick={() => { setEditTeacher(r); setTeacherForm({ ...r, subjects: (r.subjects || []).join(', ') }); setShowTeacherModal(true); }} className="text-[10px] bg-primary-600/20 text-primary-400 hover:bg-primary-600 hover:text-white px-3 py-1 rounded border border-primary-600/30 transition-all font-bold uppercase tracking-tighter">Edit</button>
                    <button onClick={() => deleteTeacherItem(r.id)} className="text-[10px] bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1 rounded border border-red-600/30 transition-all font-bold uppercase tracking-tighter">Delete</button>
                  </div>
                )}
              ]} 
              data={teachers} 
              loading={academicLoading}
            />
          </div>
        )}


        {activeTab === 'fees' && (
          <div className="space-y-4">
             <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-white">Fee Structures</h2>
              <button onClick={() => setShowFeeModal(true)} className="btn btn-primary btn-sm">+ New Pricing Rule</button>
            </div>
            <DataTable 
              columns={[
                { key: 'feeType', label: 'Fee Type' },
                { key: 'class', label: 'Class', render: (r) => r.class?.name || 'Global' },
                { key: 'amount', label: 'Amount', render: (r) => `₹${r.amount}` },
                { key: 'frequency', label: 'Frequency' },
              ]} 
              data={structures} 
              loading={feeLoading}
            />
          </div>
        )}
      </div>

      {/* Class Modal */}
      <Modal isOpen={showClassModal} onClose={() => setShowClassModal(false)} title={editClass ? "Edit Class" : "Add New Class"} maxWidth="max-w-md">
        <form onSubmit={handleClassSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Class Name</label>
            <input className="input-field" value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} placeholder="e.g., Class 10th" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Grade (1-12)</label>
              <input type="number" className="input-field" value={classForm.grade} onChange={(e) => setClassForm({ ...classForm, grade: e.target.value })} placeholder="10" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Capacity</label>
              <input type="number" className="input-field" value={classForm.maxStudents} onChange={(e) => setClassForm({ ...classForm, maxStudents: e.target.value })} placeholder="40" />
            </div>
          </div>
          {!editClass && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Initial Section (Optional)</label>
              <input className="input-field" value={classForm.sectionName} onChange={(e) => setClassForm({ ...classForm, sectionName: e.target.value })} placeholder="e.g., A" />
              <p className="text-[10px] text-gray-500 mt-1 italic">Leave blank if no sections needed yet</p>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowClassModal(false)} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary px-8">{editClass ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* Teacher Modal */}
      <Modal isOpen={showTeacherModal} onClose={() => setShowTeacherModal(false)} title={`${editTeacher ? 'Edit' : 'Add'} Teacher`} maxWidth="max-w-2xl">
        <form onSubmit={handleTeacherSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <input className="input-field" placeholder="Employee ID *" value={teacherForm.employeeId} onChange={(e) => setTeacherForm({ ...teacherForm, employeeId: e.target.value })} required />
                <input className="input-field" placeholder="Name *" value={teacherForm.name} onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })} required />
                <input type="email" className="input-field" placeholder="Email" value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} />
                <input className="input-field" placeholder="Phone" value={teacherForm.phone} onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })} />
                <input className="input-field" placeholder="Qualification" value={teacherForm.qualification} onChange={(e) => setTeacherForm({ ...teacherForm, qualification: e.target.value })} />
                <input className="input-field" placeholder="Subjects (comma-separated)" value={teacherForm.subjects} onChange={(e) => setTeacherForm({ ...teacherForm, subjects: e.target.value })} />
                <input type="number" className="input-field" placeholder="Salary" value={teacherForm.salary} onChange={(e) => setTeacherForm({ ...teacherForm, salary: e.target.value })} />
              </div>
              <div className="w-full md:w-48 flex flex-col items-center">
                <label className="block text-sm text-gray-400 mb-2 font-semibold">Teacher Photo</label>
                <div className="w-32 h-32 border-2 border-dashed border-white/10 rounded-lg overflow-hidden flex justify-center items-center mb-3 bg-white/5">
                  {teacherForm.photo ? (
                    <img 
                      src={teacherForm.photo instanceof File ? URL.createObjectURL(teacherForm.photo) : teacherForm.photo} 
                      alt="Teacher preview" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-gray-500 text-xs text-center px-2">No photo selected</span>
                  )}
                </div>
                <label className="btn btn-ghost border border-white/10 text-xs cursor-pointer hover:bg-white/5">
                  Upload Photo
                  <input type="file" className="hidden" accept="image/*" onChange={handleTeacherPhotoChange} />
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setShowTeacherModal(false)} className="btn btn-ghost">Cancel</button>
              <button type="submit" className="btn btn-primary">{editTeacher ? 'Update' : 'Create'}</button>
            </div>
        </form>
      </Modal>


      {/* Teacher Info Modal */}
      {/* Teacher Info Modal */}
      <Modal isOpen={!!infoTeacher} onClose={() => setInfoTeacher(null)} title={`Teacher Profile - ${infoTeacher?.name}`} isFullScreen={true}>
        {infoTeacher && (
          <div className="flex flex-col gap-6">
            {/* Hero Section Card */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-navy-800 p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary-600/10 transition-all duration-700"></div>
              
              <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 w-full md:w-auto">
                <div className="relative group/photo">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/10 flex justify-center items-center bg-navy-900 shrink-0 shadow-lg">
                    {infoTeacher.photo ? (
                      <img src={infoTeacher.photo} alt="Teacher" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl text-gray-700 font-bold uppercase">{infoTeacher.name ? infoTeacher.name.charAt(0) : '?'}</span>
                    )}
                  </div>
                </div>

                <div className="text-center md:text-left">
                  <p className="text-primary-400 text-[10px] uppercase font-black tracking-[0.2em] mb-1">Staff Member Profile</p>
                  <h3 className="text-2xl font-black text-white leading-tight">{infoTeacher.name}</h3>
                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-3 gap-y-1 mt-2 font-mono text-xs">
                    <span className="text-gray-400">EMP ID: <span className="text-white font-bold">{infoTeacher.employeeId}</span></span>
                    <span className="text-gray-600">|</span>
                    <span className="text-gray-400">QUALIFICATION: <span className="text-white font-bold">{infoTeacher.qualification || '-'}</span></span>
                  </div>
                </div>
              </div>

              <div className="mt-6 md:mt-0 text-center md:text-right relative z-10 bg-white/5 md:bg-transparent p-4 md:p-0 rounded-xl w-full md:w-auto">
                <p className="text-gray-500 text-[10px] uppercase font-black tracking-[0.2em] mb-1">Payroll Info</p>
                <p className="text-xl font-black text-white">₹{infoTeacher.salary || '0'}</p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 bg-success/20 text-success border border-success/30">
                   <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                   ACTIVE STAFF
                </div>
              </div>
            </div>

            {/* Grid for categorized info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Contact Section */}
              <div className="bg-navy-800/50 p-5 rounded-2xl border border-white/5 space-y-4">
                <h4 className="text-primary-400 text-[10px] font-black uppercase tracking-[0.2em] pb-2 border-b border-white/5 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Communication
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-blue-300/50 font-black uppercase block mb-0.5 tracking-wider">Mobile Number</span>
                    <span className="text-sm text-white font-bold">{infoTeacher.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-300/50 font-black uppercase block mb-0.5 tracking-wider">Email Address</span>
                    <span className="text-sm text-white font-bold break-all">{infoTeacher.email || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Academic/Professional Section */}
              <div className="bg-navy-800/50 p-5 rounded-2xl border border-white/5 space-y-4 lg:col-span-2">
                <h4 className="text-primary-400 text-[10px] font-black uppercase tracking-[0.2em] pb-2 border-b border-white/5 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  Academic Assignment
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-blue-300/50 font-black uppercase block mb-0.5 tracking-wider">Assigned Subjects</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(infoTeacher.subjects || []).length > 0 ? (infoTeacher.subjects || []).map((sub, idx) => (
                        <span key={idx} className="px-2 py-1 bg-primary-600/20 text-primary-400 rounded text-[10px] font-bold border border-primary-500/30 uppercase">{sub}</span>
                      )) : <span className="text-sm text-gray-500 font-bold">No subjects assigned</span>}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-300/50 font-black uppercase block mb-0.5 tracking-wider">Professional Qualification</span>
                    <span className="text-sm text-white font-bold">{infoTeacher.qualification || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/5">
          <button onClick={() => setInfoTeacher(null)} className="btn btn-primary px-12 py-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-600/20">Close Profile</button>
        </div>
      </Modal>

      {/* Fee Modal */}
      <Modal isOpen={showFeeModal} onClose={() => setShowFeeModal(false)} title="New Fee Structure" maxWidth="max-w-md">
        <form onSubmit={handleFeeSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Fee Category</label>
            <select className="input-field" value={feeForm.feeType} onChange={(e) => setFeeForm({ ...feeForm, feeType: e.target.value })} required>
              <option value="Tuition">Tuition Fee</option>
              <option value="Transport">Transport Fee</option>
              <option value="Library">Library Fee</option>
              <option value="Lab">Lab Fee</option>
              <option value="Sports">Sports Fee</option>
              <option value="Other">Other Fees</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Applies to Class</label>
            <select className="input-field" value={feeForm.classId} onChange={(e) => setFeeForm({ ...feeForm, classId: e.target.value })} required>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Base Amount (₹)</label>
            <input type="number" className="input-field" value={feeForm.amount} onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Frequency</label>
            <select className="input-field" value={feeForm.frequency} onChange={(e) => setFeeForm({ ...feeForm, frequency: e.target.value })}>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Annually">Annually</option>
              <option value="One-time">One-time</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowFeeModal(false)} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary px-8">Save Structure</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
