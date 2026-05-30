import emailjs from '@emailjs/browser'

export async function sendMatchEmail({
  ownerName, ownerEmail, itemName, confidence, reasoning,
  finderName, foundItemId, lostItemId, mapLink
}) {
  try {
    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      {
        owner_name: ownerName,
        to_email: ownerEmail,
        item_name: itemName,
        confidence,
        reasoning,
        finder_name: finderName || 'Someone',
        email_subject: 'Possible Match Found!',
        email_intro: 'Great news! Our AI found a possible match for your lost item:',
        finder_phone_line: '',
        found_location_line: '',
        reward_line: '',
        claim_link: `${window.location.origin}/verify/${lostItemId}/${foundItemId}`,
        map_link: mapLink || `${window.location.origin}/heatmap`,
        cta_display: 'display:block',
        reunion_display: 'display:none',
        owner_reunion_id: '',
        finder_reunion_id: '',
      },
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    )
    console.log('Match email sent to', ownerEmail)
  } catch (err) {
    console.error('Owner email error:', err)
  }
}

export async function sendOwnerReunionEmail({
  ownerName, ownerEmail, itemName, finderName, finderPhone,
  ownerReunionId, finderReunionId, reward, foundLocation
}) {
  try {
    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      {
        owner_name: ownerName,
        to_email: ownerEmail,
        item_name: itemName,
        confidence: '',
        reasoning: '',
        finder_name: finderName,
        email_subject: '🎉 Your Item Is Coming Back!',
        email_intro: `You confirmed your item has been found! Here is everything you need to arrange the handover:`,
        finder_phone_line: `📞 Finder's Phone: ${finderPhone || 'Not provided'}`,
        found_location_line: `📍 Found at: ${foundLocation || 'Unknown'}`,
        reward_line: reward ? `💰 Reward to give: ${reward}` : '',
        claim_link: '',
        map_link: '',
        cta_display: 'display:none',
        reunion_display: 'display:block',
        owner_reunion_id: ownerReunionId || 'N/A',
        finder_reunion_id: finderReunionId || 'N/A',
      },
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    )
    console.log('Owner reunion email sent to', ownerEmail)
  } catch (err) {
    console.error('Owner reunion email error:', err)
  }
}

export async function sendFinderEmail({
  finderName, finderEmail, ownerName, ownerPhone,
  itemName, reward, ownerReunionId, finderReunionId
}) {
  try {
    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_FINDER_TEMPLATE_ID,
      {
        to_email: finderEmail,
        finder_name: finderName || 'Finder',
        owner_name: ownerName,
        owner_phone: ownerPhone || 'Not provided',
        item_name: itemName,
        reward: reward || 'No reward specified',
        owner_reunion_id: ownerReunionId || 'N/A',
        finder_reunion_id: finderReunionId || 'N/A',
      },
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    )
    console.log('Finder email sent to', finderEmail)
  } catch (err) {
    console.error('Finder email error:', err)
  }
}