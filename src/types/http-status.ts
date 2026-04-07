// Solo los que necesitamos en el frontend
export const HttpStatus = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
} as const;
export type HttpStatus = (typeof HttpStatus)[keyof typeof HttpStatus];
