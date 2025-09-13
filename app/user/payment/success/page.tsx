"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle,
  ArrowLeft, 
  CreditCard, 
  Calendar, 
  Users, 
  Navigation, 
  Timer, 
  Phone, 
  User, 
  MapPin,
  Clock,
  Ticket,
  AlertTriangle,
  Copy,
  Share2,
  Hexagon,
  Cpu,
  Terminal,
  Network,
  Plus
} from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import { apiClient } from "@/lib/api";
import { notificationService } from "@/lib/notificationService";
import dynamic from "next/dynamic";
import { useLanguage } from "@/lib/hooks/useLanguage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

// Countdown Timer Component
interface CountdownTimerProps {
  estimatedDepartureTime: string;
  bookingId: string;
  departureStation: string;
  destinationStation: string;
  onTicketExpired: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  estimatedDepartureTime, 
  bookingId, 
  departureStation, 
  destinationStation,
  onTicketExpired
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    isBonusTime: boolean;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    isBonusTime: false
  });

  const [notificationsSent, setNotificationsSent] = useState<{
    oneHour: boolean;
    thirtyMinutes: boolean;
    tenMinutes: boolean;
    bonusTime: boolean;
  }>({
    oneHour: false,
    thirtyMinutes: false,
    tenMinutes: false,
    bonusTime: false
  });

  // Bonus time duration in minutes
  const BONUS_TIME_MINUTES = 2;

  // Send notification using the notification service
  const sendNotification = async (title: string, body: string, tag?: string) => {
    try {
      await notificationService.sendNotification(title, body, { tag });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  // Send event message to backend
  const sendEventMessage = async (eventType: string, message: string) => {
    try {
      const response = await fetch('/api/notifications/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          bookingId,
          eventType,
          message,
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        console.log(`Event message sent: ${eventType}`);
      }
    } catch (error) {
      console.error('Failed to send event message:', error);
    }
  };

  // Expire ticket when countdown and bonus time run out
  const expireTicket = async () => {
    try {
      const response = await fetch(`/api/expire-ticket/${bookingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        }
      });
      
      if (response.ok) {
        console.log('Ticket expired successfully');
        // Call the parent's expire function
        onTicketExpired();
      } else {
        const errorData = await response.json();
        console.error('Failed to expire ticket:', errorData);
        
        // Show error message to user
        alert(`Failed to expire ticket: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error expiring ticket:', error);
      alert('Network error occurred while expiring ticket');
    }
  };

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const targetTime = new Date(estimatedDepartureTime).getTime();
      const difference = targetTime - now;

      // Check if we're in bonus time (after original time expired)
      if (difference <= 0) {
        const bonusTimeRemaining = Math.abs(difference);
        const bonusMinutes = Math.floor(bonusTimeRemaining / (1000 * 60));
        const bonusSeconds = Math.floor((bonusTimeRemaining % (1000 * 60)) / 1000);
        
        // If bonus time is still available
        if (bonusMinutes < BONUS_TIME_MINUTES) {
          setTimeLeft({
            hours: 0,
            minutes: bonusMinutes,
            seconds: bonusSeconds,
            isExpired: false,
            isBonusTime: true
          });

          // Send bonus time notification only once
          if (!notificationsSent.bonusTime) {
            const title = "⏰ Bonus Time Active!";
            const body = `You have ${BONUS_TIME_MINUTES} minutes of bonus time to reach the station!`;
            
            sendNotification(title, body, `bonus-time-${bookingId}`);
            sendEventMessage('BONUS_TIME_ACTIVE', body);
            
            setNotificationsSent(prev => ({ ...prev, bonusTime: true }));
          }
          return;
        } else {
          // Bonus time expired
          setTimeLeft({
            hours: 0,
            minutes: 0,
            seconds: 0,
            isExpired: true,
            isBonusTime: false
          });
          
          // Call the expire API
          expireTicket();
          return;
        }
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({
        hours,
        minutes,
        seconds,
        isExpired: false,
        isBonusTime: false
      });

      // Check for notification triggers
      const totalMinutes = Math.floor(difference / (1000 * 60));
      
      // 1 hour left notification
      if (totalMinutes <= 60 && totalMinutes > 59 && !notificationsSent.oneHour) {
        const title = "🚌 Departure in 1 Hour!";
        const body = `Your trip from ${departureStation} to ${destinationStation} departs in 1 hour. Please arrive 15 minutes early.`;
        
        sendNotification(title, body, `departure-1hour-${bookingId}`);
        sendEventMessage('DEPARTURE_1HOUR', body);
        
        setNotificationsSent(prev => ({ ...prev, oneHour: true }));
      }
      
      // 30 minutes left notification
      if (totalMinutes <= 30 && totalMinutes > 29 && !notificationsSent.thirtyMinutes) {
        const title = "⚠️ Departure in 30 Minutes!";
        const body = `URGENT: Your trip from ${departureStation} to ${destinationStation} departs in 30 minutes. Please hurry to the station!`;
        
        sendNotification(title, body, `departure-30min-${bookingId}`);
        sendEventMessage('DEPARTURE_30MIN', body);
        
        setNotificationsSent(prev => ({ ...prev, thirtyMinutes: true }));
      }
      
      // 10 minutes left notification
      if (totalMinutes <= 10 && totalMinutes > 9 && !notificationsSent.tenMinutes) {
        const title = "🚨 Departure in 10 Minutes!";
        const body = `CRITICAL: Your trip from ${departureStation} to ${destinationStation} departs in 10 minutes. You must be at the station NOW!`;
        
        sendNotification(title, body, `departure-10min-${bookingId}`);
        sendEventMessage('DEPARTURE_10MIN', body);
        
        setNotificationsSent(prev => ({ ...prev, tenMinutes: true }));
      }
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [estimatedDepartureTime, bookingId, departureStation, destinationStation, notificationsSent]);

  if (timeLeft.isExpired) {
    return (
      <div className="text-center">
        <div className="text-2xl sm:text-3xl font-bold text-red-400 mb-2 font-mono">
          TICKET_EXPIRED
        </div>
        <div className="text-gray-400 text-sm font-mono">
          PLEASE_CONTACT_CUSTOMER_SERVICE
        </div>
      </div>
    );
  }

  // Determine urgency level and colors
  const isUrgent = timeLeft.hours === 0 && timeLeft.minutes < 30;
  const isWarning = timeLeft.hours === 0 && timeLeft.minutes < 60;
  
  const getTimeDisplayColor = (unit: 'hours' | 'minutes' | 'seconds') => {
    if (timeLeft.isBonusTime) return 'text-purple-400';
    if (isUrgent) return 'text-red-400';
    if (isWarning) return 'text-orange-400';
    return 'text-red-400';
  };

  const getBorderColor = (unit: 'hours' | 'minutes' | 'seconds') => {
    if (timeLeft.isBonusTime) return 'border-purple-500/50';
    if (isUrgent) return 'border-red-500/50';
    if (isWarning) return 'border-orange-500/50';
    return 'border-red-500/30';
  };

  const getBackgroundColor = () => {
    if (timeLeft.isBonusTime) return 'from-purple-500/20 to-pink-500/20';
    return 'from-gray-900/50 to-black/50';
  };

  return (
    <div className="space-y-4">
      {/* Bonus Time Banner */}
      {timeLeft.isBonusTime && (
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30 text-center animate-pulse">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-purple-500/30 rounded-full flex items-center justify-center">
              <Timer className="w-4 h-4 text-purple-400" />
            </div>
            <h4 className="text-purple-300 font-bold font-mono text-lg">BONUS TIME ACTIVE!</h4>
          </div>
          <p className="text-purple-200 text-sm font-mono">
            You have {BONUS_TIME_MINUTES} extra minutes to reach the station!
          </p>
        </div>
      )}

      {/* Countdown Display */}
      <div className="grid grid-cols-3 gap-4 sm:gap-6">
        <div className={`bg-gradient-to-br ${getBackgroundColor()} rounded-xl p-4 border ${getBorderColor('hours')} text-center transition-all duration-300 ${isUrgent ? 'animate-pulse' : ''}`}>
          <div className={`text-3xl sm:text-4xl font-bold ${getTimeDisplayColor('hours')} font-mono`}>
            {timeLeft.hours.toString().padStart(2, '0')}
          </div>
          <div className="text-gray-400 text-xs font-mono">HOURS</div>
        </div>
        
        <div className={`bg-gradient-to-br ${getBackgroundColor()} rounded-xl p-4 border ${getBorderColor('minutes')} text-center transition-all duration-300 ${isUrgent ? 'animate-pulse' : ''}`}>
          <div className={`text-3xl sm:text-4xl font-bold ${getTimeDisplayColor('minutes')} font-mono`}>
            {timeLeft.minutes.toString().padStart(2, '0')}
          </div>
          <div className="text-gray-400 text-xs font-mono">MINUTES</div>
        </div>
        
        <div className={`bg-gradient-to-br ${getBackgroundColor()} rounded-xl p-4 border ${getBorderColor('seconds')} text-center transition-all duration-300 ${isUrgent ? 'animate-pulse' : ''}`}>
          <div className={`text-3xl sm:text-4xl font-bold ${getTimeDisplayColor('seconds')} font-mono`}>
            {timeLeft.seconds.toString().padStart(2, '0')}
          </div>
          <div className="text-gray-400 text-xs font-mono">SECONDS</div>
        </div>
      </div>
    </div>
  );
};

// Notification Permission Request Component
const NotificationPermissionRequest: React.FC = () => {
  const [permission, setPermission] = useState<NotificationPermission | 'default'>('default');
  const [showRequest, setShowRequest] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
      setShowRequest(Notification.permission === 'default');
    }
  }, []);

  const requestPermission = async () => {
    try {
      // Register service worker first
      await notificationService.registerServiceWorker();
      
      // Request notification permission
      const result = await notificationService.requestPermission();
      setPermission(result);
      setShowRequest(false);
      
      if (result === 'granted') {
        // Send a test notification
        await notificationService.sendNotification(
          "🔔 Notifications Enabled!",
          "You'll now receive departure reminders for your trip!"
        );
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      alert('Failed to enable notifications. Please check your browser settings.');
    }
  };

  if (!showRequest) return null;

  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
      <div className="text-center">
        <div className="flex items-center justify-center mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg flex items-center justify-center mr-2 border border-blue-500/30">
            <AlertTriangle className="w-4 h-4 text-blue-400" />
          </div>
          <h4 className="text-white font-semibold font-mono">ENABLE_NOTIFICATIONS</h4>
        </div>
        
        <p className="text-gray-300 text-sm mb-4 font-mono">
          Get departure reminders at 1 hour, 30 minutes, and 10 minutes before your trip!
        </p>
        
        <Button
          onClick={requestPermission}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 font-mono"
        >
          🔔 ENABLE_NOTIFICATIONS
        </Button>
        
        <p className="text-gray-400 text-xs mt-2 font-mono">
          You can change this later in your browser settings
        </p>
      </div>
    </div>
  );
};

