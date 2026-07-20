-- ═══════════════════════════════════════════════════
-- AppleLink — Mandatory Reviews & AI Migration
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════

-- 1. Modify OFFERS table to track who has submitted reviews
ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS farmer_reviewed_buyer BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS buyer_reviewed_farmer BOOLEAN DEFAULT FALSE;

-- 2. Modify REVIEWS table to support bidirectional reviews
ALTER TABLE reviews
  ALTER COLUMN quality_rating DROP NOT NULL,
  ALTER COLUMN freshness_rating DROP NOT NULL,
  ALTER COLUMN packaging_rating DROP NOT NULL,
  ALTER COLUMN quantity_accuracy_rating DROP NOT NULL;

-- Drop constraints if they exist, to ensure we can re-add or bypass them if null
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_quality_rating_check;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_freshness_rating_check;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_packaging_rating_check;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_quantity_accuracy_rating_check;

ALTER TABLE reviews
  ADD CONSTRAINT reviews_quality_rating_check CHECK (quality_rating IS NULL OR (quality_rating >= 1 AND quality_rating <= 5)),
  ADD CONSTRAINT reviews_freshness_rating_check CHECK (freshness_rating IS NULL OR (freshness_rating >= 1 AND freshness_rating <= 5)),
  ADD CONSTRAINT reviews_packaging_rating_check CHECK (packaging_rating IS NULL OR (packaging_rating >= 1 AND packaging_rating <= 5)),
  ADD CONSTRAINT reviews_quantity_accuracy_rating_check CHECK (quantity_accuracy_rating IS NULL OR (quantity_accuracy_rating >= 1 AND quantity_accuracy_rating <= 5));

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS payment_reliability_rating INTEGER CHECK (payment_reliability_rating IS NULL OR (payment_reliability_rating >= 1 AND payment_reliability_rating <= 5)),
  ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- 3. Modify PROFILES table for AI Authenticity
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ai_authenticity_status TEXT DEFAULT 'Pending' CHECK (ai_authenticity_status IN ('Pending', 'Authentic', 'Suspicious', 'Fraudulent')),
  ADD COLUMN IF NOT EXISTS ai_authenticity_reason TEXT DEFAULT NULL;

-- 4. Update Policies for Reviews
-- Drop existing insert policy to replace it with bidirectional logic
DROP POLICY IF EXISTS "Buyers can create reviews for their offers" ON reviews;

CREATE POLICY "Participants can create reviews for their offers"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = farmer_id);

-- ═══════════════════════════════════════════════════
-- DONE — Migration complete
-- ═══════════════════════════════════════════════════
