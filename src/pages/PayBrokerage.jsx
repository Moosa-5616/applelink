import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Shield, CheckCircle, Tag, Lock } from 'lucide-react';
import { getOfferById, updateBrokeragePaid } from '../lib/database';
import { BYPASS_COUPON_CODE } from '../lib/constants';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';

export default function PayBrokerage() {
  const { offerId } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'farmer'; // 'farmer' or 'buyer'
  const navigate = useNavigate();

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Fake card form
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    const fetchOffer = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await getOfferById(offerId);
        if (fetchError || !data) {
          console.error('Error fetching offer:', fetchError);
          setError('Could not load offer details.');
        } else {
          setOffer(data);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Something went wrong.');
      } finally {
        setLoading(false);
      }
    };

    if (offerId) fetchOffer();
  }, [offerId]);

  // Format card number with spaces
  const handleCardNumberChange = (value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Format expiry as MM/YY
  const handleExpiryChange = (value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      setExpiry(cleaned.slice(0, 2) + '/' + cleaned.slice(2));
    } else {
      setExpiry(cleaned);
    }
  };

  const handleApplyCoupon = () => {
    setCouponError('');
    if (couponCode.trim() === BYPASS_COUPON_CODE) {
      setCouponApplied(true);
      setCouponError('');
    } else {
      setCouponApplied(false);
      setCouponError('Invalid coupon code. Please try again.');
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setError('');

    // If coupon is not applied, validate card fields
    if (!couponApplied) {
      const cleanedCard = cardNumber.replace(/\s/g, '');
      if (cleanedCard.length !== 16) {
        setError('Please enter a valid 16-digit card number.');
        return;
      }
      if (!expiry || expiry.length < 5) {
        setError('Please enter a valid expiry date (MM/YY).');
        return;
      }
      if (!cvv || cvv.length < 3) {
        setError('Please enter a valid CVV.');
        return;
      }
      if (!cardName.trim()) {
        setError('Please enter the cardholder name.');
        return;
      }
    }

    setPaying(true);

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, couponApplied ? 800 : 2000));

      // Mark brokerage as paid in the database
      const { error: updateError } = await updateBrokeragePaid(offerId, role);
      if (updateError) {
        throw updateError;
      }

      setSuccess(true);

      // Redirect back after 3 seconds
      setTimeout(() => {
        if (role === 'farmer') {
          navigate('/offers');
        } else {
          navigate('/my-offers');
        }
      }, 3000);
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container text-center py-12">
        <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-xs text-text-secondary">Loading payment details...</p>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="page-container text-center py-12">
        <h2 className="text-lg font-bold text-text-primary">Offer Not Found</h2>
        <p className="text-xs text-text-secondary mt-2">This offer may have been removed or is no longer available.</p>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const listing = offer.listing || {};
  const orderValue = (offer.offer_quantity || 0) * (offer.offer_price || 0);
  const brokerageAmount = offer.brokerage_amount || 0;
  const brokeragePercentage = offer.brokerage_percentage || 0;

  // Success state
  if (success) {
    return (
      <div className="page-container flex flex-col gap-5 items-center justify-center py-12">
        <div className="animate-fade-in flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-extrabold text-text-primary">
              {couponApplied ? 'Coupon Applied Successfully!' : 'Payment Successful!'}
            </h2>
            <p className="text-xs text-text-secondary mt-2 max-w-xs">
              {couponApplied
                ? 'Your brokerage fee has been waived using the coupon code. Contact details are now unlocked!'
                : `₹${brokerageAmount.toLocaleString()} brokerage fee has been processed. Contact details are now unlocked!`
              }
            </p>
          </div>
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 text-center">
            <p className="text-[10px] text-primary-800">Redirecting you back in 3 seconds...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-surface border border-border text-text-secondary hover:bg-background-alt cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-text-secondary">Pay Brokerage Fee</span>
      </div>

      {/* Order Summary */}
      <Card className="flex flex-col gap-3" padding="lg">
        <h3 className="font-bold text-text-primary text-sm flex items-center gap-2 border-b border-border-light pb-2">
          <Shield className="w-4 h-4 text-primary-600" />
          Order Summary
        </h3>

        <div className="flex flex-col gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-text-secondary">Apple Variety:</span>
            <span className="font-semibold text-text-primary">{listing.variety || 'Unknown'} (Grade {listing.grade || '?'})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Price per {listing.unit === 'boxes' ? 'box' : 'kg'}:</span>
            <span className="font-semibold text-text-primary">₹{offer.offer_price}</span>
          </div>
          {offer.offer_quantity && (
            <div className="flex justify-between">
              <span className="text-text-secondary">Quantity:</span>
              <span className="font-semibold text-text-primary">{offer.offer_quantity} {listing.unit === 'boxes' ? 'boxes' : 'kgs'}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border-light pt-2">
            <span className="text-text-secondary font-medium">Total Order Value:</span>
            <span className="font-bold text-text-primary">₹{orderValue.toLocaleString()}</span>
          </div>
        </div>
      </Card>

      {/* Brokerage Fee Breakdown */}
      <Card className="flex flex-col gap-3 border-amber-200 bg-amber-50/30" padding="lg">
        <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-amber-700" />
          Brokerage Fee
          <Badge variant="warning" size="sm">{brokeragePercentage}%</Badge>
        </h3>

        <div className="flex flex-col gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-amber-800">Order Value:</span>
            <span className="font-semibold text-amber-950">₹{orderValue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-amber-800">Brokerage Rate:</span>
            <span className="font-semibold text-amber-950">{brokeragePercentage}%</span>
          </div>
          <div className="flex justify-between border-t border-amber-200 pt-2">
            <span className="text-amber-900 font-bold">Amount to Pay:</span>
            <span className="font-extrabold text-amber-950 text-sm">₹{brokerageAmount.toLocaleString()}</span>
          </div>
        </div>

        <p className="text-[10px] text-amber-700 leading-relaxed mt-1">
          This one-time fee unlocks {role === 'farmer' ? 'buyer' : 'farmer'} contact details so you can coordinate the deal directly. Both parties pay the same brokerage fee.
        </p>
      </Card>

      {/* Coupon Code Section */}
      <Card className="flex flex-col gap-3" padding="lg">
        <h3 className="font-bold text-text-primary text-sm flex items-center gap-2 border-b border-border-light pb-2">
          <Tag className="w-4 h-4 text-primary-600" />
          Have a Coupon Code?
        </h3>

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label="Coupon Code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter coupon code"
              disabled={couponApplied || paying}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleApplyCoupon}
            disabled={couponApplied || !couponCode.trim() || paying}
            className="mb-0.5 text-xs whitespace-nowrap"
          >
            {couponApplied ? '✓ Applied' : 'Apply'}
          </Button>
        </div>

        {couponApplied && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-800 font-semibold">
              Coupon applied! Brokerage fee is waived. Click "Complete Payment" below.
            </p>
          </div>
        )}

        {couponError && (
          <div className="text-xs bg-error-light text-error p-3 rounded-xl font-semibold">
            {couponError}
          </div>
        )}
      </Card>

      {/* Fake Payment Gateway */}
      {!couponApplied && (
        <Card className="flex flex-col gap-4" padding="lg">
          <h3 className="font-bold text-text-primary text-sm flex items-center gap-2 border-b border-border-light pb-2">
            <Lock className="w-4 h-4 text-primary-600" />
            Secure Payment
          </h3>

          <div className="flex items-center gap-2 text-[10px] text-text-muted bg-background-alt/50 rounded-lg p-2">
            <Shield className="w-3.5 h-3.5 text-primary-600 shrink-0" />
            <span>Your payment information is encrypted and secure. 256-bit SSL.</span>
          </div>

          <div className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Card Number</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => handleCardNumberChange(e.target.value)}
                placeholder="1234 5678 9012 3456"
                disabled={paying}
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none tracking-widest font-mono"
                maxLength={19}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">Expiry Date</label>
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => handleExpiryChange(e.target.value)}
                  placeholder="MM/YY"
                  disabled={paying}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none tracking-wider font-mono"
                  maxLength={5}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">CVV</label>
                <input
                  type="password"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="•••"
                  disabled={paying}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none tracking-widest font-mono"
                  maxLength={4}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Cardholder Name</label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Name on card"
                disabled={paying}
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Error */}
      {error && (
        <div className="text-xs bg-error-light text-error p-3 rounded-xl font-semibold">
          {error}
        </div>
      )}

      {/* Pay Button */}
      <Button
        variant="primary"
        fullWidth
        loading={paying}
        onClick={handlePayment}
        className="text-sm font-bold"
      >
        <CreditCard className="w-4 h-4 mr-2" />
        {couponApplied
          ? 'Complete Payment (Coupon Applied — ₹0)'
          : `Pay ₹${brokerageAmount.toLocaleString()} Brokerage Fee`
        }
      </Button>

      <p className="text-[10px] text-center text-text-muted pb-4">
        By proceeding, you agree to AppleLink's platform terms and brokerage policy.
      </p>
    </div>
  );
}
