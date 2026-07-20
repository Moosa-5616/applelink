import { useState } from 'react';
import { Star, ShieldAlert } from 'lucide-react';
import { createReview } from '../lib/database';
import { useAuth } from '../contexts/AuthContext';
import Button from './ui/Button';

export default function MandatoryReviewModal({ pendingOffer, onReviewSubmitted }) {
  const { user, role } = useAuth();
  
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

    const revieweeId = role === 'farmer' ? pendingOffer.buyer_id : pendingOffer.farmer_id;

    try {
      const reviewData = {
        offer_id: pendingOffer.id,
        farmer_id: pendingOffer.farmer_id,
        buyer_id: pendingOffer.buyer_id,
        reviewee_id: revieweeId,
        overall_rating: overallRating,
        communication_rating: communicationRating,
        review_text: reviewText,
        
        // Buyer fields
        quality_rating: role === 'buyer' ? qualityRating : null,
        freshness_rating: role === 'buyer' ? freshnessRating : null,
        packaging_rating: role === 'buyer' ? packagingRating : null,
        quantity_accuracy_rating: role === 'buyer' ? quantityAccuracyRating : null,
        
        // Farmer fields
        payment_reliability_rating: role === 'farmer' ? paymentReliabilityRating : null,
      };

      const { error: submitError } = await createReview(reviewData);
      
      if (submitError) throw submitError;
      
      onReviewSubmitted(pendingOffer.id);
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

  const otherPartyName = role === 'farmer' 
    ? (pendingOffer.buyer?.business_name || pendingOffer.buyer?.full_name || 'the buyer')
    : (pendingOffer.listing?.farmer?.full_name || 'the farmer');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface w-full max-w-lg rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        
        <div className="flex items-center gap-3 text-error mb-4">
          <ShieldAlert className="w-8 h-8" />
          <h2 className="text-xl font-bold">Mandatory Review Required</h2>
        </div>
        
        <p className="text-sm text-text-secondary mb-6">
          To maintain a trusted marketplace and train our AI authenticity system, you must review 
          <strong> {otherPartyName} </strong> for your recently completed transaction of 
          <strong> {pendingOffer.listing?.variety} Apples </strong> before continuing.
        </p>

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

          {/* Role specific rating fields */}
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
              placeholder={`Share your experience trading with ${otherPartyName}...`}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              required
            ></textarea>
            <p className="text-[10px] text-text-muted">This text will be analyzed by our AI Authenticity System.</p>
          </div>

          <Button type="submit" fullWidth loading={loading} className="py-3">
            Submit Review & Continue
          </Button>

        </form>
      </div>
    </div>
  );
}
