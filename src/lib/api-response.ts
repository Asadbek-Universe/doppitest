/**
 * API Response Utilities
 * 
 * Standardized API responses and error handling for all operations.
 * Every response follows a consistent structure for predictable client-side handling.
 */

// =====================================================
// TYPE DEFINITIONS
// =====================================================

/**
 * Standard API response format
 * All endpoints return this structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

/**
 * Error codes used throughout the system
 * Enables client-side error handling and localization
 */
export enum ErrorCode {
  // Authentication
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  AUTH_INVALID = 'AUTH_INVALID',

  // Authorization
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  OWNERSHIP_VIOLATION = 'OWNERSHIP_VIOLATION',
  ROLE_INSUFFICIENT = 'ROLE_INSUFFICIENT',

  // Center Status
  CENTER_NOT_ACTIVE = 'CENTER_NOT_ACTIVE',
  CENTER_SUSPENDED = 'CENTER_SUSPENDED',
  CENTER_NOT_FOUND = 'CENTER_NOT_FOUND',
  CENTER_STATUS_INVALID = 'CENTER_STATUS_INVALID',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED = 'MISSING_REQUIRED',
  INVALID_STATE = 'INVALID_STATE',

  // Content Rules
  CANNOT_PUBLISH_EMPTY = 'CANNOT_PUBLISH_EMPTY',
  INVALID_CONTENT = 'INVALID_CONTENT',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',

  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',

  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * Error message mapping
 * User-friendly messages for each error code
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.AUTH_REQUIRED]: 'Please log in to continue',
  [ErrorCode.AUTH_EXPIRED]: 'Your session has expired. Please log in again',
  [ErrorCode.AUTH_INVALID]: 'Invalid credentials',

  [ErrorCode.PERMISSION_DENIED]: 'You do not have permission to perform this action',
  [ErrorCode.OWNERSHIP_VIOLATION]: 'You can only manage your own content',
  [ErrorCode.ROLE_INSUFFICIENT]: 'Your role does not allow this action',

  [ErrorCode.CENTER_NOT_ACTIVE]: 'Your center must be ACTIVE to perform this action',
  [ErrorCode.CENTER_SUSPENDED]: 'Your center is currently suspended',
  [ErrorCode.CENTER_NOT_FOUND]: 'Center not found',
  [ErrorCode.CENTER_STATUS_INVALID]: 'Invalid center status for this action',

  [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again',
  [ErrorCode.MISSING_REQUIRED]: 'All required fields must be filled in',
  [ErrorCode.INVALID_STATE]: 'This action is not allowed in the current state',

  [ErrorCode.CANNOT_PUBLISH_EMPTY]: 'Cannot publish empty content',
  [ErrorCode.INVALID_CONTENT]: 'The content violates platform guidelines',
  [ErrorCode.DUPLICATE_ENTRY]: 'This entry already exists',

  [ErrorCode.DATABASE_ERROR]: 'A database error occurred. Please try again later',
  [ErrorCode.CONSTRAINT_VIOLATION]: 'This operation violates a system constraint',
  [ErrorCode.TRANSACTION_FAILED]: 'The operation failed. Your data has not been changed',

  [ErrorCode.INTERNAL_ERROR]: 'An unexpected error occurred. Our team has been notified',
  [ErrorCode.RATE_LIMITED]: 'Too many requests. Please wait a moment and try again',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'The service is temporarily unavailable',
};

// =====================================================
// SUCCESS RESPONSE BUILDER
// =====================================================

/**
 * Create a successful API response
 * @param data The response data
 * @param requestId Optional request ID for tracking
 * @returns Standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  requestId?: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: requestId || generateRequestId(),
      version: '1.0',
    },
  };
}

// =====================================================
// ERROR RESPONSE BUILDER
// =====================================================

/**
 * Create an error API response
 * @param code Error code (from ErrorCode enum)
 * @param details Optional additional error details
 * @param requestId Optional request ID for tracking
 * @returns Standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  details?: Record<string, any>,
  requestId?: string
): ApiResponse<null> {
  return {
    success: false,
    error: {
      code,
      message: ERROR_MESSAGES[code] || 'An error occurred',
      details,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: requestId || generateRequestId(),
      version: '1.0',
    },
  };
}

// =====================================================
// ERROR HANDLERS
// =====================================================

/**
 * Handle Supabase errors and map to API error codes
 * @param error The error from Supabase
 * @param context Additional context for debugging
 * @returns Standardized error response
 */
