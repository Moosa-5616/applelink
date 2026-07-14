import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, Briefcase, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DISTRICTS } from '../../lib/constants';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

export default function RoleSelectPage() {
  const { selectRole } = useAuth();
  const navigate = useNavigate();
  
  const [selectedRole, setSelectedRole] = useState(null); // 'farmer' | 'buyer'
  const [fullName, setFullName] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [yearsFarming, setYearsFarming] = useState('');
  const [businessName, setBusinessName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }
    if (!fullName) {
      setError('Please enter your full name');
      return;
    }
    if (!district) {
      setError('Please select/enter your district');
      return;
    }

    setLoading(true);
    setError('');

    const profileData = {
      full_name: fullName,
      district,
    };

    if (selectedRole === 'farmer') {
      profileData.village = village;
      profileData.years_farming = parseInt(yearsFarming) || 0;
    } else {
      profileData.business_name = businessName;
    }

    try {
      const res = await selectRole(selectedRole, profileData);
      if (res.success) {
        navigate('/', { replace: true });
      } else {
        setError(res.error || 'Failed to setup profile');
      }
    } catch (err) {
      setError('Failed to setup profile layout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-black text-text-primary mb-2 text-center">Complete Your Profile</h1>
        <p className="text-sm text-text-secondary text-center mb-6">Select your account type and tell us a bit about yourself.</p>

        {error && (
          <div className="bg-error-light text-error text-xs p-3 rounded-xl mb-4 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Card Selectors */}
          <div className="grid grid-cols-2 gap-4">
            {/* Farmer Card */}
            <button
              type="button"
              onClick={() => {
                setSelectedRole('farmer');
                setError('');
              }}
              className={`text-left focus:outline-none transition-all cursor-pointer ${
                selectedRole === 'farmer'
                  ? 'ring-2 ring-primary-600 scale-102'
                  : 'hover:scale-101'
              }`}
            >
              <Card
                className={`h-full ${selectedRole === 'farmer' ? 'bg-primary-50/50 border-primary-500' : 'bg-surface'}`}
                padding="md"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  selectedRole === 'farmer' ? 'bg-primary-100 text-primary-700' : 'bg-background-alt text-text-secondary'
                }`}>
                  <Sprout className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-text-primary text-sm">Apple Farmer</h3>
                <p className="text-xs text-text-secondary mt-1">I want to list apples and receive purchase offers.</p>
              </Card>
            </button>

            {/* Buyer Card */}
            <button
              type="button"
              onClick={() => {
                setSelectedRole('buyer');
                setError('');
              }}
              className={`text-left focus:outline-none transition-all cursor-pointer ${
                selectedRole === 'buyer'
                  ? 'ring-2 ring-primary-600 scale-102'
                  : 'hover:scale-101'
              }`}
            >
              <Card
                className={`h-full ${selectedRole === 'buyer' ? 'bg-primary-50/50 border-primary-500' : 'bg-surface'}`}
                padding="md"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  selectedRole === 'buyer' ? 'bg-primary-100 text-primary-700' : 'bg-background-alt text-text-secondary'
                }`}>
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-text-primary text-sm">Verified Buyer</h3>
                <p className="text-xs text-text-secondary mt-1">I want to browse listings and send offers to farmers.</p>
              </Card>
            </button>
          </div>

          {/* Form details input */}
          {selectedRole && (
            <Card className="flex flex-col gap-4 animate-fade-in" padding="lg">
              <h4 className="font-bold text-text-primary border-b border-border-light pb-2 text-sm">
                Profile Details ({selectedRole === 'farmer' ? 'Farmer Info' : 'Business Info'})
              </h4>

              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                required
                disabled={loading}
              />

              <Select
                label="District"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                options={DISTRICTS}
                placeholder="Select District"
                required
                disabled={loading}
              />

              {selectedRole === 'farmer' ? (
                <>
                  <Input
                    label="Village"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="Enter village name"
                    disabled={loading}
                  />

                  <Input
                    label="Years of Farming (Optional)"
                    type="number"
                    value={yearsFarming}
                    onChange={(e) => setYearsFarming(e.target.value)}
                    placeholder="e.g. 5"
                    disabled={loading}
                    min="0"
                  />
                </>
              ) : (
                <Input
                  label="Business / Company Name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. FreshMart Supermarkets"
                  required
                  disabled={loading}
                />
              )}

              <Button
                type="submit"
                fullWidth
                loading={loading}
                iconRight={ArrowRight}
                className="mt-2"
              >
                Complete Registration
              </Button>
            </Card>
          )}
        </form>
      </div>
    </div>
  );
}
