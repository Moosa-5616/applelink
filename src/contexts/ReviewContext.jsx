import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getPendingReviews } from '../lib/database';
import MandatoryReviewModal from '../components/MandatoryReviewModal';

const ReviewContext = createContext(null);

export function ReviewProvider({ children }) {
  const { user } = useAuth();
  const [pendingOffers, setPendingOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [interceptCallback, setInterceptCallback] = useState(null);

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
   * If there are pending reviews, it intercepts the action and shows the review modal.
   * Otherwise, it proceeds with the action.
   */
  const withReviewCheck = (actionCallback) => {
    return (e) => {
      if (e && e.preventDefault) e.preventDefault();
      
      if (pendingOffers.length > 0) {
        setInterceptCallback(() => actionCallback);
        setShowModal(true);
      } else {
        actionCallback(e);
      }
    };
  };

  const handleReviewSubmitted = (offerId) => {
    const updated = pendingOffers.filter(o => o.id !== offerId);
    setPendingOffers(updated);
    
    if (updated.length === 0) {
      setShowModal(false);
      if (interceptCallback) {
        interceptCallback();
        setInterceptCallback(null);
      }
    }
  };

  return (
    <ReviewContext.Provider value={{ withReviewCheck, pendingOffers }}>
      {children}
      {showModal && pendingOffers.length > 0 && (
        <MandatoryReviewModal 
          pendingOffer={pendingOffers[0]} 
          onReviewSubmitted={handleReviewSubmitted} 
          onCancel={() => setShowModal(false)}
        />
      )}
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
