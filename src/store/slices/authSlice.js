import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Login failed' });
  }
});

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', userData);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Registration failed' });
  }
});

export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Not authenticated' });
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await api.post('/auth/logout');
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/auth/profile', userData);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Failed to update profile' });
  }
});

export const updatePassword = createAsyncThunk('auth/updatePassword', async (passwords, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/auth/password', passwords);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Failed to change password' });
  }
});

export const updateEmail = createAsyncThunk('auth/updateEmail', async (emailData, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/auth/email', emailData);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Failed to update email' });
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    accessToken: localStorage.getItem('accessToken'),
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        localStorage.setItem('accessToken', action.payload.accessToken);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Login failed';
      })
      .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        localStorage.setItem('accessToken', action.payload.accessToken);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Registration failed';
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.loading = false;
      })
      .addCase(getMe.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.loading = false;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.accessToken = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
      })
      .addCase(updateEmail.fulfilled, (state, action) => {
        state.user = action.payload.user;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
