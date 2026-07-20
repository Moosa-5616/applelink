import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ShieldAlert, ArrowLeft } from 'lucide-react';
import { createReview } from '../lib/database';
import { useAuth } from '../contexts/AuthContext';
import { useReviewCheck } from '../contexts/ReviewContext';
import Button from '../components/ui/Button';

export default function PendingReviews() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { pendingOffers, refreshPendingReviews } = useReviewCheck();
  
  // State for the currently selected offer to review
  const [selectedOffer, setSelectedOffer] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Shared fields
  const [overallRating, setOverallRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  
  // Buyer specific fields
  const [qualityRating, setQualityRating] = useState(0);
  const [freshnessRating, setFreshnessRating] = useState(0);
  const [packagingRating, setPackagingRating] = useState(0);
  const [quantityAccuracyRating, setQuantityAccuracyRating] = useState(0);

  // Farmer specific fields
  const [paymentReliabilityRating, setPaymentReliabilityRating] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOffer) return;
    
    // Basic validation
    if (overallRating === 0 || communicationRating === 0) {
      setError('Please provide at least an overall rating and communication rating.');
      return;
    }
    
    if (role === 'buyer' && (qualityRating === 0 || freshnessRating === 0 || packagingRating === 0 || quantityAccuracyRating === 0)) {
      setError('Please fill out all quality ratings for the produce.');
      return;
    }
    
    if (role === 'farmer' && paymentReliabilityRating === 0) {
      setError('Please rate the payment reliability of the buyer.');
      return;
    }

    setLoading(true);
    setError('');

    const revieweeId = role === 'farmer' ? selectedOffer.buyer_id : selectedOffer.farmer_id;

    try {
      const reviewData = {
        offer_id: selectedOffer.id,
        farmer_id: selectedOffer.farmer_id,
        buyer_id: selectedOffer.buyer_id,
        reviewee_id: revieweeId,
        overall_rating: overallRating,
        communication_rating: communicationRating,
        review_text: reviewText,
        
        quality_rating: role === 'buyer' ? qualityRating : null,
        freshness_rating: role === 'buyer' ? freshnessRating : null,
        packaging_rating: role === 'buyer' ? packagingRating : null,
        quantity_accuracy_rating: role === 'buyer' ? quantityAccuracyRating : null,
        
        payment_reliability_rating: role === 'farmer' ? paymentReliabilityRating : null,
      };

      const { error: submitError } = await createReview(reviewData);
      if (submitError) throw submitError;
      
      // Remove from list
      setPendingOffers(prev => prev.filter(o => o.id !== selectedOffer.id));
      setSelectedOffer(null);
      
      // Reset form
      setOverallRating(0);
      setCommunicationRating(0);
      setReviewText('');
      setQualityRating(0);
      setFreshnessRating(0);
      setPackagingRating(0);
      setQuantityAccuracyRating(0);
      setPaymentReliabilityRating(0);
      
      // Update global context
      refreshPendingReviews();
      
    } catch (err) {
      console.error(err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (value, setter) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setter(star)}
            className={`p-1 ${value >= star ? 'text-amber-400' : 'text-gray-300'}`}
          >
            <Star className="w-6 h-6 fill-current" />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="page-container flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 rounded-xl bg-surface border border-border text-text-secondary hover:bg-background-alt cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold text-text-primary">Pending Reviews</h1>
      </div>

      {pendingOffers.length === 0 ? (
        <div className="bg-surface rounded-2xl p-8 text-center border border-border">
          <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-2">You're all caught up!</h2>
          <p className="text-sm text-text-secondary">
            You have no pending reviews. You are free to make new deals and listings.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed font-medium">
              You must submit reviews for these completed transactions before you can make any new deals or listings on the platform.
            </p>
          </div>

          {!selectedOffer ? (
            <div className="flex flex-col gap-3">
              {pendingOffers.map(offer => (
                <div key={offer.id} className="bg-surface p-4 rounded-xl border border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-text-primary">
                      {offer.listing?.variety} Apples
                    </h3>
                    <p className="text-xs text-text-secondary mt-1">
                      Partner: {role === 'farmer' ? (offer.buyer?.business_name || offer.buyer?.full_name) : (offer.listing?.farmer?.full_name)}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => setSelectedOffer(offer)}>
                    Write Review
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">
                  Reviewing {role === 'farmer' ? (selectedOffer.buyer?.business_name || selectedOffer.buyer?.full_name) : (selectedOffer.listing?.farmer?.full_name)}
                </h2>
                <button onClick={() => setSelectedOffer(null)} className="text-xs text-text-muted hover:text-text-primary font-medium">
                  Cancel
                </button>
              </div>

              {error && (
                <div className="bg-error-light text-error text-xs p-3 rounded-lg font-bold mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-text-primary">Overall Experience</label>
                  {renderStars(overallRating, setOverallRating)}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-text-primary">Communication & Professionalism</label>
                  {renderStars(communicationRating, setCommunicationRating)}
                </div>

                {role === 'buyer' ? (
                  <div className="grid grid-cols-2 gap-4 bg-background-alt p-4 rounded-xl border border-border">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-text-secondary uppercase">Produce Quality</label>
                      {renderStars(qualityRating, setQualityRating)}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-text-secondary uppercase">Freshness</label>
                      {renderStars(freshnessRating, setFreshnessRating)}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-text-secondary uppercase">Packaging</label>
                      {renderStars(packagingRating, setPackagingRating)}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-text-secondary uppercase">Quantity Accuracy</label>
                      {renderStars(quantityAccuracyRating, setQuantityAccuracyRating)}
                    </div>
                  </div>
                ) : (
                  <div className="bg-background-alt p-4 rounded-xl border border-border">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-text-secondary uppercase">Payment Reliability</label>
                      {renderStars(paymentReliabilityRating, setPaymentReliabilityRating)}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-text-primary">Detailed Feedback</label>
                  <textarea
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none min-h-[100px]"
                    placeholder="Share your experience..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    required
                  ></textarea>
                  <p className="text-[10px] text-text-muted">This text will be analyzed by our AI Authenticity System.</p>
                </div>

                <Button type="submit" fullWidth loading={loading} className="py-3">
                  Submit Review
                </Button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
