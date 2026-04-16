import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchExams = createAsyncThunk('exams/fetch', async (params, { rejectWithValue }) => {
  try { const { data } = await api.get('/exams', { params }); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const createExam = createAsyncThunk('exams/create', async (d, { rejectWithValue }) => {
  try { const { data } = await api.post('/exams', d); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const fetchResults = createAsyncThunk('exams/results', async (examId, { rejectWithValue }) => {
  try { const { data } = await api.get(`/exams/results/${examId}`); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const bulkAddResults = createAsyncThunk('exams/bulkResults', async (d, { rejectWithValue }) => {
  try { const { data } = await api.post('/exams/results/bulk', d); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});

const slice = createSlice({
  name: 'exams',
  initialState: { exams: [], results: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchExams.fulfilled, (s, a) => { s.exams = a.payload.exams; })
     .addCase(createExam.fulfilled, (s, a) => { s.exams.unshift(a.payload.exam); })
     .addCase(fetchResults.fulfilled, (s, a) => { s.results = a.payload.results; })
     .addCase(bulkAddResults.fulfilled, (s) => { s.loading = false; });
  },
});

export default slice.reducer;
