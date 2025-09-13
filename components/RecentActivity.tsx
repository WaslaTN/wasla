"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Clock3, 
  Navigation, 
  Calendar,
  CreditCard,
  ArrowRight,
  Activity
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Station {
  id: string;
  name: string;
  governorate: string;
  delegation: string;
}

interface RecentBooking {
  id: string;
  verificationCode: string;
  status: 'PAID' | 'PENDING' | 'FAILED' | 'CANCELLED';
  seatsBooked: number;
  totalAmount: number;
  journeyDate: string;
  createdAt: string;
  departureStation: Station;
  destinationStation: Station;
  paymentReference?: string;
}

export default function RecentActivity() {
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchRecentActivity = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch('/api/bookings/recent', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setRecentBookings(result.data?.bookings || []);
      } else {
        setError('Failed to load recent activity');
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      setError('Failed to load recent activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-500/20 border-green-500/40 text-green-400';
      case 'PENDING':
        return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400';
      case 'FAILED':
        return 'bg-red-500/20 border-red-500/40 text-red-400';
      case 'CANCELLED':
        return 'bg-gray-500/20 border-gray-500/40 text-gray-400';
      default:
        return 'bg-gray-500/20 border-gray-500/40 text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle2 className="w-3 h-3" />;
      case 'PENDING':
        return <Clock3 className="w-3 h-3" />;
      case 'FAILED':
        return <XCircle className="w-3 h-3" />;
      case 'CANCELLED':
        return <XCircle className="w-3 h-3" />;
      default:
        return <Clock3 className="w-3 h-3" />;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <Card className="backdrop-blur-xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-600/50">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-700/30 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-600/50">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg sm:text-xl text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Recent Activity
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">Click on any booking to view details</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/booking-history')}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
          >
            View All
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-6 pt-0">
        {error ? (
          <div className="text-center py-6">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="text-center py-6">
            <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No recent activity</p>
            <Button
              size="sm"
              onClick={() => router.push('/user/book-trip')}
              className="mt-3 bg-blue-600 hover:bg-blue-700"
            >
              Book Your First Trip
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="p-3 rounded-lg bg-black/20 hover:bg-black/30 transition-colors cursor-pointer"
                onClick={() => router.push(`/booking-details/${booking.paymentReference || booking.id}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`${getStatusColor(booking.status)} text-xs px-2 py-0.5`}>
                      {getStatusIcon(booking.status)}
                      <span className="ml-1">{booking.status}</span>
                    </Badge>
                    <span className="text-xs text-gray-400">{formatRelativeTime(booking.createdAt)}</span>
                  </div>
                  <span className="text-green-400 font-semibold text-sm">{booking.totalAmount} TND</span>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="w-3 h-3 text-gray-400" />
                  <span className="text-white text-sm">
                    {booking.departureStation.name}
                  </span>
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                  <span className="text-white text-sm">
                    {booking.destinationStation.name}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(booking.journeyDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    <span>{booking.seatsBooked} seat(s)</span>
                  </div>
                  <span className="font-mono">{booking.verificationCode}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 