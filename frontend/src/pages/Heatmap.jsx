import { useEffect, useState, useRef } from 'react'
import { getLostItems, getFoundItems } from '../services/firestoreService'
import LoadingSpinner from '../components/LoadingSpinner'

const CALEB_CENTER = { lat: 6.6687, lng: 3.6366 }
const CALEB_BOUNDS = { north: 6.6730, south: 6.6640, east: 3.6420, west: 3.6300 }
const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// Shared across all mounts/calls so concurrent loadMap() runs (e.g. StrictMode
// double-invoke, fast remounts) await the same in-flight script load instead
// of injecting duplicate <script> tags and racing each other to define window.google
let mapsLoadPromise = null
function loadGoogleMapsScript() {
  if (window.google?.maps) return Promise.resolve()
  if (!mapsLoadPromise) {
    mapsLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=visualization`
      script.onload = resolve
      script.onerror = () => { mapsLoadPromise = null; reject(new Error('Failed to load Google Maps script')) }
      document.head.appendChild(script)
    })
  }
  return mapsLoadPromise
}

const KNOWN_LOCATIONS = {
  'library': { lat: 6.6689, lng: 3.6358 }, 'e-library': { lat: 6.6689, lng: 3.6358 },
  'cafeteria': { lat: 6.6685, lng: 3.6355 }, 'cafe': { lat: 6.6685, lng: 3.6355 }, 'canteen': { lat: 6.6685, lng: 3.6355 },
  'chapel': { lat: 6.6690, lng: 3.6370 }, 'church': { lat: 6.6690, lng: 3.6370 },
  'caleb hall': { lat: 6.6682, lng: 3.6375 },
  'deborah': { lat: 6.6675, lng: 3.6362 },
  'esme': { lat: 6.6668, lng: 3.6370 },
  'sport': { lat: 6.6679, lng: 3.6348 }, 'field': { lat: 6.6679, lng: 3.6348 },
  'architecture': { lat: 6.6695, lng: 3.6372 },
  'gate': { lat: 6.6670, lng: 3.6340 }, 'entrance': { lat: 6.6670, lng: 3.6340 },
  'admin': { lat: 6.6688, lng: 3.6360 },
  'hostel': { lat: 6.6695, lng: 3.6352 },
  'male': { lat: 6.6698, lng: 3.6352 },
  'female': { lat: 6.6672, lng: 3.6368 },
  'parking': { lat: 6.6675, lng: 3.6345 },
}

function resolveLocation(item) {
  if (item.gps) return item.gps
  const text = (item.location || '').toLowerCase()
  for (const [key, coords] of Object.entries(KNOWN_LOCATIONS)) {
    if (text.includes(key)) return coords
  }
  return null
}

async function geocode(locationText) {
  try {
    const query = encodeURIComponent(`${locationText}, Caleb University, Imota, Lagos, Nigeria`)
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${MAPS_KEY}`)
    const data = await res.json()
    if (data.results?.[0]) return data.results[0].geometry.location
  } catch (e) {}
  return null
}

