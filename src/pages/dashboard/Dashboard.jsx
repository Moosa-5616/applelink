import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Heart, AlertCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useReviewCheck } from '../../contexts/ReviewContext';
import { getDashboardStats, getReviewsForFarmer, getListings } from '../../lib/database';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TrustScore from '../../components/ui/TrustScore';
import StarRating from '../../components/ui/StarRating';
import Badge from '../../components/ui/Badge';

export default function Dashboard() {
  const { profile, role } = useAuth();
  const { pendingOffers } = useReviewCheck();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ activeListingsCount: 0, incomingOffersCount: 0, userDealsCount: 0 });
  const [reviews, setReviews] = useState([]);
  const [favoriteFarmers, setFavoriteFarmers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile?.id) return;
      setLoading(true);
      try {
        // Fetch stats
        const dashStats = await getDashboardStats(profile.id, role);
        setStats(dashStats);

        if (role === 'farmer') {
          // Fetch reviews for farmer
          const { data: reviewsData } = await getReviewsForFarmer(profile.id);
          setReviews(reviewsData || []);
        } else {
          // For buyers, show some farmers as "favorites" (first few from marketplace)
          const { data: listingsData } = await getListings({});
          // Extract unique farmers
          const farmersMap = new Map();
          (listingsData || []).forEach(l => {
            if (l.farmer && !farmersMap.has(l.farmer.id)) {
              farmersMap.set(l.farmer.id, l.farmer);
            }
          });
          setFavoriteFarmers(Array.from(farmersMap.values()).slice(0, 3));
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [profile?.id, role]);

  if (loading) {
    return (
      <div className="page-container text-center py-12">
        <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-xs text-text-secondary">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="page-container flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <h2 className="text-xl font-black text-text-primary flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-primary-600" />
          {role === 'farmer' ? 'Farmer Console' : 'Purchasing Dashboard'}
        </h2>
        <Badge variant={profile?.is_verified ? 'verified' : 'gray'}>
          {profile?.is_verified ? 'Verified Partner' : 'Standard Account'}
        </Badge>
      </div>

      {pendingOffers?.length > 0 && (
        <button 
          onClick={() => navigate('/pending-reviews')}
          className="w-full text-left bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between hover:bg-amber-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">Action Required: Pending Reviews</h3>
              <p className="text-xs text-amber-800 mt-0.5">You have {pendingOffers.length} review{pendingOffers.length > 1 ? 's' : ''} to complete before making new deals.</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-700" />
        </button>
      )}

      {role === 'farmer' ? (
        <>
          {/* Circular Trust Gauge & Level Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="flex items-center gap-4 justify-between" padding="lg">
              <TrustScore score={profile?.trust_score || 75} size="lg" />
            </Card>

            <Card className="flex flex-col justify-between gap-1" padding="lg">
              <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-bold">My Apple Yield Sales</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-primary-600">{profile?.total_sales || 0}</span>
                <span className="text-xs text-text-secondary font-medium">Completed Deals</span>
              </div>
              <span className="text-[10px] text-text-muted mt-2">Reputation score builds automatically on verified reviews.</span>
            </Card>

            <Card className="flex flex-col justify-between gap-1" padding="lg">
              <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-bold">Average Quality rating</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-primary-600">{profile?.avg_rating || 0.0}</span>
                <span className="text-sm text-text-secondary">/ 5.0</span>
              </div>
              <div className="mt-2">
                <StarRating rating={profile?.avg_rating || 0} showValue={false} size="sm" />
              </div>
            </Card>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card hoverable className="text-center flex flex-col items-center justify-center py-5" onClick={() => navigate('/marketplace')}>
              <span className="text-2xl font-black text-text-primary">{stats.activeListingsCount}</span>
              <span className="text-xs font-semibold text-text-secondary mt-1">My Active Listings</span>
            </Card>
            <Card hoverable className="text-center flex flex-col items-center justify-center py-5" onClick={() => navigate('/offers')}>
              <span className="text-2xl font-black text-primary-600">{stats.incomingOffersCount}</span>
              <span className="text-xs font-semibold text-text-secondary mt-1">Offers Received</span>
            </Card>
          </div>

          {/* Customer Feedback logs */}
          <Card className="flex flex-col gap-4" padding="lg">
            <h3 className="font-bold text-text-primary text-sm">Verified Customer Reviews</h3>
            {reviews.length > 0 ? (
              <div className="flex flex-col gap-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="border-b border-border/40 pb-4 last:border-0 last:pb-0 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-text-primary">
                        {rev.buyer?.business_name || rev.buyer?.full_name || 'Anonymous'}
                      </span>
                      <StarRating rating={rev.overall_rating} size="sm" />
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">"{rev.review_text}"</p>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <div className="bg-background-alt p-1.5 rounded-lg text-center">
                        <span className="text-[10px] text-text-muted block">Quality</span>
                        <span className="text-xs font-bold text-text-secondary">{rev.quality_rating}/5</span>
                      </div>
                      <div className="bg-background-alt p-1.5 rounded-lg text-center">
                        <span className="text-[10px] text-text-muted block">Freshness</span>
                        <span className="text-xs font-bold text-text-secondary">{rev.freshness_rating}/5</span>
                      </div>
                      <div className="bg-background-alt p-1.5 rounded-lg text-center">
                        <span className="text-[10px] text-text-muted block font-semibold">Packaging</span>
                        <span className="text-xs font-bold text-text-secondary">{rev.packaging_rating}/5</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-secondary text-center py-6">Orchards built over years. Complete transactions to receive reviews.</p>
            )}
          </Card>
        </>
      ) : (
        <>
          {/* Buyer view dashboard layout */}
          <div className="grid grid-cols-2 gap-4">
            <Card hoverable className="text-center py-6 flex flex-col items-center justify-center" onClick={() => navigate('/my-offers')}>
              <span className="text-2xl font-black text-primary-600">{stats.userDealsCount}</span>
              <span className="text-xs font-semibold text-text-secondary mt-1">Active Purchases</span>
            </Card>
            <Card className="text-center py-6 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-text-primary">{favoriteFarmers.length}</span>
              <span className="text-xs font-semibold text-text-secondary mt-1">Favorite Farms</span>
            </Card>
          </div>

          {/* Favorite Sellers listing */}
          <Card className="flex flex-col gap-4" padding="lg">
            <h3 className="font-bold text-text-primary text-sm flex items-center gap-1.5">
              <Heart className="w-4 h-4 fill-error text-error" />
              Saved / Favorite Orchards
            </h3>

            <div className="flex flex-col gap-3">
              {favoriteFarmers.length > 0 ? (
                favoriteFarmers.map((farmer) => (
                  <div 
                    key={farmer.id}
                    className="flex items-center justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 bg-primary-100/60 rounded-xl text-primary-700 font-bold flex items-center justify-center">
                        {(farmer.full_name || 'U').charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                          {farmer.full_name}
                          {farmer.is_verified && (
                            <Badge variant="verified" size="sm">Verified</Badge>
                          )}
                        </h4>
                        <p className="text-[10px] text-text-secondary mt-0.5">{farmer.village}, {farmer.district}</p>
                      </div>
                    </div>
                    <TrustScore score={farmer.trust_score || 0} size="sm" showLabel={false} />
                  </div>
                ))
              ) : (
                <p className="text-xs text-text-secondary text-center py-4">No favorite orchards yet. Browse the marketplace to discover sellers.</p>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
