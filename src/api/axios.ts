import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_URL = VITE_API_URL.endsWith('/') ? VITE_API_URL : `${VITE_API_URL}/`;

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ===== Interceptor de REQUEST: agrega JWT automáticamente =====
api.interceptors.request.use(
    (config) => {
        // Obtenemos el token directamente del store de Zustand (fuera de React)
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ===== Interceptor de RESPONSE: manejo global de errores =====
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message || 'Error inesperado en el servidor';

        // 1. Manejo de Sesión Expirada
        if (status === 401) {
            useAuthStore.getState().logout();
            // Evitamos mostrar toast en login para no ser redundantes
            if (!window.location.pathname.includes('/login')) {
                toast.error('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
                window.location.href = '/login';
            }
        }

        // 2. Errores de Validación o Solicitud Incorrecta (400)
        else if (status === 400) {
            // El backend suele enviar un array de errores o un string
            const description = Array.isArray(message) ? message.join(', ') : message;
            toast.error('Datos inválidos', {
                description: description,
            });
        }

        // 3. Permisos Insuficientes (403)
        else if (status === 403) {
            toast.error('Acceso denegado', {
                description: 'No tiene permisos suficientes para realizar esta acción.',
            });
        }

        // 4. Recurso no encontrado (404)
        else if (status === 404) {
            // No siempre queremos mostrar toast para 404, pero para acciones de mutación sí
            if (error.config.method !== 'get') {
                toast.error('No encontrado', {
                    description: 'El recurso que intenta modificar no existe.',
                });
            }
        }

        // 5. Error del Servidor (500)
        else if (status >= 500) {
            const description = Array.isArray(message) ? message.join(', ') : message;
            toast.error('Error del sistema', {
                description: description || 'Estamos experimentando dificultades técnicas.',
            });
        }

        return Promise.reject(error);
    }
);
