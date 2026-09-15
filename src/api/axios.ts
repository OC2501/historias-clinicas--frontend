import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_URL = VITE_API_URL.endsWith('/') ? VITE_API_URL : `${VITE_API_URL}/`;

const formatTitleCase = (str: string | null | undefined): string => {
    if (!str) return '';
    return str
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .map((word, idx) => {
            const prepositions = ['de', 'la', 'las', 'el', 'los', 'y', 'del', 'o', 'a', 'en'];
            if (prepositions.includes(word) && idx !== 0) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
};

const formatPatientNames = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
        return obj.map(formatPatientNames);
    }
    const newObj = { ...obj };
    if (typeof newObj.firstName === 'string') {
        newObj.firstName = formatTitleCase(newObj.firstName);
    }
    if (typeof newObj.lastName === 'string') {
        newObj.lastName = formatTitleCase(newObj.lastName);
    }
    for (const key in newObj) {
        if (newObj[key] && typeof newObj[key] === 'object') {
            newObj[key] = formatPatientNames(newObj[key]);
        }
    }
    return newObj;
};

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

// ===== Interceptor de RESPONSE: manejo global de errores y formateo de datos =====
api.interceptors.response.use(
    (response) => {
        if (response.data) {
            response.data = formatPatientNames(response.data);
        }
        return response;
    },
    (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message || 'Error inesperado en el servidor';

        // Helper path resolver for base URL
        const getFullPath = (path: string) => {
            const base = import.meta.env.BASE_URL || '/';
            const cleanBase = base.endsWith('/') ? base : `${base}/`;
            const cleanPath = path.startsWith('/') ? path.slice(1) : path;
            return `${cleanBase}${cleanPath}`;
        };

        // 1. Manejo de Sesión Expirada
        if (status === 401) {
            useAuthStore.getState().logout();
            // Evitamos mostrar toast en login para no ser redundantes
            if (!window.location.pathname.includes('/login')) {
                toast.error('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
                window.location.href = getFullPath('/login');
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

        // 3. Permisos Insuficientes (403) o Mantenimiento
        else if (status === 403) {
            if (typeof message === 'string' && message.toLowerCase().includes('mantenimiento')) {
                toast.error('Sistema en mantenimiento');
                const user = useAuthStore.getState().user;
                if (user?.systemRole !== 'SUPERADMIN') {
                    useAuthStore.getState().logout();
                    window.location.href = getFullPath('/maintenance');
                }
            } else {
                toast.error('Acceso denegado', {
                    description: 'No tiene permisos suficientes para realizar esta acción.',
                });
            }
        }

        // 3.5. Sistema en Mantenimiento (503)
        else if (status === 503) {
            toast.error('Sistema en mantenimiento', {
                description: typeof message === 'string' ? message : 'El sistema está en mantenimiento. Por favor, intente más tarde.',
            });
            const user = useAuthStore.getState().user;
            if (user?.systemRole !== 'SUPERADMIN') {
                useAuthStore.getState().logout();
                window.location.href = getFullPath('/maintenance');
            }
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
