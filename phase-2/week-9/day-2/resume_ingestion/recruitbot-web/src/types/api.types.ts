/** Standard backend error response shape ({ success, requestId, errorCode, message }). */
export interface ApiError {
  success: false;
  requestId?: string;
  errorCode: string;
  message: string;
}
