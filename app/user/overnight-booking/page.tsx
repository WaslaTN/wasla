"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MapPin, Calendar, Clock, Users, Navigation, Loader, CheckCircle2, CreditCard, User, ArrowRight, Car, Timer, AlertCircle, Moon, Star, Zap, Route, Building2, Train, Minus, Plus, Hexagon, Cpu, Terminal, Network } from "lucide-react";
import { apiClient, calculateOvernightETA, formatOvernightDepartureTime } from "@/lib/api";
import StationMap from "@/components/map/StationMap";
import stationService from "@/lib/station-service";
import ETDDisplay from "@/components/ui/etd-display";
import { useRouter } from "next/navigation";

// Types based on your API
interface Station {
  id: string;
  stationId?: string;
  name: string;
  stationName?: string;
  nameAr?: string;
  stationNameAr?: string;
  governorate: string | {
    name: string;
    nameAr?: string;
  };
  governorateAr?: string;
  delegation: string | {
    name: string;
    nameAr?: string;
  };
  delegationAr?: string;
  address?: string;
  latitude: number;
  longitude: number;
  isActive?: boolean;
  isOnline: boolean;
  lastHeartbeat?: string | null;
  lastChecked?: string;
  destinationCount?: number;
  localServerIp?: string | null;
  supervisorId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  supervisor?: any;
  _count?: {
    staff: number;
    departureBookings: number;
    destinationBookings: number;
    queueEntries: number;
  };
}

interface ETDPrediction {
  estimatedDepartureTime: string;
  etdHours: number;
  confidenceLevel: number;
  modelUsed: string;
  queueVehicles: number;
}

interface RouteDestination {
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
  etaPrediction?: ETDPrediction;
}

interface VehicleInfo {
  id?: string;
  queueId?: string;
  vehicleId?: string;
  licensePlate?: string;
  capacity?: number;
  totalSeats?: number;
  availableSeats?: number;
  occupiedSeats?: number;
  queuePosition?: number;
  status?: string;
  pricePerSeat?: number;
  estimatedDeparture?: string;
  driverName?: string;
  driverPhone?: string;
  model?: string;
  vehicleModel?: string;
  color?: string;
  queueType?: string;
  enteredAt?: string;
  isLoading?: boolean;
  isReady?: boolean;
  isPriority?: boolean;
  occupancyRate?: number;
  etaPrediction?: ETDPrediction;
}

interface Booking {
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
  etaPrediction?: ETDPrediction;
}

type BookingStep = 'departure' | 'destination' | 'seats' | 'confirm';

