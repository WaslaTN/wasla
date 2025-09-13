'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Wrench, LogOut, MapPin, Clock, CheckCircle } from 'lucide-react'

export default function WorkerDashboard() {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    const authToken = localStorage.getItem('authToken')
    const userProfileData = localStorage.getItem('userProfile')
    
    if (!authToken || !userProfileData) {
      router.push('/station-partnership/login')
      return
    }

    try {
      const profile = JSON.parse(userProfileData)
      if (profile.role !== 'WORKER') {
        router.push('/station-partnership/login')
        return
      }
      setUserProfile(profile)
    } catch (error) {
      router.push('/station-partnership/login')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userProfile')
    router.push('/station-partnership/login')
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative bg-black">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-black/80 to-green-950/20" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `
            linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }} />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="bg-black/80 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Wrench className="h-8 w-8 text-green-400 mr-3" />
                <h1 className="text-2xl font-bold text-white">
                  Louaj <span className="text-green-400">Worker</span>
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-400">
                  {userProfile.firstName} {userProfile.lastName}
                </span>
                <span className="text-sm text-green-400">
                  {userProfile.station?.name}
                </span>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Worker Dashboard</h2>
              <p className="text-gray-400">Working at {userProfile.station?.name}</p>
            </div>

            {/* Today's Tasks */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">Today's Schedule</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-green-400 mr-3" />
                    <div>
                      <p className="text-white font-medium">Morning Shift</p>
                      <p className="text-gray-400 text-sm">8:00 AM - 2:00 PM</p>
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-yellow-400 mr-3" />
                    <div>
                      <p className="text-white font-medium">Afternoon Shift</p>
                      <p className="text-gray-400 text-sm">2:00 PM - 8:00 PM</p>
                    </div>
                  </div>
                  <div className="h-5 w-5 border-2 border-yellow-400 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400">Tasks Completed</p>
                    <p className="text-2xl font-bold text-white">24</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-green-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400">Hours Worked</p>
                    <p className="text-2xl font-bold text-white">6.5</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <div className="flex items-center">
                  <MapPin className="h-8 w-8 text-green-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400">Current Status</p>
                    <p className="text-2xl font-bold text-green-400">Active</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Clock In/Out
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  View Schedule
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Report Issue
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  View Tasks
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}