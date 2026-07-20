import { supabase } from './supabase';

/**
 * Interface with Groq API to analyze user authenticity based on their reviews.
 */
export async function analyzeAuthenticity(profileId, role) {
  try {
    // 1. Fetch all reviews where this user was the reviewee
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', profileId);

    if (error) throw error;
    
    // If they have no reviews, keep them pending
    if (!reviews || reviews.length === 0) {
      await updateAiAuthenticity(profileId, 'Pending', 'Not enough reviews for AI analysis yet.');
      return;
    }

    // 2. Format reviews for the LLM
    const reviewsText = reviews.map((r, i) => `
      Review ${i + 1}:
      Overall Rating: ${r.overall_rating}/5
      Text: "${r.review_text || 'No text provided'}"
      Communication: ${r.communication_rating}/5
      ${r.payment_reliability_rating ? `Payment Reliability: ${r.payment_reliability_rating}/5` : ''}
      ${r.quality_rating ? `Quality: ${r.quality_rating}/5` : ''}
    `).join('\n');

    const prompt = `
      You are an AI Trust & Safety auditor for an agricultural B2B marketplace.
      A ${role} has received the following reviews from their trading partners:
      
      ${reviewsText}
      
      Based ONLY on these reviews, classify this ${role} into one of three categories:
      1. Authentic: The user seems reliable, communicates well, and fulfills their side of the deal (payment or produce quality).
      2. Suspicious: There are minor red flags, inconsistent ratings, or vague complaints, but not enough to ban them.
      3. Fraudulent: Clear signs of scamming, completely failing to pay, or completely fake produce/scams.
      
      Return a pure JSON object in exactly this format:
      {
        "status": "Authentic" | "Suspicious" | "Fraudulent",
        "reason": "A 1-2 sentence explanation of your decision based on the reviews."
      }
    `;

    const apiKey = import.meta.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn('Groq API Key not found. Skipping AI analysis.');
      return;
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0
      })
    });

    const result = await response.json();
    if (result.choices && result.choices[0] && result.choices[0].message) {
      // Strip markdown code blocks if present
      let content = result.choices[0].message.content;
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const aiResponse = JSON.parse(content);
      
      if (aiResponse.status && aiResponse.reason) {
        // 3. Update the profile with the new AI status
        await updateAiAuthenticity(profileId, aiResponse.status, aiResponse.reason);
      }
    }
  } catch (err) {
    console.error('Error analyzing AI authenticity:', err);
  }
}

/**
 * Updates the ai_authenticity_status of a profile
 */
export async function updateAiAuthenticity(profileId, status, reason) {
  const { error } = await supabase
    .from('profiles')
    .update({ 
      ai_authenticity_status: status,
      ai_authenticity_reason: reason 
    })
    .eq('id', profileId);

  if (error) {
    console.error('Failed to update AI status:', error);
  }
}
