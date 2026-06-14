import axios from 'axios';
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────────────
// API_BASE_URL:
//  • Resolves dynamically from the Metro bundler's host IP
//  • Fallback to the PC's actual WiFi IP: '192.168.1.7'
// ─────────────────────────────────────────────────────────────────
const scriptURL = NativeModules.SourceCode?.scriptURL || '';
// let hostIP = scriptURL.split('://')[1]?.split('/')[0]?.split(':')[0];
let hostIP = 'https://hukoom-backend-9t2f.onrender.com';

// if (!hostIP) {
//   hostIP = 'https://hukoom-backend-9t2f.onrender.com'; // Fallback to current host WiFi IP (works for physical devices & emulators)
// }

// export const API_BASE_URL = `http://${hostIP}:3000`;
export const API_BASE_URL = `https://hukoom-backend-9t2f.onrender.com`;
console.log('[API] scriptURL:', scriptURL);
console.log('[API] Connecting to API at:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to automatically attach user session headers
api.interceptors.request.use(async (config) => {
  try {
    const sessionStr = await AsyncStorage.getItem('hukoom_session');
    if (sessionStr) {
      const { user, role } = JSON.parse(sessionStr);
      if (user?._id) {
        config.headers['x-user-id'] = user._id;
      }
      if (role) {
        config.headers['x-user-role'] = role;
      }
    }
  } catch (err) {
    console.log('[API] Error attaching session headers:', err);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
