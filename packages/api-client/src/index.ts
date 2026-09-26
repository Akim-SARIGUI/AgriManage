import type {
  ActivityDto,
  AdminUserDto,
  AuthUser,
  CropDetailDto,
  CropDto,
  ExpenseDto,
  FinanceSummaryDto,
  HealthStatus,
  InterventionDto,
  ParcelDto,
  RevenueDto,
  Role,
  StockDto,
  StockHistoryDto,
  StockMovementLevel,
  StockType,
  SupportStatus,
  SupportTicketDto,
  WeatherForecastDto,
  WeatherLocationDto,
  NotificationDto,
  NotificationsFeedDto,
  AdminOverviewDto,
} from '@agrimanage/shared';

export type ApiClientOptions = {
  baseUrl: string;
  fetch?: typeof fetch;
  /** Appelé après échec du refresh (session vraiment expirée). */
  onUnauthorized?: () => void | Promise<void>;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly body?: unknown,
    /** Si true : ne pas afficher l’erreur dans l’UI (redirect session en cours). */
    public readonly silent = false,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Erreur d’auth / session : rediriger, ne pas afficher comme erreur métier. */
export function isSessionError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.silent || error.statusCode === 401 || /session expirée/i.test(error.message))
  );
}

const AUTH_SKIP_REFRESH = [
  '/auth/login',
  '/auth/admin/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/password/request-reset',
  '/auth/password/reset',
];

