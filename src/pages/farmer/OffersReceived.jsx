import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Check, X, Lock, CreditCard, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getOffersForFarmer, updateOfferStatus } from '../../lib/database';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function OffersReceived() {
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
        const { data, error } = await getOffersForFarmer(profile.id);
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
        // Update local state
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
      pending: { variant: 'warning', text: 'Incoming Offer' },
      accepted: { variant: 'success', text: 'Deal Accepted' },
      rejected: { variant: 'error', text: 'Offer Declined' },
      completed: { variant: 'info', text: 'Trade Completed' },
    };
    const current = badges[status] || { variant: 'gray', text: status };
    return <Badge variant={current.variant}>{current.text}</Badge>;
  };

  return (
    <div className="page-container flex flex-col gap-5">
      {/* Back navbar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-surface border border-border text-text-secondary hover:bg-background-alt cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-text-secondary">Offers Received</span>
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
            const farmerPaid = offer.brokerage_paid_farmer;
            const buyerPaid = offer.brokerage_paid_buyer;
            const bothPaid = farmerPaid && buyerPaid;
            const listing = offer.listing || {};
            const buyer = offer.buyer || {};
            const orderValue = (offer.offer_quantity || 0) * (offer.offer_price || 0);
            return (
              <Card key={offer.id} className="flex flex-col gap-3 relative overflow-hidden" padding="lg">
                <div className="flex justify-between items-start border-b border-border-light pb-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-text-primary">
                      {listing.variety || 'Unknown'} (Grade {listing.grade || '?'})
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Requested price: <strong className="text-primary-700 font-bold">₹{offer.offer_price} / {listing.unit === 'boxes' ? 'box' : 'kg'}</strong>
                    </p>
                  </div>
                  <div>{getStatusBadge(offer.status)}</div>
                </div>

                {/* Offer Details */}
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Buyer Entity:</span>
                    <span className="font-semibold text-text-primary">{buyer.business_name || buyer.full_name || 'Unknown'}</span>
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
                  {offer.message && (
                    <div className="bg-background-alt/50 border rounded-xl p-3 text-text-secondary leading-relaxed mt-1">
                      "{offer.message}"
                    </div>
                  )}
                </div>

                {/* Contact details — gated behind brokerage payment */}
                {isAccepted ? (
                  bothPaid ? (
                    // Both paid — show buyer details normally
                    <div className="bg-primary-50 rounded-xl p-4 border border-primary-200 mt-2 flex flex-col gap-3 animate-fade-in">
                      <div className="flex items-center gap-2 text-primary-900">
                        <Phone className="w-4 h-4" />
                        <h4 className="font-bold text-xs">Buyer Contact Details Exchanged</h4>
                      </div>
                      <div className="flex flex-col gap-1 text-[11px] text-primary-950 font-medium">
                        <span>Representative: <strong className="text-text-primary">{buyer.full_name || 'N/A'}</strong></span>
                        <span>Phone: <strong className="text-text-primary">{buyer.phone || 'N/A'}</strong></span>
                        <span>Orchard Location: <strong className="text-text-primary">{listing.pickup_location || 'N/A'}</strong></span>
                      </div>
                      <p className="text-[10px] text-primary-800 leading-normal border-t border-primary-100 pt-2">
                         Contact the buyer directly via phone or WhatsApp to coordinate transport and payment terms.
                      </p>
                    </div>
                  ) : farmerPaid && !buyerPaid ? (
                    // Farmer paid but buyer hasn't — show waiting state
                    <div className="relative mt-2 rounded-xl overflow-hidden">
                      <div className="bg-primary-50 rounded-xl p-4 border border-primary-200 flex flex-col gap-3" style={{ filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none' }}>
                        <div className="flex items-center gap-2 text-primary-900">
                          <Phone className="w-4 h-4" />
                          <h4 className="font-bold text-xs">Buyer Contact Details</h4>
                        </div>
                        <div className="flex flex-col gap-1 text-[11px] text-primary-950 font-medium">
                          <span>Representative: <strong>████████████</strong></span>
                          <span>Phone: <strong>██████████</strong></span>
                          <span>Location: <strong>█████████████</strong></span>
                        </div>
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-xl">
                        <div className="flex flex-col items-center gap-2 text-center px-4">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          </div>
                          <h4 className="text-xs font-bold text-text-primary">Your Brokerage Fee is Paid ✓</h4>
                          <p className="text-[10px] text-text-secondary leading-relaxed">
                            Waiting for the buyer to pay their brokerage fee. Contact details will unlock once both parties have paid.
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin"></div>
                            <span className="text-[10px] text-primary-700 font-semibold">Waiting for buyer...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Farmer hasn't paid — show blurred overlay with pay button
                    <div className="relative mt-2 rounded-xl overflow-hidden">
                      <div className="bg-primary-50 rounded-xl p-4 border border-primary-200 flex flex-col gap-3" style={{ filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none' }}>
                        <div className="flex items-center gap-2 text-primary-900">
                          <Phone className="w-4 h-4" />
                          <h4 className="font-bold text-xs">Buyer Contact Details</h4>
                        </div>
                        <div className="flex flex-col gap-1 text-[11px] text-primary-950 font-medium">
                          <span>Representative: <strong>████████████</strong></span>
                          <span>Phone: <strong>██████████</strong></span>
                          <span>Location: <strong>█████████████</strong></span>
                        </div>
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-xl">
                        <div className="flex flex-col items-center gap-2 text-center px-4">
                          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <Lock className="w-5 h-5 text-amber-700" />
                          </div>
                          <h4 className="text-xs font-bold text-text-primary">Pay Brokerage Fee to Unlock</h4>
                          <p className="text-[10px] text-text-secondary leading-relaxed">
                            A platform brokerage fee of <strong className="text-primary-700">₹{(offer.brokerage_amount || 0).toLocaleString()}</strong> ({offer.brokerage_percentage || 0}%) is required to view buyer contact details.
                          </p>
                          <Button
                            variant="primary"
                            size="sm"
                            className="mt-1 text-xs"
                            onClick={() => navigate(`/pay-brokerage/${offer.id}?role=farmer`)}
                          >
                            <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                            Pay ₹{(offer.brokerage_amount || 0).toLocaleString()} Brokerage
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                ) : null}

                {/* Actions */}
                {offer.status === 'pending' && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-border-light">
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => handleAction(offer.id, 'rejected')}
                      size="sm"
                      className="text-xs font-semibold text-error hover:bg-error-light"
                      loading={actionLoading === offer.id}
                      disabled={actionLoading !== null}
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Decline Offer
                    </Button>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => handleAction(offer.id, 'accepted')}
                      size="sm"
                      className="text-xs font-semibold"
                      loading={actionLoading === offer.id}
                      disabled={actionLoading !== null}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Accept Deal
                    </Button>
                  </div>
                )}
              </Card>
            );
          })
        ) : (
          <div className="text-center py-12 bg-surface border border-dashed rounded-2xl">
            <span className="text-4xl block mb-2 select-none">💬</span>
            <h4 className="font-bold text-text-primary text-sm">No Offers Yet</h4>
            <p className="text-xs text-text-secondary mt-1">Offers will appear here as soon as buyers check your listings.</p>
          </div>
        )}
      </div>
    </div>
  );
}
