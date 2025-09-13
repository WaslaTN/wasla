"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, type User as ApiUser } from '@/lib/api';

export interface User extends ApiUser {
  isPhoneVerified?: boolean; // Make it optional since API might not have this field
}

export function useUserAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userProfile');
    // Clear cookie as well
    document.cookie = 'userToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setUser(null);
    setIsAuthenticated(false);
    console.log('🔒 User logged out');
    router.push('/');
  };

  const login = async (phoneNumber: string, password: string) => {
    try {
      const response = await apiClient.login(phoneNumber, password);

      if (response.success && response.data) {
        const { user, token } = response.data;
        
        console.log('🔐 Storing user token:', token.substring(0, 20) + '...');
        console.log('🔐 User data:', user);
        
        // Store token and user data with user-specific keys
        localStorage.setItem('userToken', token);
        localStorage.setItem('userProfile', JSON.stringify(user));
        
        // Set cookie for user middleware - using userToken
        document.cookie = `userToken=${token}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax; secure=false`;
        
        // Also try setting without secure flag
        setTimeout(() => {
          document.cookie = `userToken=${token}; path=/`;
          console.log('🍪 User cookie set (delayed)');
        }, 100);
        
        console.log('🍪 Immediate user cookie set');
        console.log('🍪 All cookies:', document.cookie);
        
        setUser(user);
        setIsAuthenticated(true);
        
        console.log('✅ User login successful');
        return { success: true };
      } else {
        console.error('❌ User login failed:', response.error);
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      console.error('❌ Network error during user login:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const register = async (
    firstName: string,
    lastName: string,
    phoneNumber: string,
    password: string
  ) => {
    try {
      const response = await apiClient.register({
        firstName,
        lastName,
        phoneNumber,
        password
      });

      if (response.success && response.data) {
        const { user, token } = response.data;
        
        console.log('📝 Storing user registration token:', token.substring(0, 20) + '...');
        
        // Store token and user data with user-specific keys
        localStorage.setItem('userToken', token);
        localStorage.setItem('userProfile', JSON.stringify(user));
        
        // Set cookie for user middleware - using userToken
        const cookieValue = `userToken=${token}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax`;
        document.cookie = cookieValue;
        
        console.log('🍪 User registration cookie set:', cookieValue.substring(0, 50) + '...');
        
        setUser(user);
        setIsAuthenticated(true);
        
        console.log('✅ User registration successful');
        return { success: true };
      } else {
        console.error('❌ User registration failed:', response.error);
        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('❌ Network error during user registration:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const verifyToken = async () => {
    const token = localStorage.getItem('userToken');
    const userData = localStorage.getItem('userProfile');
    
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    // If we have cached user data and it's valid, use it initially
    if (userData && userData !== 'null' && userData !== 'undefined') {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser && typeof parsedUser === 'object') {
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.warn('⚠️ Invalid cached user data');
      }
    }

    // Verify token with backend
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        throw new Error('No user token found');
      }

      const response = await apiClient.verifyUser(token);

      if (response.success && response.data) {
        // The API returns { user: User } in data
        const userData = response.data.user;
        setUser(userData);
        setIsAuthenticated(true);
        // Update cached user data
        localStorage.setItem('userProfile', JSON.stringify(userData));
        console.log('✅ User token verified and user loaded');
      } else {
        console.error('❌ User token verification failed:', response.error);
        logout();
      }
    } catch (error: any) {
      console.error('❌ Error verifying user token:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyToken();
  }, []);

  return {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    verifyToken
  };
} 