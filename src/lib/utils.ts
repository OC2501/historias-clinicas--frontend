import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFileUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  
  const viteApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const backendBase = viteApiUrl.replace(/\/api\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${backendBase}${cleanPath}`;
}

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function getCaracasDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function safeParseDate(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;
  if (typeof dateInput === 'string') {
    const cleanStr = dateInput.trim();
    if (!cleanStr) return null;

    // 1. Si es un formato de solo fecha "YYYY-MM-DD"
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
      const [year, month, day] = cleanStr.split('-').map(Number);
      return new Date(year, month - 1, day, 12, 0, 0);
    }

    // 2. Si es una fecha ISO que representa medianoche (como las devueltas por columnas DATE de Postgres: T00:00:00 o T04:00:00)
    const midnightMatch = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})T(00:00:00|04:00:00)/);
    if (midnightMatch) {
      const year = parseInt(midnightMatch[1], 10);
      const month = parseInt(midnightMatch[2], 10) - 1;
      const day = parseInt(midnightMatch[3], 10);
      return new Date(year, month, day, 12, 0, 0);
    }

    // 3. Otros casos: parsear como fecha/hora completa
    const d = new Date(cleanStr);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? null : d;
}

export function safeFormat(dateInput: string | Date | null | undefined, formatStr: string, fallback = '—'): string {
  if (!dateInput) return fallback;
  const d = safeParseDate(dateInput);
  if (!d || isNaN(d.getTime())) return fallback;
  return format(d, formatStr, { locale: es });
}

export function formatPatientAge(birthDate: string | Date | null | undefined): string {
  if (!birthDate) return '—';
  try {
    const birth = safeParseDate(birthDate);
    if (!birth || isNaN(birth.getTime())) return '—';
    const today = new Date();

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      days += prevMonthLastDay;
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    // 1 año o más
    if (years >= 1) {
      return years === 1 ? '1 año' : `${years} años`;
    }

    // Menos de 1 año (bebés / infantes)
    if (months >= 1) {
      return months === 1 ? '1 mes' : `${months} meses`;
    }

    // Menos de 1 mes (recién nacidos)
    if (days <= 0) return 'Recién nacido';
    return days === 1 ? '1 día' : `${days} días`;
  } catch {
    return '—';
  }
}

export function formatTitleCase(str: string | null | undefined, fallback: string = ''): string {
  if (!str || !str.trim()) return fallback;
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
}
