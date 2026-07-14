import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, CheckCircle, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DISTRICTS } from '../../lib/constants';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import TrustScore from '../../components/ui/TrustScore';

export default function Profile() {
  const { profile, role, logout, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [district, setDistrict] = useState(profile?.district || '');
  const [village, setVillage] = useState(profile?.village || '');
  const [yearsFarming, setYearsFarming] = useState(profile?.years_farming?.toString() || '');
  const [businessName, setBusinessName] = useState(profile?.business_name || '');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      const profileData = {
        full_name: fullName,
        district,
        ...(role === 'farmer' ? {
          village,
          years_farming: parseInt(yearsFarming) || 0,
        } : {
          business_name: businessName,
        }),
      };

      const result = await updateUserProfile(profileData);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="page-container flex flex-col gap-5">
      {/* Header back navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-surface border border-border text-text-secondary hover:bg-background-alt cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-text-secondary">My Profile Settings</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-xs font-bold text-error hover:bg-error-light"
        >
          <LogOut className="w-4 h-4 mr-1" />
          Log Out
        </Button>
      </div>

      {/* Profile Overview Card */}
      <Card className="flex items-center justify-between" padding="lg">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-primary-150 rounded-2xl flex items-center justify-center text-primary-700 text-xl font-bold font-sans">
            {fullName ? fullName.charAt(0) : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm text-text-primary">{fullName || 'Apple Partner'}</h3>
              {profile?.is_verified && (
                <span className="text-[10px] bg-primary-100 text-primary-800 font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3 text-primary-600 fill-current" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-secondary mt-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              {profile?.phone}
            </p>
          </div>
        </div>
        
        {role === 'farmer' && (
          <TrustScore score={profile?.trust_score || 80} size="sm" showLabel={false} />
        )}
      </Card>

      {success && (
        <div className="bg-success-light text-success text-xs font-bold p-3.5 rounded-xl border border-primary-200 animate-fade-in flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-primary-600" />
          Profile settings updated successfully.
        </div>
      )}

      {error && (
        <div className="bg-error-light text-error text-xs font-bold p-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Editor Form */}
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4" padding="lg">
          <h3 className="font-bold text-text-primary text-xs uppercase tracking-wider border-b border-border-light pb-2">
            Personal Information
          </h3>

          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter name"
            required
            disabled={loading}
          />

          <Select
            label="District"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            options={DISTRICTS}
            placeholder="Select district"
            required
            disabled={loading}
          />

          {role === 'farmer' ? (
            <>
              <Input
                label="Village Address"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="Enter village"
                disabled={loading}
              />
              <Input
                label="Years of Farming Experience"
                type="number"
                value={yearsFarming}
                onChange={(e) => setYearsFarming(e.target.value)}
                placeholder="e.g. 10"
                disabled={loading}
                min="0"
              />
            </>
          ) : (
            <Input
              label="Business/Company Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Delhi Fruit Wholesalers"
              required
              disabled={loading}
            />
          )}

          <Button
            type="submit"
            fullWidth
            loading={loading}
            className="mt-2"
          >
            Save Changes
          </Button>
        </Card>
      </form>
    </div>
  );
}
