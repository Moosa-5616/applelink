-- ═══════════════════════════════════════════════════
-- AppleLink — Schema Migration
-- Adds buyer quantity selection + brokerage fee tracking
-- Run this in your Supabase SQL Editor AFTER the initial schema
-- ═══════════════════════════════════════════════════

-- 1. Add offer_quantity to offers table (buyer can request partial quantity)
ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS offer_quantity NUMERIC DEFAULT NULL;

-- 2. Add brokerage fee tracking columns
ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS brokerage_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS brokerage_percentage NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS brokerage_paid_farmer BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS brokerage_paid_buyer BOOLEAN DEFAULT FALSE;

-- ═══════════════════════════════════════════════════
-- DONE — Migration complete
-- ═══════════════════════════════════════════════════
