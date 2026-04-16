import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchBooks = createAsyncThunk('library/fetchBooks', async (params, { rejectWithValue }) => {
  try { const { data } = await api.get('/library/books', { params }); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const createBook = createAsyncThunk('library/createBook', async (d, { rejectWithValue }) => {
  try { const { data } = await api.post('/library/books', d); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const issueBook = createAsyncThunk('library/issue', async (d, { rejectWithValue }) => {
  try { const { data } = await api.post('/library/issue', d); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const returnBook = createAsyncThunk('library/return', async (id, { rejectWithValue }) => {
  try { const { data } = await api.put(`/library/return/${id}`); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const fetchIssues = createAsyncThunk('library/fetchIssues', async (params, { rejectWithValue }) => {
  try { const { data } = await api.get('/library/issues', { params }); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});

const slice = createSlice({
  name: 'library',
  initialState: { books: [], issues: [], pagination: null, loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchBooks.fulfilled, (s, a) => { s.books = a.payload.books; s.pagination = a.payload.pagination; })
     .addCase(createBook.fulfilled, (s, a) => { s.books.unshift(a.payload.book); })
     .addCase(fetchIssues.fulfilled, (s, a) => { s.issues = a.payload.issues; });
  },
});

export default slice.reducer;
