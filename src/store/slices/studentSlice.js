import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchStudents = createAsyncThunk('students/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/students', { params });
    return data;
  } catch (err) { return rejectWithValue(err.response?.data); }
});

export const createStudent = createAsyncThunk('students/create', async (studentData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/students', studentData);
    return data;
  } catch (err) { return rejectWithValue(err.response?.data); }
});

export const updateStudent = createAsyncThunk('students/update', async ({ id, formData }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/students/${id}`, formData);
    return data;
  } catch (err) { return rejectWithValue(err.response?.data); }
});

export const deleteStudent = createAsyncThunk('students/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/students/${id}`);
    return id;
  } catch (err) { return rejectWithValue(err.response?.data); }
});

export const getStudentById = createAsyncThunk('students/getById', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/students/${id}`);
    return data;
  } catch (err) { return rejectWithValue(err.response?.data); }
});

const studentSlice = createSlice({
  name: 'students',
  initialState: { list: [], pagination: null, loading: false, error: null },
  reducers: { clearStudentError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudents.pending, (state) => { state.loading = true; })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.students;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchStudents.rejected, (state, action) => { state.loading = false; state.error = action.payload?.error; })
      .addCase(createStudent.fulfilled, (state, action) => { state.list.unshift(action.payload.student); })
      .addCase(updateStudent.fulfilled, (state, action) => {
        const idx = state.list.findIndex(s => s.id === action.payload.student.id);
        if (idx !== -1) state.list[idx] = action.payload.student;
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.list = state.list.filter(s => s.id !== action.payload);
      });
  },
});

export const { clearStudentError } = studentSlice.actions;
export default studentSlice.reducer;
