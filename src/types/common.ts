/**
 * Common types for the trivia game application
 */

// Tier types used across the application
export type Tier = 'bronze' | 'silver' | 'gold';

// Common page props for dynamic routes
export interface PageParams {
  roomId?: string;
  questionId?: string;
  participantId?: string;
  id?: string;
}

export interface PageProps {
  params: PageParams;
  searchParams: { [key: string]: string | string[] | undefined };
}

// API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
} 