export interface ApiResponse {
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
}