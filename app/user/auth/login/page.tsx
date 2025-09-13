"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, LogIn, Phone, Lock, Hexagon, Cpu, Terminal, Network } from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/lib/hooks/useUserAuth";
import { useLanguage } from "@/lib/hooks/useLanguage";

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useUserAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log('🔐 Attempting login with:', { phoneNumber, password: '***' });
      
      const result = await login(phoneNumber, password);

      if (result.success) {
        console.log('✅ Login successful, redirecting to dashboard');
        
        // Force a full page reload to ensure middleware picks up the cookie
        setTimeout(() => {
          window.location.href = '/user/dashboard';
        }, 100);
      } else {
        console.error('❌ Login failed:', result.error);
        setError(result.error || t('unexpectedError'));
      }
    } catch (error) {
      console.error('❌ Unexpected error during login:', error);
      setError(t('unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-black">
      {/* Particle Background */}
      <div className="fixed inset-0 z-0">
        <ParticleBackground 
          particleColor="rgba(249, 115, 22, 0.6)"
          connectionColor="rgba(239, 68, 68, 0.2)"
        />
      </div>

      {/* Background Gradient */}
      <div className="fixed inset-0 z-1 bg-gradient-to-br from-orange-900/30 via-black/80 to-red-900/30" />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-3 sm:p-6">
        <Card className="w-full max-w-md backdrop-blur-xl bg-gray-900/50 border border-orange-500/30 shadow-2xl hover:shadow-2xl hover:shadow-orange-500/20">
          <CardHeader className="text-center p-4 sm:p-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Terminal className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" />
            </div>
            
            <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent font-mono">
              {t('welcomeBack')}
            </CardTitle>
            <CardDescription className="text-gray-400 text-base sm:text-lg font-mono">
              {t('signInToAccount')}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {error && (
                <div className="p-3 sm:p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300 font-mono">
                  {t('phoneNumber')}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-400" />
                  <Input
                    type="tel"
                    placeholder={t('enterPhoneNumber')}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-11 sm:h-12 pl-12 text-base sm:text-lg bg-black/20 border-orange-500/30 focus:border-orange-500 focus:ring-orange-500/50 text-white placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300 font-mono">
                  {t('password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={t('enterPassword')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 sm:h-12 pl-12 pr-12 text-base sm:text-lg bg-black/20 border-orange-500/30 focus:border-orange-500 focus:ring-orange-500/50 text-white placeholder-gray-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-11 sm:h-12 text-base sm:text-lg font-semibold rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 transform hover:scale-105 transition-all duration-300 shadow-xl border border-orange-500/30 shadow-2xl shadow-orange-500/20"
              >
                {isLoading ? (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    {t('signIn')}
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-4 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-orange-500/30" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-900 px-4 text-gray-400 font-mono">{t('dontHaveAccount')}</span>
              </div>
            </div>

            {/* Register Link */}
            <Link href="/user/auth/register">
              <Button
                variant="outline"
                className="w-full h-11 sm:h-12 text-base sm:text-lg font-semibold rounded-xl border-2 border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 transition-all duration-300 font-mono"
              >
                {t('createNewAccount')}
              </Button>
            </Link>

            {/* Footer */}
            <div className="text-center mt-4 sm:mt-6">
              <Link href="/auth/forgot-password" className="text-orange-400 hover:text-orange-300 transition-colors text-sm font-mono">
                {t('forgotPassword')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 