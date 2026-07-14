import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getOffersForBuyer } from '../../lib/database';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function MyOffers() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      if (!profile?.id) return;
      setLoading(true);
      try {
        const { data, error } = await getOffersForBuyer(profile.id);
        if (error) {
          console.error('Error fetching offers:', error);
        } else {
          setOffers(data || []);
        }
      } catch (err) {
        console.error('Error fetching offers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [profile?.id]);

  const getStatusBadge = (status) => {
    const badges = {
      pending: { variant: 'warning', text: 'Waiting for Farmer response' },
      accepted: { variant: 'success', text: 'Deal Accepted!' },
      rejected: { variant: 'error', text: 'Offer Declined' },
      completed: { variant: 'info', text: 'Completed Deal' },
    };
    const current = badges[status] || { variant: 'gray', text: status };
    return <Badge variant={current.variant}>{current.text}</Badge>;
  };

  return (
    <div className="page-container flex flex-col gap-5">
      {/* Header back */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-surface border border-border text-text-secondary hover:bg-background-alt cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-text-secondary">Sent Offers</span>
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-xs text-text-secondary">Loading offers...</p>
          </div>
        ) : offers.length > 0 ? (
          offers.map((offer) => {
            const isAccepted = offer.status === 'accepted';
            const listing = offer.listing || {};
            const farmer = listing.farmer || {};
            return (
              <Card key={offer.id} className="flex flex-col gap-3 relative overflow-hidden" padding="lg">
                <div className="flex justify-between items-start border-b border-border-light pb-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-text-primary">
                      {listing.variety || 'Unknown'} (Grade {listing.grade || '?'})
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Orchard proprietor: <strong className="text-text-primary font-bold">{farmer.full_name || 'Unknown'}</strong>
                    </p>
                  </div>
                  <div>{getStatusBadge(offer.status)}</div>
                </div>

                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Expected Price:</span>
                    <span className="font-semibold text-text-primary">₹{listing.price_per_unit} / {listing.unit === 'boxes' ? 'box' : 'kg'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">My Offered Price:</span>
                    <span className="font-bold text-primary-700">₹{offer.offer_price} / {listing.unit === 'boxes' ? 'box' : 'kg'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Requested Pickup:</span>
                    <span className="font-semibold text-text-primary">{new Date(offer.pickup_date).toLocaleDateString()}</span>
                  </div>
                </div>

                {isAccepted ? (
                  <div className="bg-primary-50 rounded-xl p-4 border border-primary-200 mt-2 flex flex-col gap-3 animate-fade-in animate-slide-up">
                    <div className="flex items-center gap-2 text-primary-900">
                      <Phone className="w-4 h-4" />
                      <h4 className="font-bold text-xs">Farmer Contact Information Exchanged</h4>
                    </div>
                    <div className="flex flex-col gap-1 text-[11px] text-primary-950 font-medium">
                      <span>Farmer Name: <strong className="text-text-primary">{farmer.full_name || 'N/A'}</strong></span>
                      <span>Orchard Location: <strong className="text-text-primary">{listing.pickup_location || 'N/A'}</strong></span>
                      <span>Primary Phone: <strong className="text-text-primary">{farmer.phone || 'N/A'}</strong></span>
                    </div>
                    <p className="text-[10px] text-primary-800 leading-normal border-t border-primary-100 pt-2">
                      Please contact this farmer directly to finalize logistics, crate drop-offs, and secure bank / cash transfer accounts.
                    </p>
                  </div>
                ) : null}
              </Card>
            );
          })
        ) : (
          <div className="text-center py-12 bg-surface border border-dashed rounded-2xl">
            <span className="text-4xl block mb-2 select-none">📦</span>
            <h4 className="font-bold text-text-primary text-sm">No Sent Bids</h4>
            <p className="text-xs text-text-secondary mt-1">Browse market crops and place offers to engage.</p>
          </div>
        )}
      </div>
    </div>
  );
}
