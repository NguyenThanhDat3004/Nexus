export interface ApiResponse<T> { success: boolean; code: number; message: string; data: T | null; errors?: string[] }

export function ok<T>(data: T, code = 200, message = 'OK'): ApiResponse<T> {
  return { success: true, code, message, data };
}
export function fail(code: number, message: string, errors?: string[]): ApiResponse<null> {
  return { success: false, code, message, data: null, ...(errors?.length ? { errors } : {}) };
}