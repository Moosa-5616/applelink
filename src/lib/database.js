// ═══════════════════════════════════════════════════
// AppleLink — Centralized Data Access Layer
// All Supabase database operations in one place
// ═══════════════════════════════════════════════════

import { supabase } from './supabase'

// ───────────────────────────────────────────────────
// PROFILES
// ───────────────────────────────────────────────────

/**
 * Get the current authenticated user's profile
 */
export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { data, error }
}

/**
 * Get a profile by its ID (for viewing other users)
 */
export async function getProfileById(id) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  return { data, error }
}

/**
 * Update the current user's profile
 */
export async function updateProfile(profileData) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }

  const { data, error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', user.id)
    .select()
    .single()

  return { data, error }
}


// ───────────────────────────────────────────────────
// LISTINGS
// ───────────────────────────────────────────────────

/**
 * Get listings with optional filters
 * @param {Object} filters - { variety, district, grade, minPrice, maxPrice, onlyVerified, searchTerm }
 */
export async function getListings(filters = {}) {
  let query = supabase
    .from('listings')
    .select(`
      *,
      farmer:profiles!farmer_id (
        id, full_name, avatar_url, district, village,
        is_verified, trust_score, total_sales, avg_rating, phone
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (filters.variety) {
    query = query.eq('variety', filters.variety)
  }
  if (filters.district) {
    query = query.eq('pickup_district', filters.district)
  }
  if (filters.grade) {
    query = query.eq('grade', filters.grade)
  }
  if (filters.minPrice) {
    query = query.gte('price_per_unit', filters.minPrice)
  }
  if (filters.maxPrice) {
    query = query.lte('price_per_unit', filters.maxPrice)
  }
  if (filters.searchTerm) {
    query = query.or(
      `variety.ilike.%${filters.searchTerm}%,pickup_district.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`
    )
  }

  const { data, error } = await query

  // Client-side filter for verified sellers (since it's on a joined table)
  let filteredData = data
  if (filters.onlyVerified && filteredData) {
    filteredData = filteredData.filter(l => l.farmer?.is_verified)
  }

  return { data: filteredData, error }
}

/**
 * Get a single listing by ID with farmer profile
 */
export async function getListingById(id) {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      farmer:profiles!farmer_id (
        id, full_name, avatar_url, district, village, phone,
        is_verified, trust_score, total_sales, avg_rating, years_farming
      )
    `)
    .eq('id', id)
    .single()

  return { data, error }
}

/**
 * Create a new listing
 */
export async function createListing(listingData) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }

  const { data, error } = await supabase
    .from('listings')
    .insert({
      ...listingData,
      farmer_id: user.id,
    })
    .select()
    .single()

  return { data, error }
}

/**
 * Update a listing's status
 */
export async function updateListingStatus(id, status) {
  const { data, error } = await supabase
    .from('listings')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

/**
 * Upload a listing photo to Supabase Storage
 * @returns {string} Public URL of uploaded photo
 */
export async function uploadListingPhoto(file) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { url: null, error: new Error('Not authenticated') }

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('listing-photos')
    .upload(fileName, file)

  if (error) return { url: null, error }

  const { data: { publicUrl } } = supabase.storage
    .from('listing-photos')
    .getPublicUrl(fileName)

  return { url: publicUrl, error: null }
}


// ───────────────────────────────────────────────────
// OFFERS
// ───────────────────────────────────────────────────

/**
 * Get offers received by a farmer
 */
export async function getOffersForFarmer(farmerId) {
  const { data, error } = await supabase
    .from('offers')
    .select(`
      *,
      listing:listings (
        id, variety, grade, quantity, unit, price_per_unit,
        pickup_location, pickup_district, status,
        farmer:profiles!farmer_id (id, full_name, phone, is_verified, trust_score)
      ),
      buyer:profiles!buyer_id (
        id, full_name, phone, business_name, is_verified
      )
    `)
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false })

  return { data, error }
}

/**
 * Get offers sent by a buyer
 */
