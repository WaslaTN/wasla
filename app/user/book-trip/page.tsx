"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MapPin, Calendar, Clock, Users, Navigation, Loader, CheckCircle2, CreditCard, User, ArrowRight, Car, Timer, AlertCircle, Zap, Route, Building2, Train, Minus, Plus, Hexagon, Cpu, Terminal, Network } from "lucide-react";
import { apiClient } from "@/lib/api";
import StationMap from "@/components/map/StationMap";
import stationService from "@/lib/station-service";
import { useLanguage } from "@/lib/hooks/useLanguage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
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

export default function StepByStepBooking() {
  const { t } = useLanguage();
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
      console.log('🔄 Loading stations from API...');
      const response = await stationService.getAllStations();

      console.log('📦 Raw API Response:', response);

      if (response.success && response.data.stations) {
        const stationsData = stationService.transformStationData(response);

        console.log('🏪 Processed stations data:', stationsData);
        console.log('🔍 First station structure:', stationsData[0]);

        setOnlineStations(stationsData);
        console.log(`✅ Loaded ${stationsData.length} stations`);
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
    console.log('🏪 Selected departure station:', stationName, 'with ID:', stationId);
    setSelectedDeparture(station);
    setSelectedDestination(null);
    setRouteDetails(null);
    setAvailableDestinations([]);
    setLoadingDestinations(true);
    setError(null);

    try {
      console.log(`🔄 Loading destinations for ${stationName}...`);
      // Use the stationId that was clicked (which should be the correct one)
      const response = await apiClient.getStationDestinations(stationId);

      if (response.success && response.data) {
        // Handle both array and object responses
        const destinationsData = Array.isArray(response.data) ? response.data : (response.data as any).destinations || [];

        // Enrich destinations with coordinates from station data
        const enrichedDestinations = stationService.enrichDestinationsWithCoordinates(destinationsData, onlineStations);

        // Add ETA predictions from the API response
        const destinationsWithETA = enrichedDestinations.map(destination => ({
          ...destination,
          etaPrediction: (destinationsData as any[]).find(d => d.destinationId === destination.destinationId)?.etaPrediction
        }));

        setAvailableDestinations(destinationsWithETA);
        console.log(`✅ Found ${destinationsWithETA.length} destinations from ${stationName}`);
        console.log('🤖 ETA predictions:', destinationsWithETA.map(d => d.etaPrediction));
        setCurrentStep('destination');
      } else {
        throw new Error(response.error || 'No destinations available');
      }
    } catch (err: any) {
      console.error('❌ Error loading destinations:', err);
      setError(err.message || 'Failed to load destinations');
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
      console.log(`🔄 Loading route details from ${stationName} to ${destination.destinationName}...`);

      // Get the correct station ID for the API call
      const departureStationId = selectedDeparture.stationId || selectedDeparture.id || '';
      console.log('🚂 Using departure station ID:', departureStationId);

      const response = await apiClient.getRouteDetails(departureStationId, destination.destinationId);

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
          estimatedDeparture: queueData.vehicles?.[0]?.estimatedDeparture || 'Soon',
          basePrice: queueData.priceRange?.average || queueData.vehicles?.[0]?.pricePerSeat || 0,
          vehicles: queueData.vehicles || [],
          etaPrediction: routeData.etaPrediction // Add ETA prediction from API
        };

        setRouteDetails(processedRouteDetails);
        console.log(`✅ Route details loaded: ${processedRouteDetails.availableSeats} seats available`);
        console.log('🚐 Vehicles:', processedRouteDetails.vehicles.length);
        console.log('💰 Price per seat:', processedRouteDetails.basePrice, 'TND');
        console.log('🤖 ETA Prediction:', processedRouteDetails.etaPrediction);
        setCurrentStep('seats');
      } else {
        throw new Error(response.error || 'Failed to load route details');
      }
    } catch (err: any) {
      console.error('❌ Error loading route details:', err);
      setError(err.message || 'Failed to load route details');
    } finally {
      setLoadingRouteDetails(false);
    }
  };

  const handleSeatsConfirm = () => {
    if (selectedSeats > 0 && routeDetails && selectedSeats <= (routeDetails.availableSeats || 0)) {
      setCurrentStep('confirm');
    } else {
      setError(t('pleaseSelectValidSeats'));
    }
  };

  const createBooking = async () => {
    if (!selectedDeparture || !selectedDestination || !routeDetails) {
      setError(t('missingBookingInfo'));
      return;
    }

    if (!isAuthenticated) {
      setError(t('pleaseLoginToBook'));
      // In a real app, you'd redirect to login
      return;
    }

    setIsCreatingBooking(true);
    setError(null);

    try {
      // Use current time as journey date since we're booking for immediate departure
      const journeyDateTime = new Date();

      console.log('🎫 Creating booking...', {
        departureStationId: selectedDeparture.stationId || selectedDeparture.id,
        destinationStationId: selectedDestination.destinationId,
        seatsBooked: selectedSeats,
        journeyDate: journeyDateTime.toISOString()
      });

      const departureStationId = selectedDeparture.stationId || selectedDeparture.id || '';
      const response = await apiClient.createBooking(
        departureStationId,
        selectedDestination.destinationId,
        selectedSeats,
        journeyDateTime.toISOString()
      );

      const responseData = response.data as any; // Type as any to handle actual API response structure

      if (response.success && (responseData?.paymentUrl || responseData?.payment?.paymentUrl)) {
        const paymentUrl = responseData.paymentUrl || responseData.payment?.paymentUrl;
        console.log('✅ Booking created successfully:', responseData.booking?.id || responseData.booking?.bookingId);
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
      console.error('❌ Booking creation failed:', err);
      setError(err.message || 'Failed to create booking');
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
        router.push('/user/dashboard');
        break;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'departure': return t('selectDepartureStation');
      case 'destination': return t('chooseDestination');
      case 'seats': return t('selectSeatsDate');
      case 'confirm': return t('confirmBooking');
      default: return t('bookTrip');
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'departure': return t('chooseStartingPoint');
      case 'destination': return `${t('availableDestinationsFrom')} ${selectedDeparture?.name || selectedDeparture?.stationName}`;
      case 'seats': return t('selectNumberOfSeats');
      case 'confirm': return t('reviewConfirmBooking');
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Cyberpunk Header */}
      <header className="border-b border-orange-500/30 bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 py-8">
            <Button
              onClick={currentStep === 'departure' ? () => router.push('/user/dashboard') : goBack}
              variant="outline"
              size="sm"
              className="border-orange-500/30 text-gray-300 hover:bg-orange-500/10 hover:text-orange-400 hover:border-orange-400 transition-all duration-200 font-mono"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2 font-mono">{getStepTitle()}</h1>
              <p className="text-gray-400 text-lg font-mono">{getStepDescription()}</p>
            </div>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Cyberpunk Step indicator */}
            <div className="hidden lg:flex items-center gap-3">
              {['departure', 'step', 'seats', 'confirm'].map((step, index) => {
                const stepIndex = ['departure', 'step', 'seats', 'confirm'].indexOf(currentStep);
                const isCompleted = index < stepIndex;
                const isCurrent = currentStep === step;

                return (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                        isCurrent
                          ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25'
                          : isCompleted
                          ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25'
                          : 'bg-gradient-to-r from-gray-800/50 to-black/50 text-gray-400 border border-orange-500/30'
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
                        index < stepIndex ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-gray-700/50'
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
          <Card className="mb-8 border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-red-500/5 backdrop-blur-sm shadow-lg shadow-orange-500/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-orange-400 font-mono">
                <AlertCircle className="w-6 h-6" />
                <span className="text-lg">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Select Departure Station */}
        {currentStep === 'departure' && (
          <div className="space-y-8">
            <Card className="backdrop-blur-sm bg-gradient-to-br from-gray-900/90 to-black/90 border border-orange-500/30 shadow-xl shadow-orange-500/10">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl text-white flex items-center gap-3 font-mono">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-600/20 flex items-center justify-center border border-orange-500/30">
                    <Hexagon className="w-6 h-6 text-orange-400" />
                  </div>
                  {t('selectDeparture')}
                </CardTitle>
                <CardDescription className="text-gray-400 text-lg font-mono">
                  {t('chooseStartingPoint')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingStations ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <Loader className="w-8 h-8 animate-spin text-orange-400 mx-auto mb-4" />
                      <span className="text-gray-400 text-lg font-mono">{t('loadingStations')}</span>
                    </div>
                  </div>
                ) : !onlineStations || onlineStations.length === 0 || onlineStations.filter(s => s.isOnline).length === 0 ? (
                  <div className="text-center py-16">
                    <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold text-white mb-3 font-mono">{t('noStationsFound')}</h3>
                    <p className="text-gray-400 mb-6 text-lg font-mono">{t('noOnlineStationsAvailable')}</p>
                    <Button onClick={loadOnlineStations} variant="outline" className="border-orange-500/30 text-gray-300 hover:bg-orange-500/10 hover:text-orange-400 font-mono">
                      {t('tryAgain')}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(onlineStations || []).filter(station => station.isOnline).map((station, index) => {
                      const stationAny = station as any;
                      if (!station || (!stationAny.id && !stationAny._id && !stationAny.stationId)) {
                        console.warn('Skipping invalid station at index', index, station);
                        return null;
                      }

                      const stationId = stationAny.id || stationAny._id || stationAny.stationId;
                      const stationName = stationAny.name || stationAny.stationName || `Station ${index + 1}`;

                      return (
                        <Card
                          key={stationId}
                          className="cursor-pointer hover:bg-gradient-to-br hover:from-gray-800/90 hover:to-gray-900/90 hover:border-orange-400/50 transition-all duration-300 border border-orange-500/30 bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-sm group shadow-lg shadow-orange-500/10"
                          onClick={() => {
                            console.log('🖱️ Station clicked:', { stationId, stationName, station });
                            handleDepartureSelect(stationId);
                          }}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-600/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-orange-500/30">
                                <Hexagon className="w-8 h-8 text-orange-400" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-white text-lg mb-2 font-mono">{stationName}</h3>
                                <p className="text-gray-400 mb-3 font-mono">
                                  {typeof station.governorate === 'string' ? station.governorate : station.governorate?.name || 'Unknown'}, {typeof station.delegation === 'string' ? station.delegation : station.delegation?.name || 'Unknown'}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-gradient-to-r from-emerald-500/20 to-green-600/20 text-emerald-400 border-emerald-500/50 px-3 py-1 font-mono">
                                    <Zap className="w-3 h-3 mr-2" />
                                    ONLINE
                                  </Badge>
                                </div>
                              </div>
                              <ArrowRight className="w-6 h-6 text-orange-400/40 group-hover:text-orange-400/60 transition-colors duration-300" />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }).filter(Boolean)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Interactive Map */}
            {onlineStations && onlineStations.filter(s => s.isOnline).length > 0 && (
              <Card className="backdrop-blur-sm bg-gradient-to-br from-gray-900/90 to-black/90 border border-orange-500/30 shadow-xl shadow-orange-500/10">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl text-white flex items-center gap-3 font-mono">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 flex items-center justify-center border border-emerald-500/30">
                      <Navigation className="w-6 h-6 text-emerald-400" />
                    </div>
                    INTERACTIVE_STATION_MAP
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-lg font-mono">
                    CLICK_STATION_MARKER_TO_SELECT_DEPARTURE
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StationMap
                    stations={onlineStations.filter(s => s.isOnline)}
                    destinations={[]}
                    selectedDeparture={selectedDeparture}
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
            <Card className="backdrop-blur-sm bg-gradient-to-br from-gray-900/90 to-black/90 border border-purple-500/30 shadow-xl shadow-purple-500/10">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl text-white flex items-center gap-3 font-mono">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-600/20 flex items-center justify-center border border-purple-500/30">
                    <Route className="w-6 h-6 text-purple-400" />
                  </div>
                  {t('availableDestinationsFrom')}
                </CardTitle>
                <CardDescription className="text-gray-400 text-lg font-mono">
                  {t('departure')} <span className="text-purple-400 font-semibold font-mono">{selectedDeparture.name || selectedDeparture.stationName}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingDestinations ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <Loader className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
                      <span className="text-gray-400 text-lg font-mono">{t('loadingStations')}</span>
                    </div>
                  </div>
                ) : !availableDestinations || availableDestinations.length === 0 ? (
                  <div className="text-center py-16">
                    <AlertCircle className="w-16 h-16 text-purple-400 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold text-white mb-3 font-mono">{t('noStationsFound')}</h3>
                    <p className="text-gray-400 text-lg font-mono">NO_VEHICLES_QUEUED_FROM_STATION</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(availableDestinations || []).filter(destination => destination && destination.destinationId && destination.destinationName).map((destination) => (
                      <Card
                        key={destination.destinationId}
                        className="cursor-pointer hover:bg-gradient-to-br hover:from-gray-800/90 hover:to-gray-900/90 hover:border-purple-400/50 transition-all duration-300 border border-purple-500/30 bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-sm group shadow-lg shadow-purple-500/10"
                        onClick={() => handleDestinationSelect(destination)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-600/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-purple-500/30">
                                <MapPin className="w-8 h-8 text-purple-400" />
                              </div>
                              <div>
                                <h3 className="font-bold text-white text-lg mb-2 font-mono">{destination.destinationName || 'Unknown Destination'}</h3>
                                <p className="text-gray-400 mb-3 font-mono">
                                  {destination.governorate || 'Unknown'}, {destination.delegation || 'Unknown'}
                                </p>
                                <div className="flex items-center gap-6">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Car className="w-4 h-4 text-purple-400" />
                                    <span className="text-purple-400 font-medium font-mono">{destination.totalVehicles} VEHICLES</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Users className="w-4 h-4 text-emerald-400" />
                                    <span className="text-emerald-400 font-medium font-mono">{destination.availableSeats} {t('seats')}</span>
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
                              <div className="text-white/60">{t('pricePerSeat')}</div>
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
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Navigation className="w-6 h-6 text-purple-400" />
                    </div>
                    {t('interactiveMap')}
                  </CardTitle>
                  <CardDescription className="text-white/60 text-lg">
                    Click on destination markers to select your final destination
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
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
                {t('selectSeats')}
              </CardTitle>
              <CardDescription className="text-white/60 text-lg">
                Route: <span className="text-blue-400 font-semibold">{selectedDeparture?.name || selectedDeparture?.stationName}</span> → <span className="text-purple-400 font-semibold">{selectedDestination.destinationName}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {loadingRouteDetails ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <Loader className="w-8 h-8 animate-spin text-green-400 mx-auto mb-4" />
                    <span className="text-white/60 text-lg">Loading route details...</span>
                  </div>
                </div>
              ) : routeDetails ? (
                <>
                  {/* Route Summary */}
                  <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 text-center">
                        <div>
                          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                            <Car className="w-6 h-6 text-blue-400" />
                          </div>
                          <div className="text-white/60 mb-1">Vehicles</div>
                          <div className="text-2xl font-bold text-white">{routeDetails.totalVehicles}</div>
                        </div>
                        <div>
                          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                            <Users className="w-6 h-6 text-green-400" />
                          </div>
                          <div className="text-white/60 mb-1">Available Seats</div>
                          <div className="text-2xl font-bold text-green-400">{routeDetails.availableSeats || 0}</div>
                        </div>
                       
                        <div>
                          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                            <CreditCard className="w-6 h-6 text-blue-400" />
                          </div>
                          <div className="text-white/60 mb-1">Price per Seat</div>
                          <div className="text-2xl font-bold text-blue-400">{routeDetails.basePrice || 0} TND</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI ETD Display */}
                  {routeDetails.etaPrediction && (
                    <ETDDisplay
                      etaPrediction={routeDetails.etaPrediction}
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
                            <Users className="w-6 h-6 text-blue-400" />
                            {t('selectSeats')}
                          </h3>

                          {/* Single Seat Selection */}
                          {routeDetails.availableSeats === 1 ? (
                            <div className="space-y-4">
                              <div className="inline-flex items-center gap-3 bg-green-500/20 border border-green-500/30 rounded-full px-6 py-3">
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                                <span className="text-green-400 font-semibold">1 seat available</span>
                              </div>
                              <p className="text-white/60 text-lg">
                                This vehicle has only 1 seat remaining
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
                                  className=" w-14 h-14 rounded-full border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95"
                                >
                                  <Minus className="w-6 h-6 text-orange-400" />
                                </Button>

                                <div className="bg-gradient-to-r from-orange-500/20 to-red-600/20 border border-orange-500/30 rounded-2xl px-8 py-4 min-w-[120px]">
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
                                  <Plus className="w-6 h-6 text-orange-400" />
                                </Button>
                              </div>

                             

                              <p className="text-white/60 text-lg">
                                <span className="text-green-400 font-semibold">{routeDetails.availableSeats || 6}</span> seats available
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Cost Display */}
                    <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 backdrop-blur-sm">
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
                      className="w-full h-14 text-xl font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-600/25 transition-all duration-200"
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
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
                {t('confirmBooking')}
              </CardTitle>
              <CardDescription className="text-white/60 text-lg">
                {t('reviewConfirmBooking')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Booking Summary */}
              <div className="space-y-4">
                <div className="flex justify-between items-center p-5 bg-white/5 rounded-xl border border-white/20">
                  <span className="text-white/60 text-lg">{t('departure')}:</span>
                  <span className="text-blue-400 font-semibold text-lg">{selectedDeparture.name || selectedDeparture.stationName}</span>
                </div>
                <div className="flex justify-between items-center p-5 bg-white/5 rounded-xl border border-white/20">
                  <span className="text-white/60 text-lg">{t('destination')}:</span>
                  <span className="text-purple-400 font-semibold text-lg">{selectedDestination.destinationName}</span>
                </div>
                <div className="flex justify-between items-center p-5 bg-white/5 rounded-xl border border-white/20">
                  <span className="text-white/60 text-lg">{t('numberOfSeats')}:</span>
                  <span className="text-green-400 font-semibold text-lg">{selectedSeats}</span>
                </div>
                <div className="flex justify-between items-center p-5 bg-white/5 rounded-xl border border-white/20">
                  <span className="text-white/60 text-lg">{t('pricePerSeat')}:</span>
                  <span className="text-blue-400 font-semibold text-lg">{routeDetails.basePrice} TND</span>
                </div>
                {/* AI ETD in Confirmation */}
                {routeDetails.etaPrediction && (
                  <div className="p-5 bg-white/5 rounded-xl border border-white/20">
                    <span className="text-white/60 text-lg block mb-3">AI-Powered ETD:</span>
                    <ETDDisplay
                      etaPrediction={routeDetails.etaPrediction}
                      compact={true}
                    />
                  </div>
                )}
                <div className="flex justify-between items-center p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl border border-green-500/30">
                  <span className="text-xl font-semibold text-white">{t('totalPrice')}:</span>
                  <span className="text-3xl font-bold text-green-400">{selectedSeats * routeDetails.basePrice} TND</span>
                </div>
              </div>

              {/* Route Map */}
              <Card className="backdrop-blur-sm bg-white/5 border border-white/10">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl text-white flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Navigation className="w-6 h-6 text-blue-400" />
                    </div>
                    Your Journey Route
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
                    onClick={createBooking}
                    disabled={isCreatingBooking}
                    className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-600/25 transition-all duration-200 disabled:from-gray-600 disabled:to-gray-700"
                  >
                    {isCreatingBooking ? (
                      <>
                        <Loader className="w-6 h-6 mr-3 animate-spin" />
                        {t('processingBooking')}
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-6 h-6 mr-3" />
                        {t('confirm')} {t('bookTrip')} & Pay {selectedSeats * routeDetails.basePrice} TND
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => {/* Redirect to login */}}
                    className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-600/25 transition-all duration-200"
                  >
                    <User className="w-6 h-6 mr-3" />
                    Login to Complete Booking
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