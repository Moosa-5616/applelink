import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getPendingReviews } from '../lib/database';
import MandatoryReviewModal from './MandatoryReviewModal';

export default function GlobalReviewCheck() {
  const { user } = useAuth();
  const [pendingOffers, setPendingOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    if (!user?.id) return;
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

  const handleReviewSubmitted = (offerId) => {
    setPendingOffers(prev => prev.filter(o => o.id !== offerId));
  };

  if (!user || loading || pendingOffers.length === 0) return null;

  // Render the modal for the first pending review
  return (
    <MandatoryReviewModal 
      pendingOffer={pendingOffers[0]} 
      onReviewSubmitted={handleReviewSubmitted} 
    />
  );
}
