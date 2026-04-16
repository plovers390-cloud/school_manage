import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchInbox = createAsyncThunk('messages/inbox', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/messages/inbox'); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const sendMessage = createAsyncThunk('messages/send', async (d, { rejectWithValue }) => {
  try { const { data } = await api.post('/messages', d); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const fetchConversation = createAsyncThunk('messages/conversation', async (userId, { rejectWithValue }) => {
  try { const { data } = await api.get(`/messages/${userId}`); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const fetchUsers = createAsyncThunk('messages/users', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/messages/users'); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const fetchBroadcastHistory = createAsyncThunk('messages/fetchBroadcastHistory', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/broadcasts/history'); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});
export const sendBroadcast = createAsyncThunk('messages/sendBroadcast', async (d, { rejectWithValue }) => {
  try { const { data } = await api.post('/broadcasts/send', d); return data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});

const slice = createSlice({
  name: 'messages',
  initialState: { inbox: [], conversation: [], users: [], broadcasts: [], unreadCount: 0, loading: false },
  reducers: {},
  extraReducers: (b) => {
     b.addCase(fetchInbox.fulfilled, (s, a) => { s.inbox = a.payload.messages; s.unreadCount = a.payload.unreadCount; })
      .addCase(fetchConversation.fulfilled, (s, a) => { s.conversation = a.payload.messages; })
      .addCase(fetchUsers.fulfilled, (s, a) => { s.users = a.payload.users; })
      .addCase(sendMessage.fulfilled, (s, a) => { s.conversation.push(a.payload.data); })
      .addCase(fetchBroadcastHistory.fulfilled, (s, a) => { s.broadcasts = a.payload.broadcasts; })
      .addCase(sendBroadcast.fulfilled, (s, a) => { s.broadcasts.unshift(a.payload.broadcast); });
  },
});

export default slice.reducer;
