import axios from 'axios';

const apiHost = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '');
const apiBaseURL = apiHost ? `${apiHost}/api` : '/api';

export const httpClient = axios.create({
  baseURL: apiBaseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});
