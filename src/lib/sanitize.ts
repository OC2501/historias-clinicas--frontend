import DOMPurify from 'dompurify';

/**
 * Lista de etiquetas HTML permitidas en contenido médico enriquecido
 */
const ALLOWED_TAGS = ['p', 'br', 'b', 'i', 'u', 'ul', 'ol', 'li', 'strong', 'em', 'h1', 'h2', 'h3', 'span', 'div'];
const ALLOWED_ATTR: string[] = []; // Sin atributos para prevenir on*, href=javascript:, etc.

/**
 * Sanitiza HTML para prevenir ataques XSS Stored.
 * Usar siempre antes de usar dangerouslySetInnerHTML con contenido del servidor.
 *
 * @param dirty - String HTML potencialmente inseguro
 * @returns String HTML sanitizado seguro para renderizar
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
    if (!dirty) return '';
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
    });
}