export default function Heatmap() {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const [loading, setLoading] = useState(true)
  const [lostItems, setLostItems] = useState([])
  const [foundItems, setFoundItems] = useState([])
  const [stats, setStats] = useState({ lost: 0, found: 0, hotspots: [] })
  const [analyticsTab, setAnalyticsTab] = useState('lost')
  const [locationBreakdown, setLocationBreakdown] = useState([])

  useEffect(() => { loadMap() }, [])

  function focusMarker(coords) {
    if (!mapInstance.current || !coords) return
    mapInstance.current.panTo(coords)
    mapInstance.current.setZoom(19)
  }

  async function loadMap() {
    setLoading(true)
    try {
      await loadGoogleMapsScript()

      const map = new window.google.maps.Map(mapRef.current, {
        center: CALEB_CENTER, zoom: 17, mapTypeId: 'hybrid', tilt: 0,
        restriction: { latLngBounds: CALEB_BOUNDS, strictBounds: false },
        zoomControl: true, mapTypeControl: true,
        mapTypeControlOptions: { mapTypeIds: ['hybrid', 'roadmap'] },
        streetViewControl: false, fullscreenControl: true,
      })
      mapInstance.current = map

      // Wait for map to fully initialize before placing markers
      await new Promise(resolve => setTimeout(resolve, 100))

      const [lost, found] = await Promise.all([getLostItems(), getFoundItems()])
      setLostItems(lost)
      setFoundItems(found)

      const locationCounts = {}
      const markers = []

      for (const item of lost) {
        let coords = resolveLocation(item)
        if (!coords && item.location) coords = await geocode(item.location)
        if (!coords) continue
        item._coords = coords

        const key = `${Math.round(coords.lat * 1000)},${Math.round(coords.lng * 1000)}`
        if (!locationCounts[key]) locationCounts[key] = { count: 0, coords, label: item.location || 'Unknown', items: [] }
        locationCounts[key].count++
        locationCounts[key].items.push(item.itemName)

        const marker = new window.google.maps.Marker({
          position: coords, map,
          icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#ff4d6d', fillOpacity: 0.95, strokeColor: '#fff', strokeWeight: 2.5 },
          title: item.itemName, zIndex: 10,
        })
        const iw = new window.google.maps.InfoWindow({
          content: `<div style="font-family:Inter,sans-serif;padding:12px;max-width:220px;background:#13131f;color:#eeeef5;border-radius:10px">
            <div style="color:#ff4d6d;font-size:11px;font-weight:700;margin-bottom:6px">🔴 LOST ITEM</div>
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">${item.itemName}</div>
            <div style="font-size:12px;color:#6b6b8a">📍 ${item.location || 'Unknown'}</div>
            <div style="font-size:12px;color:#6b6b8a">👤 ${item.name}</div>
            ${item.phone ? `<div style="font-size:12px;color:#00d4aa;margin-top:4px">📞 ${item.phone}</div>` : ''}
            ${item.imei ? `<div style="font-size:11px;color:#6c63ff;margin-top:4px">IMEI: ${item.imei}</div>` : ''}
          </div>`,
        })
        marker.addListener('click', () => { markers.forEach(m => m.iw.close()); iw.open(map, marker) })
        markers.push({ marker, iw })
      }

      for (const item of found) {
        let coords = resolveLocation(item)
        if (!coords && item.location) coords = await geocode(item.location)
        if (!coords) continue
        item._coords = coords

        const marker = new window.google.maps.Marker({
          position: coords, map,
          icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#00d4aa', fillOpacity: 0.95, strokeColor: '#fff', strokeWeight: 2.5 },
          title: `Found by ${item.finderName}`, zIndex: 10,
        })
        const iw = new window.google.maps.InfoWindow({
          content: `<div style="font-family:Inter,sans-serif;padding:12px;max-width:220px;background:#13131f;color:#eeeef5;border-radius:10px">
            <div style="color:#00d4aa;font-size:11px;font-weight:700;margin-bottom:6px">🟢 FOUND ITEM</div>
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">Found by ${item.finderName}</div>
            <div style="font-size:12px;color:#6b6b8a">📍 ${item.location || 'Unknown'}</div>
            ${item.finderPhone ? `<div style="font-size:12px;color:#00d4aa;margin-top:4px">📞 ${item.finderPhone}</div>` : ''}
            ${item.matches?.length > 0 ? `<div style="font-size:12px;color:#6c63ff;margin-top:4px">🤖 ${item.matches.length} AI match${item.matches.length > 1 ? 'es' : ''}</div>` : ''}
          </div>`,
        })
        marker.addListener('click', () => { markers.forEach(m => m.iw.close()); iw.open(map, marker) })
        markers.push({ marker, iw })
      }

      const hotspots = Object.values(locationCounts).filter(l => l.count >= 3)
      for (const spot of hotspots) {
        new window.google.maps.Circle({
          strokeColor: '#ff4d6d', strokeOpacity: 0.9, strokeWeight: 2,
          fillColor: '#ff4d6d', fillOpacity: 0.18,
          map, center: spot.coords, radius: 40,
        })
      }

      const breakdown = Object.values(locationCounts).sort((a, b) => b.count - a.count)
      setLocationBreakdown(breakdown)
      setStats({ lost: lost.length, found: found.length, hotspots })

    } catch (err) {
      console.error('Map error:', err)
    } finally {
      setLoading(false)
    }
  }

  const maxCount = Math.max(...locationBreakdown.map(l => l.count), 1)

  return (
    <div style={{ minHeight: '100vh', padding: '7rem 1.5rem 4rem' }}>
      <style>{`
        .heatmap-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .analytics-tabs { display: flex; gap: 8px; }
        @media (max-width: 500px) {
          .heatmap-stats { grid-template-columns: 1fr 1fr !important; }
          .heatmap-stats > div:last-child { grid-column: 1 / -1; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.02em' }}>Campus Heatmap</h1>
          <p style={{ fontFamily: 'Inter', color: 'var(--muted)' }}>Live satellite map of lost and found items across Caleb University, Ota.</p>
        </div>

        {/* Stats */}
        <div className="heatmap-stats" style={{ marginBottom: 24 }}>
          {[
            { val: stats.lost, color: '#ff4d6d', label: '🔴 Items Lost' },
            { val: stats.found, color: '#00d4aa', label: '🟢 Items Found' },
            { val: stats.hotspots.length, color: '#f59e0b', label: '🔥 High Risk Zones' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '1.5rem', color: s.color }}>{s.val}</div>
              <div style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Hotspot warning */}
        {stats.hotspots.length > 0 && (
          <div style={{ marginBottom: 16, padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,77,109,0.3)', backgroundColor: 'rgba(255,77,109,0.08)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span>⚠️</span>
            <div>
              <p style={{ fontFamily: 'Space Mono', fontWeight: 700, color: '#ff4d6d', margin: '0 0 4px', fontSize: '0.85rem' }}>High Risk Zones Detected</p>
              <p style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>
                {stats.hotspots.map(h => h.label).join(', ')} — multiple items lost here. Stay alert!
              </p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 12, flexWrap: 'wrap' }}>
          {[
            { color: '#ff4d6d', label: 'Lost item' },
            { color: '#00d4aa', label: 'Found item' },
            { color: 'rgba(255,77,109,0.3)', label: 'High risk zone', circle: true },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: l.circle ? 16 : 12, height: l.circle ? 16 : 12, borderRadius: '50%', backgroundColor: l.color, border: l.circle ? '2px solid #ff4d6d' : 'none', flexShrink: 0 }} />
              <span style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'var(--muted)' }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Map */}
        <div style={{ position: 'relative', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--border)', height: '55vw', minHeight: 300, maxHeight: 520, marginBottom: 12, boxShadow: 'var(--shadow-card)' }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: 'var(--card)' }}>
              <LoadingSpinner size="lg" />
              <p style={{ fontFamily: 'Inter', color: 'var(--muted)' }}>Loading Caleb University map...</p>
            </div>
          )}
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        </div>

        <p style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 40 }}>
          Click any marker to see item details. Locations resolved from building names typed by users.
        </p>

        {/* Analytics Panel */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '1rem', color: 'var(--text)', margin: 0 }}>📊 Location Analytics</h2>
            <div className="analytics-tabs">
              {['lost', 'found'].map(t => (
                <button key={t} onClick={() => setAnalyticsTab(t)} style={{
                  fontFamily: 'Inter', fontWeight: 500, fontSize: '0.8rem', padding: '0.3rem 0.875rem',
                  borderRadius: '0.4rem', cursor: 'pointer', border: '1px solid',
                  borderColor: analyticsTab === t ? (t === 'lost' ? '#ff4d6d' : '#00d4aa') : 'var(--border)',
                  backgroundColor: analyticsTab === t ? (t === 'lost' ? 'rgba(255,77,109,0.1)' : 'rgba(0,212,170,0.1)') : 'transparent',
                  color: analyticsTab === t ? (t === 'lost' ? '#ff4d6d' : '#00d4aa') : 'var(--muted)',
                }}>
                  {t === 'lost' ? '🔴 Lost' : '🟢 Found'}
                </button>
              ))}
            </div>
          </div>

          {analyticsTab === 'lost' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {locationBreakdown.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontFamily: 'Space Mono', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 12 }}>HOTSPOT LOCATIONS</p>
                  {locationBreakdown.slice(0, 6).map((loc, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <span style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'var(--muted)', width: 100, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.label}</span>
                      <div style={{ flex: 1, height: 8, borderRadius: 999, backgroundColor: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(loc.count / maxCount) * 100}%`, backgroundColor: '#ff4d6d', borderRadius: 999, transition: 'width 0.7s ease' }} />
                      </div>
                      <span style={{ fontFamily: 'Space Mono', fontSize: '0.8rem', color: '#ff4d6d', width: 20 }}>{loc.count}</span>
                    </div>
                  ))}
                </div>
              )}

              <p style={{ fontFamily: 'Space Mono', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 8 }}>ALL LOST ITEMS</p>
              {lostItems.length === 0 ? (
                <p style={{ fontFamily: 'Inter', color: 'var(--muted)', fontSize: '0.875rem' }}>No lost items yet.</p>
              ) : lostItems.map((item, i) => (
                <div key={i} onClick={() => item._coords && focusMarker(item._coords)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '0.75rem', borderRadius: '0.75rem', cursor: 'pointer', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#ff4d6d'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.status === 'active' ? '#ff4d6d' : '#00d4aa', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.itemName}</p>
                      <p style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: 'var(--muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {item.location} · 👤 {item.name}</p>
                    </div>
                  </div>
                  <span style={{ fontFamily: 'Inter', fontSize: '0.65rem', padding: '2px 8px', borderRadius: 999, backgroundColor: item.status === 'active' ? 'rgba(255,77,109,0.12)' : 'rgba(0,212,170,0.12)', color: item.status === 'active' ? '#ff4d6d' : '#00d4aa', flexShrink: 0 }}>{item.status}</span>
                </div>
              ))}
            </div>
          )}

          {analyticsTab === 'found' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontFamily: 'Space Mono', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 8 }}>ALL FOUND ITEMS</p>
              {foundItems.length === 0 ? (
                <p style={{ fontFamily: 'Inter', color: 'var(--muted)', fontSize: '0.875rem' }}>No found items yet.</p>
              ) : foundItems.map((item, i) => (
                <div key={i} onClick={() => item._coords && focusMarker(item._coords)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '0.75rem', borderRadius: '0.75rem', cursor: 'pointer', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#00d4aa'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#00d4aa', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', margin: 0 }}>Found by {item.finderName}</p>
                      <p style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: 'var(--muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {item.location} · 📞 {item.finderPhone || 'N/A'}{item.matches?.length > 0 ? ` · 🤖 ${item.matches.length} match${item.matches.length > 1 ? 'es' : ''}` : ''}</p>
                    </div>
                  </div>
                  <span style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: 'var(--muted)', flexShrink: 0 }}>🔍</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}