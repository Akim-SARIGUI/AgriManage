import type { Role, StockMovementLevel, StockType, SupportStatus, NotificationType } from './enums';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface AdminUserDto {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  loginAttempts: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOverviewDto {
  users: {
    total: number;
    farmers: number;
    admins: number;
    locked: number;
  };
  tickets: {
    total: number;
    open: number;
    inProgress: number;
    closed: number;
  };
  health: HealthStatus;
  recentTickets: SupportTicketDto[];
  recentUsers: AdminUserDto[];
}

export interface ParcelDto {
  id: string;
  userId: string;
  name: string;
  size: number | null;
  latitude: number | null;
  longitude: number | null;
  locationLabel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CropDto {
  id: string;
  parcelId: string;
  parcelName?: string;
  name: string;
  plantingDate: string | null;
  harvestDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InterventionDto {
  id: string;
  activityId: string;
  note: string | null;
  createdAt: string;
}

export interface ActivityDto {
  id: string;
  cropId: string;
  name: string;
  date: string | null;
  details: string | null;
  createdAt: string;
  updatedAt: string;
  interventions?: InterventionDto[];
}

export interface CropDetailDto extends CropDto {
  activities: ActivityDto[];
}

export interface StockDto {
  id: string;
  userId: string;
  name: string;
  quantity: number;
  unit: string;
  type: StockType;
  createdAt: string;
  updatedAt: string;
}

export interface StockHistoryDto {
  id: string;
  userId: string;
  type: StockType;
  name: string;
  quantity: number;
  unit: string;
  level: StockMovementLevel;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueDto {
  id: string;
  userId: string;
  amount: number;
  source: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseDto {
  id: string;
  userId: string;
  amount: number;
  category: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceSummaryDto {
  totalRevenue: number;
  totalExpense: number;
  balance: number;
}

export interface SupportTicketDto {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  message: string;
  status: SupportStatus;
  response: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HealthStatus {
  status: 'ok' | 'degraded';
  service: string;
  timestamp: string;
}

export interface WeatherDayDto {
  date: string;
  weatherCode: number;
  weatherLabel: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  windSpeedMax: number | null;
}

export interface WeatherForecastDto {
  latitude: number;
  longitude: number;
  timezone: string;
  locationName?: string;
  days: WeatherDayDto[];
}

export interface WeatherLocationDto {
  id: number;
  name: string;
  country: string;
  admin1: string | null;
  latitude: number;
  longitude: number;
}

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsFeedDto {
  items: NotificationDto[];
  unreadCount: number;
}
