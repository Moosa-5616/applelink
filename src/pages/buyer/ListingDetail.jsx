import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Scale, ShieldCheck, CheckCircle, MessageSquare } from 'lucide-react';
import { getListingById, getReviewsForFarmer, createOffer } from '../../lib/database';
import { generateAIReputationSummary } from '../../lib/constants';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TrustScore from '../../components/ui/TrustScore';
import StarRating from '../../components/ui/StarRating';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, role } = useAuth();
  
  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  
  // Form submission for sending offers
  const [offerPrice, setOfferPrice] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Fetch listing and reviews from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoadingPage(true);
      try {
        const { data: listingData, error: listingError } = await getListingById(id);
        if (listingError || !listingData) {
          console.error('Error fetching listing:', listingError);
          setLoadingPage(false);
          return;
        }
        
        setListing(listingData);
        setOfferPrice(listingData.price_per_unit?.toString() || '');

        // Fetch reviews for this farmer
        if (listingData.farmer_id) {
          const { data: reviewsData } = await getReviewsForFarmer(listingData.farmer_id);
          setReviews(reviewsData || []);
        }
      } catch (err) {
        console.error('Error loading listing:', err);
      } finally {
        setLoadingPage(false);
      }
    };

    fetchData();
  }, [id]);

  if (loadingPage) {
    return (
      <div className="page-container text-center py-12">
        <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-xs text-text-secondary">Loading listing...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="page-container text-center py-12">
        <h2 className="text-lg font-bold text-text-primary">Listing Not Found</h2>
        <Button variant="outline" size="sm" onClick={() => navigate('/marketplace')} className="mt-4">
          Back to Marketplace
        </Button>
      </div>
    );
  }

  const farmer = listing.farmer || {};
  const aiSummary = generateAIReputationSummary(farmer, reviews);

  const handleSendOffer = async (e) => {
    e.preventDefault();
    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      setError('Please Enter a valid Offer Price');
      return;
    }
    if (!pickupDate) {
      setError('Please enter a target pickup date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: offerError } = await createOffer({
        listing_id: listing.id,
        farmer_id: listing.farmer_id,
        offer_price: parseFloat(offerPrice),
        pickup_date: pickupDate,
        message,
      });

      if (offerError) throw offerError;

      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to submit offer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container flex flex-col gap-5">
      {/* Header Back navigation */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 rounded-xl bg-surface border border-border text-text-secondary hover:bg-background-alt cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-text-secondary">Listing Details</span>
      </div>

      {/* Main card with photo/variety info */}
      <Card padding="none" className="overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-primary-50 to-primary-100/40 flex items-center justify-center relative">
          {listing.photos && listing.photos.length > 0 ? (
            <img src={listing.photos[0]} alt={listing.variety} className="w-full h-full object-cover" />
          ) : (
            <span className="text-6xl select-none">🍎</span>
          )}
          <div className="absolute top-4 left-4">
            <Badge variant="grade" size="lg">{listing.grade} Grade</Badge>
          </div>
          <div className="absolute bottom-4 right-4">
            <span className="bg-white/90 backdrop-blur-sm text-primary-700 font-bold px-3 py-1 rounded-xl shadow-sm text-sm">
              Expected: ₹{listing.price_per_unit} / {listing.unit === 'boxes' ? 'box' : 'kg'}
            </span>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary">{listing.variety} apples</h2>
            <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-primary-600" />
              {listing.pickup_location}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 border-t border-b border-border-light py-3">
            <div className="flex flex-col items-center justify-center text-center">
              <Scale className="w-4 h-4 text-primary-600 mb-1" />
              <span className="text-[11px] text-text-secondary font-medium">Quantity</span>
              <span className="text-xs font-bold text-text-primary mt-0.5">{listing.quantity} {listing.unit}</span>
            </div>
            
            <div className="flex flex-col items-center justify-center text-center">
              <Calendar className="w-4 h-4 text-primary-600 mb-1" />
              <span className="text-[11px] text-text-secondary font-medium">Harvest Date</span>
              <span className="text-xs font-bold text-text-primary mt-0.5">{new Date(listing.harvest_date).toLocaleDateString()}</span>
            </div>

            <div className="flex flex-col items-center justify-center text-center">
              <ShieldCheck className="w-4 h-4 text-primary-600 mb-1" />
              <span className="text-[11px] text-text-secondary font-medium">Apple Grade</span>
              <span className="text-xs font-bold text-text-primary mt-0.5">Grade {listing.grade}</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Description</h4>
            <p className="text-sm text-text-secondary leading-relaxed">{listing.description}</p>
          </div>
        </div>
      </Card>

      {/* Farmer trust and AI reputation summaries */}
      <Card className="flex flex-col gap-4" padding="lg">
        <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-primary-600" />
          Verified Orchard Profile
        </h3>

        <div className="flex items-center justify-between gap-3 border-b border-border-light pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 text-primary-700 font-bold flex items-center justify-center rounded-xl text-lg">
              {(farmer.full_name || 'U').charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-sm text-text-primary">{farmer.full_name || 'Unknown Farmer'}</h4>
                {farmer.is_verified && (
                  <Badge variant="verified" size="sm">Verified</Badge>
                )}
              </div>
              <p className="text-xs text-text-secondary mt-0.5">{farmer.village}, {farmer.district}</p>
            </div>
          </div>
          <TrustScore score={farmer.trust_score || 0} size="md" />
        </div>

        {/* AI summary block box */}
        <div className="bg-primary-50 rounded-xl p-4 border border-primary-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-primary-800 uppercase tracking-wide">AI Reputation Summary</h4>
            <Badge variant="primary" size="sm" className="bg-primary-100/80 text-primary-850 font-bold">Reputation AI</Badge>
          </div>
          <p className="text-xs text-primary-950 leading-relaxed font-medium">"{aiSummary}"</p>
        </div>

        {/* Farmer reviews display */}
        {reviews.length > 0 && (
          <div className="flex flex-col gap-3 mt-1">
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Recent Buyer Feedback</h4>
            <div className="flex flex-col gap-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="border-t border-border-light pt-3 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-text-primary">{rev.buyer?.business_name || rev.buyer?.full_name || 'Anonymous'}</span>
                    <StarRating rating={rev.overall_rating} size="sm" />
                  </div>
                  <p className="text-xs text-text-secondary">"{rev.review_text}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Offer Submission Panel (only for Buyers) */}
      {submitted ? (
        <Card className="bg-success-light text-center border-emerald-250 py-8 flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-bold text-primary-800 text-sm">Offer Submitted Successfully!</h3>
            <p className="text-xs text-text-secondary mt-1">The orchard farmer was notified and can accept/reject your requested terms.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/my-offers')} className="mt-2">
            Track Sent Offers
          </Button>
        </Card>
      ) : (
        role === 'buyer' && (
          <Card className="flex flex-col gap-4" padding="lg">
            <h3 className="font-bold text-text-primary text-sm flex items-center gap-2 border-b border-border-light pb-2">
              <MessageSquare className="w-4 h-4 text-primary-600" />
              Make Direct Purchase Offer
            </h3>

            {error && <div className="text-xs bg-error-light text-error p-3 rounded-xl font-semibold">{error}</div>}

            <form onSubmit={handleSendOffer} className="flex flex-col gap-4">
              <Input
                label={`Offer Price per ${listing.unit === 'boxes' ? 'box' : 'kg'} (₹)`}
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                required
                disabled={loading}
              />

              <Input
                label="Target Pickup Date"
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                required
                disabled={loading}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">Additional Instructions / Transit Message</label>
                <textarea
                  className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 active:outline-none"
                  rows="3"
                  placeholder="Ask about loading, packaging, crate preferences, crop quality certifications..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                fullWidth
                loading={loading}
                className="mt-2"
              >
                Send Direct Offer to Farmer
              </Button>
            </form>
          </Card>
        )
      )}
    </div>
  );
}
