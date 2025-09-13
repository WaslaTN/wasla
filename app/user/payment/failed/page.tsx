"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { XCircle, ArrowLeft, CreditCard, AlertTriangle, RefreshCw, Phone, Mail, HelpCircle, Hexagon, Cpu, Terminal, Network } from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import { apiClient } from "@/lib/api";

import dynamic from "next/dynamic";

const StationMap = dynamic(() => import("@/components/map/StationMap"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-black/20 rounded-lg flex items-center justify-center">
      <div className="text-gray-400">Loading map...</div>
    </div>
  )
});

interface FailedBookingDetails {
  paymentRef: string;
  error?: string;
  timestamp: string;
}

function PaymentFailedContent() {
  const [failedDetails, setFailedDetails] = useState<FailedBookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const paymentRef = searchParams.get('payment_ref');
    const error = searchParams.get('error');
    
    console.log('❌ Payment failed page loaded:', { paymentRef, error });

    if (paymentRef) {
      setFailedDetails({
        paymentRef,
        error: error || 'Payment processing failed',
        timestamp: new Date().toISOString()
      });
    }
    
    setLoading(false);
  }, [searchParams]);

  const handleTryAgain = () => {
    router.push('/user/book-trip');
  };

  const handleBackToDashboard = () => {
    router.push('/user/dashboard');
  };

  const handleContactSupport = () => {
    // You can implement support contact functionality here
    console.log('Contact support clicked');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="w-full max-w-md backdrop-blur-sm bg-gray-900/30 border border-orange-500/30 shadow-2xl shadow-orange-500/20">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
            <p className="text-white font-mono">PROCESSING_PAYMENT_STATUS...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 font-mono">
            PAYMENT_FAILED
          </h1>
          <p className="text-gray-400 text-lg font-mono">
            PAYMENT_PROCESSING_FAILED
          </p>
        </div>

        {/* Main Error Card */}
        <Card className="mb-6 backdrop-blur-sm bg-gray-900/30 border border-red-500/30 shadow-2xl shadow-red-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-300 flex items-center gap-2 font-mono">
                  <Terminal className="w-6 h-6 text-red-400" />
                  PAYMENT_PROCESSING_FAILED
                </CardTitle>
                <CardDescription className="text-gray-400 font-mono">
                  {failedDetails?.paymentRef && (
                    <>PAYMENT_REFERENCE: <span className="font-mono text-white">{failedDetails.paymentRef}</span></>
                  )}
                </CardDescription>
              </div>
              <Badge className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30 text-red-400 text-sm px-3 py-1 font-mono">
                FAILED
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Error Details */}
              <div className="p-4 bg-black/50 rounded-lg border border-red-500/30">
                <h3 className="text-white font-medium mb-2 flex items-center gap-2 font-mono">
                  <XCircle className="w-4 h-4 text-red-400" />
                  ERROR_DETAILS
                </h3>
                <p className="text-gray-300">
                  {failedDetails?.error || 'UNEXPECTED_ERROR_DURING_PAYMENT_PROCESSING'}
                </p>
                {failedDetails?.timestamp && (
                  <p className="text-gray-500 text-sm mt-2 font-mono">
                    FAILED_AT: {formatDate(failedDetails.timestamp)}
                  </p>
                )}
              </div>

              {/* Common Reasons */}
              <div className="p-4 bg-black/50 rounded-lg border border-orange-500/30">
                <h3 className="text-white font-medium mb-3 flex items-center gap-2 font-mono">
                  <Cpu className="w-4 h-4 text-orange-400" />
                  COMMON_REASONS_FOR_PAYMENT_FAILURE
                </h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-1">•</span>
                    INSUFFICIENT_FUNDS_IN_ACCOUNT
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-1">•</span>
                    CARD_DECLINED_BY_BANK
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-1">•</span>
                    INCORRECT_PAYMENT_INFORMATION
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-1">•</span>
                    NETWORK_CONNECTION_ISSUES
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-1">•</span>
                    PAYMENT_GATEWAY_UNAVAILABLE
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps Card */}
        <Card className="mb-6 backdrop-blur-sm bg-gray-900/30 border border-purple-500/30 shadow-2xl shadow-purple-500/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2 font-mono">
              <Network className="w-5 h-5 text-purple-400" />
              NEXT_ACTION_STEPS
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/30 to-emerald-500/30 flex items-center justify-center text-white text-sm font-bold mt-1 border border-purple-500/30">
                  1
                </div>
                <div>
                  <h4 className="text-white font-medium font-mono">CHECK_PAYMENT_METHOD</h4>
                  <p className="text-gray-400 text-sm">
                    VERIFY_CARD_FUNDS_AND_EXPIRY
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/30 to-emerald-500/30 flex items-center justify-center text-white text-sm font-bold mt-1 border border-purple-500/30">
                  2
                </div>
                <div>
                  <h4 className="text-white font-medium font-mono">TRY_DIFFERENT_PAYMENT_METHOD</h4>
                  <p className="text-gray-400 text-sm">
                    USE_ALTERNATIVE_CARD_OR_PAYMENT_OPTION
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/30 to-emerald-500/30 flex items-center justify-center text-white text-sm font-bold mt-1 border border-purple-500/30">
                  3
                </div>
                <div>
                  <h4 className="text-white font-medium font-mono">CONTACT_YOUR_BANK</h4>
                  <p className="text-gray-400 text-sm">
                    BANK_MAY_HAVE_BLOCKED_TRANSACTION
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/30 to-emerald-500/30 flex items-center justify-center text-white text-sm font-bold mt-1 border border-purple-500/30">
                  4
                </div>
                <div>
                  <h4 className="text-white font-medium font-mono">TRY_AGAIN_LATER</h4>
                  <p className="text-gray-400 text-sm">
                    WAIT_AND_ATTEMPT_BOOKING_AGAIN
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Contact Card */}
        <Card className="mb-6 backdrop-blur-sm bg-gray-900/30 border border-emerald-500/30 shadow-2xl shadow-emerald-500/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2 font-mono">
              <Phone className="w-5 h-5 text-emerald-400" />
              NEED_HELP?
            </h3>
            <p className="text-gray-400 mb-4 font-mono">
              CUSTOMER_SUPPORT_TEAM_AVAILABLE
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-black/50 rounded-lg border border-emerald-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span className="text-gray-400 text-sm font-mono">PHONE_SUPPORT</span>
                </div>
                <p className="text-white font-mono">+216 XX XXX XXX</p>
                <p className="text-gray-500 text-xs font-mono">AVAILABLE_24_7</p>
              </div>

              <div className="p-3 bg-black/50 rounded-lg border border-emerald-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-400 text-sm font-mono">EMAIL_SUPPORT</span>
                </div>
                <p className="text-white">support@tunimove.tn</p>
                <p className="text-gray-500 text-xs font-mono">RESPONSE_WITHIN_2_HOURS</p>
              </div>
            </div>

            {failedDetails?.paymentRef && (
              <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <p className="text-orange-400 text-sm font-mono">
                  <strong>WHEN_CONTACTING_SUPPORT_PROVIDE_REFERENCE:</strong>
                </p>
                <p className="text-white font-mono text-sm mt-1">{failedDetails.paymentRef}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleTryAgain}
              className="flex-1 h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 border border-orange-500/30 text-white shadow-2xl shadow-orange-500/20"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              TRY_BOOKING_AGAIN
            </Button>

            <Button
              onClick={handleContactSupport}
              variant="outline"
              className="flex-1 h-12 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 font-mono"
            >
              <Phone className="mr-2 h-4 w-4" />
              CONTACT_SUPPORT
            </Button>
          </div>

          <Button
            onClick={handleBackToDashboard}
            variant="outline"
            className="w-full h-12 border-purple-500/30 text-purple-300 hover:bg-purple-500/10 font-mono"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            BACK_TO_DASHBOARD
          </Button>
        </div>

        {/* Security Notice */}
        <div className="mt-8 p-4 bg-black/50 rounded-lg border border-gray-600/30">
          <p className="text-gray-400 text-xs text-center font-mono">
            🔒 PAYMENT_INFORMATION_SECURE_NOT_STORED_NO_CHARGES_MADE
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="w-full max-w-md backdrop-blur-sm bg-gray-900/30 border border-orange-500/30 shadow-2xl shadow-orange-500/20">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
            <p className="text-white font-mono">LOADING_PAYMENT_STATUS...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentFailedContent />
    </Suspense>
  );
}
