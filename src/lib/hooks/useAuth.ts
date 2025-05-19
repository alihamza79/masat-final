'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  const loading = status === 'loading';
  const user = session?.user;
  const isAuthenticated = !!session?.user;
  
  // Effect to redirect unauthenticated users from protected routes
  useEffect(() => {
    const isAuthPage = pathname?.startsWith('/auth');
    
    if (status === 'loading') return; // Wait for session to load
    
    if (!session && !isAuthPage) {
      // Redirect to login page if not authenticated and not on an auth page
      router.push('/auth/auth1/login');
    } else if (session && isAuthPage) {
      // Redirect to dashboard if authenticated and on an auth page
      router.push('/');
    }
  }, [session, status, pathname, router]);
  
  // Login function
  const login = async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      
      if (result?.ok) {
        // Wait briefly before redirecting
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // For more reliable redirect
        window.location.href = '/dashboard';
      }
      
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };
  
  // Register function
  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };
  
  // Logout function
  const logout = async () => {
    await signOut({ callbackUrl: '/auth/auth1/login' });
  };
  
  return {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
  };
} 