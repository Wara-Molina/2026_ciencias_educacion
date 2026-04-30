import axios from 'axios';

// 1. Creamos la instancia de Axios con la configuración base
const api = axios.create({
  // Usamos NEXT_PUBLIC para que el navegador pueda leer esta variable
  baseURL: process.env.NEXT_PUBLIC_API_BASE || 'https://apiadministrador.upea.bo/api/v2',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // Tiempo máximo de espera (10 segundos)
    // No enviar cookies por defecto (cambia a true si lo necesitas)
  withCredentials: false,
});

// 2. Interceptor de Solicitud (Opcional: aquí puedes poner tu Token si lo tienes)
api.interceptors.request.use(
  (config) => {
    const token = process.env.NEXT_PUBLIC_API_TOKEN;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Interceptor de Respuesta (Manejo de errores global)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Aquí puedes manejar errores globales (ej: 401, 500)
    console.error('❌ Error en la petición a la API:', error.message);
    return Promise.reject(error);
  }
);

// 4. Exportamos la instancia para usarla en cualquier lado
export default api;