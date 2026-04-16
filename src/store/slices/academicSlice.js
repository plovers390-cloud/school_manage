import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchClasses = createAsyncThunk('academic/fetchClasses', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/academic/classes'); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const createClass = createAsyncThunk('academic/createClass', async (d, { rejectWithValue }) => {
  try { const { data } = await api.post('/academic/classes', d); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const updateClass = createAsyncThunk('academic/updateClass', async ({ id, ...d }, { rejectWithValue }) => {
  try { const { data } = await api.put(`/academic/classes/${id}`, d); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const deleteClass = createAsyncThunk('academic/deleteClass', async (id, { rejectWithValue }) => {
  try { await api.delete(`/academic/classes/${id}`); return id; }
  catch (err) { return rejectWithValue(err.response?.data); }
});

export const fetchTeachers = createAsyncThunk('academic/fetchTeachers', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/academic/teachers'); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const createTeacher = createAsyncThunk('academic/createTeacher', async (d, { rejectWithValue }) => {
  try { const { data } = await api.post('/academic/teachers', d); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const updateTeacher = createAsyncThunk('academic/updateTeacher', async ({ id, formData }, { rejectWithValue }) => {
  try { const { data } = await api.put(`/academic/teachers/${id}`, formData); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const deleteTeacher = createAsyncThunk('academic/deleteTeacher', async (id, { rejectWithValue }) => {
  try { await api.delete(`/academic/teachers/${id}`); return id; }
  catch (err) { return rejectWithValue(err.response?.data); }
});

export const fetchSubjects = createAsyncThunk('academic/fetchSubjects', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/academic/subjects'); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const createSubject = createAsyncThunk('academic/createSubject', async (d, { rejectWithValue }) => {
  try { const { data } = await api.post('/academic/subjects', d); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const createSection = createAsyncThunk('academic/createSection', async (d, { rejectWithValue }) => {
  try { const { data } = await api.post('/academic/sections', d); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});

const academicSlice = createSlice({
  name: 'academic',
  initialState: { classes: [], teachers: [], subjects: [], sections: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClasses.fulfilled, (state, a) => { state.classes = a.payload.classes; })
      .addCase(createClass.fulfilled, (state, a) => { state.classes.push(a.payload.class); })
      .addCase(updateClass.fulfilled, (state, a) => { 
        const index = state.classes.findIndex(c => c.id === a.payload.class.id);
        if (index !== -1) state.classes[index] = a.payload.class;
      })
      .addCase(deleteClass.fulfilled, (state, a) => { state.classes = state.classes.filter(c => c.id !== a.payload); })
      
      .addCase(fetchTeachers.fulfilled, (state, a) => { state.teachers = a.payload.teachers; })
      .addCase(createTeacher.fulfilled, (state, a) => { state.teachers.push(a.payload.teacher); })
      .addCase(updateTeacher.fulfilled, (state, a) => {
        const index = state.teachers.findIndex(t => t.id === a.payload.teacher.id);
        if (index !== -1) state.teachers[index] = a.payload.teacher;
      })
      .addCase(deleteTeacher.fulfilled, (state, a) => { state.teachers = state.teachers.filter(t => t.id !== a.payload); })

      .addCase(fetchSubjects.fulfilled, (state, a) => { state.subjects = a.payload.subjects; })
      .addCase(createSubject.fulfilled, (state, a) => { state.subjects.push(a.payload.subject); })
      .addCase(createSection.fulfilled, (state, a) => { state.sections.push(a.payload.section); });
  },
});

export default academicSlice.reducer;
