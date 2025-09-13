"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, type User as ApiUser } from '@/lib/api';

export interface User extends ApiUser {
  isPhoneVerified?: boolean; // Make it optional since API might not have this field
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Clear cookie as well
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
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
        
        console.log('🔐 Storing token:', token.substring(0, 20) + '...');
        console.log('🔐 User data:', user);
        
        // Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Set cookie for middleware - try multiple approaches
        document.cookie = `token=${token}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax; secure=false`;
        
        // Also try setting without secure flag
        setTimeout(() => {
          document.cookie = `token=${token}; path=/`;
          console.log('🍪 Cookie set (delayed)');
        }, 100);
        
        console.log('🍪 Immediate cookie set');
        console.log('🍪 All cookies:', document.cookie);
        
        setUser(user);
        setIsAuthenticated(true);
        
        console.log('✅ Login successful');
        return { success: true };
      } else {
        console.error('❌ Login failed:', response.error);
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      console.error('❌ Network error during login:', error);
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
        
        console.log('📝 Storing registration token:', token.substring(0, 20) + '...');

        // Store token and user data
        localStorage.setItem('userToken', token);
        localStorage.setItem('userProfile', JSON.stringify(user));

        // Set cookie for middleware - using more explicit format
        const cookieValue = `userToken=${token}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax`;
        document.cookie = cookieValue;
        
        console.log('🍪 Registration cookie set:', cookieValue.substring(0, 50) + '...');
        
        setUser(user);
        setIsAuthenticated(true);
        
        console.log('✅ Registration successful');
        return { success: true };
      } else {
        console.error('❌ Registration failed:', response.error);
        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('❌ Network error during registration:', error);
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
        throw new Error('No token found');
      }

      const response = await apiClient.verifyUser(token);

      if (response.success && response.data) {
        // The API returns { user: User } in data
        const userData = response.data.user;
        setUser(userData);
        setIsAuthenticated(true);
        // Update cached user data
        localStorage.setItem('userProfile', JSON.stringify(userData));
        console.log('✅ Token verified and user loaded');
      } else {
        console.error('❌ Token verification failed:', response.error);
        logout();
      }
    } catch (error: any) {
      console.error('❌ Error verifying token:', error);
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
