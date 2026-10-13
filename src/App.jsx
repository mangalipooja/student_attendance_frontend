import { useEffect, useMemo, useState } from 'react';
import { getStudents, createStudent, updateStudent, deleteStudent, getAttendance, markAttendance } from './api';

const emptyForm = { name: '', rollNumber: '', department: 'ECE', email: '' };
const today = () => new Date().toLocaleDateString('en-CA');

export default function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState(today());
  const [attendance, setAttendance] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadStudents() {
    try { setStudents(await getStudents()); }
    catch (e) { setError(`Cannot load students. Is Spring Boot running? ${e.message}`); }
  }
  async function loadAttendance() {
    try { setAttendance(await getAttendance(date)); }
    catch (e) { setError(e.message); }
  }
  useEffect(() => { loadStudents(); }, []);
  useEffect(() => { loadAttendance(); }, [date]);

  const filtered = useMemo(() => students.filter(s =>
    `${s.name} ${s.rollNumber} ${s.department}`.toLowerCase().includes(search.toLowerCase())
  ), [students, search]);

  function changeForm(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  async function submitStudent(e) {
    e.preventDefault(); setError(''); setNotice('');
    try {
      if (editingId) await updateStudent(editingId, form);
      else await createStudent(form);
      setForm(emptyForm); setEditingId(null);
      setNotice(editingId ? 'Student updated successfully.' : 'Student added successfully.');
      await loadStudents();
    } catch (e) { setError(e.message); }
  }

  function editStudent(student) {
    setEditingId(student.id);
    setForm({ name: student.name || '', rollNumber: student.rollNumber || '',
      department: student.department || '', email: student.email || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function removeStudent(id) {
    if (!window.confirm('Delete this student?')) return;
    setError(''); setNotice('');
    try { await deleteStudent(id); setNotice('Student deleted.'); await loadStudents(); await loadAttendance(); }
    catch (e) { setError(e.message); }
  }

  async function setStatus(studentId, status) {
    setError(''); setNotice('');
    try {
      await markAttendance({ studentId, date, status });
      setNotice('Attendance saved.');
      await loadAttendance();
    } catch (e) { setError(e.message); }
  }

  const recordFor = (studentId) => attendance.find(a =>
    a.student?.id === studentId && a.attendanceDate === date
  );
  const presentCount = attendance.filter(a => a.attendanceDate === date && a.status === 'PRESENT').length;

  return <main className="page">
    <header className="hero">
      <div><p className="eyebrow">STUDENT PORTAL</p><h1>Attendance Management</h1>
        <p>Manage student records and daily attendance in one place.</p></div>
      <div className="hero-count"><strong>{students.length}</strong><span>Total students</span></div>
    </header>

    {error && <div className="message error">{error}</div>}
    {notice && <div className="message success">{notice}</div>}

    <section className="panel">
      <div className="section-heading"><div><h2>{editingId ? 'Edit student' : 'Add a student'}</h2>
        <p>Enter the student's basic details.</p></div></div>
      <form className="student-form" onSubmit={submitStudent}>
        <label>Full name<input name="name" value={form.name} onChange={changeForm} required placeholder="e.g. Ananya Rao" /></label>
        <label>Roll number<input name="rollNumber" value={form.rollNumber} onChange={changeForm} required placeholder="e.g. 23ECE001" /></label>
        <label>Department<input name="department" value={form.department} onChange={changeForm} placeholder="e.g. ECE" /></label>
        <label>Email<input name="email" type="email" value={form.email} onChange={changeForm} placeholder="student@example.com" /></label>
        <div className="form-actions">
          <button className="primary" type="submit">{editingId ? 'Save changes' : 'Add student'}</button>
          {editingId && <button className="secondary" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button>}
        </div>
      </form>
    </section>

    <section className="panel">
      <div className="section-heading responsive-heading"><div><h2>Student records</h2><p>Search, update, or remove a student.</p></div>
        <input className="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." aria-label="Search students" /></div>
      <div className="table-wrap"><table><thead><tr><th>Name</th><th>Roll number</th><th>Department</th><th>Email</th><th>Actions</th></tr></thead>
        <tbody>{filtered.map(s => <tr key={s.id}><td data-label="Name">{s.name}</td><td data-label="Roll number">{s.rollNumber}</td><td data-label="Department">{s.department}</td><td data-label="Email">{s.email || '—'}</td>
          <td data-label="Actions" className="actions"><button className="small secondary" onClick={() => editStudent(s)}>Edit</button><button className="small danger" onClick={() => removeStudent(s.id)}>Delete</button></td></tr>)}
          {filtered.length === 0 && <tr><td colSpan="5" className="empty">No students found. Add a student above to get started.</td></tr>}</tbody></table></div>
    </section>

    <section className="panel">
      <div className="section-heading responsive-heading"><div><h2>Daily attendance</h2><p>Choose a date and mark each student's status.</p></div>
        <label className="date-label">Attendance date<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label></div>
      <div className="attendance-summary"><strong>{presentCount}</strong><span>present records for {date}</span></div>
      <div className="table-wrap"><table><thead><tr><th>Student</th><th>Roll number</th><th>Status</th><th>Mark attendance</th></tr></thead>
        <tbody>{students.map(s => { const rec = recordFor(s.id); return <tr key={s.id}>
          <td data-label="Student">{s.name}</td><td data-label="Roll number">{s.rollNumber}</td>
          <td data-label="Status"><span className={`status ${rec ? rec.status.toLowerCase() : 'unmarked'}`}>{rec ? rec.status : 'Not marked'}</span></td>
          <td data-label="Mark attendance" className="actions"><button className="small present" onClick={() => setStatus(s.id, 'PRESENT')}>Present</button><button className="small absent" onClick={() => setStatus(s.id, 'ABSENT')}>Absent</button></td>
        </tr>; })}
        {students.length === 0 && <tr><td colSpan="4" className="empty">Add students before marking attendance.</td></tr>}</tbody></table></div>
    </section>
    <footer>Student Attendance Management System · React + Spring Boot + MySQL</footer>
  </main>;
}
