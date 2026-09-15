import { api } from './axios';

export interface UploadFileResponse {
    message: string;
    filename: string;
    originalname: string;
    size: number;
    url: string;
}

export const uploadsApi = {
    uploadSingle: async (file: File): Promise<UploadFileResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<UploadFileResponse>('/uploads/file', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    uploadMultiple: async (files: File[]): Promise<UploadFileResponse[]> => {
        const formData = new FormData();
        files.forEach((f) => formData.append('files', f));

        const response = await api.post<UploadFileResponse[]>('/uploads/files', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    deleteFile: async (filename: string): Promise<{ message: string }> => {
        const response = await api.delete<{ message: string }>(`/uploads/file/${filename}`);
        return response.data;
    },
};
