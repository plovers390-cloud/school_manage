import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBooks, createBook, fetchIssues, issueBook, returnBook } from '../store/slices/librarySlice';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Library() {
  const dispatch = useDispatch();
  const { books, issues } = useSelector((s) => s.library);
  const [tab, setTab] = useState('books');
  const [showBookModal, setShowBookModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', quantity: 1 });
  const [issueForm, setIssueForm] = useState({ bookId: '', studentId: '', dueDate: '' });

  useEffect(() => {
    dispatch(fetchBooks());
    dispatch(fetchIssues());
  }, [dispatch]);

  const handleCreateBook = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createBook(bookForm)).unwrap();
      toast.success('Book added!');
      setShowBookModal(false);
      setBookForm({ title: '', author: '', isbn: '', quantity: 1 });
    } catch (err) { toast.error(err?.error || 'Failed'); }
  };

  const handleIssueBook = async (e) => {
    e.preventDefault();
    try {
      await dispatch(issueBook(issueForm)).unwrap();
      toast.success('Book issued!');
      setShowIssueModal(false);
      dispatch(fetchBooks());
    } catch (err) { toast.error(err?.error || 'Failed'); }
  };

  const handleReturn = async (id) => {
    try {
      const result = await dispatch(returnBook(id)).unwrap();
      toast.success(`Returned! Fine: ₹${result.fine}`);
      dispatch(fetchBooks());
      dispatch(fetchIssues());
    } catch (err) { toast.error(err?.error || 'Failed'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Library</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowBookModal(true)} className="btn btn-ghost">+ Add Book</button>
          <button onClick={() => setShowIssueModal(true)} className="btn btn-primary">+ Issue Book</button>
        </div>
      </div>

      <div className="flex gap-2">
        {['books', 'issues'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}>
            {t === 'books' ? 'Books' : 'Issued Books'}
          </button>
        ))}
      </div>

      {tab === 'books' ? (
        <DataTable
          columns={[
            { key: 'title', label: 'Title' },
            { key: 'author', label: 'Author' },
            { key: 'isbn', label: 'ISBN' },
            { key: 'quantity', label: 'Total' },
            { key: 'available', label: 'Available', render: (r) => <span className={r.available > 0 ? 'text-green-400' : 'text-red-400'}>{r.available}</span> },
          ]}
          data={books}
        />
      ) : (
        <DataTable
          columns={[
            { key: 'book', label: 'Book', render: (r) => r.book?.title || '-' },
            { key: 'student', label: 'Student', render: (r) => r.student ? `${r.student.firstName} ${r.student.lastName}` : '-' },
            { key: 'issueDate', label: 'Issue Date' },
            { key: 'dueDate', label: 'Due Date' },
            { key: 'returnDate', label: 'Returned', render: (r) => r.returnDate || <span className="text-yellow-400">Pending</span> },
            { key: 'fine', label: 'Fine', render: (r) => `₹${r.fine}` },
            { key: 'actions', label: '', render: (r) => !r.returnDate && <button onClick={() => handleReturn(r.id)} className="text-primary-400 text-sm hover:underline">Return</button> },
          ]}
          data={issues}
        />
      )}

      <Modal isOpen={showBookModal} onClose={() => setShowBookModal(false)} title="Add Book">
        <form onSubmit={handleCreateBook} className="space-y-4">
          <input className="input-field" placeholder="Title" value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} required />
          <input className="input-field" placeholder="Author" value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} required />
          <input className="input-field" placeholder="ISBN" value={bookForm.isbn} onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })} required />
          <input type="number" className="input-field" placeholder="Quantity" value={bookForm.quantity} onChange={(e) => setBookForm({ ...bookForm, quantity: e.target.value })} min="1" />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowBookModal(false)} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary">Add Book</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showIssueModal} onClose={() => setShowIssueModal(false)} title="Issue Book">
        <form onSubmit={handleIssueBook} className="space-y-4">
          <select className="input-field" value={issueForm.bookId} onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })} required>
            <option value="">Select Book</option>
            {books.filter(b => b.available > 0).map((b) => <option key={b.id} value={b.id}>{b.title} ({b.available} available)</option>)}
          </select>
          <input className="input-field" placeholder="Student ID" value={issueForm.studentId} onChange={(e) => setIssueForm({ ...issueForm, studentId: e.target.value })} required />
          <input type="date" className="input-field" value={issueForm.dueDate} onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })} required />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowIssueModal(false)} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary">Issue</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
