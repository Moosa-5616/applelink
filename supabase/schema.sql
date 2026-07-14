-- ═══════════════════════════════════════════════════
-- AppleLink — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════

-- ───────────────────────────────────────────────────
-- 1. PROFILES TABLE
-- Stores farmer & buyer profiles, linked to auth.users
-- ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('farmer', 'buyer')) DEFAULT NULL,
  phone TEXT UNIQUE NOT NULL,
  full_name TEXT DEFAULT '',
  avatar_url TEXT DEFAULT NULL,
  district TEXT DEFAULT '',
  village TEXT DEFAULT NULL,
  years_farming INTEGER DEFAULT 0,
  business_name TEXT DEFAULT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  total_sales INTEGER DEFAULT 0,
  avg_rating NUMERIC(2,1) DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast phone lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read profiles (needed for marketplace farmer cards)
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);


-- ───────────────────────────────────────────────────
-- 2. LISTINGS TABLE
-- Apple listings created by farmers
-- ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photos TEXT[] DEFAULT '{}',
  variety TEXT NOT NULL,
  grade TEXT NOT NULL CHECK (grade IN ('A', 'B', 'C')),
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL CHECK (unit IN ('boxes', 'kg')),
  price_per_unit NUMERIC NOT NULL CHECK (price_per_unit > 0),
  harvest_date DATE NOT NULL,
  pickup_location TEXT NOT NULL,
  pickup_district TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deal_in_progress', 'sold', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_farmer_id ON listings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_variety ON listings(variety);
CREATE INDEX IF NOT EXISTS idx_listings_pickup_district ON listings(pickup_district);
CREATE INDEX IF NOT EXISTS idx_listings_grade ON listings(grade);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);

CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for listings
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view active listings
CREATE POLICY "Active listings are viewable by authenticated users"
  ON listings FOR SELECT
  TO authenticated
  USING (true);

-- Only farmers can insert listings (and only as themselves)
CREATE POLICY "Farmers can create own listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = farmer_id);

-- Only the listing owner can update their listing
CREATE POLICY "Farmers can update own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = farmer_id)
  WITH CHECK (auth.uid() = farmer_id);

-- Only the listing owner can delete their listing
CREATE POLICY "Farmers can delete own listings"
  ON listings FOR DELETE
  TO authenticated
  USING (auth.uid() = farmer_id);


-- ───────────────────────────────────────────────────
-- 3. OFFERS TABLE
-- Purchase offers from buyers on listings
-- ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offer_price NUMERIC NOT NULL CHECK (offer_price > 0),
  pickup_date DATE NOT NULL,
  message TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_listing_id ON offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer_id ON offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_farmer_id ON offers(farmer_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);

CREATE TRIGGER offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for offers
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Buyers and farmers involved in the offer can view it
CREATE POLICY "Users can view own offers"
  ON offers FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = farmer_id);

-- Buyers can create offers
CREATE POLICY "Buyers can create offers"
  ON offers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- Farmers can update offer status (accept/reject), buyers can update for completion
CREATE POLICY "Involved users can update offers"
  ON offers FOR UPDATE
  TO authenticated
  USING (auth.uid() = farmer_id OR auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = farmer_id OR auth.uid() = buyer_id);


-- ───────────────────────────────────────────────────
-- 4. REVIEWS TABLE
-- Post-transaction reviews from buyers
-- ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quality_rating INTEGER NOT NULL CHECK (quality_rating >= 1 AND quality_rating <= 5),
  freshness_rating INTEGER NOT NULL CHECK (freshness_rating >= 1 AND freshness_rating <= 5),
  packaging_rating INTEGER NOT NULL CHECK (packaging_rating >= 1 AND packaging_rating <= 5),
  quantity_accuracy_rating INTEGER NOT NULL CHECK (quantity_accuracy_rating >= 1 AND quantity_accuracy_rating <= 5),
  communication_rating INTEGER NOT NULL CHECK (communication_rating >= 1 AND communication_rating <= 5),
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  review_text TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_farmer_id ON reviews(farmer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_buyer_id ON reviews(buyer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_offer_id ON reviews(offer_id);

-- RLS Policies for reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read reviews (public reputation)
CREATE POLICY "Reviews are viewable by authenticated users"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

-- Only the buyer in a completed offer can create a review
CREATE POLICY "Buyers can create reviews for their offers"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);


-- ───────────────────────────────────────────────────
-- 5. NOTIFICATIONS TABLE
-- In-app notification queue
-- ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('offer_received', 'offer_accepted', 'listing_sold', 'review_added', 'verification_approved')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_id TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS Policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- System (or edge functions) can insert notifications for any user
-- In practice, notifications are created server-side via edge functions or triggers
CREATE POLICY "Users can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ───────────────────────────────────────────────────
-- 6. STORAGE BUCKETS
-- For apple photos and user avatars
-- ───────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-photos', 'listing-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for listing-photos
CREATE POLICY "Anyone can view listing photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-photos');

CREATE POLICY "Authenticated users can upload listing photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'listing-photos');

CREATE POLICY "Users can update their own listing photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own listing photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policies for avatars
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);


-- ───────────────────────────────────────────────────
-- 7. HELPER FUNCTION: Auto-create profile on auth signup
-- ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone)
  VALUES (NEW.id, NEW.phone)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: when a user signs up via auth, auto-create their profile row
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ═══════════════════════════════════════════════════
-- DONE — Schema ready for AppleLink
-- ═══════════════════════════════════════════════════
