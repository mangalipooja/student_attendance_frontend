const API = 'http://localhost:8081/api';

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export const getStudents = () => request('/students');
export const createStudent = (student) => request('/students', { method: 'POST', body: JSON.stringify(student) });
export const updateStudent = (id, student) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(student) });
export const deleteStudent = (id) => request(`/students/${id}`, { method: 'DELETE' });
export const getAttendance = (date) => request(`/attendance?date=${encodeURIComponent(date)}`);
export const markAttendance = (record) => request('/attendance', { method: 'POST', body: JSON.stringify(record) });
