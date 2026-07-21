// ═══════════════════════════════════════════════════
// AppleLink — App Constants
// Static values used throughout the application
// ═══════════════════════════════════════════════════

export const APPLE_VARIETIES = [
  'Akane', 'Alice', 'Alkmene', 'Ambri', 'Ambrosia', 'Anna', 'Arkansas Black', 
  'Ashmead\'s Kernel', 'Aurora Golden Gala', 'Baldwin', 'Banana', 'Braeburn', 
  'Bramley', 'Cameo', 'Campanino', 'Cortland', 'Cosmic Crisp', 'Court Pendu Plat', 
  'Cox\'s Orange Pippin', 'Cripps Pink (Pink Lady)', 'Crispin (Mutsu)', 'D\'Arcy Spice', 
  'Discovery', 'Egremont Russet', 'Empire', 'Enterprise', 'Envy', 'Fuji', 'Gala', 
  'Ginger Gold', 'Golden Delicious', 'Granny Smith', 'Gravenstein', 'Haralson', 
  'Honeycrisp', 'Idared', 'Jazz', 'Jersey Mac', 'Jonagold', 'Jonathan', 'Kashmiri', 
  'Liberty', 'Lodi', 'Macoun', 'Maharaji', 'McIntosh', 'Melrose', 'Mutsu', 
  'Newtown Pippin', 'Northern Spy', 'Opal', 'Orin', 'Pacific Rose', 'Paula Red', 
  'Pinova', 'Red Delicious', 'Rome Beauty', 'Royal Delicious', 'Rubens', 'Salome', 
  'Shimla', 'Spartan', 'Stayman', 'Suncrisp', 'SweeTango', 'Topaz', 'Wealthy', 
  'Winesap', 'Winter Banana', 'Wolf River', 'York', 'Zestar', 'Other'
]

export const DISTRICTS = [
  'Shopian', 'Pulwama', 'Anantnag', 'Baramulla',
  'Kupwara', 'Budgam', 'Kulgam', 'Shimla',
  'Kullu', 'Kinnaur', 'Manali', 'Srinagar'
]

export const GRADES = ['A', 'B', 'C']
export const UNITS = ['boxes', 'kg']

// AI Reputation summary generator
// Summarizes verified buyer feedback and transaction history
export function generateAIReputationSummary(farmer, reviews) {
  if (!reviews || reviews.length === 0) {
    return 'This farmer is new to AppleLink. No verified reviews yet.'
  }

  const avgOverall = reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length
  const avgQuality = reviews.reduce((sum, r) => sum + r.quality_rating, 0) / reviews.length
  const avgFreshness = reviews.reduce((sum, r) => sum + r.freshness_rating, 0) / reviews.length

  if (avgOverall >= 4.5) {
    return `This farmer has completed ${farmer.total_sales} verified sales. Buyers consistently praise the freshness of the apples, accurate grading, and reliable communication. Most deliveries match the listed quantity and quality. Highly recommended for bulk orders.`
  } else if (avgOverall >= 3.5) {
    return `This farmer has completed ${farmer.total_sales} verified sales with generally positive feedback. Buyers appreciate the apple quality though some noted minor inconsistencies in grading. Communication is responsive and deliveries are timely.`
  } else {
    return `Recent buyers reported inconsistent grading across several orders. Buyers should review the latest feedback before purchasing. The farmer has completed ${farmer.total_sales} sales total.`
  }
}


// ───────────────────────────────────────────────────
// BROKERAGE FEE SYSTEM
// Tiered brokerage based on order value (B2B wholesale rates)
// ───────────────────────────────────────────────────

export const BROKERAGE_TIERS = [
  { maxValue: 50000,   percentage: 7 },   // ≤ ₹50K → 7%
  { maxValue: 200000,  percentage: 6 },   // ₹50K–₹2L → 6%
  { maxValue: 500000,  percentage: 4 },   // ₹2L–₹5L → 4%
  { maxValue: Infinity, percentage: 3 },  // > ₹5L → 3%
]

/**
 * Calculate brokerage fee based on total order value
 * @param {number} orderValue - Total value (quantity × price per unit)
 * @returns {{ percentage: number, amount: number }}
 */
export function calculateBrokerageFee(orderValue) {
  if (!orderValue || orderValue <= 0) return { percentage: 0, amount: 0 }

  const tier = BROKERAGE_TIERS.find(t => orderValue <= t.maxValue)
  const percentage = tier ? tier.percentage : 3
  const amount = Math.round((orderValue * percentage) / 100)

  return { percentage, amount }
}

// Coupon code that bypasses the fake payment gateway
export const BYPASS_COUPON_CODE = 'Moosa@123'
