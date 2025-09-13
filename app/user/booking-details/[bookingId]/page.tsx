"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  QrCode,
  Car,
  Plus,
  Hexagon
} from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import DigitalTicket from "@/components/ui/digital-ticket";
import { apiClient } from "@/lib/api";
import { notificationService } from "@/lib/notificationService";
import dynamic from "next/dynamic";
import { useLanguage } from "@/lib/hooks/useLanguage";

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

  // Send event message to backend (you can implement this based on your API)
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

// Urgency Message Component
interface UrgencyMessageProps {
  estimatedDepartureTime: string;
}

const UrgencyMessage: React.FC<UrgencyMessageProps> = ({ estimatedDepartureTime }) => {
  const [urgencyLevel, setUrgencyLevel] = useState<'none' | 'warning' | 'urgent' | 'bonus'>('none');

  useEffect(() => {
    const checkUrgency = () => {
      const now = new Date().getTime();
      const targetTime = new Date(estimatedDepartureTime).getTime();
      const difference = targetTime - now;
      const minutesLeft = Math.floor(difference / (1000 * 60));

      if (minutesLeft <= 0) {
        // Check if we're in bonus time
        const bonusTimeRemaining = Math.abs(difference);
        const bonusMinutes = Math.floor(bonusTimeRemaining / (1000 * 60));
        
        if (bonusMinutes < 2) { // 2 minutes bonus time
          setUrgencyLevel('bonus');
        } else {
          setUrgencyLevel('none'); // Bonus time expired
        }
      } else if (minutesLeft <= 30) {
        setUrgencyLevel('urgent');
      } else if (minutesLeft <= 60) {
        setUrgencyLevel('warning');
      } else {
        setUrgencyLevel('none');
      }
    };

    checkUrgency();
    const timer = setInterval(checkUrgency, 1000);
    return () => clearInterval(timer);
  }, [estimatedDepartureTime]);

  if (urgencyLevel === 'none') return null;

  return (
    <div className={`mt-4 p-3 rounded-lg border ${
      urgencyLevel === 'urgent' 
        ? 'bg-red-500/20 border-red-500/40 text-red-300' 
        : urgencyLevel === 'warning'
        ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
        : urgencyLevel === 'bonus'
        ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
        : 'bg-gray-500/20 border-gray-500/40 text-gray-300'
    }`}>
      <div className="flex items-center justify-center space-x-2 font-mono text-sm">
        {urgencyLevel === 'bonus' ? (
          <Timer className="w-4 h-4 text-purple-400" />
        ) : (
          <AlertTriangle className="w-4 h-4" />
        )}
        <span className="font-semibold">
          {urgencyLevel === 'urgent' 
            ? 'URGENT: DEPARTURE_SOON!' 
            : urgencyLevel === 'warning'
            ? 'WARNING: DEPARTURE_APPROACHING!'
            : urgencyLevel === 'bonus'
            ? 'BONUS TIME: EXTRA 2 MINUTES!'
            : 'NO URGENCY'
          }
        </span>
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
      localServerIp?: string;
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

export default function BookingDetailsPage() {
  const { t } = useLanguage();
  const [bookingDetails, setBookingDetails] = useState<BookingDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [stationCoordinates, setStationCoordinates] = useState<StationCoordinates>({});
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const fetchStationCoordinates = async () => {
    try {
      console.log('🗺️ Fetching station coordinates...');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stations`);
      
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
      if (!bookingId) {
        setError('No booking ID provided');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Fetching booking details for ID:', bookingId);
        
        // Fetch both booking details and station coordinates in parallel
        const [bookingResponse] = await Promise.all([
          fetch(`/api/bookings/details/${bookingId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('userToken')}`
          }
          }),
          fetchStationCoordinates()
        ]);

        const result = await bookingResponse.json();

        if (bookingResponse.ok && result.success && result.data) {
          console.log('✅ Booking details loaded successfully:', result.data);
          setBookingDetails(result.data);
        } else {
          console.error('❌ Failed to fetch booking details:', result);
          setError(result.error || result.message || 'Failed to fetch booking details');
        }
      } catch (error) {
        console.error('❌ Error fetching booking details:', error);
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId]);

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

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
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
    switch (status.toUpperCase()) {
      case 'PAID':
      case 'COMPLETED':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'PENDING':
        return <Timer className="w-4 h-4" />;
      case 'FAILED':
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Timer className="w-4 h-4" />;
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="w-full max-w-md backdrop-blur-sm bg-gradient-to-br from-gray-900/90 to-black/90 border border-orange-500/30 shadow-lg shadow-orange-500/20">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
          <p className="text-white font-mono">LOADING_BOOKING_DETAILS...</p>
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
              <XCircle className="w-8 h-8 text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 font-mono">BOOKING_NOT_FOUND</h2>
            <p className="text-gray-400 mb-6 font-mono">
              {error || "BOOKING_DETAILS_NOT_FOUND"}
            </p>
            <div className="space-y-3">
              <Button onClick={() => router.back()} className="w-full border-orange-500/30 text-gray-300 hover:bg-orange-500/10 hover:text-orange-400 font-mono" variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                GO_BACK
              </Button>
              <Button onClick={() => router.push('/booking-history')} className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 border border-orange-500/30 text-white font-mono">
                VIEW_ALL_BOOKINGS
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
    <div className="min-h-screen bg-black">
      {/* Cyberpunk Header */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-orange-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <Button
                onClick={() => router.back()}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 border border-orange-500/20 flex-shrink-0 font-mono"
              >
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">BACK</span>
              </Button>
              <div className="w-px h-4 sm:h-6 bg-orange-500/30 hidden sm:block"></div>
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/25">
                  <Hexagon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent truncate font-mono">E_TICKET_DETAILS</h1>
                  <p className="text-gray-400 text-xs sm:text-sm hidden sm:block font-mono">DIGITAL_BOARDING_PASS</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <Button
                onClick={() => copyToClipboard(booking.id, 'booking-id')}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 border border-orange-500/20 font-mono"
              >
                {copied === 'booking-id' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1 sm:mr-2 text-orange-400" />
                    <span className="hidden sm:inline">COPIED!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">SHARE</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">

        {/* Cyberpunk E-Ticket Display */}
        <div className="mb-8 sm:mb-12">
          <div className="relative">
            {/* Main Ticket Body */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-gray-900/90 to-black/90 border border-orange-500/30 shadow-2xl shadow-orange-500/20">
              {/* Decorative background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-orange-500/20 via-transparent to-red-500/20"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-500/10 rounded-full translate-y-12 -translate-x-12"></div>
              </div>

              {/* Ticket perforation effect - Left side */}
              <div className="absolute left-0 top-0 h-full w-4 bg-black flex flex-col justify-center items-center">
                <div className="w-2 h-2 bg-orange-500/50 rounded-full mb-1"></div>
                <div className="w-2 h-2 bg-orange-500/50 rounded-full mb-1"></div>
                <div className="w-2 h-2 bg-orange-500/50 rounded-full mb-1"></div>
                <div className="w-2 h-2 bg-orange-500/50 rounded-full mb-1"></div>
                <div className="w-2 h-2 bg-orange-500/50 rounded-full mb-1"></div>
                <div className="w-2 h-2 bg-orange-500/50 rounded-full mb-1"></div>
                <div className="w-2 h-2 bg-orange-500/50 rounded-full mb-1"></div>
                <div className="w-2 h-2 bg-orange-500/50 rounded-full"></div>
              </div>

              {/* Ticket perforation effect - Right side */}
              <div className="absolute right-0 top-0 h-full w-4 bg-black flex flex-col justify-center items-center">
                <div className="w-2 h-2 bg-orange-500/50 rounded-full mb-1"></div>
                <div className="w-2 h-2 bg-orange-500/50 rounded-full mb-1"></div>
                <div className="w-2 h-2 bg-orange-500/50 rounded-full mb-1"></div>
                <div className="w-2 h-2 bg-orange-500/50 rounded-full mb-1"></div>
                <div className="w-2 h-2 bg-orange-500/50 rounded-full mb-1"></div>
                <div className="w-2 h-2 bg-orange-500/50 rounded-full mb-1"></div>
                <div className="w-2 h-2 bg-orange-500/50 rounded-full mb-1"></div>
                <div className="w-2 h-2 bg-orange-500/50 rounded-full"></div>
              </div>

              {/* Central perforation line */}
              <div className="absolute left-4 right-4 top-1/2 border-t-2 border-dashed border-orange-500/60 -translate-y-1/2"></div>

              <CardContent className="p-6 sm:p-8 lg:p-10 relative z-10 pl-8 pr-8">
                {/* Cyberpunk Ticket Header */}
                <div className="text-center mb-8 sm:mb-10 lg:mb-12">
                  {/* Cyberpunk-style header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                        <Hexagon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent font-mono">
                          LOUAJ
                        </h1>
                        <p className="text-gray-400 text-sm font-mono">TRANSPORT_SYSTEM</p>
                      </div>
          </div>

                    <div className="text-right">
                      <Badge className={`${getStatusColor(booking.status)} px-4 py-2 text-sm font-semibold shadow-lg font-mono`}>
                    {getStatusIcon(booking.status)}
                        <span className="ml-2">{booking.status}</span>
                  </Badge>
                      <p className="text-gray-500 text-xs mt-1 font-mono">TICKET</p>
                    </div>
                </div>
                
                  {/* Ticket title */}
                  <div className="border-t border-b border-orange-500/30 py-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-white text-center font-mono">
                      ELECTRONIC_BOARDING_PASS
                    </h2>
                    <p className="text-gray-400 text-sm text-center mt-1 font-mono">
                      PRESENT_TO_DRIVER
                    </p>
                  </div>
                </div>

                {/* Countdown Timer */}
                {booking.estimatedDepartureTime && (
                  <div className="mb-8 sm:mb-10 lg:mb-12">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-300 mb-2 font-mono">TICKET_EXPIRY_COUNTDOWN</h3>
                      <div className="w-24 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent mx-auto"></div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl p-6 sm:p-8 border border-red-500/30 shadow-lg shadow-red-500/20">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-orange-600/20 rounded-xl flex items-center justify-center mr-3 border border-red-500/30">
                            <Timer className="w-6 h-6 text-red-400" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-white font-mono">TIME_REMAINING</h4>
                            <p className="text-gray-400 text-sm font-mono">BEFORE_TICKET_EXPIRES</p>
                          </div>
                        </div>
                        
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
                        
                        <div className="mt-4 text-sm text-gray-400 font-mono">
                          <p>ESTIMATED_DEPARTURE: {formatDate(booking.estimatedDepartureTime)}</p>
                          <p className="text-red-400 font-medium">ARRIVE_15_MINUTES_EARLY</p>
                        </div>
                        
                        {/* Urgency Messages */}
                        <UrgencyMessage estimatedDepartureTime={booking.estimatedDepartureTime} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Cyberpunk Route Display */}
                <div className="mb-8 sm:mb-10 lg:mb-12">
                  {/* Route Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-300 mb-2 font-mono">JOURNEY_DETAILS</h3>
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent mx-auto"></div>
                  </div>

                  {/* Route Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    {/* Departure */}
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-gray-800/30 to-black/30 rounded-xl p-4 border border-orange-500/30">
                        <div className="text-orange-400 font-semibold text-sm uppercase tracking-wide mb-2 font-mono">FROM</div>
                        <div className="text-2xl sm:text-3xl font-bold text-white mb-1 font-mono">{booking.departureStation.name}</div>
                        <div className="text-gray-400 text-sm font-mono">{booking.departureStation.governorate.name}</div>
                        <div className="text-gray-500 text-xs font-mono">{booking.departureStation.delegation.name}</div>
                      </div>
                    </div>

                    {/* Flight Path Visualization */}
                    <div className="flex items-center justify-center">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-orange-500 rounded-full shadow-lg shadow-orange-500/50"></div>
                        <div className="flex-1 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                        <Navigation className="w-6 h-6 text-orange-400" />
                        <div className="flex-1 h-0.5 bg-gradient-to-l from-red-500 to-orange-500 rounded-full"></div>
                        <div className="w-4 h-4 bg-red-500 rounded-full shadow-lg shadow-red-500/50"></div>
                      </div>
                    </div>

                    {/* Destination */}
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-gray-800/30 to-black/30 rounded-xl p-4 border border-red-500/30">
                        <div className="text-red-400 font-semibold text-sm uppercase tracking-wide mb-2 font-mono">TO</div>
                        <div className="text-2xl sm:text-3xl font-bold text-white mb-1 font-mono">{booking.destinationStation.name}</div>
                        <div className="text-gray-400 text-sm font-mono">{booking.destinationStation.governorate.name}</div>
                        <div className="text-gray-500 text-xs font-mono">{booking.destinationStation.delegation.name}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expired Ticket Notice */}
                {booking.status === 'EXPIRED' && (
                  <div className="mb-8 sm:mb-10 lg:mb-12">
                    <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-2xl p-6 sm:p-8 border border-red-500/30 shadow-lg shadow-red-500/20">
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
                    </div>
                  </div>
                )}

                {/* Cyberpunk Ticket Details */}
                {booking.status !== 'EXPIRED' && (
                  <div className="mb-8 sm:mb-10 lg:mb-12">
                    {/* Section Header */}
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-300 mb-2 font-mono">TRIP_INFORMATION</h3>
                      <div className="w-24 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent mx-auto"></div>
                    </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {/* Date */}
                    <div className="bg-gradient-to-br from-gray-800/20 to-black/20 rounded-xl p-4 border border-orange-500/20 text-center">
                      <Calendar className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                      <div className="text-gray-400 text-xs uppercase tracking-wide mb-1 font-mono">DATE</div>
                      <div className="text-white font-bold text-sm sm:text-base font-mono">
                        {new Date(booking.journeyDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-gray-500 text-xs font-mono">
                        {new Date(booking.journeyDate).getFullYear()}
                      </div>
                    </div>

                    {/* Time */}
                    <div className="bg-gradient-to-br from-gray-800/20 to-black/20 rounded-xl p-4 border border-purple-500/20 text-center">
                      <Clock className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                      <div className="text-gray-400 text-xs uppercase tracking-wide mb-1 font-mono">TIME</div>
                      <div className="text-white font-bold text-sm sm:text-base font-mono">
                        {new Date(booking.journeyDate).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="text-gray-500 text-xs font-mono">DEPARTURE</div>
                    </div>

                    {/* Passengers */}
                    <div className="bg-gradient-to-br from-gray-800/20 to-black/20 rounded-xl p-4 border border-emerald-500/20 text-center">
                      <Users className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                      <div className="text-gray-400 text-xs uppercase tracking-wide mb-1 font-mono">PASSENGERS</div>
                      <div className="text-white font-bold text-sm sm:text-base font-mono">{booking.seatsBooked}</div>
                      <div className="text-gray-500 text-xs font-mono">SEAT{booking.seatsBooked > 1 ? 'S' : ''}</div>
                    </div>

                    {/* Fare */}
                    <div className="bg-gradient-to-br from-gray-800/20 to-black/20 rounded-xl p-4 border border-amber-500/20 text-center">
                      <CreditCard className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                      <div className="text-gray-400 text-xs uppercase tracking-wide mb-1 font-mono">FARE</div>
                      <div className="text-white font-bold text-sm sm:text-base font-mono">{formatAmount(booking.totalAmount)}</div>
                      <div className="text-gray-500 text-xs font-mono">TND</div>
                    </div>
                  </div>
                </div>
                )}

                {/* Cyberpunk Verification Code */}
                {booking.status !== 'EXPIRED' && (
                  <div className="mb-8 sm:mb-10 lg:mb-12">
                    {/* Section Header */}
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-300 mb-2 font-mono">BOARDING_PASS</h3>
                      <div className="w-24 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent mx-auto"></div>
                    </div>

                  {/* Verification Code Display */}
                  <div className="bg-gradient-to-br from-gray-800/40 to-black/40 rounded-2xl p-6 sm:p-8 border border-orange-500/30">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                      {/* QR Code Side */}
                      <div className="text-center">
                        <div className="bg-white rounded-xl p-4 inline-block shadow-2xl">
                          <QrCode className="w-24 h-24 text-black" />
                        </div>
                        <p className="text-gray-400 text-xs mt-2 font-mono">SCAN_TO_VERIFY</p>
                      </div>

                      {/* Code Details Side */}
                      <div className="text-center lg:text-left">
                        <div className="mb-4">
                          <div className="text-gray-400 text-sm uppercase tracking-wide mb-2 font-mono">VERIFICATION_CODE</div>
                          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 rounded-xl p-4 border-2 border-dashed border-orange-500/30">
                            <div className="text-3xl sm:text-4xl font-mono font-bold text-orange-400 tracking-widest">
                              {booking.verificationCode}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Button
                            onClick={() => copyToClipboard(booking.verificationCode, 'verification-code')}
                            variant="outline"
                            className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50 font-mono"
                          >
                            {copied === 'verification-code' ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                CODE_COPIED!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-2" />
                                COPY_VERIFICATION_CODE
                              </>
                            )}
                          </Button>

                          <div className="text-xs text-gray-400 space-y-1 font-mono">
                            <div>BOOKING_ID: <span className="font-mono text-gray-300">{booking.id.slice(-8)}</span></div>
                            <div className="text-orange-400 font-medium">PRESENT_CODE_TO_DRIVER</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}

                {/* Cyberpunk Passenger & Payment Info */}
                <div className="mb-8 sm:mb-10 lg:mb-12">
                  {/* Section Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-300 mb-2 font-mono">PASSENGER_&_PAYMENT</h3>
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent mx-auto"></div>
                  </div>

                  {/* Info Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Passenger Card */}
                    <div className="bg-gradient-to-br from-gray-800/20 to-black/20 rounded-xl p-6 border border-orange-500/20">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-xl flex items-center justify-center mr-3 border border-orange-500/30">
                          <User className="w-5 h-5 text-orange-400" />
                        </div>
                        <h3 className="text-white font-semibold text-lg font-mono">PASSENGER_DETAILS</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-gradient-to-br from-gray-900/30 to-black/30 rounded-lg p-3 border border-gray-700/30">
                          <div className="text-gray-400 text-xs uppercase tracking-wide mb-1 font-mono">FULL_NAME</div>
                          <div className="text-white font-medium text-base font-mono">
                            {booking.user.firstName} {booking.user.lastName}
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-gray-900/30 to-black/30 rounded-lg p-3 border border-gray-700/30">
                          <div className="text-gray-400 text-xs uppercase tracking-wide mb-1 font-mono">PHONE_NUMBER</div>
                          <div className="text-white font-mono text-base">{booking.user.phoneNumber}</div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Card */}
                    <div className="bg-gradient-to-br from-gray-800/20 to-black/20 rounded-xl p-6 border border-emerald-500/20">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-xl flex items-center justify-center mr-3 border border-emerald-500/30">
                          <CreditCard className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h3 className="text-white font-semibold text-lg font-mono">PAYMENT_DETAILS</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-gradient-to-br from-gray-900/30 to-black/30 rounded-lg p-3 border border-gray-700/30">
                          <div className="text-gray-400 text-xs uppercase tracking-wide mb-1 font-mono">PAYMENT_STATUS</div>
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${booking.paymentProcessedAt ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                            <div className={`font-medium text-base ${booking.paymentProcessedAt ? 'text-emerald-400' : 'text-amber-400'} font-mono`}>
                              {booking.paymentProcessedAt ? 'COMPLETED' : 'PENDING'}
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-gray-900/30 to-black/30 rounded-lg p-3 border border-gray-700/30">
                          <div className="text-gray-400 text-xs uppercase tracking-wide mb-1 font-mono">PAYMENT_REFERENCE</div>
                          <div className="text-white font-mono text-sm">{booking.paymentReference}</div>
                  </div>
                  
                        {booking.paymentProcessedAt && (
                          <div className="bg-gradient-to-br from-gray-900/30 to-black/30 rounded-lg p-3 border border-gray-700/30">
                            <div className="text-gray-400 text-xs uppercase tracking-wide mb-1 font-mono">PROCESSED_AT</div>
                            <div className="text-white text-sm font-mono">{formatDate(booking.paymentProcessedAt)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cyberpunk Security Features & Terms */}
                <div className="border-t border-orange-500/30 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="flex items-center justify-center space-x-2 text-gray-400 text-xs font-mono">
                      <div className="w-4 h-4 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded flex items-center justify-center border border-orange-500/30">
                        <CheckCircle2 className="w-3 h-3 text-orange-400" />
                      </div>
                      <span>SECURE_&_VERIFIED</span>
                    </div>

                    <div className="flex items-center justify-center space-x-2 text-gray-400 text-xs font-mono">
                      <div className="w-4 h-4 bg-gradient-to-br from-purple-500/20 to-blue-600/20 rounded flex items-center justify-center border border-purple-500/30">
                        <AlertTriangle className="w-3 h-3 text-purple-400" />
                      </div>
                      <span>VALID_24_HOURS</span>
                    </div>

                    <div className="flex items-center justify-center space-x-2 text-gray-400 text-xs font-mono">
                      <div className="w-4 h-4 bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded flex items-center justify-center border border-emerald-500/30">
                        <Phone className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span>24/7_SUPPORT</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-700/30">
                    <p className="text-gray-500 text-xs text-center font-mono">
                      ELECTRONIC_TICKET_NON_TRANSFERABLE_VALID_PASSENGER_NAMED_ABOVE.
                      ARRIVE_DEPARTURE_STATION_15_MINUTES_BEFORE_SCHEDULED_TIME.
                      TERMS_AND_CONDITIONS_APPLY.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
                </div>
                </div>

            {/* Cyberpunk Vehicle Information */}
            {booking.status !== 'EXPIRED' && booking.vehicleAllocations && booking.vehicleAllocations.length > 0 && (
          <Card className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-orange-500/30 mb-6 sm:mb-8 shadow-lg shadow-orange-500/10">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="text-white flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-mono">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-lg sm:rounded-xl flex items-center justify-center border border-orange-500/30">
                  <Car className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                </div>
                VEHICLE_INFORMATION
                  </CardTitle>
              <CardDescription className="text-gray-400 text-sm sm:text-base font-mono">
                ALLOCATED_VEHICLES_DRIVER_DETAILS
              </CardDescription>
                </CardHeader>
            <CardContent>
              <div className="space-y-4 sm:space-y-6">
                  {booking.vehicleAllocations.map((vehicle, index) => (
                  <div key={index} className="bg-gradient-to-br from-gray-800/30 to-black/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-orange-500/30">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-lg sm:rounded-xl flex items-center justify-center border border-orange-500/30">
                          <Car className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                        </div>
                        <div>
                          <h4 className="text-base sm:text-lg font-semibold text-white font-mono">VEHICLE_{index + 1}</h4>
                          <p className="text-gray-400 text-xs sm:text-sm font-mono">LICENSE: {vehicle.licensePlate}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-gradient-to-r from-orange-500/20 to-red-600/20 border-orange-500/40 text-orange-400 px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm self-start sm:self-auto font-mono">
                        {vehicle.seatsBooked} SEAT{vehicle.seatsBooked > 1 ? 'S' : ''}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {vehicle.driverName && (
                        <div>
                          <div className="text-gray-400 text-sm mb-1 font-mono">DRIVER</div>
                          <div className="text-white font-medium font-mono">{vehicle.driverName}</div>
                        </div>
                      )}

                      {vehicle.driverPhone && (
                        <div>
                          <div className="text-gray-400 text-sm mb-1 font-mono">DRIVER_PHONE</div>
                          <div className="text-white font-mono">{vehicle.driverPhone}</div>
                        </div>
                      )}

                      {vehicle.queuePosition && (
                        <div>
                          <div className="text-gray-400 text-sm mb-1 font-mono">QUEUE_POSITION</div>
                          <div className="text-white font-semibold font-mono">#{vehicle.queuePosition}</div>
                        </div>
                      )}

                      {vehicle.estimatedDeparture && (
                        <div>
                          <div className="text-gray-400 text-sm mb-1 font-mono">ESTIMATED_DEPARTURE</div>
                          <div className="text-white font-mono">{formatDate(vehicle.estimatedDeparture)}</div>
                        </div>
                      )}
                    </div>
                    </div>
                  ))}
              </div>
                </CardContent>
              </Card>
            )}

        {/* Cyberpunk Booking Timeline */}
        {booking.status !== 'EXPIRED' && (
          <Card className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-orange-500/30 mb-8 shadow-lg shadow-orange-500/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3 font-mono">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-xl flex items-center justify-center border border-orange-500/30">
                <Clock className="w-5 h-5 text-orange-400" />
              </div>
              JOURNEY_TIMELINE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-4 h-4 rounded-full bg-orange-400 flex-shrink-0 shadow-lg shadow-orange-500/50"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium font-mono">BOOKING_CREATED</p>
                      <p className="text-gray-400 text-sm font-mono">{formatDate(booking.createdAt)}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-orange-400" />
                  </div>
                </div>
              </div>

              {booking.paymentProcessedAt && (
                <div className="flex items-center gap-6">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 flex-shrink-0 shadow-lg shadow-emerald-500/50"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium font-mono">PAYMENT_PROCESSED</p>
                        <p className="text-gray-400 text-sm font-mono">{formatDate(booking.paymentProcessedAt)}</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-6">
                <div className="w-4 h-4 rounded-full bg-amber-400 flex-shrink-0 shadow-lg shadow-amber-500/50"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium font-mono">JOURNEY_DATE</p>
                      <p className="text-gray-400 text-sm font-mono">{formatDate(booking.journeyDate)}</p>
                    </div>
                    <Timer className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

            {/* Cyberpunk Important Information */}
            {booking.status !== 'EXPIRED' && (booking.status === 'PAID' || booking.status === 'COMPLETED') && (
          <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30 mb-8 shadow-lg shadow-orange-500/10">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3 font-mono">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-xl flex items-center justify-center border border-orange-500/30">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                </div>
                IMPORTANT_TRAVEL_INFORMATION
                  </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-400 mt-2 flex-shrink-0 shadow-lg shadow-orange-500/50"></div>
                    <p className="text-gray-300 font-mono">ARRIVE_DEPARTURE_STATION_15_MINUTES_BEFORE_SCHEDULED_DEPARTURE_TIME.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-400 mt-2 flex-shrink-0 shadow-lg shadow-orange-500/50"></div>
                    <p className="text-gray-300 font-mono">PRESENT_VERIFICATION_CODE <strong className="text-white font-mono bg-gradient-to-br from-gray-900/50 to-black/50 px-2 py-1 rounded border border-orange-500/30">{booking.verificationCode}</strong> TO_DRIVER.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-400 mt-2 flex-shrink-0 shadow-lg shadow-orange-500/50"></div>
                    <p className="text-gray-300 font-mono">KEEP_PAYMENT_REFERENCE_FOR_RECORDS: <strong className="text-white font-mono bg-gradient-to-br from-gray-900/50 to-black/50 px-2 py-1 rounded border border-orange-500/30">{booking.paymentReference}</strong></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-400 mt-2 flex-shrink-0 shadow-lg shadow-orange-500/50"></div>
                    <p className="text-gray-300 font-mono">CONTACT_CUSTOMER_SERVICE_IF_ASSISTANCE_NEEDED.</p>
                  </div>
                </div>
              </div>
                </CardContent>
              </Card>
            )}

        {/* Cyberpunk Action Buttons */}
        <div className="bg-gradient-to-br from-gray-900/30 to-black/30 rounded-xl p-6 border border-orange-500/30 shadow-lg shadow-orange-500/10">
          <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => router.push('/user/booking-history')}
            variant="outline"
              className="flex-1 h-12 border-orange-500/30 text-gray-300 hover:bg-orange-500/10 hover:text-orange-400 hover:border-orange-400 font-mono"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            BACK_TO_HISTORY
          </Button>

          <Button
            onClick={() => router.push('/user/book-trip')}
              className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-mono"
          >
              <Plus className="mr-2 h-4 w-4" />
            BOOK_ANOTHER_TRIP
          </Button>
        </div>
      </div>
      </main>
    </div>
  );
};
