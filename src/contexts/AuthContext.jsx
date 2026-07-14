import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getProfile, updateProfile as updateProfileDb } from '../lib/database';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Supabase auth user
  const [profile, setProfile] = useState(null);  // Profile from profiles table
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes and load profile
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile();
      } else {
        setLoading(false);
      }
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          await loadProfile();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setRole(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async () => {
    try {
      const { data, error } = await getProfile();
      if (data && !error) {
        setProfile(data);
        setRole(data.role);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send OTP to phone number via Supabase built-in Phone Auth
   * (Twilio is configured in Supabase Dashboard → Auth → Providers → Phone)
   */
  const sendOtp = async (phoneNumber) => {
    try {
      // Format phone: ensure it starts with +
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;

      return { success: true, message: 'OTP sent successfully' };
    } catch (err) {
      console.error('Send OTP error:', err);
      return { success: false, error: err.message || 'Failed to send OTP' };
    }
  };

  /**
   * Verify OTP code via Supabase built-in Phone Auth
   */
  const verifyOtp = async (phoneNumber, otpCode) => {
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otpCode,
        type: 'sms',
      });

      if (error) throw error;

      setUser(data.user);

      // Load profile (auto-created by DB trigger on signup)
      await loadProfile();

      // Check if user has a role set
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const hasRole = profileData?.role != null;

      return {
        success: true,
        roleSelected: hasRole,
        role: profileData?.role || null,
      };
    } catch (err) {
      console.error('Verify OTP error:', err);
      return { success: false, error: err.message || 'Invalid OTP code' };
    }
  };

  /**
   * Select role and complete profile setup
   */
  const selectRole = async (selectedRole, profileData = {}) => {
    try {
      const { data, error } = await updateProfileDb({
        role: selectedRole,
        full_name: profileData.full_name || '',
        district: profileData.district || '',
        ...(selectedRole === 'farmer' ? {
          village: profileData.village || '',
          years_farming: profileData.years_farming || 0,
        } : {
          business_name: profileData.business_name || '',
        }),
      });

      if (error) throw error;

      setProfile(data);
      setRole(selectedRole);

      return { success: true };
    } catch (err) {
      console.error('Select role error:', err);
      return { success: false, error: err.message || 'Failed to setup profile' };
    }
  };

  /**
   * Update profile data
   */
  const updateUserProfile = async (profileData) => {
    try {
      const { data, error } = await updateProfileDb(profileData);
      if (error) throw error;

      setProfile(data);
      return { success: true, data };
    } catch (err) {
      console.error('Update profile error:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Logout
   */
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole(null);
  };

  const value = {
    user,
    profile,
    role,
    loading,
    sendOtp,
    verifyOtp,
    selectRole,
    updateUserProfile,
    logout,
    setProfile,
    loadProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
