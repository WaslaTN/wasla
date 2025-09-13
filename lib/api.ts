/**
 * Wasla API Client - Updated for Step-by-Step Booking
 * Handles all communication with the Central Server
 */

const CENTRAL_SERVER_URL = process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL || 'http://localhost:5000';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface User {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  isActive: boolean;
  role: string;
  createdAt: string;
}

export interface Station {
  id: string;
  name: string;
  nameAr?: string;
  governorate: {
    name: string;
    nameAr?: string;
  };
  delegation: {
    name: string;
    nameAr?: string;
  };
  address?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  isOnline: boolean;
  lastHeartbeat?: string;
}

export interface RouteDestination {
  destinationId: string;
  destinationName: string;
  destinationNameAr?: string;
  governorate: string;
  delegation: string;
  totalVehicles: number;
  availableSeats: number;
  estimatedDeparture: string;
  basePrice: number;
  vehicles: VehicleInfo[];
  openingTime?: string; // Station opening time in HH:MM format
}

export interface VehicleInfo {
  id: string;
  licensePlate: string;
  capacity: number;
  availableSeats: number;
  queuePosition: number;
  status: string;
  pricePerSeat: number;
  estimatedDeparture: string;
  driverName?: string;
  vehicleModel?: string;
}

export interface Booking {
  id: string;
  verificationCode: string;
  totalAmount: number;
  seatsBooked: number;
  status: 'PENDING' | 'PAID' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  journeyDate: string;
  paymentReference?: string;
  paymentProcessedAt?: string;
  createdAt: string;
  departureStation: {
    id: string;
    name: string;
    nameAr?: string;
    governorate: string;
    delegation: string;
  };
  destinationStation: {
    id: string;
    name: string;
    nameAr?: string;
    governorate: string;
    delegation: string;
  };
  vehicles?: VehicleInfo[];
  payment?: {
    paymentUrl: string;
    paymentRef: string;
    amount: number;
    currency: string;
    expiresIn: string;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = CENTRAL_SERVER_URL) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log(`🔗 API Request: ${options.method || 'GET'} ${url}`);

      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();
      console.log(`📡 API Response: ${response.status}`, data);

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || `HTTP ${response.status}`,
          ...data,
        };
      }

      return {
        success: true,
        ...data,
      };
    } catch (error) {
      console.error('❌ API Request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Authentication
  async login(phoneNumber: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/api/v1/users/login', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, password }),
    });
  }

  async register(userData: {
    phoneNumber: string;
    password: string;
    firstName: string;
    lastName: string;
    email?: string;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/api/v1/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async verifyUser(token: string): Promise<ApiResponse<{ user: User }>> {
    return this.request('/api/v1/users/verify-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // Route Discovery - Step-by-Step Booking Flow
  /**
   * Step 1: Get all online stations that have available destinations
   * GET /api/v1/route-discovery/stations/online
   */
  async getOnlineStations(): Promise<ApiResponse<Station[]>> {
    return this.request('/api/v1/route-discovery/stations/online');
  }

  /**
   * Step 2: Get available destinations for a specific departure station
   * GET /api/v1/route-discovery/stations/:stationId
   */
  async getStationDestinations(stationId: string): Promise<ApiResponse<RouteDestination[]>> {
    return this.request(`/api/v1/route-discovery/stations/${stationId}`);
  }

  /**
   * Step 3: Get detailed vehicle queue information for a specific route
   * GET /api/v1/route-discovery/route/:departureStationId/:destinationId
   */
  async getRouteDetails(
    departureStationId: string,
    destinationId: string
  ): Promise<ApiResponse<RouteDestination>> {
    return this.request(`/api/v1/route-discovery/route/${departureStationId}/${destinationId}`);
  }

  /**
   * Get detailed status of a specific station
   * GET /api/v1/route-discovery/station/:stationId/status
   */
  async getStationStatus(stationId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/route-discovery/station/${stationId}/status`);
  }

  /**
   * Get detailed status of a specific station
   * GET /api/v1/central-bookings/booking-details/:paymentRef
   */
  async getBookingDetails(paymentRef: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/central-bookings/booking-details/${paymentRef}`);
  }

  
  // Central Bookings
  /**
   * Step 4: Create booking and get payment URL
   * POST /api/v1/central-bookings/create
   */
  async createBooking(
    departureStationId: string,
    destinationStationId: string,
    numberOfSeats: number,
    journeyDate: string
  ): Promise<ApiResponse<{ booking: Booking; paymentUrl: string }>> {
    // Use frontend webhook URL instead of Central Server's own webhook
    const frontendWebhookUrl = `${window.location.origin}/api/webhook/payment`;
    
    return this.request('/api/v1/central-bookings/create', {
      method: 'POST',
      body: JSON.stringify({
        departureStationId,
        destinationStationId,
        numberOfSeats, // Note: Using 'numberOfSeats' to match your API
        journeyDate,
        webhookUrl: frontendWebhookUrl // Send frontend webhook URL to Central Server
      }),
    });
  }

  /**
   * Get booking history for the authenticated user
   * GET /api/v1/bookings
   */
  async getBookingHistory(): Promise<ApiResponse<{ bookings: Booking[] }>> {
    // This endpoint automatically gets user's bookings based on JWT token
    return this.request('/api/v1/bookings');
  }

  /**
   * Get bookings for a specific user (admin only)
   * GET /api/v1/central-bookings/user/:userId
   */
  async getUserBookings(userId: string): Promise<ApiResponse<Booking[]>> {
    return this.request(`/api/v1/central-bookings/user/${userId}`);
  }

  /**
   * Get payment status by payment reference
   * GET /api/v1/central-bookings/payment/:paymentRef
   */
  async getPaymentStatus(paymentRef: string): Promise<ApiResponse<{
    booking: Booking;
    payment: any;
  }>> {
    return this.request(`/api/v1/central-bookings/payment/${paymentRef}`);
  }

  /**
   * Debug payment status (development only)
   * GET /api/v1/central-bookings/debug/payment/:paymentRef
   */
  async debugPaymentStatus(paymentRef: string): Promise<ApiResponse<{
    booking: Booking;
    payment: any;
  }>> {
    return this.request(`/api/v1/central-bookings/debug/payment/${paymentRef}`);
  }

  /**
   * Test payment completion (development only)
   * POST /api/v1/central-bookings/test-payment/:paymentRef
   */
  async testPaymentCompletion(paymentRef: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/central-bookings/test-payment/${paymentRef}`, {
      method: 'POST',
    });
  }

  // Overnight Booking Methods
  /**
   * Get available overnight destinations for a specific station
   * GET /api/v1/route-discovery/overnight/:stationId
   */
  async getOvernightDestinations(stationId: string): Promise<ApiResponse<RouteDestination[]>> {
    return this.request(`/api/v1/route-discovery/overnight/${stationId}`);
  }

  /**
   * Get detailed vehicle queue information for a specific overnight route
   * GET /api/v1/route-discovery/overnight/:departureStationId/:destinationId
   */
  async getOvernightRouteDetails(
    departureStationId: string,
    destinationId: string
  ): Promise<ApiResponse<RouteDestination>> {
    return this.request(`/api/v1/route-discovery/overnight/${departureStationId}/${destinationId}`);
  }

  /**
   * Create an overnight booking
   * POST /api/v1/central-bookings/overnight
   */
  async createOvernightBooking(
    departureStationId: string,
    destinationStationId: string,
    numberOfSeats: number
  ): Promise<ApiResponse<{ booking: Booking; paymentUrl: string }>> {
    // Use frontend webhook URL instead of Central Server's own webhook
    const frontendWebhookUrl = `${window.location.origin}/api/webhook/payment`;

    return this.request('/api/v1/central-bookings/overnight', {
      method: 'POST',
      body: JSON.stringify({
        departureStationId,
        destinationStationId,
        numberOfSeats,
        webhookUrl: frontendWebhookUrl // Send frontend webhook URL to Central Server
      }),
    });
  }

  // Health Check Endpoints
  async checkRouteDiscoveryHealth(): Promise<ApiResponse<any>> {
    return this.request('/api/v1/route-discovery/health');
  }

  async checkCentralBookingHealth(): Promise<ApiResponse<any>> {
    return this.request('/api/v1/central-bookings/health');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export hook for React components
export function useApiClient() {
  return apiClient;
}

// Helper functions
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userToken');
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('userProfile');
  return userStr ? JSON.parse(userStr) : null;
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null && getCurrentUser() !== null;
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('userToken');
  localStorage.removeItem('userProfile');
  document.cookie = 'userToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
}

// Additional helper functions for the booking flow
export function formatEstimatedTime(timeString: string): string {
  try {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } catch {
    return timeString;
  }
}

export function calculateTotalPrice(basePrice: number, seats: number): number {
  return basePrice * seats;
}

export function getVehicleStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'waiting': return 'text-yellow-400';
    case 'boarding': return 'text-blue-400';
    case 'departed': return 'text-green-400';
    case 'full': return 'text-red-400';
    default: return 'text-gray-400';
  }
}

export function getBookingStatusBadge(status: string): { color: string; text: string } {
  switch (status) {
    case 'PENDING':
      return { color: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/50', text: 'Pending Payment' };
    case 'PAID':
      return { color: 'bg-blue-600/20 text-blue-400 border-blue-500/50', text: 'Paid' };
    case 'COMPLETED':
      return { color: 'bg-green-600/20 text-green-400 border-green-500/50', text: 'Completed' };
    case 'FAILED':
      return { color: 'bg-red-600/20 text-red-400 border-red-500/50', text: 'Failed' };
    case 'CANCELLED':
      return { color: 'bg-gray-600/20 text-gray-400 border-gray-500/50', text: 'Cancelled' };
    default:
      return { color: 'bg-gray-600/20 text-gray-400 border-gray-500/50', text: status };
  }
}

// Overnight booking helper functions
export function calculateOvernightETA(openingTime: string): { eta: string; dayIndicator: string } {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Parse opening time (format: "HH:MM")
  const [openingHour, openingMinute] = openingTime.split(':').map(Number);

  // Create opening time for today
  const todayOpening = new Date();
  todayOpening.setHours(openingHour, openingMinute, 0, 0);

  // Create opening time for tomorrow
  const tomorrowOpening = new Date(todayOpening);
  tomorrowOpening.setDate(tomorrowOpening.getDate() + 1);

  // Calculate minutes until opening
  let minutesUntilOpening: number;
  let dayIndicator: string;

  if (now < todayOpening) {
    // Station opens today
    minutesUntilOpening = Math.floor((todayOpening.getTime() - now.getTime()) / (1000 * 60));
    dayIndicator = 'today';
  } else {
    // Station opens tomorrow
    minutesUntilOpening = Math.floor((tomorrowOpening.getTime() - now.getTime()) / (1000 * 60));
    dayIndicator = 'tomorrow';
  }

  // Format ETA
  let eta: string;
  if (minutesUntilOpening <= 60) {
    eta = `${minutesUntilOpening} MIN`;
  } else {
    const hours = Math.floor(minutesUntilOpening / 60);
    const minutes = minutesUntilOpening % 60;
    eta = minutes > 0 ? `${hours}H ${minutes}MIN` : `${hours}H`;
  }

  console.log(`🌙 ETA Calculation: Current time ${currentHour}:${currentMinute}, Opening time ${openingTime}, Day: ${dayIndicator}, ETA: ${eta}`);

  return { eta, dayIndicator };
}

export function formatOvernightDepartureTime(openingTime: string, estimatedDeparture?: string): string {
  if (estimatedDeparture) {
    // If we have a specific estimated departure time, use it
    try {
      const departure = new Date(estimatedDeparture);
      return departure.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('Invalid estimated departure time, using opening time');
    }
  }

  // Use opening time as fallback
  const [hour, minute] = openingTime.split(':');
  const openingDate = new Date();
  openingDate.setHours(parseInt(hour), parseInt(minute), 0, 0);

  // If current time is after opening time, assume it's for tomorrow
  const now = new Date();
  if (now > openingDate) {
    openingDate.setDate(openingDate.getDate() + 1);
  }

  return openingDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}