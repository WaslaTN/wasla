'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, User, Phone, Mail, Shield, Edit2, Save, X, Menu, Settings, CheckCircle, AlertTriangle } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  isPhoneVerified: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const verifyAndLoadUser = async () => {
      const token = localStorage.getItem('userToken');
      const userData = localStorage.getItem('userProfile');
      
      if (!token) {
        console.log('🔒 No user token found, redirecting to login');
        router.push('/user/auth/login');
        return;
      }

      // If we have cached user data and it's valid, use it
      if (userData && userData !== 'null' && userData !== 'undefined') {
        try {
          const parsedUser = JSON.parse(userData);
          if (parsedUser && typeof parsedUser === 'object') {
            setUser(parsedUser);
            setEditData({
              firstName: parsedUser.firstName || '',
              lastName: parsedUser.lastName || '',
              email: parsedUser.email || ''
            });
            return;
          }
        } catch (error) {
          console.warn('⚠️ Invalid cached user data, verifying token...');
        }
      }

      // Verify token with backend
      try {
        const response = await fetch('/api/v1/users/verify-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const result = await response.json();

        if (response.ok && result.success && result.data?.user) {
          const verifiedUser = result.data.user;
          localStorage.setItem('userProfile', JSON.stringify(verifiedUser));
          setUser(verifiedUser);
          setEditData({
            firstName: verifiedUser.firstName || '',
            lastName: verifiedUser.lastName || '',
            email: verifiedUser.email || ''
          });
          console.log('✅ User token verified, user loaded');
        } else {
          throw new Error(result.message || 'Token verification failed');
        }
      } catch (error) {
        console.error('❌ Token verification failed:', error);
        localStorage.removeItem('userToken');
        localStorage.removeItem('userProfile');
        document.cookie = 'userToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        router.push('/user/auth/login');
      }
    };

    verifyAndLoadUser();
  }, [router]);

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || ''
    });
    setError('');
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/v1/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      });

      const data = await response.json();

      if (response.ok) {
        // Update user data in localStorage and state
        const updatedUser: User = {
          ...user!,
          firstName: editData.firstName,
          lastName: editData.lastName,
          email: editData.email
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setIsEditing(false);
        setSuccess('Profile updated successfully!');
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Modern Header */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <Button
                onClick={() => router.push('/user/dashboard')}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white hover:bg-slate-800/50 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{t('dashboard' as any)}</span>
              </Button>
              <div className="w-px h-4 sm:h-6 bg-slate-700 hidden sm:block"></div>
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-lg sm:text-xl font-bold text-white truncate">{t('myProfile' as any)}</h1>
              <p className="text-slate-400 text-xs sm:text-sm hidden sm:block">{t('manageYourAccountSettings' as any)}</p>
            </div>
            
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">

        {/* Profile Overview */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 bg-purple-600/20 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-slate-400 text-base sm:text-lg">{user.phoneNumber}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30 text-xs sm:text-sm">
                    <Shield className="w-3 h-3 mr-1" />
                    {user.isPhoneVerified ? t('verified' as any) : t('pending' as any)}
                  </Badge>
                  <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 text-xs sm:text-sm">
                    {t('memberSince' as any)} {new Date(user.createdAt).getFullYear()}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information Card */}
        <Card className="bg-slate-800/30 border-slate-700/50 mb-6 sm:mb-8">
          <CardHeader className="pb-4 sm:pb-6">
            <div className="flex flex-col gap-4 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-xl sm:text-2xl text-white flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <User className="w-4 h-4 sm:w-5 sm:w-5 text-blue-400" />
                  </div>
                  {t('personalDetails' as any)}
                </CardTitle>
                <CardDescription className="text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base">
                  {t('managePersonalDetails' as any)}
                </CardDescription>
              </div>
              
              {!isEditing ? (
                <Button 
                  onClick={handleEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white self-start sm:self-auto"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  {t('editProfile' as any)}
                </Button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 self-start sm:self-auto">
                  <Button 
                    onClick={handleSave}
                    disabled={isLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? t('saving' as any) : t('saveChanges' as any)}
                  </Button>
                  <Button 
                    onClick={handleCancel}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {t('cancel' as any)}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
            
          <CardContent className="p-4 sm:p-6 lg:p-8">
            {error && (
              <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-4 sm:mb-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-medium text-sm sm:text-base">{t('error' as any)}</span>
                </div>
                <p className="mt-1 sm:mt-2 text-sm sm:text-base">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 sm:mb-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-medium text-sm sm:text-base">{t('success' as any)}</span>
                </div>
                <p className="mt-1 sm:mt-2 text-sm sm:text-base">{success}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-3">
                    First Name
                  </label>
                  {isEditing ? (
                    <Input
                      value={editData.firstName}
                      onChange={(e) => setEditData({...editData, firstName: e.target.value})}
                      className="bg-slate-800/50 border-slate-600 text-white h-12 text-lg"
                      placeholder="Enter your first name"
                    />
                  ) : (
                    <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                      <p className="text-white text-lg font-medium">{user.firstName}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-3">
                    Last Name
                  </label>
                  {isEditing ? (
                    <Input
                      value={editData.lastName}
                      onChange={(e) => setEditData({...editData, lastName: e.target.value})}
                      className="bg-slate-800/50 border-slate-600 text-white h-12 text-lg"
                      placeholder="Enter your last name"
                    />
                  ) : (
                    <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                      <p className="text-white text-lg font-medium">{user.lastName}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-3">
                    Email Address
                  </label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({...editData, email: e.target.value})}
                      className="bg-slate-800/50 border-slate-600 text-white h-12 text-lg"
                      placeholder="Enter your email address (optional)"
                    />
                  ) : (
                    <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                      <p className="text-white text-lg font-medium">{user.email || 'Not provided'}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-3">
                    Phone Number
                  </label>
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-slate-400" />
                        <span className="text-white text-lg font-medium">{user.phoneNumber}</span>
                      </div>
                      <Badge className={user.isPhoneVerified 
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                        : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      }>
                        <Shield className="w-3 h-3 mr-1" />
                        {user.isPhoneVerified ? 'Verified' : 'Pending'}
                      </Badge>
                    </div>
                    <p className="text-slate-500 text-sm mt-2">
                      Contact support to change your phone number
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Status & Security */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Account Status */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                Account Status
              </CardTitle>
              <CardDescription className="text-slate-400">
                Your verification and security status
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-6 space-y-4">
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">Phone Verification</p>
                      <p className="text-slate-400 text-sm">Your phone number status</p>
                    </div>
                  </div>
                  <Badge className={user.isPhoneVerified 
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                    : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  }>
                    {user.isPhoneVerified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
              </div>
              
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-white font-medium">Account Status</p>
                      <p className="text-slate-400 text-sm">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-amber-400" />
                </div>
                Security & Privacy
              </CardTitle>
              <CardDescription className="text-slate-400">
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-6 space-y-4">
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="text-white font-medium">Two-Factor Authentication</p>
                      <p className="text-slate-400 text-sm">SMS verification enabled</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    Enabled
                  </Badge>
                </div>
              </div>
              
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-white font-medium">Email Notifications</p>
                      <p className="text-slate-400 text-sm">Trip updates and receipts</p>
                    </div>
                  </div>
                  <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
                    {user.email ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 