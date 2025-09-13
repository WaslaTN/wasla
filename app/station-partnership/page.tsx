'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, CheckCircle, ArrowRight, Search, MapPin, Hexagon, Cpu, Terminal, Network } from 'lucide-react'
import RequestStatusChecker from '@/components/station-partnership/RequestStatusChecker'
import { useRouter } from 'next/navigation'
import { WaslaLogo } from '@/components/WaslaLogo'
import { useLanguage } from '@/lib/hooks/useLanguage'

export default function StationPartnershipPage() {
  const router = useRouter()
  const { t } = useLanguage()

  const handleApplyClick = () => {
    router.push('/station-partnership/request-creation')
  }

  const handleLoginClick = () => {
    router.push('/station-partnership/login')
  }

  return (
    <div className="min-h-screen relative bg-black">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-black/80 to-red-950/20" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `
            linear-gradient(rgba(249, 115, 22, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(239, 68, 68, 0.1) 1px, transparent 1px)
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
                </div>
              </div>
              <button
                onClick={() => router.push('/')}
                className="text-white hover:text-orange-400 transition-colors font-medium font-mono"
              >
                {t('backToHome')}
              </button>
            </div>
          </div>
        </nav>

        {/* Header Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 mb-8">
              <Cpu className="w-4 h-4 text-orange-400" />
              <span className="text-orange-300 font-medium text-sm font-mono">{t('stationPartnershipProgram')}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 font-mono">
              {t('joinTransportationNetwork')}
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed font-mono">
              {t('becomePartOfNetwork')}
            </p>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12 font-mono">
              {t('whyPartnerWithUs')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-900/50 backdrop-blur-sm border border-orange-500/30 rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-200 hover:shadow-2xl hover:shadow-orange-500/20">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg flex items-center justify-center mb-4 border border-orange-500/30">
                  <Users className="h-6 w-6 text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 font-mono">{t('reachMoreCustomers')}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {t('connectWithThousands')}
                </p>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-200 hover:shadow-2xl hover:shadow-purple-500/20">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center mb-4 border border-purple-500/30">
                  <Terminal className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 font-mono">{t('digitalIntegration')}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {t('modernizeStation')}
                </p>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-200 hover:shadow-2xl hover:shadow-emerald-500/20">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center mb-4 border border-emerald-500/30">
                  <CheckCircle className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 font-mono">{t('qualityAssurance')}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {t('maintainHighStandards')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Partnership Requirements Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-8 hover:shadow-2xl hover:shadow-cyan-500/20">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 font-mono">
                {t('partnershipRequirements')}
              </h2>
              <p className="text-gray-400 mb-8 font-mono">
                {t('ensureYouMeetRequirements')}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-white font-medium font-mono">{t('validBusinessLicense')}</h4>
                      <p className="text-gray-400 text-sm">
                        {t('mustHaveValidRegistration')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-white font-medium font-mono">{t('physicalLocation')}</h4>
                      <p className="text-gray-400 text-sm">
                        {t('stationMustHaveFixedLocation')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-white font-medium font-mono">{t('qualityStandards')}</h4>
                      <p className="text-sm">
                        {t('commitmentToMaintainStandards')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-white font-medium font-mono">{t('safetyCompliance')}</h4>
                      <p className="text-gray-400 text-sm">
                        {t('meetSafetyRegulations')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-white font-medium font-mono">{t('technologyIntegration')}</h4>
                      <p className="text-gray-400 text-sm">
                        {t('willingnessToIntegrate')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-white font-medium font-mono">CUSTOMER_SERVICE</h4>
                      <p className="text-gray-400 text-sm">
                        COMMITMENT_TO_PROVIDING_EXCELLENT_CUSTOMER_SERVICE
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Status Check Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900/30">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-8 hover:shadow-2xl hover:shadow-purple-500/20">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 font-mono">
                {t('checkApplicationStatus')}
              </h2>
              <p className="text-gray-400 mb-8 font-mono">
                {t('enterRequestNumber')}
              </p>
              <RequestStatusChecker />
            </div>
          </div>
        </section>

        {/* Action Buttons Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 font-mono">
              {t('readyToGetStarted')}
            </h2>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleApplyClick}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-200 border border-orange-500/30 shadow-2xl shadow-orange-500/20"
              >
                <Terminal className="mr-2 h-5 w-5" />
                {t('applyForPartnership')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <Button
                onClick={handleLoginClick}
                variant="outline"
                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-200 font-mono"
              >
                <Users className="mr-2 h-5 w-5 text-orange-400 hover:text-orange-300" />
                {t('loginToPartnerPortal')}
              </Button>
            </div>

            <p className="text-gray-400 text-sm mt-6 font-mono">
              {t('alreadyInProgram')}
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900/50 border-t border-orange-500/30">
          <div className="max-w-6xl mx-auto text-center">
            <h3 className="text-xl font-semibold text-white mb-4 font-mono">
              {t('questionsAboutPartnership')}
            </h3>
            <p className="text-gray-400 mb-6 font-mono">
              {t('partnershipTeamHere')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm text-gray-400 font-mono">
              <div className="flex items-center justify-center gap-2">
                <span>📞</span>
                <span>{t('callUs')}: +216 XX XXX XXX</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span>💬</span>
                <span>{t('whatsApp')}: +216 XX XXX XXX</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span>📧</span>
                <span>{t('email')}: {t('partnershipsEmail')}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
