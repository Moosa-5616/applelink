import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Lock, CreditCard, CheckCircle, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getOffersForBuyer, updateOfferStatus } from '../../lib/database';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function MyOffers() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

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

  const handleAction = async (offerId, newStatus) => {
    setActionLoading(offerId);
    try {
      const { error } = await updateOfferStatus(offerId, newStatus);
      if (error) {
        console.error('Error updating offer:', error);
      } else {
        setOffers(prev => prev.map(o => 
          o.id === offerId ? { ...o, status: newStatus } : o
        ));
      }
    } catch (err) {
      console.error('Error updating offer:', err);
    } finally {
      setActionLoading(null);
    }
  };

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
            const buyerPaid = offer.brokerage_paid_buyer;
            const farmerPaid = offer.brokerage_paid_farmer;
            const bothPaid = buyerPaid && farmerPaid;
            const listing = offer.listing || {};
            const farmer = listing.farmer || {};
            const orderValue = (offer.offer_quantity || 0) * (offer.offer_price || 0);
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
                  {offer.offer_quantity && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Quantity Requested:</span>
                      <span className="font-bold text-primary-700">{offer.offer_quantity} {listing.unit === 'boxes' ? 'boxes' : 'kgs'}</span>
                    </div>
                  )}
                  {orderValue > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Total Order Value:</span>
                      <span className="font-bold text-text-primary">₹{orderValue.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Requested Pickup:</span>
                    <span className="font-semibold text-text-primary">{new Date(offer.pickup_date).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Contact details — gated behind brokerage payment */}
                {isAccepted ? (
                  bothPaid ? (
                    // Both paid — show farmer details normally
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
                      <Button
                        variant="primary"
                        size="sm"
                        className="mt-2 text-xs"
                        onClick={() => handleAction(offer.id, 'completed')}
                        loading={actionLoading === offer.id}
                        disabled={actionLoading !== null}
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Mark Deal as Completed
                      </Button>
                    </div>
                  ) : buyerPaid && !farmerPaid ? (
                    // Buyer paid but farmer hasn't — show waiting state
                    <div className="relative mt-2 rounded-xl overflow-hidden">
                      <div className="bg-primary-50 rounded-xl p-4 border border-primary-200 flex flex-col gap-3" style={{ filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none' }}>
                        <div className="flex items-center gap-2 text-primary-900">
                          <Phone className="w-4 h-4" />
                          <h4 className="font-bold text-xs">Farmer Contact Information</h4>
                        </div>
                        <div className="flex flex-col gap-1 text-[11px] text-primary-950 font-medium">
                          <span>Farmer Name: <strong>████████████</strong></span>
                          <span>Orchard Location: <strong>█████████████</strong></span>
                          <span>Primary Phone: <strong>██████████</strong></span>
                        </div>
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-xl">
                        <div className="flex flex-col items-center gap-2 text-center px-4">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          </div>
                          <h4 className="text-xs font-bold text-text-primary">Your Brokerage Fee is Paid ✓</h4>
                          <p className="text-[10px] text-text-secondary leading-relaxed">
                            Waiting for the farmer to pay their brokerage fee. Contact details will unlock once both parties have paid.
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin"></div>
                            <span className="text-[10px] text-primary-700 font-semibold">Waiting for farmer...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Buyer hasn't paid — show blurred overlay with pay button
                    <div className="relative mt-2 rounded-xl overflow-hidden">
                      <div className="bg-primary-50 rounded-xl p-4 border border-primary-200 flex flex-col gap-3" style={{ filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none' }}>
                        <div className="flex items-center gap-2 text-primary-900">
                          <Phone className="w-4 h-4" />
                          <h4 className="font-bold text-xs">Farmer Contact Information</h4>
                        </div>
                        <div className="flex flex-col gap-1 text-[11px] text-primary-950 font-medium">
                          <span>Farmer Name: <strong>████████████</strong></span>
                          <span>Orchard Location: <strong>█████████████</strong></span>
                          <span>Primary Phone: <strong>██████████</strong></span>
                        </div>
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-xl">
                        <div className="flex flex-col items-center gap-2 text-center px-4">
                          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <Lock className="w-5 h-5 text-amber-700" />
                          </div>
                          <h4 className="text-xs font-bold text-text-primary">Pay Brokerage Fee to Unlock</h4>
                          <p className="text-[10px] text-text-secondary leading-relaxed">
                            A platform brokerage fee of <strong className="text-primary-700">₹{(offer.brokerage_amount || 0).toLocaleString()}</strong> ({offer.brokerage_percentage || 0}%) is required to view farmer contact details.
                          </p>
                          <Button
                            variant="primary"
                            size="sm"
                            className="mt-1 text-xs"
                            onClick={() => navigate(`/pay-brokerage/${offer.id}?role=buyer`)}
                          >
                            <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                            Pay ₹{(offer.brokerage_amount || 0).toLocaleString()} Brokerage
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
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
