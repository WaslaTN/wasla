"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, UserPlus, User, Phone, Lock, Hexagon, Cpu, Terminal, Network } from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/lib/hooks/useUserAuth";
import { useLanguage } from "@/lib/hooks/useLanguage";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { register } = useUserAuth();
  const { t } = useLanguage();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError(t('passwordMin6Chars'));
      setIsLoading(false);
      return;
    }

    if (!formData.phoneNumber.match(/^[0-9]{8}$/)) {
      setError(t('phoneMustBe8Digits'));
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔐 Attempting registration with:', { 
        ...formData, 
        password: '***', 
        confirmPassword: '***' 
      });
      
      const result = await register(
        formData.firstName,
        formData.lastName,
        formData.phoneNumber,
        formData.password
      );

      if (result.success) {
        console.log('✅ Registration successful, redirecting to dashboard');
        
        // Force a full page reload to ensure middleware picks up the cookie
        setTimeout(() => {
          window.location.href = '/user/dashboard';
        }, 100);
      } else {
        console.error('❌ Registration failed:', result.error);
        setError(result.error || t('unexpectedError'));
      }
    } catch (error) {
      console.error('❌ Unexpected error during registration:', error);
      setError(t('unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-black">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-black/80 to-cyan-950/20" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }} />
      </div>
      
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="backdrop-blur-xl bg-gray-900/50 border border-emerald-500/30 shadow-2xl hover:shadow-2xl hover:shadow-emerald-500/20">
            <CardHeader className="space-y-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Terminal className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-white font-mono">{t('createAccount')}</CardTitle>
                <CardDescription className="text-gray-400 mt-2 font-mono">
                  {t('joinWasla')}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 font-mono">{t('firstName')}</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-400" />
                      <Input
                        name="firstName"
                        type="text"
                        placeholder={t('enterFirstName')}
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="pl-10 h-12 bg-black/20 border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/50 text-white placeholder-gray-400"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 font-mono">{t('lastName')}</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-400" />
                      <Input
                        name="lastName"
                        type="text"
                        placeholder={t('enterLastName')}
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="pl-10 h-12 bg-black/20 border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/50 text-white placeholder-gray-400"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 font-mono">{t('phoneNumber')}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    <Input
                      name="phoneNumber"
                      type="tel"
                      placeholder="12345678"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="pl-10 h-12 bg-black/20 border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/50 text-white placeholder-gray-400"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-400 font-mono">{t('enter8DigitPhone')}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 font-mono">{t('password')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t('enterPassword')}
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10 pr-10 h-12 bg-black/20 border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/50 text-white placeholder-gray-400"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 font-mono">{t('confirmPassword')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    <Input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t('confirmPasswordPlaceholder')}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="pl-10 pr-10 h-12 bg-black/20 border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/50 text-white placeholder-gray-400"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-lg font-semibold rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 border border-emerald-500/30 shadow-2xl shadow-emerald-500/20"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('creatingAccount')}
                    </div>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" />
                      {t('createAccount')}
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center">
                <p className="text-gray-400 font-mono">
                  {t('alreadyHaveAccount')}{" "}
                  <Link href="/user/auth/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                    {t('signIn')}
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}