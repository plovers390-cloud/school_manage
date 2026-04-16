import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExams, createExam } from '../store/slices/examSlice';
import { fetchClasses, fetchSubjects } from '../store/slices/academicSlice';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Exams() {
  const dispatch = useDispatch();
  const { exams } = useSelector((s) => s.exams);
  const { classes, subjects } = useSelector((s) => s.academic);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', classId: '', subjectId: '', examDate: '', totalMarks: 100, passingMarks: 33 });

  useEffect(() => {
    dispatch(fetchExams());
    dispatch(fetchClasses());
    dispatch(fetchSubjects());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createExam(form)).unwrap();
      toast.success('Exam created!');
      setShowModal(false);
      setForm({ name: '', classId: '', subjectId: '', examDate: '', totalMarks: 100, passingMarks: 33 });
    } catch (err) { toast.error(err?.error || 'Failed'); }
  };

  const columns = [
    { key: 'name', label: 'Exam Name' },
    { key: 'class', label: 'Class', render: (r) => r.class?.name || '-' },
    { key: 'subject', label: 'Subject', render: (r) => r.subject?.name || '-' },
    { key: 'examDate', label: 'Date' },
    { key: 'totalMarks', label: 'Total Marks' },
    { key: 'passingMarks', label: 'Passing Marks' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Exams & Results</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Create Exam</button>
      </div>

      <DataTable columns={columns} data={exams} emptyMessage="No exams found" />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Exam">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Exam Name *</label>
            <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g., Mid-Term 2024" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Class *</label>
            <select className="input-field" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} required>
              <option value="">Select</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Subject *</label>
            <select className="input-field" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} required>
              <option value="">Select</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Date *</label>
            <input type="date" className="input-field" value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Total Marks</label>
              <input type="number" className="input-field" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Passing Marks</label>
              <input type="number" className="input-field" value={form.passingMarks} onChange={(e) => setForm({ ...form, passingMarks: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary">Create Exam</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
