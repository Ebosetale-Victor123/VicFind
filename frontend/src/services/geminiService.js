// Helper: fetch with a timeout so a stalled request on slow networks doesn't hang forever
function fetchWithTimeout(url, options, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      controller.abort()
      reject(new Error('Request timed out'))
    }, timeoutMs)

    fetch(url, { ...options, signal: controller.signal })
      .then(res => { clearTimeout(timer); resolve(res) })
      .catch(err => { clearTimeout(timer); reject(err) })
  })
}

// Helper: wait
const wait = ms => new Promise(r => setTimeout(r, ms))

export async function analyzeFoundItem(imageBase64, mimeType, lostItems) {
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

  const body = JSON.stringify({
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
  })

  // Retry up to 3 times with increasing delays — handles dropped requests on weak networks
  const MAX_RETRIES = 3
  let lastError = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body,
        },
        35000  // 35s timeout — generous for slow connections
      )

      if (!response.ok) {
        // 429 (rate limit) or 5xx — worth retrying
        if (response.status === 429 || response.status >= 500) {
          lastError = new Error(`Groq returned ${response.status}`)
          console.warn(`Groq attempt ${attempt} failed with ${response.status}, retrying...`)
          await wait(attempt * 1500)  // 1.5s, 3s, 4.5s
          continue
        }
        // Other errors (400 etc.) — don't retry, no point
        console.error(`Groq returned ${response.status}`)
        return []
      }

      const data = await response.json()
      const raw = data?.choices?.[0]?.message?.content
      if (!raw) return []

      const text = raw.replace(/```json|```/g, '').trim()
      try {
        const matches = JSON.parse(text)
        return Array.isArray(matches) ? matches : []
      } catch (parseErr) {
        // AI returned non-JSON (rare) — try to salvage a JSON array if present
        const arrayMatch = text.match(/\[[\s\S]*\]/)
        if (arrayMatch) {
          try {
            const salvaged = JSON.parse(arrayMatch[0])
            return Array.isArray(salvaged) ? salvaged : []
          } catch { /* fall through */ }
        }
        console.error('Groq returned unparseable response:', text.slice(0, 200))
        return []
      }
    } catch (err) {
      lastError = err
      console.warn(`Groq attempt ${attempt} failed:`, err.message)
      if (attempt < MAX_RETRIES) {
        await wait(attempt * 1500)  // back off before retrying
      }
    }
  }

  // All retries exhausted — log and return empty so the app still saves the item
  console.error('Groq error after all retries:', lastError?.message)
  return []
}