export default function OvernightBooking() {
  const [currentStep, setCurrentStep] = useState<BookingStep>('departure');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  // Loading states
  const [loadingStations, setLoadingStations] = useState(false);
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  const [loadingRouteDetails, setLoadingRouteDetails] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);

  // Data states
  const [onlineStations, setOnlineStations] = useState<Station[]>([]);
  const [selectedDeparture, setSelectedDeparture] = useState<Station | null>(null);
  const [availableDestinations, setAvailableDestinations] = useState<RouteDestination[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<RouteDestination | null>(null);
  const [routeDetails, setRouteDetails] = useState<RouteDestination | null>(null);
  const [selectedSeats, setSelectedSeats] = useState(1);

  // Error states
  const [error, setError] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    setIsAuthenticated(!!token);

    // Load online stations on mount
    loadOnlineStations();
  }, []);

  const loadOnlineStations = async () => {
    setLoadingStations(true);
    setError(null);

    try {
      console.log('🌙 Loading stations with overnight capabilities...');
      const response = await stationService.getAllStations();

      console.log('📦 Raw API Response:', response);

      if (response.success && response.data.stations) {
        const stationsData = stationService.transformStationData(response);

        console.log('🏪 Processed stations data:', stationsData);
        console.log('🔍 First station structure:', stationsData[0]);

        setOnlineStations(stationsData);
        console.log(`✅ Loaded ${stationsData.length} stations with overnight capabilities`);
      } else {
        throw new Error(response.message || 'Failed to load stations');
      }
    } catch (err: any) {
      console.error('❌ Error loading stations:', err);
      // Fallback to existing API client if direct service fails
      try {
        console.log('🔄 Trying fallback API...');
        const response = await apiClient.getOnlineStations();

        if (response.success && response.data) {
          let stationsData = [];

          if (Array.isArray(response.data)) {
            stationsData = response.data;
          } else if ((response.data as any).stations && Array.isArray((response.data as any).stations)) {
            stationsData = (response.data as any).stations;
          } else if (typeof response.data === 'object') {
            stationsData = Object.values(response.data as any).filter((item: any) =>
              typeof item === 'object' && item !== null && 'id' in item && 'name' in item
            );
          }

          setOnlineStations(Array.isArray(stationsData) ? stationsData : []);
          console.log(`✅ Loaded ${Array.isArray(stationsData) ? stationsData.length : 0} stations via fallback`);
        } else {
          throw new Error(response.error || 'Failed to load stations');
        }
      } catch (fallbackErr: any) {
        console.error('❌ Fallback API also failed:', fallbackErr);
        setError(fallbackErr.message || 'Failed to load stations');
      }
    } finally {
      setLoadingStations(false);
    }
  };

  const handleDepartureSelect = async (stationId: string) => {
    // Find station using flexible ID matching
    const station = onlineStations.find(s => {
      return (s.id === stationId) || (s.stationId === stationId) || ((s as any)._id === stationId);
    });

    if (!station) {
      console.error('Station not found with ID:', stationId);
      console.log('Available stations:', onlineStations.map(s => ({
        id: s.id,
        stationId: s.stationId,
        name: s.name || s.stationName
      })));
      return;
    }

    const stationName = station.name || station.stationName || 'Unknown Station';
    console.log('🌙 Selected overnight departure station:', stationName, 'with ID:', stationId);
    setSelectedDeparture(station);
    setSelectedDestination(null);
    setRouteDetails(null);
    setAvailableDestinations([]);
    setLoadingDestinations(true);
    setError(null);

    try {
      console.log(`🔄 Loading overnight destinations for ${stationName}...`);
      // Use the stationId that was clicked (which should be the correct one)
      const response = await apiClient.getOvernightDestinations(stationId);

      if (response.success && response.data) {
        // Handle both array and object responses
        const destinationsData = Array.isArray(response.data) ? response.data : (response.data as any).destinations || [];

        // Enrich destinations with coordinates from station data
        const enrichedDestinations = stationService.enrichDestinationsWithCoordinates(destinationsData, onlineStations);

        // Add openingTime to destinations if available from the API response
        const destinationsWithOpeningTime = enrichedDestinations.map(destination => ({
          ...destination,
          openingTime: (destinationsData as any[]).find(d => d.destinationId === destination.destinationId)?.openingTime || '06:00'
        }));

        setAvailableDestinations(destinationsWithOpeningTime);
        console.log(`✅ Found ${destinationsWithOpeningTime.length} overnight destinations from ${stationName}`);
        setCurrentStep('destination');
      } else {
        throw new Error(response.error || 'No overnight destinations available');
      }
    } catch (err: any) {
      console.error('❌ Error loading overnight destinations:', err);
      setError(err.message || 'Failed to load overnight destinations');
    } finally {
      setLoadingDestinations(false);
    }
  };

  const handleDestinationSelect = async (destination: RouteDestination) => {
    setSelectedDestination(destination);
    setRouteDetails(null);
    setLoadingRouteDetails(true);
    setError(null);

    if (!selectedDeparture) return;

    try {
      const stationName = selectedDeparture.name || selectedDeparture.stationName || 'Unknown Station';
      console.log(`🔄 Loading overnight route details from ${stationName} to ${destination.destinationName}...`);

      // Get the correct station ID for the API call
      const departureStationId = selectedDeparture.stationId || selectedDeparture.id || '';
      console.log('🚂 Using overnight departure station ID:', departureStationId);

      const response = await apiClient.getOvernightRouteDetails(departureStationId, destination.destinationId);

      if (response.success && response.data) {
        // Handle the actual API response structure
        const routeData = response.data as any; // Type as any to handle API response
        const queueData = routeData.queue || {};

        // Create a combined route details object that matches our interface
        const processedRouteDetails: RouteDestination = {
          destinationId: routeData.route?.destinationStation?.id || selectedDestination?.destinationId || '',
          destinationName: routeData.route?.destinationStation?.name || selectedDestination?.destinationName || '',
          destinationNameAr: routeData.route?.destinationStation?.nameAr,
          governorate: routeData.route?.destinationStation?.governorate || selectedDestination?.governorate || '',
          delegation: routeData.route?.destinationStation?.delegation || selectedDestination?.delegation || '',
          totalVehicles: queueData.totalVehicles || 0,
          availableSeats: queueData.totalAvailableSeats || 0,
          estimatedDeparture: queueData.vehicles?.[0]?.estimatedDeparture || 'Tomorrow Morning',
          basePrice: queueData.priceRange?.average || queueData.vehicles?.[0]?.pricePerSeat || 0,
          vehicles: queueData.vehicles || [],
          openingTime: queueData.openingTime || '06:00', // Default to 6 AM if not provided
          etaPrediction: routeData.etaPrediction // Add ETA prediction from API
        };

        setRouteDetails(processedRouteDetails);
        console.log(`✅ Overnight route details loaded: ${processedRouteDetails.availableSeats} seats available`);
        console.log('🚐 Vehicles:', processedRouteDetails.vehicles.length);
        console.log('💰 Price per seat:', processedRouteDetails.basePrice, 'TND');
        console.log('🤖 ETA Prediction:', processedRouteDetails.etaPrediction);
        setCurrentStep('seats');
      } else {
        throw new Error(response.error || 'Failed to load overnight route details');
      }
    } catch (err: any) {
      console.error('❌ Error loading overnight route details:', err);
      setError(err.message || 'Failed to load overnight route details');
    } finally {
      setLoadingRouteDetails(false);
    }
  };

  const handleSeatsConfirm = () => {
    if (selectedSeats > 0 && routeDetails && selectedSeats <= (routeDetails.availableSeats || 0)) {
      setCurrentStep('confirm');
    } else {
      setError('Please select a valid number of seats');
    }
  };

  const createOvernightBooking = async () => {
    if (!selectedDeparture || !selectedDestination || !routeDetails) {
      setError('Missing booking information');
      return;
    }

    if (!isAuthenticated) {
      setError('Please login to book an overnight trip');
      // In a real app, you'd redirect to login
      return;
    }

    setIsCreatingBooking(true);
    setError(null);

    try {
      // Use current time as journey date since we're booking for next day departure
      const journeyDateTime = new Date();
      journeyDateTime.setDate(journeyDateTime.getDate() + 1); // Next day for overnight

      console.log('🌙 Creating overnight booking...', {
        departureStationId: selectedDeparture.stationId || selectedDeparture.id,
        destinationStationId: selectedDestination.destinationId,
        seatsBooked: selectedSeats,
        journeyDate: journeyDateTime.toISOString()
      });

      const departureStationId = selectedDeparture.stationId || selectedDeparture.id || '';
      const response = await apiClient.createOvernightBooking(
        departureStationId,
        selectedDestination.destinationId,
        selectedSeats
      );

      const responseData = response.data as any; // Type as any to handle actual API response structure

      if (response.success && (responseData?.paymentUrl || responseData?.payment?.paymentUrl)) {
        const paymentUrl = responseData.paymentUrl || responseData.payment?.paymentUrl;
        console.log('✅ Overnight booking created successfully:', responseData.booking?.id || responseData.booking?.bookingId);
        console.log('💳 Redirecting to payment:', paymentUrl);

        // Automatically redirect to payment
        window.location.href = paymentUrl;
      } else {
        console.log('📋 Full API Response:', response);
        console.log('📦 Response data:', responseData);
        console.log('💳 Payment data:', responseData?.payment);
        console.log('💳 Payment URL in response:', responseData?.paymentUrl);
        console.log('💳 Payment URL in payment object:', responseData?.payment?.paymentUrl);
        throw new Error(response.error || 'No payment URL received');
      }
    } catch (err: any) {
      console.error('❌ Overnight booking creation failed:', err);
      setError(err.message || 'Failed to create overnight booking');
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const goBack = () => {
    switch (currentStep) {
      case 'destination':
        setCurrentStep('departure');
        setSelectedDestination(null);
        setAvailableDestinations([]);
        break;
      case 'seats':
        setCurrentStep('destination');
        setRouteDetails(null);
        break;
      case 'confirm':
        setCurrentStep('seats');
        break;
      default:
        // Go to dashboard or previous page
        break;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'departure': return 'Select Departure Station';
      case 'destination': return 'Choose Overnight Destination';
      case 'seats': return 'Select Seats & Date';
      case 'confirm': return 'Confirm Overnight Booking';
      default: return 'Book Overnight Trip';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'departure': return 'Choose your starting point from stations with overnight services';
      case 'destination': return `Available overnight destinations from ${selectedDeparture?.name || selectedDeparture?.stationName}`;
      case 'seats': return 'Select number of seats for your overnight journey';
      case 'confirm': return 'Review and confirm your overnight booking details';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 py-8">
            <Button
              onClick={currentStep === 'departure' ? () => router.push('/user/dashboard') : goBack}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 text-orange-400" />
            </Button>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Hexagon className="w-8 h-8 text-orange-400" />
                {getStepTitle()}
              </h1>
              <p className="text-white/60 text-lg font-mono">{getStepDescription()}</p>
            </div>

            {/* Enhanced Step indicator */}
            <div className="hidden lg:flex items-center gap-3">
              {['departure', 'destination', 'seats', 'confirm'].map((step, index) => {
                const stepIndex = ['departure', 'destination', 'seats', 'confirm'].indexOf(currentStep);
                const isCompleted = index < stepIndex;
                const isCurrent = currentStep === step;

                return (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                        isCurrent
                          ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/25'
                          : isCompleted
                          ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/25'
                          : 'bg-white/10 text-white/40 border border-white/20'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    {index < 3 && (
                      <div className={`w-8 h-1 mx-2 rounded-full transition-all duration-300 ${
                        index < stepIndex ? 'bg-cyan-600' : 'bg-white/20'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Card className="mb-8 border-red-500/30 bg-red-500/5 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-red-400">
                <AlertCircle className="w-6 h-6" />
                <span className="text-lg">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Select Departure Station */}
        {currentStep === 'departure' && (
          <div className="space-y-8">
            <Card className="backdrop-blur-sm bg-white/5 border border-white/10 shadow-xl">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl text-white flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                    <Hexagon className="w-6 h-6 text-orange-400" />
                  </div>
                  SELECT_ONLINE_DEPARTURE_STATION
                </CardTitle>
                <CardDescription className="text-white/60 text-lg">
                  CHOOSE_FROM_ONLINE_STATIONS_WITH_OVERNIGHT_SERVICES
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingStations ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <Loader className="w-8 h-8 animate-spin text-teal-400 mx-auto mb-4" />
                      <span className="text-white/60 text-lg font-mono">LOADING_ONLINE_STATIONS...</span>
                    </div>
                  </div>
                ) : !onlineStations || onlineStations.length === 0 ? (
                  <div className="text-center py-16">
                    <Moon className="w-16 h-16 text-teal-400 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold text-white mb-3 font-mono">NO_ONLINE_STATIONS</h3>
                    <p className="text-white/60 text-lg font-mono">NO_STATIONS_CURRENTLY_ONLINE</p>
                    <p className="text-white/50 text-sm mt-2 font-mono">PLEASE_WAIT_FOR_STATIONS_TO_COME_ONLINE</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {onlineStations.filter(station => station.isOnline).map((station) => (
                      <Card
                        key={station.id}
                        className="cursor-pointer hover:bg-white/10 hover:border-teal-500/30 transition-all duration-300 border border-white/20 bg-white/5 backdrop-blur-sm group"
                        onClick={() => handleDepartureSelect(station.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Building2 className="w-8 h-8 text-teal-400" />
                              </div>
                              <div>
                                <h3 className="font-bold text-white text-lg mb-2 flex items-center gap-2">
                                                                     {station.name || station.stationName || 'UNKNOWN_STATION'}
                                  {station.isOnline && (
                                    <Badge className="bg-green-500/20 border-green-500/30 text-green-400 text-xs px-2 py-1">
                                      ONLINE
                                    </Badge>
                                  )}
                                </h3>
                                <p className="text-white/60 mb-3">
                                                                     {typeof station.governorate === 'string' ? station.governorate : station.governorate?.name || 'UNKNOWN'}, {typeof station.delegation === 'string' ? station.delegation : station.delegation?.name || 'UNKNOWN'}
                                </p>
                                <div className="flex items-center gap-6">
                                  <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="w-4 h-4 text-blue-400" />
                                                                         <span className="text-blue-400 font-medium font-mono">
                                       {station.latitude && station.longitude ? 'GPS_AVAILABLE' : 'GPS_PENDING'}
                                     </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Zap className="w-4 h-4 text-yellow-400" />
                                                                         <span className="text-yellow-400 font-medium font-mono">
                                       {station.isOnline ? 'ACTIVE' : 'INACTIVE'}
                                     </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <ArrowRight className="w-6 h-6 text-teal-400 group-hover:translate-x-1 transition-transform duration-300" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Interactive Map */}
            {onlineStations && onlineStations.length > 0 && (
              <Card className="backdrop-blur-sm bg-white/5 border border-white/10 shadow-xl">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl text-white flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                      <Navigation className="w-6 h-6 text-cyan-400" />
                    </div>
                                         STATION_MAP
                  </CardTitle>
                  <CardDescription className="text-white/60 text-lg">
                                         CLICK_ON_STATION_MARKERS_TO_SELECT_DEPARTURE_POINT
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StationMap
                    stations={onlineStations.filter(station => station.isOnline)}
                    destinations={[]}
                    selectedDeparture={null}
                    selectedDestination={null}
                    onStationSelect={handleDepartureSelect}
                    onDestinationSelect={() => {}}
                    showRoute={false}
                    mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 2: Select Destination */}
        {currentStep === 'destination' && selectedDeparture && (
          <div className="space-y-8">
            <Card className="backdrop-blur-sm bg-white/5 border border-white/10 shadow-xl">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl text-white flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <Route className="w-6 h-6 text-cyan-400" />
                  </div>
                  Available Overnight Destinations
                </CardTitle>
                <CardDescription className="text-white/60 text-lg">
                  Departing from <span className="text-teal-400 font-semibold">{selectedDeparture.name || selectedDeparture.stationName}</span>
                  <br />
                  <span className="text-sm text-white/50">Overnight vehicles depart in the morning after station opening</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingDestinations ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <Loader className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-4" />
                      <span className="text-white/60 text-lg">Loading overnight destinations...</span>
                    </div>
                  </div>
                ) : !availableDestinations || availableDestinations.length === 0 ? (
                  <div className="text-center py-16">
                    <Moon className="w-16 h-16 text-teal-400 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold text-white mb-3">No Overnight Destinations</h3>
                    <p className="text-white/60 text-lg">This station currently has no overnight destinations available.</p>
                    <p className="text-white/50 text-sm mt-2">Overnight services typically operate from evening until morning.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(availableDestinations || []).filter(destination => destination && destination.destinationId && destination.destinationName).map((destination) => (
                      <Card
                        key={destination.destinationId}
                        className="cursor-pointer hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300 border border-white/20 bg-white/5 backdrop-blur-sm group"
                        onClick={() => handleDestinationSelect(destination)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <MapPin className="w-8 h-8 text-cyan-400" />
                              </div>
                              <div>
                                <h3 className="font-bold text-white text-lg mb-2 flex items-center gap-2">
                                  {destination.destinationName || 'Unknown Destination'}
                                  <Star className="w-4 h-4 text-teal-400" />
                                </h3>
                                <p className="text-white/60 mb-3">
                                  {destination.governorate || 'Unknown'}, {destination.delegation || 'Unknown'}
                                </p>
                                <div className="flex items-center gap-6">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Car className="w-4 h-4 text-blue-400" />
                                    <span className="text-blue-400 font-medium">{destination.totalVehicles} vehicles</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Users className="w-4 h-4 text-green-400" />
                                    <span className="text-green-400 font-medium">{destination.availableSeats} seats</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Timer className="w-4 h-4 text-orange-400" />
                                    <div className="flex flex-col">
                                      <span className="text-orange-400 font-medium">
                                        {destination.openingTime ? destination.openingTime : '06:00'}
                                      </span>
                                      <span className="text-xs text-white/70">
                                        {destination.openingTime
                                          ? formatOvernightDepartureTime(destination.openingTime, destination.estimatedDeparture)
                                          : destination.estimatedDeparture
                                        }
                                      </span>
                                      {destination.openingTime && (() => {
                                        const { eta, dayIndicator } = calculateOvernightETA(destination.openingTime);
                                        return (
                                          <div className="text-xs text-white/50">
                                            {dayIndicator === 'tomorrow' ? 'Tomorrow' : 'Today'} • ETA {eta}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                  {/* Add ETD Display */}
                                  <ETDDisplay
                                    etaPrediction={destination.etaPrediction || null}
                                    compact={true}
                                    className="ml-2"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold text-white mb-1">{destination.basePrice} TND</div>
                              <div className="text-white/60">per seat</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Interactive Map with Destinations */}
            {availableDestinations && availableDestinations.length > 0 && (
              <Card className="backdrop-blur-sm bg-white/5 border border-white/10 shadow-xl">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl text-white flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                      <Navigation className="w-6 h-6 text-cyan-400" />
                    </div>
                    Overnight Destination Map
                  </CardTitle>
                  <CardDescription className="text-white/60 text-lg">
                    Click on destination markers to select your overnight destination
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StationMap
                    stations={onlineStations}
                    destinations={availableDestinations}
                    selectedDeparture={selectedDeparture}
                    selectedDestination={selectedDestination}
                    onStationSelect={handleDepartureSelect}
                    onDestinationSelect={handleDestinationSelect}
                    showRoute={!!selectedDestination}
                    mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 3: Select Seats and Date */}
        {currentStep === 'seats' && selectedDestination && (
          <Card className="backdrop-blur-sm bg-white/5 border border-white/10 shadow-xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-emerald-400" />
                </div>
                Select Seats for Overnight Journey
              </CardTitle>
              <CardDescription className="text-white/60 text-lg">
                Route: <span className="text-teal-400 font-semibold">{selectedDeparture?.name || selectedDeparture?.stationName}</span> → <span className="text-cyan-400 font-semibold">{selectedDestination.destinationName}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {loadingRouteDetails ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <Loader className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-4" />
                    <span className="text-white/60 text-lg">Loading overnight route details...</span>
                  </div>
                </div>
              ) : routeDetails ? (
                <>
                  {/* Route Summary */}
                  <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/30 border border-slate-600/30 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                                                <div>
                          <div className="w-12 h-12 rounded-xl bg-slate-600/30 flex items-center justify-center mx-auto mb-3">
                            <Car className="w-6 h-6 text-slate-300" />
                          </div>
                          <div className="text-white/60 mb-1">Vehicles</div>
                          <div className="text-2xl font-bold text-white">{routeDetails.totalVehicles}</div>
                        </div>
                        <div>
                          <div className="w-12 h-12 rounded-xl bg-slate-600/30 flex items-center justify-center mx-auto mb-3">
                            <Users className="w-6 h-6 text-slate-300" />
                          </div>
                          <div className="text-white/60 mb-1">Available Seats</div>
                          <div className="text-2xl font-bold text-emerald-400">{routeDetails.availableSeats || 0}</div>
                        </div>
                        <div>
                          <div className="w-12 h-12 rounded-xl bg-slate-600/30 flex items-center justify-center mx-auto mb-3">
                            <Timer className="w-6 h-6 text-slate-300" />
                          </div>
                          <div className="text-white/60 mb-1">Est. Departure</div>
                          <div className="text-xl font-bold text-cyan-400">
                            {routeDetails.openingTime ? routeDetails.openingTime : '06:00'}
                          </div>
                          <div className="text-sm text-white/70">
                            {routeDetails.openingTime
                              ? formatOvernightDepartureTime(routeDetails.openingTime, routeDetails.estimatedDeparture)
                              : 'Morning'
                            }
                          </div>
                          {routeDetails.openingTime && (() => {
                            const { eta, dayIndicator } = calculateOvernightETA(routeDetails.openingTime);
                            return (
                              <div className="text-xs text-white/60 mt-1">
                                {dayIndicator === 'tomorrow' ? 'Tomorrow' : 'Today'} • ETA {eta}
                              </div>
                            );
                          })()}
                        </div>
                        <div>
                          <div className="w-12 h-12 rounded-xl bg-slate-600/30 flex items-center justify-center mx-auto mb-3">
                            <CreditCard className="w-6 h-6 text-slate-300" />
                          </div>
                          <div className="text-white/60 mb-1">Price per Seat</div>
                          <div className="text-2xl font-bold text-teal-400">{routeDetails.basePrice || 0} TND</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI ETD Display */}
                  {routeDetails.etaPrediction && (
                    <ETDDisplay
                      etaPrediction={routeDetails.etaPrediction || null}
                      showDetails={true}
                      className="mb-6"
                    />
                  )}

                  {/* Seat Selection */}
                  <div className="space-y-8">
                    <Card className="bg-white/5 border border-white/20 backdrop-blur-sm">
                      <CardContent className="p-8">
                        <div className="text-center space-y-6">
                          <h3 className="text-2xl font-semibold text-white flex items-center justify-center gap-3">
                            <Users className="w-6 h-6 text-teal-400" />
                            Select Seats
                          </h3>

                          {/* Single Seat Selection */}
                          {routeDetails.availableSeats === 1 ? (
                            <div className="space-y-4">
                              <div className="inline-flex items-center gap-3 bg-teal-500/20 border border-teal-500/30 rounded-full px-6 py-3">
                                <CheckCircle2 className="w-5 h-5 text-teal-400" />
                                <span className="text-teal-400 font-semibold">1 seat available</span>
                              </div>
                              <p className="text-white/60 text-lg">
                                This vehicle has only 1 seat remaining for overnight travel
                              </p>
                            </div>
                          ) : (
                            /* Multiple Seats Selection */
                            <div className="space-y-6">
                              <div className="flex items-center justify-center gap-4">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setSelectedSeats(Math.max(1, selectedSeats - 1))}
                                  disabled={selectedSeats <= 1}
                                  className="w-14 h-14 rounded-full border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95"
                                >
                                  <Minus className="w-6 h-6" />
                                </Button>

                                <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/30 rounded-2xl px-8 py-4 min-w-[120px]">
                                  <div className="text-4xl font-bold text-white">{selectedSeats}</div>
                                  <div className="text-white/60 text-sm">seats</div>
                                </div>

                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setSelectedSeats(Math.min(routeDetails.availableSeats || 6, selectedSeats + 1))}
                                  disabled={selectedSeats >= (routeDetails.availableSeats || 6)}
                                  className="w-14 h-14 rounded-full border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95"
                                >
                                  <Plus className="w-6 h-6" />
                                </Button>
                              </div>

                              {/* Quick Selection Buttons */}
                              <div className="flex flex-wrap justify-center gap-2">
                                {[1, 2, 3, 4, 5, 6].map((num) => (
                                  num <= (routeDetails.availableSeats || 6) && (
                                    <Button
                                      key={num}
                                      variant={selectedSeats === num ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => setSelectedSeats(num)}
                                      className={`px-4 py-2 rounded-full transition-all duration-200 ${
                                        selectedSeats === num
                                          ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/25'
                                          : 'border-white/30 text-white hover:bg-white/10 hover:border-white/50'
                                      }`}
                                    >
                                      {num}
                                    </Button>
                                  )
                                ))}
                              </div>

                              <p className="text-white/60 text-lg">
                                <span className="text-teal-400 font-semibold">{routeDetails.availableSeats || 6}</span> seats available for overnight travel
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Cost Display */}
                    <Card className="bg-gradient-to-r from-slate-800/30 to-slate-700/20 border border-slate-600/30 backdrop-blur-sm">
                      <CardContent className="p-8">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-white/60 text-lg mb-1">Total Cost</div>
                            <div className="text-white/60">{selectedSeats} seat{selectedSeats > 1 ? 's' : ''} × {routeDetails.basePrice || 0} TND</div>
                          </div>
                          <div className="text-right">
                            <div className="text-4xl font-bold text-green-400">
                              {selectedSeats * (routeDetails.basePrice || 0)} TND
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Button
                      onClick={handleSeatsConfirm}
                      className="w-full h-14 text-xl font-semibold bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-lg shadow-teal-600/25 transition-all duration-200"
                      disabled={selectedSeats === 0 || selectedSeats > (routeDetails.availableSeats || 0)}
                    >
                      Continue to Confirmation
                      <ArrowRight className="w-5 h-5 ml-3" />
                    </Button>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Confirm Booking */}
        {currentStep === 'confirm' && selectedDeparture && selectedDestination && routeDetails && (
          <Card className="backdrop-blur-sm bg-white/5 border border-white/10 shadow-xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                Confirm Your Overnight Booking
              </CardTitle>
              <CardDescription className="text-white/60 text-lg">
                Please review your overnight booking details before proceeding to payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Booking Summary */}
              <div className="space-y-4">
                <div className="flex justify-between items-center p-5 bg-slate-800/30 rounded-xl border border-slate-600/30">
                  <span className="text-white/60 text-lg">From:</span>
                  <span className="text-teal-400 font-semibold text-lg">{selectedDeparture.name || selectedDeparture.stationName}</span>
                </div>
                <div className="flex justify-between items-center p-5 bg-slate-800/30 rounded-xl border border-slate-600/30">
                  <span className="text-white/60 text-lg">To:</span>
                  <span className="text-cyan-400 font-semibold text-lg">{selectedDestination.destinationName}</span>
                </div>
                <div className="flex justify-between items-center p-5 bg-slate-800/30 rounded-xl border border-slate-600/30">
                  <span className="text-white/60 text-lg">Number of Seats:</span>
                  <span className="text-emerald-400 font-semibold text-lg">{selectedSeats}</span>
                </div>
                <div className="flex justify-between items-center p-5 bg-slate-800/30 rounded-xl border border-slate-600/30">
                  <span className="text-white/60 text-lg">Price per Seat:</span>
                  <span className="text-teal-400 font-semibold text-lg">{routeDetails.basePrice} TND</span>
                </div>
                <div className="flex justify-between items-center p-5 bg-slate-800/30 rounded-xl border border-slate-600/30">
                  <span className="text-white/60 text-lg">Station Opening:</span>
                  <div className="text-right">
                    <div className="text-cyan-400 font-semibold text-lg">{routeDetails.openingTime || '06:00'}</div>
                    {routeDetails.openingTime && (() => {
                      const { eta, dayIndicator } = calculateOvernightETA(routeDetails.openingTime);
                      return (
                        <div className="text-xs text-white/50">
                          {dayIndicator === 'tomorrow' ? 'Tomorrow' : 'Today'} • ETA {eta}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                {/* AI ETD in Confirmation */}
                {routeDetails.etaPrediction && (
                  <div className="p-5 bg-slate-800/30 rounded-xl border border-slate-600/30">
                    <span className="text-white/60 text-lg block mb-3">AI-Powered ETD:</span>
                    <ETDDisplay
                      etaPrediction={routeDetails.etaPrediction || null}
                      compact={true}
                    />
                  </div>
                )}
                <div className="flex justify-between items-center p-6 bg-gradient-to-r from-slate-800/40 to-slate-700/30 rounded-xl border border-slate-600/30">
                  <span className="text-xl font-semibold text-white">Total Amount:</span>
                  <span className="text-3xl font-bold text-emerald-400">{selectedSeats * routeDetails.basePrice} TND</span>
                </div>
              </div>

              {/* Route Map */}
              <Card className="backdrop-blur-sm bg-white/5 border border-white/10">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl text-white flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-600/30 flex items-center justify-center">
                      <Navigation className="w-6 h-6 text-slate-300" />
                    </div>
                    Your Overnight Journey Route
                  </CardTitle>
                  <CardDescription className="text-white/60 text-lg">
                    Visual route from {selectedDeparture.name || selectedDeparture.stationName} to {selectedDestination.destinationName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StationMap
                    stations={onlineStations}
                    destinations={availableDestinations}
                    selectedDeparture={selectedDeparture}
                    selectedDestination={selectedDestination}
                    onStationSelect={() => {}} // Read-only in confirmation step
                    onDestinationSelect={() => {}} // Read-only in confirmation step
                    showRoute={true}
                    mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''}
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-4">
                {isAuthenticated ? (
                  <Button
                    onClick={createOvernightBooking}
                    disabled={isCreatingBooking}
                    className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 shadow-lg shadow-teal-600/25 transition-all duration-200 disabled:from-gray-600 disabled:to-gray-700"
                  >
                    {isCreatingBooking ? (
                      <>
                        <Loader className="w-6 h-6 mr-3 animate-spin" />
                        Creating Overnight Booking...
                      </>
                    ) : (
                      <>
                        <Moon className="w-6 h-6 mr-3" />
                        Book Overnight Trip & Pay {selectedSeats * routeDetails.basePrice} TND
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => {/* Redirect to login */}}
                    className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 shadow-lg shadow-slate-600/25 transition-all duration-200"
                  >
                    <User className="w-6 h-6 mr-3" />
                    Login to Complete Overnight Booking
                  </Button>
                )}

                {!isCreatingBooking && isAuthenticated && (
                  <p className="text-white/60 text-center text-lg">
                    You'll be redirected to Konnect for secure payment processing
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}