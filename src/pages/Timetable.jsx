import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTimetable, createTimetable } from '../store/slices/timetableSlice';
import { fetchClasses, fetchSubjects, fetchTeachers } from '../store/slices/academicSlice';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function TimetablePage() {
  const dispatch = useDispatch();
  const { entries, error } = useSelector((s) => s.timetable);
  const { classes, subjects, teachers } = useSelector((s) => s.academic);
  const [classId, setClassId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ classId: '', subjectId: '', teacherId: '', dayOfWeek: 'Monday', period: 1, startTime: '09:00', endTime: '09:45' });

  useEffect(() => {
    dispatch(fetchClasses());
    dispatch(fetchSubjects());
    dispatch(fetchTeachers());
  }, [dispatch]);

  useEffect(() => {
    if (classId) dispatch(fetchTimetable({ classId }));
  }, [dispatch, classId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createTimetable(form)).unwrap();
      toast.success('Added!');
      setShowModal(false);
    } catch (err) { toast.error(err?.error || 'Conflict detected!'); }
  };

  const getEntry = (day, period) => entries.find((e) => e.dayOfWeek === day && e.period === period);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Timetable</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Add Entry</button>
      </div>

      <div className="glass p-4">
        <select className="input-field max-w-xs" value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">Select Class</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {classId && (
        <div className="glass overflow-hidden overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Day / Period</th>
                {PERIODS.map((p) => <th key={p}>P{p}</th>)}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day}>
                  <td className="font-medium text-primary-400">{day}</td>
                  {PERIODS.map((p) => {
                    const entry = getEntry(day, p);
                    return (
                      <td key={p} className="min-w-[100px]">
                        {entry ? (
                          <div className="text-xs">
                            <p className="font-medium text-gray-900">{entry.subject?.name}</p>
                            <p className="text-gray-400">{entry.teacher?.name}</p>
                          </div>
                        ) : (
                          <span className="text-dark-600 text-xs">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Timetable Entry">
        <form onSubmit={handleCreate} className="space-y-4">
          <select className="input-field" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} required>
            <option value="">Class</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input-field" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} required>
            <option value="">Subject</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="input-field" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} required>
            <option value="">Teacher</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select className="input-field" value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>
            {DAYS.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select className="input-field" value={form.period} onChange={(e) => setForm({ ...form, period: parseInt(e.target.value) })}>
            {PERIODS.map((p) => <option key={p} value={p}>Period {p}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-4">
            <input type="time" className="input-field" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <input type="time" className="input-field" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary">Add</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
