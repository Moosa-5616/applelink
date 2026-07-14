import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Filter, X, Eye } from 'lucide-react';
import { APPLE_VARIETIES, DISTRICTS, GRADES } from '../../lib/constants';
import { getListings } from '../../lib/database';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import TrustScore from '../../components/ui/TrustScore';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

export default function Marketplace() {
  const navigate = useNavigate();

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedVariety, setSelectedVariety] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);

  // Fetch listings from Supabase with filters
  useEffect(() => {
    const fetchListings = async () => {
      setLoadingListings(true);
      try {
        const { data, error } = await getListings({
          variety: selectedVariety || undefined,
          district: selectedDistrict || undefined,
          grade: selectedGrade || undefined,
          minPrice: minPrice ? parseFloat(minPrice) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
          onlyVerified,
          searchTerm: searchTerm || undefined,
        });

        if (error) {
          console.error('Error fetching listings:', error);
        } else {
          setListings(data || []);
        }
      } catch (err) {
        console.error('Error fetching listings:', err);
      } finally {
        setLoadingListings(false);
      }
    };

    // Debounce search term
    const timer = setTimeout(fetchListings, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedDistrict, selectedVariety, selectedGrade, minPrice, maxPrice, onlyVerified]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDistrict('');
    setSelectedVariety('');
    setSelectedGrade('');
    setMinPrice('');
    setMaxPrice('');
    setOnlyVerified(false);
  };

  return (
    <div className="page-container flex flex-col gap-4">
      {/* Search & Filter Header */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Search variety, district, or farmer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={SearchIcon}
              className="w-full"
            />
          </div>
          <Button
            variant={showFilters ? 'primary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="shrink-0 flex items-center justify-center rounded-xl"
            size="md"
          >
            <Filter className="w-4 h-4 mr-1.5" />
            Filter
          </Button>
        </div>

        {/* Filter Drawer / Accordion */}
        {showFilters && (
          <Card className="flex flex-col gap-4 animate-fade-in bg-background-alt/30 border-dashed" padding="lg">
            <div className="flex justify-between items-center pb-2 border-b border-border/80">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Advanced Filters</h3>
              <button 
                onClick={clearFilters}
                className="text-xs font-bold text-primary-600 hover:text-primary-750 cursor-pointer"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Select
                label="Variety"
                value={selectedVariety}
                onChange={(e) => setSelectedVariety(e.target.value)}
                options={APPLE_VARIETIES}
                placeholder="All varieties"
              />

              <Select
                label="District"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                options={DISTRICTS}
                placeholder="All districts"
              />

              <Select
                label="Grade"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                options={GRADES}
                placeholder="All grades"
              />

              <Input
                label="Min Price (₹)"
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />

              <Input
                label="Max Price (₹)"
                type="number"
                placeholder="No limit"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />

              <div className="flex flex-col justify-center gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">Orchard Badges</label>
                <label className="flex items-center gap-2 text-sm font-medium text-text-primary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyVerified}
                    onChange={(e) => setOnlyVerified(e.target.checked)}
                    className="w-4.5 h-4.5 border-border rounded text-primary-600 focus:ring-primary-500 accent-primary-600 cursor-pointer"
                  />
                  Verified Only
                </label>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Listing Counter / Helper Info */}
      <div className="flex justify-between items-center text-xs font-medium text-text-secondary mt-1">
        <span>
          {loadingListings ? 'Loading listings...' : `Found ${listings.length} matching active listings`}
        </span>
      </div>

      {/* Listings List */}
      <div className="flex flex-col gap-4">
        {loadingListings ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-xs text-text-secondary">Loading listings...</p>
          </div>
        ) : listings.length > 0 ? (
          listings.map((listing) => (
            <Card 
              key={listing.id}
              hoverable
              padding="none"
              className="overflow-hidden relative flex flex-col cursor-pointer"
              onClick={() => navigate(`/marketplace/${listing.id}`)}
            >
              <div className="flex">
                {/* Visual placeholder box for Apple photo */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-primary-50 to-primary-100/50 flex/col items-center justify-center shrink-0 border-r border-border flex flex-col justify-center">
                  {listing.photos && listing.photos.length > 0 ? (
                    <img src={listing.photos[0]} alt={listing.variety} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <span className="text-3xl select-none">🍎</span>
                      <span className="text-[10px] font-black text-primary-800 uppercase tracking-widest mt-1 bg-white/70 px-1.5 py-0.2 rounded">
                        {listing.grade} GRADE
                      </span>
                    </>
                  )}
                </div>

                {/* Details layout */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Varietal Header */}
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-text-primary text-sm sm:text-base leading-tight">
                        {listing.variety}
                      </h3>
                      <span className="text-xs font-extrabold text-primary-600 leading-none">
                        ₹{listing.price_per_unit}/{listing.unit === 'boxes' ? 'box' : 'kg'}
                      </span>
                    </div>

                    {/* Farmer reputation info */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs font-semibold text-text-secondary leading-none">
                        {listing.farmer?.full_name || 'Unknown Farmer'}
                      </span>
                      {listing.farmer?.is_verified && (
                        <span className="text-[9px] bg-primary-150 text-primary-800 font-bold px-1 rounded-full text-center">✓ Verified</span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-end mt-3 border-t border-border-light pt-2 gap-2 flex-wrap">
                    {/* Location + Quantity */}
                    <div className="flex flex-col text-[11px] text-text-secondary gap-0.5">
                      <span>Store: <strong className="text-text-primary">{listing.quantity} {listing.unit}</strong></span>
                      <span>District: <strong className="text-text-primary">{listing.pickup_district}</strong></span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Interactive score badge */}
                      <TrustScore score={listing.farmer?.trust_score || 0} size="sm" showLabel={false} />
                      
                      <Button variant="ghost" size="sm" className="p-1 rounded-lg">
                        <Eye className="w-4 h-4 text-text-secondary" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 bg-surface border border-border border-dashed rounded-2xl">
            <span className="text-4xl block mb-2 select-none">🔍</span>
            <h4 className="font-bold text-text-primary text-sm">No Listings Found</h4>
            <p className="text-xs text-text-secondary mt-1">Try clearing your filters or altering search keywords.</p>
            <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