export class AgriManageApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly onUnauthorized?: () => void | Promise<void>;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.fetchImpl = options.fetch ?? fetch.bind(globalThis);
    this.onUnauthorized = options.onUnauthorized;
  }

  health() {
    return this.request<HealthStatus>('/health');
  }

  register(payload: { email: string; fullName: string; password: string }) {
    return this.request<AuthUser>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  login(payload: { email: string; password: string }) {
    return this.request<AuthUser>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  adminLogin(payload: { email: string; password: string }) {
    return this.request<AuthUser>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  logout() {
    return this.request<{ success: boolean }>('/auth/logout', { method: 'POST' });
  }

  me() {
    return this.request<AuthUser>('/auth/me');
  }

  updateProfile(payload: { fullName?: string; email?: string }) {
    return this.request<AuthUser>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  changePassword(payload: { currentPassword: string; newPassword: string }) {
    return this.request<{ success: boolean }>('/auth/password/change', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  refresh() {
    return this.request<AuthUser>('/auth/refresh', { method: 'POST' });
  }

  requestPasswordReset(email: string) {
    return this.request<{ success: boolean }>('/auth/password/request-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  resetPassword(payload: { email: string; code: string; newPassword: string }) {
    return this.request<{ success: boolean }>('/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  listParcels() {
    return this.request<ParcelDto[]>('/parcels');
  }

  getParcel(id: string) {
    return this.request<ParcelDto>(`/parcels/${id}`);
  }

  createParcel(payload: {
    name: string;
    size?: number;
    latitude?: number;
    longitude?: number;
    locationLabel?: string;
  }) {
    return this.request<ParcelDto>('/parcels', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  updateParcel(
    id: string,
    payload: {
      name?: string;
      size?: number | null;
      latitude?: number | null;
      longitude?: number | null;
      locationLabel?: string | null;
    },
  ) {
    return this.request<ParcelDto>(`/parcels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  deleteParcel(id: string) {
    return this.request<{ success: true }>(`/parcels/${id}`, {
      method: 'DELETE',
    });
  }

  listCrops(parcelId?: string) {
    const query = parcelId ? `?parcelId=${encodeURIComponent(parcelId)}` : '';
    return this.request<CropDto[]>(`/crops${query}`);
  }

  getCrop(id: string) {
    return this.request<CropDetailDto>(`/crops/${id}`);
  }

  createCrop(payload: {
    parcelId: string;
    name: string;
    plantingDate?: string;
    harvestDate?: string;
  }) {
    return this.request<CropDto>('/crops', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  updateCrop(
    id: string,
    payload: {
      parcelId?: string;
      name?: string;
      plantingDate?: string | null;
      harvestDate?: string | null;
    },
  ) {
    return this.request<CropDto>(`/crops/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  deleteCrop(id: string) {
    return this.request<{ success: true }>(`/crops/${id}`, {
      method: 'DELETE',
    });
  }

  createActivity(
    cropId: string,
    payload: { name: string; date?: string; details?: string },
  ) {
    return this.request<ActivityDto>(`/crops/${cropId}/activities`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  updateActivity(
    id: string,
    payload: { name?: string; date?: string | null; details?: string | null },
  ) {
    return this.request<ActivityDto>(`/activities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  deleteActivity(id: string) {
    return this.request<{ success: true }>(`/activities/${id}`, {
      method: 'DELETE',
    });
  }

  createIntervention(activityId: string, payload: { note?: string } = {}) {
    return this.request<InterventionDto>(`/activities/${activityId}/interventions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  deleteIntervention(id: string) {
    return this.request<{ success: true }>(`/interventions/${id}`, {
      method: 'DELETE',
    });
  }

  listStocks(type?: StockType) {
    const query = type ? `?type=${encodeURIComponent(type)}` : '';
    return this.request<StockDto[]>(`/stocks${query}`);
  }

  getStockMeta() {
    return this.request<{ lowStockThreshold: number }>('/stocks/meta');
  }

  getStock(id: string) {
    return this.request<StockDto>(`/stocks/${id}`);
  }

  createStock(payload: {
    name: string;
    quantity: number;
    unit: string;
    type: StockType;
  }) {
    return this.request<StockDto>('/stocks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  updateStock(
    id: string,
    payload: {
      name?: string;
      quantity?: number;
      unit?: string;
      type?: StockType;
    },
  ) {
    return this.request<StockDto>(`/stocks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  deleteStock(id: string) {
    return this.request<{ success: true }>(`/stocks/${id}`, {
      method: 'DELETE',
    });
  }

  moveStock(
    id: string,
    payload: { level: StockMovementLevel; quantity: number; date?: string },
  ) {
    return this.request<StockDto>(`/stocks/${id}/move`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  listStockHistory(options?: { type?: StockType; level?: StockMovementLevel }) {
    const params = new URLSearchParams();
    if (options?.type) params.set('type', options.type);
    if (options?.level) params.set('level', options.level);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<StockHistoryDto[]>(`/stock-history${query}`);
  }

  getFinanceSummary() {
    return this.request<FinanceSummaryDto>('/finance/summary');
  }

  listRevenues() {
    return this.request<RevenueDto[]>('/finance/revenues');
  }

  createRevenue(payload: { amount: number; source: string; date: string }) {
    return this.request<RevenueDto>('/finance/revenues', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  updateRevenue(
    id: string,
    payload: { amount?: number; source?: string; date?: string },
  ) {
    return this.request<RevenueDto>(`/finance/revenues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  deleteRevenue(id: string) {
    return this.request<{ success: true }>(`/finance/revenues/${id}`, {
      method: 'DELETE',
    });
  }

  listExpenses() {
    return this.request<ExpenseDto[]>('/finance/expenses');
  }

  createExpense(payload: { amount: number; category: string; date: string }) {
    return this.request<ExpenseDto>('/finance/expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  updateExpense(
    id: string,
    payload: { amount?: number; category?: string; date?: string },
  ) {
    return this.request<ExpenseDto>(`/finance/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  deleteExpense(id: string) {
    return this.request<{ success: true }>(`/finance/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  listMyTickets() {
    return this.request<SupportTicketDto[]>('/support/tickets');
  }

  getMyTicket(id: string) {
    return this.request<SupportTicketDto>(`/support/tickets/${id}`);
  }

  createTicket(payload: { name: string; message: string }) {
    return this.request<SupportTicketDto>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  updateTicket(id: string, payload: { name?: string; message?: string }) {
    return this.request<SupportTicketDto>(`/support/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  deleteTicket(id: string) {
    return this.request<{ success: true }>(`/support/tickets/${id}`, {
      method: 'DELETE',
    });
  }

  listAdminTickets(status?: SupportStatus) {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.request<SupportTicketDto[]>(`/admin/support/tickets${query}`);
  }

  respondToTicket(
    id: string,
    payload: { response: string; status?: SupportStatus },
  ) {
    return this.request<SupportTicketDto>(`/admin/support/tickets/${id}/respond`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  updateAdminTicketStatus(id: string, status: SupportStatus) {
    return this.request<SupportTicketDto>(`/admin/support/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  deleteAdminTicket(id: string) {
    return this.request<{ success: true }>(`/admin/support/tickets/${id}`, {
      method: 'DELETE',
    });
  }

  getWeatherForecast(params: {
    latitude: number;
    longitude: number;
    locationName?: string;
  }) {
    const query = new URLSearchParams({
      latitude: String(params.latitude),
      longitude: String(params.longitude),
    });
    if (params.locationName) {
      query.set('locationName', params.locationName);
    }
    return this.request<WeatherForecastDto>(`/weather/forecast?${query.toString()}`);
  }

  searchWeatherLocations(q: string) {
    return this.request<WeatherLocationDto[]>(
      `/weather/search?q=${encodeURIComponent(q)}`,
    );
  }

  listNotifications() {
    return this.request<NotificationsFeedDto>('/notifications');
  }

  markNotificationRead(id: string) {
    return this.request<NotificationDto>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  markAllNotificationsRead() {
    return this.request<{ success: true }>('/notifications/read-all', {
      method: 'PATCH',
    });
  }

  listAdminUsers() {
    return this.request<AdminUserDto[]>('/admin/users');
  }

  getAdminOverview() {
    return this.request<AdminOverviewDto>('/admin/overview');
  }

  getAdminSystemHealth() {
    return this.request<HealthStatus>('/admin/system/health');
  }

  getAdminUser(id: string) {
    return this.request<AdminUserDto>(`/admin/users/${id}`);
  }

  createAdminUser(payload: {
    email: string;
    fullName: string;
    password: string;
    role: Role;
  }) {
    return this.request<AdminUserDto>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  updateAdminUser(
    id: string,
    payload: {
      email?: string;
      fullName?: string;
      role?: Role;
      password?: string;
    },
  ) {
    return this.request<AdminUserDto>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  unlockAdminUser(id: string) {
    return this.request<AdminUserDto>(`/admin/users/${id}/unlock`, {
      method: 'PATCH',
    });
  }

  deleteAdminUser(id: string) {
    return this.request<{ success: true }>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    retried = false,
  ): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(init.headers ?? {}),
      },
    });

    if (response.status === 401 && this.canRefresh(path)) {
      if (!retried) {
        const refreshed = await this.tryRefresh();
        if (refreshed) {
          return this.request<T>(path, init, true);
        }
      }
      await this.handleUnauthorized();
      throw new ApiError('', 401, undefined, true);
    }

    if (!response.ok) {
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = undefined;
      }
      const message = this.extractMessage(body, response.status);

      // Ancienne session / JWT incomplet : l’API renvoyait souvent ce 403 → traiter comme session morte
      if (
        response.status === 403 &&
        this.canRefresh(path) &&
        /permissions insuffisantes/i.test(message)
      ) {
        if (!retried) {
          const refreshed = await this.tryRefresh();
          if (refreshed) {
            return this.request<T>(path, init, true);
          }
        }
        await this.handleUnauthorized();
        throw new ApiError('', 401, body, true);
      }

      throw new ApiError(message, response.status, body);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private canRefresh(path: string) {
    return !AUTH_SKIP_REFRESH.some((skip) => path === skip || path.startsWith(`${skip}?`));
  }

  private async tryRefresh(): Promise<boolean> {
    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        try {
          const response = await this.fetchImpl(`${this.baseUrl}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          });
          return response.ok;
        } catch {
          return false;
        } finally {
          this.refreshPromise = null;
        }
      })();
    }
    return this.refreshPromise;
  }

  private async handleUnauthorized() {
    try {
      await this.onUnauthorized?.();
    } catch {
      /* ignore redirect errors */
    }
  }

  private extractMessage(body: unknown, status: number): string {
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const message = (body as { message: unknown }).message;
      if (typeof message === 'string') {
        return message;
      }
      if (Array.isArray(message)) {
        return message.map(String).join(', ');
      }
    }
    return `HTTP ${status}`;
  }
}
