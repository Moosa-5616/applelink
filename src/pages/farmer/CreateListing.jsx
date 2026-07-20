import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sprout, Camera, ChevronRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useReviewCheck } from '../../contexts/ReviewContext';
import { APPLE_VARIETIES, DISTRICTS, GRADES, UNITS } from '../../lib/constants';
import { createListing, uploadListingPhoto } from '../../lib/database';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';

export default function CreateListing() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { withReviewCheck } = useReviewCheck();

  const [step, setStep] = useState(1); // 1 = Details, 2 = Confirmation, 3 = Success
  const [variety, setVariety] = useState('');
  const [grade, setGrade] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('boxes');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [harvestDate, setHarvestDate] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupDistrict, setPickupDistrict] = useState('');
  const [description, setDescription] = useState('');
  const [photoFiles, setPhotoFiles] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || []);
    setPhotoFiles(prev => [...prev, ...files].slice(0, 5)); // Max 5 photos
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!variety || !grade || !quantity || !expectedPrice || !harvestDate || !pickupDistrict || !pickupLocation) {
      setError('Please fill in all required setup details');
      return;
    }
    setError('');
    setStep(2);
  };

  const handlePublish = withReviewCheck(async () => {
    setLoading(true);
    setError('');

    try {
      // Upload photos first
      const photoUrls = [];
      for (const file of photoFiles) {
        const { url, error: uploadError } = await uploadListingPhoto(file);
        if (uploadError) {
          console.error('Photo upload error:', uploadError);
        } else if (url) {
          photoUrls.push(url);
        }
      }

      // Create the listing in Supabase
      const { data, error: listingError } = await createListing({
        photos: photoUrls,
        variety,
        grade,
        quantity: parseFloat(quantity),
        unit,
        price_per_unit: parseFloat(expectedPrice),
        harvest_date: harvestDate,
        pickup_location: pickupLocation,
        pickup_district: pickupDistrict,
        description: description || `Fresh Grade ${grade} ${variety} apples direct from our orchard in ${pickupLocation}.`,
      });

      if (listingError) throw listingError;

      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to publish listing. Please try again.');
    } finally {
      setLoading(false);
    }
  });

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
        <span className="text-sm font-semibold text-text-secondary">Create Apple Listing</span>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center gap-3 justify-center text-xs font-semibold py-1">
        <span className={`px-2 py-0.5 rounded-full ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-border text-text-secondary'}`}>1. Details</span>
        <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
        <span className={`px-2 py-0.5 rounded-full ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-border text-text-secondary'}`}>2. Preview</span>
        <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
        <span className={`px-2 py-0.5 rounded-full ${step >= 3 ? 'bg-primary-600 text-white' : 'bg-border text-text-secondary'}`}>3. Success</span>
      </div>

      {step === 1 && (
        <form onSubmit={handleNext} className="flex flex-col gap-4">
          <Card className="flex flex-col gap-4" padding="lg">
            <h3 className="font-bold text-text-primary text-sm flex items-center gap-1.5 border-b border-border-light pb-2">
              <Sprout className="w-4 h-4 text-primary-600" />
              Apple Specifications
            </h3>

            {error && <div className="text-xs bg-error-light text-error p-3 rounded-xl font-semibold">{error}</div>}

            {/* Apple Variety Selection */}
            <Select
              label="Apple Variety"
              value={variety}
              onChange={(e) => setVariety(e.target.value)}
              options={APPLE_VARIETIES}
              placeholder="Select apple variety"
              required
            />

            {/* Grade Selection */}
            <Select
              label="Apple Grade (Quality Class)"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              options={GRADES.map(g => ({ value: g, label: `Grade ${g} (Standard Grade Class)` }))}
              placeholder="Select quality grade"
              required
            />

            {/* Quantity + Unit */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Total Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 500"
                required
                min="1"
              />
              <Select
                label="Unit Class"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                options={UNITS.map(u => ({ value: u, label: u === 'boxes' ? 'Boxes (approx 20kg)' : 'Kilograms (KGs)' }))}
                placeholder="Unit Type"
                required
              />
            </div>

            {/* Expected Price */}
            <Input
              label={`Expected Price per ${unit === 'boxes' ? 'box' : 'kg'} (₹)`}
              type="number"
              value={expectedPrice}
              onChange={(e) => setExpectedPrice(e.target.value)}
              placeholder="e.g. 1200"
              required
              min="1"
            />

            <Input
              label="Target Harvest Date"
              type="date"
              value={harvestDate}
              onChange={(e) => setHarvestDate(e.target.value)}
              required
            />
          </Card>

          {/* Pickup and descriptions */}
          <Card className="flex flex-col gap-4" padding="lg">
            <h3 className="font-bold text-text-primary text-sm flex items-center gap-1.5 border-b border-border-light pb-2">
              <Camera className="w-4 h-4 text-primary-600" />
              Pickup & Orchard Details
            </h3>

            <Select
              label="District Location"
              value={pickupDistrict}
              onChange={(e) => setPickupDistrict(e.target.value)}
              options={DISTRICTS}
              placeholder="Select Pickup District"
              required
            />

            <Input
              label="Pickup Village/Orchard Address"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              placeholder="e.g. Zainapora orchard, near checkpoint"
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Short Description (Optional)</label>
              <textarea
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 active:outline-none"
                rows="3"
                placeholder="Details about pesticide sprays, storage conditions, transit crates..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Photo Upload */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Apple Photos (Optional, max 5)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="text-xs text-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              {photoFiles.length > 0 && (
                <p className="text-[10px] text-text-muted">{photoFiles.length} photo(s) selected</p>
              )}
            </div>
          </Card>

          <Button type="submit" fullWidth className="mt-2" iconRight={ChevronRight}>
            Continue to Preview Listing
          </Button>
        </form>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <Card padding="none" className="overflow-hidden">
            <div className="h-44 bg-gradient-to-br from-primary-50 to-primary-100/40 flex items-center justify-center relative">
              {photoFiles.length > 0 ? (
                <img src={URL.createObjectURL(photoFiles[0])} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl select-none">🍎</span>
              )}
              <div className="absolute top-4 left-4">
                <Badge variant="grade" size="lg">{grade} Grade</Badge>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-bold text-text-primary">{variety} apples</h3>
                <p className="text-xs text-text-secondary mt-1">{pickupLocation}, {pickupDistrict}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border-light pt-3">
                <div>
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider block">Quantity</span>
                  <span className="text-sm font-bold text-text-primary mt-0.5">{quantity} {unit}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider block">Target Harvest</span>
                  <span className="text-sm font-bold text-text-primary mt-0.5">{new Date(harvestDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider block">Expected Price</span>
                  <span className="text-sm font-bold text-text-primary mt-0.5">₹{expectedPrice} / {unit === 'boxes' ? 'box' : 'kg'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider block">Total Estimated Value</span>
                  <span className="text-sm font-bold text-primary-600 mt-0.5">₹{(parseFloat(quantity) * parseFloat(expectedPrice)).toLocaleString()}</span>
                </div>
              </div>

              {description && (
                <div>
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider block">Description Details</span>
                  <p className="text-xs text-text-secondary mt-0.5">{description}</p>
                </div>
              )}
            </div>
          </Card>

          {error && <div className="text-xs bg-error-light text-error p-3 rounded-xl font-semibold">{error}</div>}

          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setStep(1)} disabled={loading}>
              Back to Edit
            </Button>
            <Button variant="primary" fullWidth onClick={handlePublish} loading={loading}>
              Publish & List Apples
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <Card className="bg-success-light text-center py-10 flex flex-col items-center gap-4 animate-fade-in" padding="lg">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-primary-900 text-lg">Listing Successfully Published!</h3>
            <p className="text-xs text-text-secondary mt-1">Verified buyers can now discovers your apples and send you direct offers.</p>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-xs mt-4">
            <Button variant="primary" fullWidth onClick={() => navigate('/marketplace')}>
              View on Marketplace
            </Button>
            <Button variant="outline" fullWidth onClick={() => navigate('/')}>
              Go to Homepage
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
