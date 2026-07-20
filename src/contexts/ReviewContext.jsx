import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { getPendingReviews } from '../lib/database';

const ReviewContext = createContext(null);

export function ReviewProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingOffers, setPendingOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    if (!user?.id) {
      setPendingOffers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await getPendingReviews(user.id);
      if (data) {
        setPendingOffers(data);
      }
    } catch (err) {
      console.error('Failed to fetch pending reviews', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [user?.id]);

  /**
   * Wrap any critical action with this function.
   * If there are pending reviews, it intercepts the action and redirects to the pending reviews page.
   * Otherwise, it proceeds with the action.
   */
  const withReviewCheck = (actionCallback) => {
    return (e) => {
      if (e && e.preventDefault) e.preventDefault();
      
      if (pendingOffers.length > 0) {
        navigate('/pending-reviews');
      } else {
        actionCallback(e);
      }
    };
  };

  return (
    <ReviewContext.Provider value={{ withReviewCheck, pendingOffers, refreshPendingReviews: fetchPending }}>
      {children}
    </ReviewContext.Provider>
  );
}

export function useReviewCheck() {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReviewCheck must be used within a ReviewProvider');
  }
  return context;
}
