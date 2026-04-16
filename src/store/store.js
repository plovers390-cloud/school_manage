import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import studentReducer from './slices/studentSlice';
import academicReducer from './slices/academicSlice';
import attendanceReducer from './slices/attendanceSlice';
import examReducer from './slices/examSlice';
import feeReducer from './slices/feeSlice';
import timetableReducer from './slices/timetableSlice';
import noticeReducer from './slices/noticeSlice';
import libraryReducer from './slices/librarySlice';
import transportReducer from './slices/transportSlice';
import reportReducer from './slices/reportSlice';
import messageReducer from './slices/messageSlice';
import teacherPaymentReducer from './slices/teacherPaymentSlice';
import settingReducer from './slices/settingSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    students: studentReducer,
    academic: academicReducer,
    attendance: attendanceReducer,
    exams: examReducer,
    fees: feeReducer,
    timetable: timetableReducer,
    notices: noticeReducer,
    library: libraryReducer,
    transport: transportReducer,
    reports: reportReducer,
    messages: messageReducer,
    teacherPayments: teacherPaymentReducer,
    settings: settingReducer,
    ui: uiReducer,
  },
});