export function handleSupabaseError(
  error: any,
  context?: { action?: string; resource?: string }
): ApiResponse<null> {
  // Log error for debugging
  console.error('Supabase error:', error, context);

  // Handle specific Supabase error codes
  if (error?.code === '23505') {
    // Unique constraint violation
    return createErrorResponse(
      ErrorCode.DUPLICATE_ENTRY,
      { originalCode: error.code }
    );
  }

  if (error?.code === '23503') {
    // Foreign key violation
    return createErrorResponse(
      ErrorCode.CONSTRAINT_VIOLATION,
      { originalCode: error.code }
    );
  }

  if (error?.code === '42P01') {
    // Undefined table
    return createErrorResponse(
      ErrorCode.DATABASE_ERROR,
      { originalCode: error.code }
    );
  }

  if (error?.message?.includes('row level security')) {
    return createErrorResponse(
      ErrorCode.PERMISSION_DENIED,
      { reason: 'RLS policy violation' }
    );
  }

  // Handle RLS/Auth errors
  if (error?.status === 401) {
    return createErrorResponse(ErrorCode.AUTH_REQUIRED);
  }

  if (error?.status === 403) {
    return createErrorResponse(ErrorCode.PERMISSION_DENIED);
  }

  // Generic database error
  return createErrorResponse(
    ErrorCode.DATABASE_ERROR,
    { originalMessage: error?.message }
  );
}

/**
 * Handle validation errors
 * @param validationErrors Object with field names as keys and error messages as values
 * @returns Standardized error response
 */
export function handleValidationError(
  validationErrors: Record<string, string[]> | string
): ApiResponse<null> {
  if (typeof validationErrors === 'string') {
    return createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      { error: validationErrors }
    );
  }

  return createErrorResponse(
    ErrorCode.VALIDATION_ERROR,
    { fieldErrors: validationErrors }
  );
}

/**
 * Handle center status validation
 * @param centerStatus Current center status
 * @param requiredStatus Status(es) required for operation
 * @returns Standardized error response or null if valid
 */
export function validateCenterStatus(
  centerStatus: string | null | undefined,
  requiredStatus: string | string[] = 'ACTIVE'
): ApiResponse<null> | null {
  if (!centerStatus) {
    return createErrorResponse(ErrorCode.CENTER_NOT_FOUND);
  }

  const required = Array.isArray(requiredStatus)
    ? requiredStatus
    : [requiredStatus];

  if (!required.includes(centerStatus)) {
    if (centerStatus === 'SUSPENDED') {
      return createErrorResponse(ErrorCode.CENTER_SUSPENDED);
    }
    return createErrorResponse(
      ErrorCode.CENTER_NOT_ACTIVE,
      { currentStatus: centerStatus }
    );
  }

  return null;
}

/**
 * Handle ownership verification
 * @param ownerId ID of the owner
 * @param userId Current user ID
 * @returns Standardized error response or null if valid
 */
export function validateOwnership(
  ownerId: string | null | undefined,
  userId: string | null | undefined
): ApiResponse<null> | null {
  if (!ownerId || !userId) {
    return createErrorResponse(ErrorCode.OWNERSHIP_VIOLATION);
  }

  if (ownerId !== userId) {
    return createErrorResponse(
      ErrorCode.OWNERSHIP_VIOLATION,
      { reason: 'User does not own this resource' }
    );
  }

  return null;
}

/**
 * Handle publish validation
 * @param item Item to publish
 * @param validationRules Rules that must be satisfied
 * @returns Standardized error response or null if valid
 */
