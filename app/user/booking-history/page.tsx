"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Navigation,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock3,
  MapPin,
  Ticket,
  History,
  RefreshCw,
  ArrowRight,
  QrCode,
  Hexagon,
  Cpu,
  Terminal,
  Network
} from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import { apiClient } from "@/lib/api";
import dynamic from "next/dynamic";
import { useLanguage } from "@/lib/hooks/useLanguage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const StationMap = dynamic(() => import("@/components/map/StationMap"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-black/20 rounded-lg flex items-center justify-center">
      <div className="text-gray-400">Loading map...</div>
    </div>
  )
});

interface Station {
  id: string;
  name: string;
  governorate: string;
  delegation: string;
  latitude?: number;
  longitude?: number;
}

interface StationCoordinates {
  [stationId: string]: {
    latitude: number;
    longitude: number;
  };
}

interface Booking {
  id: string;
  verificationCode: string;
  status: 'PAID' | 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  seatsBooked: number;
  totalAmount: number;
  journeyDate: string;
  paymentReference?: string;
  paymentProcessedAt?: string;
  createdAt: string;
  departureStation: Station;
  destinationStation: Station;
}

export default function BookingHistoryPage() {
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stationCoordinates, setStationCoordinates] = useState<StationCoordinates>({});
  const router = useRouter();

  const fetchStationCoordinates = async () => {
    try {
      console.log('🗺️ Fetching station coordinates...');
      
      const response = await fetch('http://localhost:5000/api/v1/stations');
      
      if (!response.ok) {
        throw new Error('Failed to fetch stations');
      }
      
      const result = await response.json();
      
      if (result.success && result.data?.stations) {
        const coordinates: StationCoordinates = {};
        result.data.stations.forEach((station: any) => {
          coordinates[station.id] = {
            latitude: station.latitude,
            longitude: station.longitude
          };
        });
        setStationCoordinates(coordinates);
        console.log('✅ Station coordinates loaded:', Object.keys(coordinates).length, 'stations');
      }
    } catch (error) {
      console.error('❌ Error fetching station coordinates:', error);
      // Fallback to default coordinates if API fails
      console.log('🔄 Using fallback coordinates');
    }
  };

  const fetchBookingHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      console.log('📋 Fetching booking history with API client...');

      const response = await apiClient.getBookingHistory();

      if (response.success && response.data) {
        setBookings(response.data.bookings || []);
        console.log('✅ Booking history loaded:', response.data.bookings?.length || 0, 'bookings');
      } else {
        throw new Error(response.error || 'Failed to fetch booking history');
      }
    } catch (error: any) {
      console.error('❌ Error fetching booking history:', error);
      setError(error.message || 'Failed to load booking history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchBookingHistory(),
        fetchStationCoordinates()
      ]);
    };
    
    loadData();
  }, []);

  const getStationCoordinates = (stationId: string) => {
    const coords = stationCoordinates[stationId];
    return coords || {
      latitude: 35.8256, // Fallback coordinates (center of Tunisia)
      longitude: 10.6340
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-gradient-to-r from-orange-500/20 to-red-600/20 border-orange-500/40 text-orange-400';
      case 'COMPLETED':
        return 'bg-gradient-to-r from-emerald-500/20 to-green-600/20 border-emerald-500/40 text-emerald-400';
      case 'PENDING':
        return 'bg-gradient-to-r from-amber-500/20 to-yellow-600/20 border-amber-500/40 text-amber-400';
      case 'FAILED':
        return 'bg-gradient-to-r from-red-500/20 to-pink-600/20 border-red-500/40 text-red-400';
      case 'CANCELLED':
        return 'bg-gradient-to-r from-gray-500/20 to-slate-600/20 border-gray-500/40 text-gray-400';
      default:
        return 'bg-gradient-to-r from-gray-500/20 to-slate-600/20 border-gray-500/40 text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'COMPLETED':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'PENDING':
        return <Clock3 className="w-4 h-4" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock3 className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="w-full max-w-md backdrop-blur-sm bg-gradient-to-br from-gray-900/90 to-black/90 border border-orange-500/30 shadow-lg shadow-orange-500/20">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
            <p className="text-white font-mono">{t('loading')} {t('myBookingHistory')}...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Cyberpunk Header */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-orange-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/user/dashboard')}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 border border-orange-500/20 font-mono"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                DASHBOARD
              </Button>
              <div className="w-px h-6 bg-orange-500/30"></div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                  <Hexagon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent font-mono">{t('tripHistory')}</h1>
                  <p className="text-gray-400 text-sm font-mono">{t('allYourJourneys')}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <LanguageSwitcher />
              <Button
                onClick={fetchBookingHistory}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 border border-orange-500/20 font-mono"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {t('refresh')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Error State */}
        {error && (
          <Card className="mb-6 backdrop-blur-sm bg-gradient-to-br from-gray-900/90 to-black/90 border border-orange-500/30 shadow-lg shadow-orange-500/10">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/10 to-red-600/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 font-mono">{t('errorLoadingHistory')}</h3>
              <p className="text-orange-400 mb-4 font-mono">{error}</p>
              <Button onClick={fetchBookingHistory} className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 border border-orange-500/30 text-white font-mono">
                {t('tryAgain')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Bookings List */}
        {bookings.length === 0 && !error ? (
          <Card className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-orange-500/30 shadow-lg shadow-orange-500/10">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-orange-500/30">
                <Hexagon className="w-10 h-10 text-orange-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3 font-mono">{t('noTripsYet')}</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto font-mono">
                {t('startJourneyWithUs')}
              </p>
              <Button
                onClick={() => router.push('/user/book-trip')}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-3 font-mono"
              >
                {t('bookYourFirstTrip')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <Card
                key={booking.id}
                className="group relative overflow-hidden bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-slate-900/50"
                onClick={() => router.push(`/user/booking-details/${booking.paymentReference || booking.id}`)}
              >
                {/* Ticket perforation effect */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-950 rounded-full -ml-3 border-2 border-slate-700/50"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-950 rounded-full -mr-3 border-2 border-slate-700/50"></div>
                
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-1">
                          <h3 className="text-lg sm:text-xl font-semibold text-white group-hover:text-slate-300 transition-colors truncate">
                            {booking.departureStation.name}
                          </h3>
                          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 hidden sm:block" />
                          <h3 className="text-lg sm:text-xl font-semibold text-white group-hover:text-slate-300 transition-colors truncate">
                            {booking.destinationStation.name}
                          </h3>
                        </div>
                        <p className="text-slate-400 text-xs sm:text-sm">
                          {booking.departureStation.governorate} → {booking.destinationStation.governorate}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start sm:text-right gap-2 sm:gap-0">
                      <Badge className={`${getStatusColor(booking.status)} px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm mb-0 sm:mb-2`}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1 sm:ml-2 font-medium">{booking.status}</span>
                      </Badge>
                      <div className="text-xl sm:text-2xl font-bold text-white">{booking.totalAmount} <span className="text-xs sm:text-sm text-slate-400">TND</span></div>
                    </div>
                  </div>

                  {/* Trip Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
                    <div className="text-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-700/50 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1 sm:mb-2">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                      </div>
                      <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Journey Date</div>
                      <div className="text-white font-semibold text-sm sm:text-base">{formatDate(booking.journeyDate)}</div>
                      <div className="text-slate-400 text-xs sm:text-sm">{formatTime(booking.journeyDate)}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-700/50 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1 sm:mb-2">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                      </div>
                      <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Passengers</div>
                      <div className="text-white font-semibold text-sm sm:text-base">{booking.seatsBooked}</div>
                      <div className="text-slate-400 text-xs sm:text-sm">{booking.seatsBooked === 1 ? 'seat' : 'seats'}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-700/50 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1 sm:mb-2">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                      </div>
                      <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Booked</div>
                      <div className="text-white font-semibold text-sm sm:text-base">{formatDate(booking.createdAt)}</div>
                      <div className="text-slate-400 text-xs sm:text-sm">{formatTime(booking.createdAt)}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-700/50 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1 sm:mb-2">
                        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                      </div>
                      <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Payment</div>
                      <div className="text-white font-semibold text-sm sm:text-base">
                        {booking.paymentProcessedAt ? 'Completed' : 'Pending'}
                      </div>
                      {booking.paymentReference && (
                        <div className="text-slate-400 text-xs font-mono">{booking.paymentReference.slice(-6)}</div>
                      )}
                    </div>
                  </div>

                  {/* Verification Code */}
                  <div className="bg-slate-700/30 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                          <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                        </div>
                        <div>
                          <div className="text-slate-400 text-xs sm:text-sm">Verification Code</div>
                          <div className="text-white font-mono font-bold text-base sm:text-lg tracking-wider">
                            {booking.verificationCode}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/user/booking-details/${booking.paymentReference || booking.id}`);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base px-4 sm:px-6 py-2"
                      >
                        View Ticket
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs sm:text-sm">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <span className="text-slate-400">
                        Booking ID: <span className="font-mono text-slate-300">{booking.id.slice(-8)}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 self-start sm:self-auto">
                      <span className="text-slate-400">Tap to view details</span>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 group-hover:text-slate-300 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 