// Notification Status Indicator Component
const NotificationStatusIndicator: React.FC = () => {
  const [permission, setPermission] = useState<NotificationPermission | 'default'>('default');

  useEffect(() => {
    if (notificationService.isSupported()) {
      setPermission(notificationService.getPermission());
      
      // Check permission status periodically since there's no event for permission changes
      const interval = setInterval(() => {
        setPermission(notificationService.getPermission());
      }, 5000); // Check every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, []);

  if (permission === 'default') return null;

  return (
    <div className={`mt-3 p-3 rounded-lg border text-center ${
      permission === 'granted' 
        ? 'bg-green-500/20 border-green-500/40 text-green-300' 
        : 'bg-red-500/20 border-red-500/40 text-red-300'
    }`}>
      <div className="flex items-center justify-center space-x-2 font-mono text-sm">
        {permission === 'granted' ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            <span>✅ NOTIFICATIONS_ENABLED</span>
          </>
        ) : (
          <>
            <XCircle className="w-4 h-4" />
            <span>❌ NOTIFICATIONS_DISABLED</span>
          </>
        )}
      </div>
      {permission === 'granted' && (
        <p className="text-green-400 text-xs mt-1 font-mono">
          You'll receive departure reminders automatically!
        </p>
      )}
    </div>
  );
};

// Notification Settings Component
const NotificationSettings: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    oneHour: true,
    thirtyMinutes: true,
    tenMinutes: true,
    sound: true,
    vibration: true
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (notificationService.getPermission() !== 'granted') return null;

  return (
    <div className="mt-3">
      <Button
        onClick={() => setShowSettings(!showSettings)}
        variant="outline"
        size="sm"
        className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/50 font-mono"
      >
        {showSettings ? '🔧 HIDE_SETTINGS' : '🔧 NOTIFICATION_SETTINGS'}
      </Button>
      
      {showSettings && (
        <div className="mt-3 p-4 bg-gradient-to-br from-gray-800/30 to-black/30 rounded-xl border border-blue-500/30">
          <h4 className="text-white font-semibold mb-3 font-mono">NOTIFICATION_PREFERENCES</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm font-mono">1_HOUR_REMINDER</span>
              <Button
                onClick={() => toggleSetting('oneHour')}
                variant={settings.oneHour ? "default" : "outline"}
                size="sm"
                className={`w-16 h-8 ${settings.oneHour ? 'bg-green-600 hover:bg-green-700' : 'border-gray-500 text-gray-400'}`}
              >
                {settings.oneHour ? 'ON' : 'OFF'}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm font-mono">30_MIN_REMINDER</span>
              <Button
                onClick={() => toggleSetting('thirtyMinutes')}
                variant={settings.thirtyMinutes ? "default" : "outline"}
                size="sm"
                className={`w-16 h-8 ${settings.thirtyMinutes ? 'bg-green-600 hover:bg-green-700' : 'border-gray-500 text-gray-400'}`}
              >
                {settings.thirtyMinutes ? 'ON' : 'OFF'}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm font-mono">10_MIN_REMINDER</span>
              <Button
                onClick={() => toggleSetting('tenMinutes')}
                variant={settings.tenMinutes ? "default" : "outline"}
                size="sm"
                className={`w-16 h-8 ${settings.tenMinutes ? 'bg-green-600 hover:bg-green-700' : 'border-gray-500 text-gray-400'}`}
              >
                {settings.tenMinutes ? 'ON' : 'OFF'}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm font-mono">SOUND</span>
              <Button
                onClick={() => toggleSetting('sound')}
                variant={settings.sound ? "default" : "outline"}
                size="sm"
                className={`w-16 h-8 ${settings.sound ? 'bg-green-600 hover:bg-green-700' : 'border-gray-500 text-gray-400'}`}
              >
                {settings.sound ? 'ON' : 'OFF'}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm font-mono">VIBRATION</span>
              <Button
                onClick={() => toggleSetting('vibration')}
                variant={settings.vibration ? "default" : "outline"}
                size="sm"
                className={`w-16 h-8 ${settings.vibration ? 'bg-green-600 hover:bg-green-700' : 'border-gray-500 text-gray-400'}`}
              >
                {settings.vibration ? 'ON' : 'OFF'}
              </Button>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-600/30">
            <p className="text-gray-400 text-xs font-mono text-center">
              Settings are saved automatically and apply to all departure reminders
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const StationMap = dynamic(() => import("@/components/map/StationMap"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-black/20 rounded-lg flex items-center justify-center">
      <div className="text-gray-400">Loading map...</div>
    </div>
  )
});

interface BookingDetailsResponse {
  booking: {
    id: string;
    verificationCode: string;
    status: string;
    totalAmount: string;
    seatsBooked: number;
    journeyDate: string;
    estimatedDepartureTime?: string;
    paymentReference: string;
    paymentProcessedAt: string;
    createdAt: string;
    updatedAt: string;
    user: {
      id: string;
      phoneNumber: string;
      firstName: string;
      lastName: string;
    };
    departureStation: {
      id: string;
      name: string;
      governorate: {
        id: string;
        name: string;
        nameAr: string;
        createdAt: string;
      };
      delegation: {
        id: string;
        name: string;
        nameAr: string;
        governorateId: string;
        createdAt: string;
      };
      localServerIp: string;
    };
    destinationStation: {
      id: string;
      name: string;
      governorate: {
        id: string;
        name: string;
        nameAr: string;
        createdAt: string;
      };
      delegation: {
        id: string;
        name: string;
        nameAr: string;
        governorateId: string;
        createdAt: string;
      };
    };
    vehicleAllocations: Array<{
      vehicleId?: string;
      licensePlate: string;
      driverName?: string;
      driverPhone?: string;
      seatsBooked: number;
      queuePosition?: number;
      estimatedDeparture?: string;
      ticketIds?: string[];
    }>;
  };
  payment: {
    status: string;
    amount: number;
    currency: string;
  };
  summary: {
    totalSeats: number;
    totalAmount: string;
    vehicleCount: number;
    isPaid: boolean;
    departureLocation: string;
    destinationLocation: string;
    journeyDate: string;
    estimatedDepartureTime?: string;
  };
}

interface StationCoordinates {
  [stationId: string]: {
    latitude: number;
    longitude: number;
  };
}

function PaymentSuccessContent() {
  const [bookingDetails, setBookingDetails] = useState<BookingDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stationCoordinates, setStationCoordinates] = useState<StationCoordinates>({});
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();

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

  const getStationCoordinates = (stationId: string) => {
    const coords = stationCoordinates[stationId];
    return coords || {
      latitude: 35.8256, // Fallback coordinates (center of Tunisia)
      longitude: 10.6340
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      const paymentRef = searchParams.get('payment_ref');
      
      console.log('🎉 Payment success page loaded with payment ref:', paymentRef);

      if (!paymentRef) {
        setError('No payment reference provided');
        setLoading(false);
        return;
      }

      try {
        // Fetch both booking details and station coordinates in parallel
        const [bookingResponse] = await Promise.all([
          apiClient.getBookingDetails(paymentRef),
          fetchStationCoordinates()
        ]);

        if (bookingResponse.success && bookingResponse.data) {
          console.log('✅ Booking details loaded successfully:', bookingResponse.data);
          setBookingDetails(bookingResponse.data);
        } else {
          console.error('❌ Failed to fetch booking details:', bookingResponse);
          setError(bookingResponse.error || 'Failed to fetch booking details');
        }
      } catch (error) {
        console.error('❌ Error fetching booking details:', error);
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  const handleBackToDashboard = () => {
    router.push('/user/dashboard');
  };

  const handleBookAnother = () => {
    router.push('/user/book-trip');
  };

  // Handle ticket expiration
  const handleTicketExpired = () => {
    if (bookingDetails) {
      setBookingDetails({
        ...bookingDetails,
        booking: {
          ...bookingDetails.booking,
          status: 'EXPIRED'
        }
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return numAmount.toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="w-full max-w-md backdrop-blur-sm bg-gradient-to-br from-gray-900/90 to-black/90 border border-orange-500/30 shadow-lg shadow-orange-500/20">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
            <p className="text-white font-mono">{t('loadingBookingDetails')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !bookingDetails) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md backdrop-blur-sm bg-gradient-to-br from-gray-900/90 to-black/90 border border-orange-500/30 shadow-lg shadow-orange-500/20">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/10 to-red-600/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 font-mono">{t('paymentSuccessful')}</h2>
            <p className="text-gray-400 mb-6 font-mono">
              {error || t('paymentSuccessfulButNoDetails')}
            </p>
            <div className="space-y-3">
              <Button onClick={handleBackToDashboard} className="w-full border-orange-500/30 text-gray-300 hover:bg-orange-500/10 hover:text-orange-400 font-mono" variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('backToDashboardCaps')}
              </Button>
              <Button onClick={handleBookAnother} className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 border border-orange-500/30 text-white font-mono">
                {t('bookAnotherTripCaps')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const booking = bookingDetails.booking;
  const payment = bookingDetails.payment;
  const summary = bookingDetails.summary;

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Language Switcher */}
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>

        {/* Cyberpunk Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/10 to-red-600/10 border border-orange-500/20 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <CheckCircle2 className="w-12 h-12 text-orange-400" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2 font-mono">
            {t('paymentSuccessful')}
          </h1>
          <p className="text-gray-400 text-lg font-mono">
            {t('tripSuccessfullyBooked')}
          </p>
        </div>

        {/* Main Booking Card */}
        <Card className="mb-6 backdrop-blur-sm bg-slate-800/30 border border-slate-600/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-300 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-slate-400" />
                  {t('bookingConfirmed')}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {t('bookingId')}: <span className="font-mono text-white">{booking.id}</span>
                </CardDescription>
              </div>
              <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-sm px-3 py-1">
                {booking.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Trip Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-slate-400" />
                  {t('tripDetails')}
                </h3>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-600/30">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <span className="text-slate-400 text-sm">{t('from')}</span>
                    </div>
                    <p className="text-white font-medium">{booking.departureStation.name}</p>
                    <p className="text-slate-300 text-sm">
                      {booking.departureStation.delegation.name}, {booking.departureStation.governorate.name}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-600/30">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-red-400" />
                      <span className="text-slate-400 text-sm">{t('to')}</span>
                    </div>
                    <p className="text-white font-medium">{booking.destinationStation.name}</p>
                    <p className="text-slate-300 text-sm">
                      {booking.destinationStation.delegation.name}, {booking.destinationStation.governorate.name}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-600/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-teal-400" />
                        <span className="text-slate-400 text-sm">{t('passengers')}</span>
                      </div>
                      <p className="text-white font-bold">{booking.seatsBooked}</p>
                    </div>

                    <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-600/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-amber-400" />
                        <span className="text-slate-400 text-sm">{t('journey')}</span>
                      </div>
                      <p className="text-white font-bold text-sm">
                        {formatDate(booking.journeyDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment & Passenger Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-slate-400" />
                  {t('passengerPayment')}
                </h3>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-600/30">
                    <span className="text-slate-400 text-sm">{t('passengerName')}</span>
                    <p className="text-white font-medium">
                      {booking.user.firstName} {booking.user.lastName}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-600/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <span className="text-slate-400 text-sm">{t('phoneNumber')}</span>
                    </div>
                    <p className="text-white font-mono">{booking.user.phoneNumber}</p>
                  </div>

                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <span className="text-slate-400 text-sm">{t('totalAmount')}</span>
                    <p className="text-emerald-400 font-bold text-2xl">
                      {formatAmount(booking.totalAmount)} {payment.currency}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-600/30">
                    <span className="text-slate-400 text-sm">{t('paymentProcessed')}</span>
                    <p className="text-white text-sm">
                      {formatDate(booking.paymentProcessedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expired Ticket Notice */}
        {booking.status === 'EXPIRED' && (
          <Card className="mb-6 backdrop-blur-sm bg-red-500/10 border border-red-500/30">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-pink-600/20 rounded-xl flex items-center justify-center mr-4 border border-red-500/30">
                    <XCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <div>
                                                <h3 className="text-2xl font-bold text-white font-mono">{t('ticketExpired')}</h3>
                            <p className="text-gray-300 text-sm font-mono">{t('yourTicketHasExpired')}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <p className="text-gray-300 font-mono">
                            {t('ticketExpiredExplanation')}
                          </p>
                          
                          <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                              onClick={() => router.push('/user/book-trip')}
                              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0 font-mono"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              {t('bookNewTrip')}
                            </Button>
                            
                            <Button
                              variant="outline"
                              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50 font-mono"
                              disabled
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              {t('refundComingSoon')}
                            </Button>
                          </div>
                          
                          <div className="mt-6 p-4 bg-gradient-to-br from-gray-800/30 to-black/30 rounded-xl border border-gray-600/30">
                            <h4 className="text-white font-semibold mb-2 font-mono">{t('needHelp')}</h4>
                            <p className="text-gray-300 text-sm font-mono">
                              {t('contactCustomerServiceExpired')}
                            </p>
                            <div className="mt-3 flex items-center justify-center space-x-2 text-purple-400 font-mono">
                              <Phone className="w-4 h-4" />
                              <span>{t('customerServiceAvailable247')}</span>
                            </div>
                          </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Countdown Timer */}
        {booking.status !== 'EXPIRED' && booking.estimatedDepartureTime && (
          <Card className="mb-6 backdrop-blur-sm bg-slate-800/30 border border-slate-600/30">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-300 mb-4 flex items-center justify-center gap-2">
                  <Timer className="w-6 h-6 text-amber-400" />
                  {t('departureCountdown')}
                </h3>
                <p className="text-slate-400 mb-4">{t('timeRemainingBeforeDeparture')}</p>
                
                <CountdownTimer 
                  estimatedDepartureTime={booking.estimatedDepartureTime} 
                  bookingId={booking.id}
                  departureStation={booking.departureStation.name}
                  destinationStation={booking.destinationStation.name}
                  onTicketExpired={handleTicketExpired}
                />
                
                {/* Notification Permission Request */}
                <NotificationPermissionRequest />
                
                {/* Notification Status Indicator */}
                <NotificationStatusIndicator />
                
                {/* Notification Settings */}
                <NotificationSettings />
                
                <div className="mt-4 text-sm text-slate-400">
                  <p>Estimated Departure: {formatDate(booking.estimatedDepartureTime)}</p>
                  <p className="text-amber-400 font-medium">Arrive 15 minutes early</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Route Visualization */}
        {booking.status !== 'EXPIRED' && booking && (
          <Card className="mb-6 backdrop-blur-sm bg-slate-800/30 border border-slate-600/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Navigation className="w-5 h-5 text-slate-400" />
                {t('routeMap')}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {t('journeyDetails')} {t('from')} {booking.departureStation.name} {t('to')} {booking.destinationStation.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 rounded-lg overflow-hidden">
                <StationMap
                  stations={[
                    {
                      id: booking.departureStation.id,
                      name: booking.departureStation.name,
                      governorate: booking.departureStation.governorate.name,
                      delegation: booking.departureStation.delegation.name,
                      latitude: getStationCoordinates(booking.departureStation.id).latitude,
                      longitude: getStationCoordinates(booking.departureStation.id).longitude,
                      isOnline: true
                    }
                  ]}
                  destinations={[
                    {
                      destinationId: booking.destinationStation.id,
                      destinationName: booking.destinationStation.name,
                      governorate: booking.destinationStation.governorate.name,
                      delegation: booking.destinationStation.delegation.name,
                      totalVehicles: 1,
                      availableSeats: booking.seatsBooked,
                      estimatedDeparture: booking.journeyDate,
                      basePrice: parseFloat(booking.totalAmount),
                      vehicles: [],
                      latitude: getStationCoordinates(booking.destinationStation.id).latitude,
                      longitude: getStationCoordinates(booking.destinationStation.id).longitude
                    }
                  ]}
                  selectedDeparture={{
                    id: booking.departureStation.id,
                    name: booking.departureStation.name,
                    governorate: booking.departureStation.governorate.name,
                    delegation: booking.departureStation.delegation.name,
                    latitude: getStationCoordinates(booking.departureStation.id).latitude,
                    longitude: getStationCoordinates(booking.departureStation.id).longitude,
                    isOnline: true
                  }}
                  selectedDestination={{
                    destinationId: booking.destinationStation.id,
                    destinationName: booking.destinationStation.name,
                    governorate: booking.destinationStation.governorate.name,
                    delegation: booking.destinationStation.delegation.name,
                    totalVehicles: 1,
                    availableSeats: booking.seatsBooked,
                    estimatedDeparture: booking.journeyDate,
                    basePrice: parseFloat(booking.totalAmount),
                    vehicles: [],
                    latitude: getStationCoordinates(booking.destinationStation.id).latitude,
                    longitude: getStationCoordinates(booking.destinationStation.id).longitude
                  }}
                  onStationSelect={() => {}} // Disabled in view mode
                  onDestinationSelect={() => {}} // Disabled in view mode
                  showRoute={true}
                  mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verification Code Card */}
        {booking.status !== 'EXPIRED' && (
          <Card className="mb-6 backdrop-blur-sm bg-slate-800/30 border border-slate-600/30">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-300 mb-2">{t('verificationCode')}</h3>
                <p className="text-slate-400 mb-4">{t('showCodeToDriver')}</p>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                  <span className="text-4xl font-mono font-bold text-white tracking-wider">
                    {booking.verificationCode}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vehicle Information */}
        {booking.status !== 'EXPIRED' && booking.vehicleAllocations && booking.vehicleAllocations.length > 0 && (
          <Card className="mb-6 backdrop-blur-sm bg-slate-800/30 border border-slate-600/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Navigation className="w-5 h-5 text-slate-400" />
                {t('vehicleInformation')}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {t('allocatedVehicles')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {booking.vehicleAllocations.map((vehicle, index) => (
                  <div key={index} className="p-4 bg-slate-900/50 rounded-lg border border-slate-600/30">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-white">{t('vehicle')} {index + 1}</h4>
                                              <Badge variant="outline" className="bg-slate-600/30 border-slate-500/30 text-slate-300">
                          {vehicle.seatsBooked} {vehicle.seatsBooked > 1 ? t('seatPlural') : t('seatSingular')}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">{t('licensePlate')}</span>
                        <span className="text-white font-mono font-bold">{vehicle.licensePlate}</span>
                      </div>

                      {vehicle.driverName && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">{t('driver')}</span>
                          <span className="text-white">{vehicle.driverName}</span>
                        </div>
                      )}

                      {vehicle.driverPhone && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">{t('driverPhone')}</span>
                          <span className="text-white font-mono">{vehicle.driverPhone}</span>
                        </div>
                      )}

                      {vehicle.queuePosition && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">{t('queuePosition')}</span>
                          <span className="text-white">#{vehicle.queuePosition}</span>
                        </div>
                      )}

                      {vehicle.estimatedDeparture && (
                        <div className="flex items-center justify-between sm:col-span-2">
                          <span className="text-slate-400 flex items-center gap-2">
                            <Timer className="w-4 h-4" />
                            {t('estimatedDeparture')}
                          </span>
                          <span className="text-white">
                            {formatDate(vehicle.estimatedDeparture)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Important Information */}
        {booking.status !== 'EXPIRED' && (
          <Card className="mb-6 backdrop-blur-sm bg-slate-800/30 border border-slate-600/30">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Timer className="w-5 h-5 text-slate-400" />
              {t('importantInformation')}
            </h3>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">•</span>
                {t('arrive15MinutesEarly')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">•</span>
                {t('showVerificationCode')} <strong className="text-white font-mono">{booking.verificationCode}</strong> {t('to')} {t('driver')}.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">•</span>
                {t('keepPaymentReference')} <strong className="text-white font-mono">{booking.paymentReference}</strong>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">•</span>
                {t('contactCustomerService')}
              </li>
            </ul>
          </CardContent>
        </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleBackToDashboard}
            variant="outline"
            className="flex-1 h-12 border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToDashboard')}
          </Button>

          <Button
            onClick={handleBookAnother}
            className="flex-1 h-12 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {t('bookAnotherTrip')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  const { t } = useLanguage();
  
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card className="w-full max-w-md backdrop-blur-sm bg-slate-800/30 border border-slate-600/30">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto mb-4"></div>
            <p className="text-white">{t('loadingPaymentDetails')}</p>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
