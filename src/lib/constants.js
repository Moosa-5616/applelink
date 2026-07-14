// ═══════════════════════════════════════════════════
// AppleLink — App Constants
// Static values used throughout the application
// ═══════════════════════════════════════════════════

export const APPLE_VARIETIES = [
  'Royal Delicious', 'Golden Delicious', 'Red Delicious',
  'Shimla', 'Kashmiri', 'Ambri', 'Maharaji',
  'Fuji', 'Granny Smith', 'Honeycrisp', 'Gala'
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
