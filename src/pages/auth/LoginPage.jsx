import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Phone, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

export default function LoginPage() {
  const { sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = Phone Input, 2 = OTP Verification
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number with country code (e.g. +91XXXXXXXXXX)');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await sendOtp(phoneNumber);
      if (result.success) {
        setStep(2);
      } else {
        setError(result.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await verifyOtp(phoneNumber, otp);
      if (response.success) {
        if (response.roleSelected) {
          navigate(from, { replace: true });
        } else {
          navigate('/select-role', { replace: true });
        }
      } else {
        setError(response.error || 'Invalid OTP code. Please try again.');
      }
    } catch (err) {
      setError('Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="flex flex-col items-center gap-2 mb-8 select-none">
        <div className="w-16 h-16 rounded-2xl shadow-elevated overflow-hidden flex items-center justify-center bg-surface border border-border">
          <img src="/logo.png" alt="AppleLink" className="w-full h-full object-cover" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Apple<span className="text-primary-600">Link</span>
          </h1>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Direct farmer to buyer marketplace
          </p>
        </div>
      </div>

      <Card className="w-full max-w-sm" padding="lg">
        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
            <div className="text-center">
              <h2 className="text-lg font-bold text-text-primary">Welcome to AppleLink</h2>
              <p className="text-xs text-text-secondary mt-1">
                Enter your mobile number to receive a verification OTP code via SMS.
              </p>
            </div>

            <Input
              label="Phone Number"
              type="tel"
              placeholder="+91 XXXXX XXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              icon={Phone}
              error={error}
              required
              disabled={loading}
              helper="Enter your phone number with country code (e.g. +919876543210)"
            />

            <Button
              type="submit"
              fullWidth
              loading={loading}
              iconRight={ArrowRight}
            >
              Get OTP Verification Code
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
            <div className="text-center">
              <h2 className="text-lg font-bold text-text-primary text-center">Enter Verification Code</h2>
              <p className="text-xs text-text-secondary mt-1">
                We sent a 6-digit verification code to
                <span className="font-semibold text-text-primary block">{phoneNumber}</span>
              </p>
            </div>

            <Input
              label="OTP Code"
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              icon={Lock}
              error={error}
              required
              disabled={loading}
              helper="Check your SMS messages for the code"
            />

            <Button
              type="submit"
              fullWidth
              loading={loading}
            >
              Verify & Log In
            </Button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError('');
                setOtp('');
              }}
              className="text-xs text-center font-semibold text-primary-600 hover:text-primary-700 cursor-pointer"
              disabled={loading}
            >
              Change Phone Number
            </button>
          </form>
        )}
      </Card>

      {/* Safety Badges */}
      <div className="flex items-center gap-1.5 mt-6 text-text-muted">
        <ShieldCheck className="w-4 h-4 text-primary-600" />
        <span className="text-[10px] font-semibold tracking-wide uppercase">Secured by AppleLink Integrity System</span>
      </div>
    </div>
  );
}
