export async function analyzeFoundItem(imageBase64, mimeType, lostItems) {
  try {
    const lostItemsText = lostItems.map(item =>
      `ID: ${item.id} | Item: ${item.itemName} | Color: ${item.color} | Category: ${item.category} | Description: ${item.description} | Lost by: ${item.name} | Email: ${item.email} | Phone: ${item.phone || 'N/A'}${item.imei ? ` | IMEI: ${item.imei}` : ''}`
    ).join('\n')

    const prompt = `You are an AI assistant for VicFind, a campus lost and found system at Caleb University, Ota. Analyze the provided image of a found item and compare it against the lost item descriptions below.

CRITICAL RULES:
- You MUST first correctly identify what the item in the photo actually is (phone, power bank, mouse, calculator, bag, keys, earbuds, charger, etc.)
- Do NOT match based on color or shape alone — the item TYPE must match
- A power bank is NOT a mouse. A phone is NOT a calculator. Earbuds are NOT keys. Be precise.
- Only give confidence above 60 if the item type AND description closely match
- Only give confidence above 80 if you are very certain it's the same specific item
- If the found item is clearly a different type of item than what's listed, give 0 confidence or exclude it entirely

Lost items database:
${lostItemsText}

Return ONLY a valid JSON array (no markdown, no code fences) in this exact format:
[{"lostItemId":"firestore_doc_id","ownerName":"name","ownerEmail":"email","ownerPhone":"phone","itemName":"item name","confidence":87,"reasoning":"I identified the found item as a [type]. This matches/doesn't match because..."}]

Rules:
- First state what you identified the found item as in your reasoning
- Return up to 3 matches maximum
- Only include items with confidence above 30
- If the item type doesn't match ANY lost item, return []
- confidence is a number 0-100
- Be specific about visual features in reasoning`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
            { type: 'text', text: prompt },
          ],
        }],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    })

    const data = await response.json()
    const text = data.choices[0].message.content.replace(/```json|```/g, '').trim()
    const matches = JSON.parse(text)
    return Array.isArray(matches) ? matches : []
  } catch (err) {
    console.error('Groq error:', err)
    return []
  }
}