export function validatePublishRules(
  item: any,
  validationRules: {
    hasTitle?: boolean;
    hasDescription?: boolean;
    minItems?: number;
    itemsField?: string;
  }
): ApiResponse<null> | null {
  if (validationRules.hasTitle && (!item.title || item.title.trim() === '')) {
    return createErrorResponse(
      ErrorCode.CANNOT_PUBLISH_EMPTY,
      { reason: 'Item must have a title' }
    );
  }

  if (
    validationRules.hasDescription &&
    (!item.description || item.description.trim() === '')
  ) {
    return createErrorResponse(
      ErrorCode.CANNOT_PUBLISH_EMPTY,
      { reason: 'Item must have a description' }
    );
  }

  if (validationRules.minItems) {
    const itemsField = validationRules.itemsField || 'items';
    const itemCount = Array.isArray(item[itemsField])
      ? item[itemsField].length
      : 0;

    if (itemCount < validationRules.minItems) {
      return createErrorResponse(
        ErrorCode.CANNOT_PUBLISH_EMPTY,
        {
          reason: `Item must have at least ${validationRules.minItems} ${itemsField}`,
          current: itemCount,
          required: validationRules.minItems,
        }
      );
    }
  }

  return null;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Generate unique request ID for tracking
 * @returns UUID string
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if response is successful
 * @param response API response
 * @returns Boolean
 */
export function isSuccess(response: ApiResponse): boolean {
  return response.success === true;
}

/**
 * Check if response is error
 * @param response API response
 * @returns Boolean
 */
export function isError(response: ApiResponse): boolean {
  return response.success === false;
}

/**
 * Extract error message from response
 * @param response API response
 * @returns Error message string
 */
export function getErrorMessage(response: ApiResponse): string {
  if (!response.error) return 'Unknown error';
  return response.error.message;
}

/**
 * Extract error code from response
 * @param response API response
 * @returns Error code string
 */
export function getErrorCode(response: ApiResponse): string | null {
  return response.error?.code || null;
}

// =====================================================
// ASYNC ERROR HANDLING
// =====================================================

/**
 * Wrapper for async operations with error handling
 * @param fn Async function to execute
 * @param context Additional context for error logging
 * @returns Promise of standardized response
 */
export async function handleAsyncOperation<T>(
  fn: () => Promise<T>,
  context?: { action?: string; resource?: string }
): Promise<ApiResponse<T>> {
  try {
    const data = await fn();
    return createSuccessResponse(data);
  } catch (error) {
    return handleSupabaseError(error, context) as any;
  }
}

/**
 * Transform async operation to always return ApiResponse
 * @param operation Async operation to wrap
 * @returns Wrapped operation
 */
export function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorContext?: { action?: string; resource?: string }
) {
  return async (): Promise<ApiResponse<T>> => {
    return handleAsyncOperation(operation, errorContext);
  };
}

// =====================================================
// REACT QUERY INTEGRATION
// =====================================================

/**
 * Parse API response for React Query
 * Used in hooks to standardize response handling
 * @param response API response
 * @returns Data on success, throws error on failure
 */
export function parseApiResponse<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(
      response.error?.message || 'An error occurred'
    );
  }

  if (!response.data) {
    throw new Error('No data returned');
  }

  return response.data;
}

/**
 * Get user-friendly error message from unknown error
 * @param error Unknown error
 * @returns String message
 */
export function getErrorMessageFromUnknown(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return (error as any).message;
  }

  return ERROR_MESSAGES[ErrorCode.INTERNAL_ERROR];
}

// =====================================================
// LOGGING & MONITORING
// =====================================================

/**
 * Log API error for monitoring
 * @param error Error object or response
 * @param context Additional context
 */
export function logApiError(
  error: unknown,
  context?: Record<string, any>
): void {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    error:
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
          }
        : error,
  };

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // sendToErrorTracker(errorInfo);
    console.error('API Error:', errorInfo);
  } else {
    console.error('API Error (Development):', errorInfo);
  }
}

// =====================================================
// EXPORT ALL
// =====================================================

export default {
  createSuccessResponse,
  createErrorResponse,
  handleSupabaseError,
  handleValidationError,
  validateCenterStatus,
  validateOwnership,
  validatePublishRules,
  generateRequestId,
  isSuccess,
  isError,
  getErrorMessage,
  getErrorCode,
  handleAsyncOperation,
  withErrorHandling,
  parseApiResponse,
  getErrorMessageFromUnknown,
  logApiError,
  ErrorCode,
  ERROR_MESSAGES,
};
