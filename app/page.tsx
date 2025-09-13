"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  MapPin,
  Users,
  Shield,
  Clock,
  ChevronDown,
  Globe,
  TrendingUp,
  LogIn,
  Download,
  BookOpen,
  Network,
  Menu,
  X,
  Bus,
  Route,
  Zap,
  Phone,
  Mail,
  MessageCircle,
  Hexagon,
  Cpu,
  Terminal,
} from "lucide-react"
import ParticleBackground from "@/components/ParticleBackground"
import { useLanguage } from "@/lib/hooks/useLanguage"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { RoutesTable } from "@/components/RoutesTable"
import { InteractiveMap } from "@/components/InteractiveMap"
import { useRouter } from "next/navigation"
import { WaslaLogo } from "@/components/WaslaLogo"

function LandingPageContent() {
  const { t } = useLanguage()
  const router = useRouter()
  const featuresRef = useRef<HTMLDivElement>(null)
  const routesRef = useRef<HTMLDivElement>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
    setIsMobileMenuOpen(false)
  }

  const handleDownloadApp = () => {
    alert("App download coming soon!")
  }

  const handleBookOnline = () => {
    router.push("/user/dashboard")
  }

  return (
    <div className="min-h-screen relative bg-black">
      {/* Enhanced Particle Background */}
      <div className="fixed inset-0 z-0">
        <ParticleBackground
          particleColor="rgba(249, 115, 22, 0.6)"
          connectionColor="rgba(239, 68, 68, 0.2)"
          particleCount={60}
        />
      </div>

      {/* Tunisian-inspired Background Patterns */}
      <div className="fixed inset-0 z-1 tunisian-pattern" />
      <div className="fixed inset-0 z-1 geometric-overlay opacity-30" />

      <div className="relative z-10">
        {/* Enhanced Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-orange-500/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo with Transport Icon */}
              <div className="flex items-center space-x-3">
                <WaslaLogo size={40} variant="simple" />
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white font-mono">Wasla</h1>
                  <span className="text-xl font-bold text-orange-400 font-arabic">وصلة</span>
                </div>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <button
                  onClick={() => scrollToSection(featuresRef)}
                  className="text-white hover:text-orange-400 transition-colors font-medium font-mono"
                >
                  {t("navFeatures")}
                </button>
                <button
                  onClick={() => scrollToSection(routesRef)}
                  className="text-white hover:text-orange-400 transition-colors font-medium font-mono"
                >
                  {t("navRoutes")}
                </button>
                <button
                  onClick={() => router.push("/station-partnership")}
                  className="text-white hover:text-orange-400 transition-colors font-medium font-mono"
                >
                  {t("navPartner")}
                </button>
                <div className="flex items-center space-x-3">
                  <Button
                    size="sm"
                    onClick={handleBookOnline}
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-2 font-medium transport-glow border border-orange-500/30 shadow-2xl shadow-orange-500/20"
                  >
                    <Terminal className="mr-2 h-4 w-4" />
                    {t("navBookTrip")}
                  </Button>
                  <LanguageSwitcher />
                </div>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden flex items-center space-x-3">
                <LanguageSwitcher />
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-white hover:text-orange-400 transition-colors"
                >
                  {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-orange-500/30">
                <div className="px-4 py-4 space-y-4">
                  <button
                    onClick={() => scrollToSection(featuresRef)}
                    className="block w-full text-left text-white hover:text-orange-400 transition-colors font-medium py-2 font-mono"
                  >
                    {t("navFeatures")}
                  </button>
                  <button
                    onClick={() => scrollToSection(routesRef)}
                    className="block w-full text-left text-white hover:text-orange-400 transition-colors font-medium py-2 font-mono"
                  >
                    {t("navRoutes")}
                  </button>
                  <button
                    onClick={() => router.push("/station-partnership")}
                    className="block w-full text-left text-white hover:text-orange-400 transition-colors font-medium py-2 font-mono"
                  >
                    {t("navPartner")}
                  </button>
                  <div className="pt-2 border-t border-orange-500/30">
                    <Button
                      onClick={handleBookOnline}
                      className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-2 font-medium border border-orange-500/30"
                    >
                      <Terminal className="mr-2 h-4 w-4" />
                      {t("navBookTrip")}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Enhanced Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center relative px-4 sm:px-6 lg:px-8 pt-16">
          <div className="text-center max-w-6xl mx-auto">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 mb-12 transport-glow animate-float-up">
              <Cpu className="w-5 h-5 text-orange-400" />
              <span className="text-orange-400 font-semibold font-mono">{t("heroBadge")}</span>
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-mono">
                PREMIUM
              </Badge>
            </div>

            {/* Main Wasla Logo with Enhanced Styling */}
            <div className="flex justify-center mb-16 animate-float-up animation-delay-100">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-black/50 backdrop-blur-sm rounded-2xl p-8 border border-orange-500/30">
                  <img
                    src="/wasla-main-logo-bg.png"
                    alt="Wasla - Tunisia Transportation Management System"
                    className="max-w-lg w-full h-auto object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-500"
                    style={{ maxHeight: '250px' }}
                  />
                </div>
              </div>
            </div>
            {/*
            <div className="mb-16 animate-float-up animation-delay-200">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight font-mono">
                <span className="text-white">Welcome to</span>
                <br />
                <span className="bg-gradient-to-r from-orange-400 via-red-500 to-purple-600 bg-clip-text text-transparent bg-size-200 animate-gradient">
                  Wasla
                </span>
              </h1>
              
              <div className="text-3xl sm:text-4xl font-bold text-orange-400 mb-4 font-arabic">
                وصلة
              </div>
              
              <div className="text-lg sm:text-xl text-orange-300 mb-6 font-arabic">
                وصلتك في كل بلاصة
              </div>
            </div>
              */}
            {/* Enhanced Subtitle */}
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 text-gray-300 animate-float-up animation-delay-400 font-mono">
              {t("heroSubtitle2")}
            </h2>

            {/* Compelling Description */}
            <p className="text-xl sm:text-2xl text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed animate-float-up animation-delay-600 font-mono">
              {t("heroDescription2")}
            </p>

            {/* Enhanced Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-float-up animation-delay-800">
              <Button
                size="lg"
                onClick={handleBookOnline}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-10 py-6 text-xl font-semibold rounded-xl shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 transform hover:scale-105 transport-glow border border-orange-500/30"
              >
                <Terminal className="mr-3 h-6 w-6" />
                {t("bookYourTrip")}
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>

            
            </div>

            {/* Enhanced Transport Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-16 max-w-4xl mx-auto">
              <div className="text-center animate-float-up animation-delay-200 group">
                <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl p-6 border border-orange-500/30 hover:border-orange-500/50 transition-all duration-300 group-hover:scale-105">
                  <div className="text-4xl font-bold text-orange-400 mb-2 font-mono group-hover:text-orange-300 transition-colors">100+</div>
                  <div className="text-gray-300 font-mono group-hover:text-white transition-colors">DESTINATIONS</div>
                  <div className="text-sm text-gray-500 mt-2 font-mono">Across Tunisia</div>
                </div>
              </div>
              <div className="text-center animate-float-up animation-delay-400 group">
                <div className="bg-gradient-to-br from-red-500/20 to-purple-500/20 rounded-2xl p-6 border border-red-500/30 hover:border-red-500/50 transition-all duration-300 group-hover:scale-105">
                  <div className="text-4xl font-bold text-red-400 mb-2 font-mono group-hover:text-red-300 transition-colors">24/7</div>
                  <div className="text-gray-300 font-mono group-hover:text-white transition-colors">SERVICE</div>
                  <div className="text-sm text-gray-500 mt-2 font-mono">Always Available</div>
                </div>
              </div>
              <div className="text-center animate-float-up animation-delay-600 group">
                <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl p-6 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 group-hover:scale-105">
                  <div className="text-4xl font-bold text-purple-400 mb-2 font-mono group-hover:text-purple-300 transition-colors">50K+</div>
                  <div className="text-gray-300 font-mono group-hover:text-white transition-colors">HAPPY_TRAVELERS</div>
                  <div className="text-sm text-gray-500 mt-2 font-mono">Trusted by Many</div>
                </div>
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="text-gray-400 text-sm flex items-center gap-2 justify-center animate-bounce font-mono">
              <span>{t("heroScrollText")}</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </section>

        {/* Enhanced Features Section */}
        <section ref={featuresRef} className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-900/30 relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5"></div>
          </div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 mb-8">
                <Zap className="w-5 h-5 text-orange-400" />
                <span className="text-orange-400 font-semibold font-mono">FEATURES</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 font-mono">{t("whyChooseService")}</h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto font-mono">{t("simpleSafeConvenient")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Enhanced Feature Cards */}
              <Card className="bg-gray-900/50 backdrop-blur-sm border-orange-500/30 hover:bg-gray-800/70 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20 group">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:from-orange-500/30 group-hover:to-red-500/30 transition-colors transport-glow border border-orange-500/30">
                    <Terminal className="h-8 w-8 text-orange-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4 font-mono">{t("easyOnlineBooking")}</h3>
                  <p className="text-gray-400 leading-relaxed">{t("easyOnlineBookingDesc")}</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 backdrop-blur-sm border-red-500/30 hover:bg-gray-800/70 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20 group">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:from-red-500/30 group-hover:to-purple-500/30 transition-colors border border-red-500/30">
                    <Shield className="h-8 w-8 text-red-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4 font-mono">{t("safeReliable")}</h3>
                  <p className="text-gray-400 leading-relaxed">{t("safeReliableDesc")}</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 backdrop-blur-sm border-purple-500/30 hover:bg-gray-800/70 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 group">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:from-purple-500/30 group-hover:to-emerald-500/30 transition-colors border border-purple-500/30">
                    <MapPin className="h-8 w-8 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4 font-mono">{t("trackYourBus")}</h3>
                  <p className="text-gray-400 leading-relaxed">{t("trackYourBusDesc")}</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 backdrop-blur-sm border-emerald-500/30 hover:bg-gray-800/70 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/20 group">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:from-emerald-500/30 group-hover:to-cyan-500/30 transition-colors border border-emerald-500/30">
                    <TrendingUp className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4 font-mono">{t("greatPrices")}</h3>
                  <p className="text-gray-400 leading-relaxed">{t("greatPricesDesc")}</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 backdrop-blur-sm border-cyan-500/30 hover:bg-gray-800/70 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20 group">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-colors border border-cyan-500/30">
                    <Network className="h-8 w-8 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4 font-mono">{t("manyDestinations")}</h3>
                  <p className="text-gray-400 leading-relaxed">{t("manyDestinationsDesc")}</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 backdrop-blur-sm border-blue-500/30 hover:bg-gray-800/70 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 group">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:from-blue-500/30 group-hover:to-indigo-500/30 transition-colors border border-blue-500/30">
                    <Users className="h-8 w-8 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4 font-mono">{t("helpWhenYouNeedIt")}</h3>
                  <p className="text-gray-400 leading-relaxed">{t("helpWhenYouNeedItDesc")}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Enhanced Routes & Map Section */}
        <section ref={routesRef} className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 font-mono">{t("busRoutesDestinations")}</h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto font-mono">{t("busRoutesDesc")}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Routes Table */}
              <div className="space-y-6">
                <Card className="bg-gray-900/50 backdrop-blur-sm border-orange-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Route className="h-6 w-6 text-orange-400" />
                      <h3 className="text-xl font-semibold text-white font-mono">{t("routeInformation")}</h3>
                    </div>
                    <p className="text-gray-400">{t("routeInfoDesc")}</p>
                  </CardContent>
                </Card>
                <RoutesTable />
              </div>

              {/* Interactive Map */}
              <div className="space-y-6">
                <Card className="bg-gray-900/50 backdrop-blur-sm border-purple-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <MapPin className="h-6 w-6 text-purple-400" />
                      <h3 className="text-xl font-semibold text-white font-mono">{t("interactiveMap")}</h3>
                    </div>
                    <p className="text-gray-400">{t("mapDesc")}</p>
                  </CardContent>
                </Card>
                <InteractiveMap />
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/30">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="bg-gray-900/50 backdrop-blur-sm border-orange-500/30 transport-glow">
              <CardContent className="p-12 md:p-16">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8 transport-glow border border-orange-500/30">
                  <Zap className="h-10 w-10 text-orange-400" />
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-6 font-mono">{t("readyToStartJourney")}</h3>
                <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto font-mono">{t("readyDesc")}</p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Button
                    size="lg"
                    onClick={() => router.push("/user/dashboard")}
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-10 py-4 text-lg font-semibold rounded-xl transport-glow border border-orange-500/30 shadow-2xl shadow-orange-500/20"
                  >
                    <Terminal className="mr-3 h-5 w-5" />
                    {t("bookYourTrip")}
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => router.push("/user/auth/login")}
                    variant="outline"
                    className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 px-10 py-4 text-lg font-semibold rounded-xl font-mono"
                  >
                    <LogIn className="mr-3 h-5 w-5" />
                    {t("signIn")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Enhanced Footer */}
        <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900/50 border-t border-orange-500/30">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              {/* Company Info */}
              <div className="md:col-span-2">
                 <div className="flex items-center space-x-3 mb-6">
                   <WaslaLogo size={48} variant="simple" />
                   <div className="flex items-center gap-2">
                     <h3 className="text-2xl font-bold text-white font-mono">Wasla</h3>
                     <span className="text-xl font-bold text-orange-400 font-arabic">وصلة</span>
                   </div>
                 </div>
                <p className="text-gray-400 text-lg leading-relaxed mb-6">{t("footerCompanyDesc")}</p>
                <div className="flex space-x-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 bg-transparent font-mono"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    CALL_US
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 bg-transparent font-mono"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WHATSAPP
                  </Button>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-6 font-mono">{t("quickLinks")}</h4>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors font-mono">
                      {t("bookTrip")}
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors font-mono">
                      {t("viewRoutes")}
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors font-mono">
                      {t("helpSupport")}
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors font-mono">
                      {t("contactUs")}
                    </a>
                  </li>
                </ul>
              </div>

              {/* Contact Info */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-6 font-mono">{t("getHelp")}</h4>
                <ul className="space-y-3 text-gray-400 font-mono">
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-orange-400" />
                    +216 XX XXX XXX
                  </li>
                  <li className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-purple-400" />
                    +216 XX XXX XXX
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-orange-400" />
                    help@wasla.tn
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-400" />
                    {t("available247")}
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-orange-500/30 text-center">
              <p className="text-gray-400 font-mono">{t("footerCopyright")}</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Enhanced Custom Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap');
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes float-up {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes glow-pulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(249, 115, 22, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(249, 115, 22, 0.6);
          }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        .bg-size-200 {
          background-size: 200% 200%;
        }
        
        .animate-float-up {
          animation: float-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animation-delay-100 {
          animation-delay: 0.1s;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        
        .animation-delay-800 {
          animation-delay: 0.8s;
        }
        
        .font-arabic {
          font-family: 'Noto Sans Arabic', 'Arial', sans-serif;
          direction: rtl;
        }
        
        .transport-glow {
          animation: glow-pulse 2s ease-in-out infinite;
        }
        
        .tunisian-pattern {
          background-image: 
            radial-gradient(circle at 25% 25%, rgba(249, 115, 22, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(239, 68, 68, 0.1) 0%, transparent 50%);
        }
        
        .geometric-overlay {
          background-image: 
            linear-gradient(45deg, rgba(249, 115, 22, 0.05) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(239, 68, 68, 0.05) 25%, transparent 25%);
          background-size: 60px 60px;
        }
      `}</style>
    </div>
  )
}

export default function Home() {
  return <LandingPageContent />
}