export async function getOffersForBuyer(buyerId) {
  const { data, error } = await supabase
    .from('offers')
    .select(`
      *,
      listing:listings (
        id, variety, grade, quantity, unit, price_per_unit,
        pickup_location, pickup_district, status,
        farmer:profiles!farmer_id (id, full_name, phone, is_verified, trust_score)
      ),
      buyer:profiles!buyer_id (
        id, full_name, phone, business_name, is_verified
      )
    `)
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false })

  return { data, error }
}

/**
 * Create a new offer on a listing
 */
export async function createOffer(offerData) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }

  const { data, error } = await supabase
    .from('offers')
    .insert({
      ...offerData,
      buyer_id: user.id,
    })
    .select()
    .single()

  // Create notification for the farmer
  if (data && !error) {
    await createNotification({
      user_id: offerData.farmer_id,
      type: 'offer_received',
      title: 'New Offer Received',
      message: `A buyer sent you an offer of ₹${offerData.offer_price} for your listing.`,
      related_id: data.id,
    })
  }

  return { data, error }
}

/**
 * Update an offer's status (accept/reject)
 */
export async function updateOfferStatus(offerId, status) {
  const { data, error } = await supabase
    .from('offers')
    .update({ status })
    .eq('id', offerId)
    .select(`
      *,
      listing:listings (id, variety, status),
      buyer:profiles!buyer_id (id, full_name)
    `)
    .single()

  // If accepted, update listing status and notify buyer
  if (data && !error && status === 'accepted') {
    await supabase
      .from('listings')
      .update({ status: 'deal_in_progress' })
      .eq('id', data.listing_id)

    await createNotification({
      user_id: data.buyer_id,
      type: 'offer_accepted',
      title: 'Offer Accepted!',
      message: `Your offer on ${data.listing?.variety || 'a listing'} has been accepted. Contact details have been exchanged.`,
      related_id: data.id,
    })
  }

  return { data, error }
}


// ───────────────────────────────────────────────────
// REVIEWS
// ───────────────────────────────────────────────────

/**
 * Get reviews for a farmer
 */
export async function getReviewsForFarmer(farmerId) {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      buyer:profiles!buyer_id (
        id, full_name, business_name
      )
    `)
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false })

  return { data, error }
}

/**
 * Create a review for a completed offer
 */
export async function createReview(reviewData) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      ...reviewData,
      buyer_id: user.id,
    })
    .select()
    .single()

  // Create notification for the farmer
  if (data && !error) {
    await createNotification({
      user_id: reviewData.farmer_id,
      type: 'review_added',
      title: 'New Review',
      message: `A buyer left a ${reviewData.overall_rating}-star review on your profile.`,
      related_id: data.id,
    })
  }

  return { data, error }
}


// ───────────────────────────────────────────────────
// NOTIFICATIONS
// ───────────────────────────────────────────────────

/**
 * Get notifications for a user
 */
export async function getNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  return { data, error }
}

/**
 * Mark all notifications as read for a user
 */
export async function markNotificationsRead(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  return { data, error }
}

/**
 * Create a notification
 */
export async function createNotification(notifData) {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notifData)
    .select()
    .single()

  return { data, error }
}


// ───────────────────────────────────────────────────
// DASHBOARD STATS
// ───────────────────────────────────────────────────

/**
 * Get dashboard stats for the current user
 */
export async function getDashboardStats(userId, role) {
  const stats = {
    activeListingsCount: 0,
    incomingOffersCount: 0,
    userDealsCount: 0,
  }

  if (role === 'farmer') {
    // Count active listings
    const { count: listingsCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('farmer_id', userId)
      .eq('status', 'active')

    stats.activeListingsCount = listingsCount || 0

    // Count pending offers
    const { count: offersCount } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true })
      .eq('farmer_id', userId)
      .eq('status', 'pending')

    stats.incomingOffersCount = offersCount || 0

    // Count accepted deals
    const { count: dealsCount } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true })
      .eq('farmer_id', userId)
      .eq('status', 'accepted')

    stats.userDealsCount = dealsCount || 0
  } else {
    // Count buyer's accepted deals
    const { count: dealsCount } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true })
      .eq('buyer_id', userId)
      .eq('status', 'accepted')

    stats.userDealsCount = dealsCount || 0
  }

  return stats
}
