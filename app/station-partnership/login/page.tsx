'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, ArrowLeft, Users, AlertCircle, Shield, Phone, Lock, Hexagon, Cpu, Terminal, Network } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { WaslaLogo } from '@/components/WaslaLogo'
import { useLanguage } from '@/lib/hooks/useLanguage'

type LoginStep = 'cin' | 'sms' | 'success'
type UserRole = 'admin' | 'supervisor' | 'worker' | null

export default function PartnerLoginPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [step, setStep] = useState<LoginStep>('cin')
  const [cinDigits, setCinDigits] = useState<string[]>(new Array(8).fill(''))
  const [smsCode, setSmsCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isAdminPortal, setIsAdminPortal] = useState(false)
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  
  // Refs for CIN input boxes
  const cinInputRefs = useRef<(HTMLInputElement | null)[]>(new Array(8).fill(null))

  // Check if JWT token is valid and not expired
  const isTokenValid = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Date.now() / 1000
      return payload.exp > currentTime
    } catch {
      return false
    }
  }

  // Check for existing login and redirect
  useEffect(() => {
    const checkExistingLogin = () => {
      const authToken = localStorage.getItem('authToken')
      const userProfile = localStorage.getItem('userProfile')
      
      if (authToken && userProfile) {
        try {
          // Validate token is not expired
          if (!isTokenValid(authToken)) {
            localStorage.removeItem('authToken')
            localStorage.removeItem('userProfile')
            return
          }

          const profile = JSON.parse(userProfile)
          const role = profile.role
          
          console.log('Auto-redirecting user with role:', role)
          
          // Redirect based on role
          if (role === 'ADMIN') {
            router.push('/admin/dashboard')
          } else if (role === 'SUPERVISOR') {
            router.push('/supervisor/dashboard')
          } else if (role === 'WORKER') {
            router.push('/worker/dashboard')
          } else {
            router.push('/dashboard')
          }
        } catch (error) {
          // Invalid stored data, clear it
          console.error('Invalid stored authentication data:', error)
          localStorage.removeItem('authToken')
          localStorage.removeItem('userProfile')
        }
      }
    }

    checkExistingLogin()
  }, [router])

  // Handle CIN digit input
  const handleCinDigitChange = (index: number, value: string) => {
    // Special handling for USSR admin portal trigger
    if (!isAdminPortal && value.toUpperCase() === 'U' && index === 0) {
      // Allow 'U' for USSR trigger
      const newCinDigits = [...cinDigits]
      newCinDigits[index] = 'U'
      setCinDigits(newCinDigits)
      if (index < 7) {
        cinInputRefs.current[index + 1]?.focus()
      }
      return
    }
    
    if (!isAdminPortal && value.toUpperCase() === 'S' && (index === 1 || index === 2) && cinDigits[0] === 'U') {
      // Allow 'S' for USSR trigger
      const newCinDigits = [...cinDigits]
      newCinDigits[index] = 'S'
      setCinDigits(newCinDigits)
      if (index < 7) {
        cinInputRefs.current[index + 1]?.focus()
      }
      return
    }
    
    if (!isAdminPortal && value.toUpperCase() === 'R' && index === 3 && cinDigits.slice(0, 3).join('') === 'USS') {
      // Complete USSR trigger - activate admin mode
      setIsAdminPortal(true)
      // Clear all inputs for fresh admin entry
      const emptyCin = new Array(8).fill('')
      setCinDigits(emptyCin)
      // Focus on the first input
      setTimeout(() => cinInputRefs.current[0]?.focus(), 100)
      return
    }
    
    // Always allow only digits for actual CIN entry
    const cleanValue = value.replace(/[^0-9]/g, '')
    
    if (cleanValue.length <= 1) {
      const newCinDigits = [...cinDigits]
      newCinDigits[index] = cleanValue
      setCinDigits(newCinDigits)

      // Auto-focus next input if digit entered
      if (cleanValue && index < 7) {
        cinInputRefs.current[index + 1]?.focus()
      }
    }
  }

  // Handle backspace
  const handleCinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !cinDigits[index] && index > 0) {
      cinInputRefs.current[index - 1]?.focus()
    }
  }

  // Start login process with CIN
  const handleCinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const fullCin = cinDigits.join('')
    
    // Validate CIN
    if (fullCin.length !== 8) {
      setError(t('pleaseEnterAll8Digits'))
      setLoading(false)
      return
    }

    try {
      // Call auth API to start login
      const response = await fetch('http://localhost:5000/api/v1/auth/login/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cin: fullCin
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // SMS sent successfully
        setPhoneNumber(data.phoneNumber || 'your registered phone')
        setStep('sms')
      } else {
        setError(data.message || t('cinNotFoundOrInvalid'))
      }
    } catch (err) {
      setError(t('networkErrorCheckConnection'))
    } finally {
      setLoading(false)
    }
  }

  // Verify SMS code
  const handleSmsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const fullCin = cinDigits.join('')

    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/login/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cin: fullCin,
          verificationCode: smsCode
        }),
      })

      const data = await response.json()
      console.log('Login verification response:', data)

      if (response.ok && data.success) {
        // Login successful
        const { token, staff } = data.data
        
        // Store auth token
        localStorage.setItem('authToken', token)
        localStorage.setItem('userProfile', JSON.stringify(staff))
        
        setUserRole(staff.role)
        setStep('success')

        // Redirect based on role
        setTimeout(() => {
          if (staff.role === 'ADMIN') {
            router.push('/admin/dashboard')
          } else if (staff.role === 'SUPERVISOR') {
            router.push('/supervisor/dashboard')
          } else if (staff.role === 'WORKER') {
            router.push('/worker/dashboard')
          } else {
            router.push('/dashboard')
          }
        }, 2000)
      } else {
        setError(data.message || t('invalidSmsCode'))
      }
    } catch (err) {
      console.error('Login verification error:', err)
      setError(t('networkErrorCheckConnection'))
    } finally {
      setLoading(false)
    }
  }

  const handleBackClick = () => {
    if (step === 'sms') {
      setStep('cin')
      setError('')
    } else {
      router.push('/station-partnership')
    }
  }

  // Render CIN input step
  const renderCinStep = () => (
    <div className="text-center mb-8">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
        isAdminPortal ? 'bg-red-600/20' : 'bg-blue-600/20'
      }`}>
        {isAdminPortal ? (
          <Shield className="h-8 w-8 text-red-400" />
        ) : (
          <Users className="h-8 w-8 text-blue-400" />
        )}
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
        {isAdminPortal ? t('adminPortal') : t('partnerLogin')}
      </h1>
      <p className="text-gray-400 mb-8">
        {isAdminPortal
          ? t('enterAdminCredentials')
          : t('enter8DigitCin')
        }
      </p>

      <form onSubmit={handleCinSubmit} className="space-y-6">
        <div>
          <Label className="text-white font-medium mb-4 block">
            {t('cinNumber')} {isAdminPortal && <span className="text-red-400">{t('adminMode')}</span>}
          </Label>
          
          {/* 8-box CIN input */}
          <div className="flex justify-center gap-2 mb-4">
            {cinDigits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  if (el) {
                    cinInputRefs.current[index] = el;
                  }
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCinDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleCinKeyDown(index, e)}
                className={`w-12 h-12 text-center text-xl font-bold rounded-lg border focus:outline-none focus:ring-2 transition-all ${
                  isAdminPortal
                    ? 'bg-red-600/20 border-red-500/30 text-red-400 focus:border-red-500 focus:ring-red-500/50'
                    : 'bg-black/20 border-orange-500/30 text-white focus:border-orange-500 focus:ring-orange-500/50'
                }`}
                placeholder=""
              />
            ))}
          </div>
          
        </div>

        {error && (
          <div className="bg-red-600/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading || cinDigits.join('').length !== 8}
          className={`w-full py-3 text-lg font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 ${
            isAdminPortal
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white border border-orange-500/30 shadow-2xl shadow-orange-500/20'
          }`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {t('sendingSms')}
            </>
          ) : (
            <>
              <Phone className="mr-2 h-5 w-5" />
              {isAdminPortal ? t('sendAdminSms') : t('sendSmsCode')}
            </>
          )}
        </Button>
      </form>
    </div>
  )

  // Render SMS verification step
  const renderSmsStep = () => (
    <div className="text-center mb-8">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
        isAdminPortal ? 'bg-red-600/20' : 'bg-green-600/20'
      }`}>
        <Phone className={`h-8 w-8 ${isAdminPortal ? 'text-red-400' : 'text-green-400'}`} />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
        {t('verifySmsCode')}
      </h1>
      <p className="text-gray-400 mb-2">
        {t('weSent6DigitCode')} {phoneNumber}
      </p>
      <p className="text-xs text-gray-500 mb-8">
        {t('enterCodeToComplete')}
      </p>

      <form onSubmit={handleSmsSubmit} className="space-y-6">
        <div>
          <Label htmlFor="smsCode" className="text-white font-medium">
            {t('smsVerificationCode')}
          </Label>
          <Input
            id="smsCode"
            type="text"
            maxLength={6}
            placeholder={t('enter6DigitCode')}
            value={smsCode}
            onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
            className="mt-2 bg-black/20 border-orange-500/30 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/50 text-center text-2xl font-mono tracking-widest"
            required
          />
        </div>

        {error && (
          <div className="bg-red-600/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading || smsCode.length !== 6}
          className={`w-full py-3 text-lg font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 ${
            isAdminPortal
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white border border-orange-500/30 shadow-2xl shadow-orange-500/20'
          }`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {t('verifying')}
            </>
          ) : (
            <>
              <Lock className="mr-2 h-5 w-5" />
              {t('verifyAndLogin')}
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => handleCinSubmit(new Event('submit') as any)}
          disabled={loading}
          className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 font-mono"
        >
          {t('resendSmsCode')}
        </Button>
      </form>
    </div>
  )

  // Render success step
  const renderSuccessStep = () => (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <Users className="h-8 w-8 text-green-400" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
        {t('welcomeBack')}
      </h1>
      <p className="text-gray-400 mb-6">
        {t('loginSuccessful')} {userRole} dashboard...
      </p>
      <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen relative bg-black">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className={`absolute inset-0 ${
          isAdminPortal 
            ? 'bg-gradient-to-br from-red-900/20 via-black/80 to-red-950/20'
            : 'bg-gradient-to-br from-orange-900/20 via-black/80 to-red-950/20'
        }`} />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `
            linear-gradient(${isAdminPortal ? 'rgba(239, 68, 68, 0.1)' : 'rgba(249, 115, 22, 0.1)'} 1px, transparent 1px),
            linear-gradient(90deg, ${isAdminPortal ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)'} 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }} />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="bg-black/80 backdrop-blur-md border-b border-orange-500/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <WaslaLogo size={32} variant="simple" />
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white font-mono">Wasla</h1>
                  <span className="text-xl font-bold text-orange-400 font-arabic">وصلة</span>
                  {isAdminPortal && <span className="text-red-400 font-mono">ADMIN</span>}
                </div>
              </div>
              <button
                onClick={handleBackClick}
                className="text-white hover:text-orange-400 transition-colors font-medium flex items-center gap-2 font-mono"
              >
                <ArrowLeft className="h-4 w-4" />
                {step === 'sms' ? t('backToCin') : t('backToPartnership')}
              </button>
            </div>
          </div>
        </nav>

        {/* Login Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-orange-500/30 rounded-xl p-8 hover:shadow-2xl hover:shadow-orange-500/20">
              {step === 'cin' && renderCinStep()}
              {step === 'sms' && renderSmsStep()}
              {step === 'success' && renderSuccessStep()}

              {step === 'cin' && (
                <>
                  <div className="mt-8 text-center">
                    <div className="bg-orange-600/10 border border-orange-500/30 rounded-lg p-4">
                      <h3 className="text-orange-400 font-semibold mb-2 font-mono">
                        {t('dontHaveCin')}
                      </h3>
                      <p className="text-gray-300 text-sm mb-4 font-mono">
                        {t('notYetInProgram')}
                      </p>
                      <Button
                        onClick={() => router.push('/station-partnership/request-creation')}
                        variant="outline"
                        className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 font-mono"
                      >
                        <Terminal className="mr-2 h-4 w-4" />
                        {t('applyForPartnership')}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-gray-400 text-sm font-mono">
                      {t('needHelpContact')}{' '}
                      <a href={`mailto:${t('partnershipsEmail')}`} className="text-orange-400 hover:text-orange-300">
                        {t('partnershipsEmail')}
                      </a>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}