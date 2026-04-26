import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import DashboardLayout from '../components/layout/DashboardLayout';
import api from '../api';

// Fix for default Leaflet icons (don't load correctly in some Vite setups)
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons for Donor and NGO (using high-precision SVG markers)
const donorIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41], // Center-bottom of the icon
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const ngoIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41], // Center-bottom of the icon
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper to calculate distance in km using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in km
}

// Component to handle map clicks/drags if using a center-based approach
function LocationMarker({ position, setPosition }) {
  const markerRef = useRef(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          setPosition(marker.getLatLng());
        }
      },
    }),
    [],
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={donorIcon}
    >
      <Popup>Your Pickup Location<br/>(Drag to adjust)</Popup>
    </Marker>
  );
}

export default function DonateFoodForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    food_type: '', quantity_kg: '', is_vegetarian: true,
    prepared_at: '', expires_at: '', address: '',
    lat: 28.6139, lng: 77.2090, // Default to New Delhi
    is_packed: false, notes: '',
  });

  const [ngos, setNgos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [searchRadius, setSearchRadius] = useState(15000); // meters (Initial 15km)
  const [success, setSuccess] = useState(false);

  // Sync coords from component state to form state
  const setPosition = (latlng) => {
    setScanning(true);
    setForm(prev => ({ ...prev, lat: latlng.lat, lng: latlng.lng }));
  };

  // Fetch Nearby NGOs when location changes
  useEffect(() => {
    const fetchNgos = async () => {
      setScanning(true);
      try {
        const res = await api.get(`/ngo/locations?lat=${form.lat}&lng=${form.lng}`);
        const allNgos = res.data;
        
        // Use backend-calculated distance if available, else calc locally
        const withDistances = allNgos.map(ngo => ({
          ...ngo,
          distance: ngo.distance || calculateDistance(form.lat, form.lng, ngo.lat, ngo.lng)
        })).sort((a, b) => a.distance - b.distance);
        
        setNgos(withDistances);

        // Adjust visualization radius based on farthest NGO (max 20km)
        if (withDistances.length > 0) {
           const maxDist = Math.max(...withDistances.map(n => n.distance));
           setSearchRadius(Math.max(5000, Math.min(20000, maxDist * 1000)));
        } else {
           setSearchRadius(20000); // 20km if none found
        }
      } catch (err) {
        console.error("Failed to fetch nearby NGOs", err);
      } finally {
        setScanning(false);
      }
    };
    
    const timeout = setTimeout(() => {
      fetchNgos();
    }, 500);
    return () => clearTimeout(timeout);
  }, [form.lat, form.lng]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Auth Check
    const demoRole = localStorage.getItem('rescuenet_demo_role');
    if (!demoRole && !Object.keys(localStorage).some(k => k.startsWith('firebase:authUser'))) {
       console.warn("Possible Auth Issue: No demo role or firebase user found in localStorage.");
    }

    setLoading(true);
    
    // Validation
    const qty = parseFloat(form.quantity_kg);
    if (!form.food_type || isNaN(qty) || qty <= 0) {
      setError('Please provide a valid food type and quantity (kg)');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...form,
        prepared_at: new Date(form.prepared_at).toISOString(),
        expires_at: new Date(form.expires_at).toISOString(),
        quantity_kg: parseFloat(form.quantity_kg),
        lat: parseFloat(form.lat) || 0,
        lng: parseFloat(form.lng) || 0,
      };

      console.log("Submitting donation payload:", payload);
      await api.post('/donations/', payload);
      setSuccess(true);
      setTimeout(() => navigate('/my-donations'), 2000);
    } catch (err) {
      console.error("Donation submission failed:", err);
      // If network error, provide a more helpful message
      if (err.message === 'Network Error') {
        setError('Network Error: Could not connect to the server. Please ensure the backend is running at http://localhost:8000 and check CORS settings.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <DashboardLayout title="Donate Food">
        <div className="flex flex-col items-center justify-center h-80 gap-4">
          <span className="text-6xl animate-bounce">🎉</span>
          <h2 className="text-xl font-bold text-brand-400">Donation Listed!</h2>
          <p className="text-surface-muted text-sm">Redirecting to your donations…</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Donate Surplus Food" subtitle="Drag the pin to find nearby NGOs to rescue your food">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
        <div className="glass p-6 order-2 lg:order-1">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-rose-400 text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-200 mb-3 text-sm uppercase tracking-wide">Food Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="food_type" className="label">Food Type</label>
                  <input id="food_type" name="food_type" required value={form.food_type} onChange={handleChange} placeholder="e.g. Rice & Dal" className="input" />
                </div>
                <div>
                  <label htmlFor="quantity_kg" className="label">Quantity (kg)</label>
                  <input id="quantity_kg" name="quantity_kg" type="number" step="0.1" min="0.1" required value={form.quantity_kg} onChange={handleChange} placeholder="e.g. 10.5" className="input" />
                </div>
                <div>
                  <label className="label">Category</label>
                  <div className="flex gap-2 mt-1">
                    {[{ val: true, label: '🟢 Veg' }, { val: false, label: '🔴 Non-Veg' }].map(opt => (
                      <label key={String(opt.val)} className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl border cursor-pointer text-xs font-medium transition-all ${form.is_vegetarian === opt.val ? 'border-brand-400 bg-brand-400/10 text-brand-300' : 'border-surface-border text-slate-400'}`}>
                        <input type="radio" name="is_vegetarian" className="hidden" checked={form.is_vegetarian === opt.val} onChange={() => setForm({ ...form, is_vegetarian: opt.val })} />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-200 mb-3 text-sm uppercase tracking-wide">Timing & Address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                <div>
                  <label htmlFor="prepared_at" className="label">Prepared At</label>
                  <input id="prepared_at" name="prepared_at" type="datetime-local" required value={form.prepared_at} onChange={handleChange} className="input" />
                </div>
                <div>
                  <label htmlFor="expires_at" className="label">Expires At</label>
                  <input id="expires_at" name="expires_at" type="datetime-local" required value={form.expires_at} onChange={handleChange} className="input" />
                </div>
              </div>
              <div>
                <label htmlFor="address" className="label">Pickup Address</label>
                <input id="address" name="address" required value={form.address} onChange={handleChange} placeholder="Full address mapped to pin..." className="input" />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="label">Notes (optional)</label>
              <textarea id="notes" name="notes" rows={2} value={form.notes} onChange={handleChange} placeholder="Handling instructions…" className="input resize-none" />
              <label className="flex items-center gap-3 mt-3 cursor-pointer group">
                <input id="is_packed" name="is_packed" type="checkbox" checked={form.is_packed} onChange={handleChange} className="w-4 h-4 rounded accent-brand-500" />
                <span className="text-sm text-slate-300">📦 Food is packed and ready</span>
              </label>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base mt-2">
              {loading ? 'Listing donation…' : '🍱 List Donation Now'}
            </button>
          </form>
        </div>

        {/* Map & Recommendations Panel */}
        <div className="order-1 lg:order-2 flex flex-col gap-4">
          {/* Map */}
          <div className="glass p-2 rounded-2xl h-64 sm:h-80 relative overflow-hidden z-0">
            <MapContainer 
              center={[form.lat, form.lng]} 
              zoom={12} 
              style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              
              {/* Scan Radius Visualization */}
              <Circle
                center={[form.lat, form.lng]}
                radius={searchRadius}
                pathOptions={{ 
                  color: scanning ? '#22c55e' : '#3b82f6', 
                  fillColor: scanning ? '#22c55e' : '#3b82f6',
                  fillOpacity: scanning ? 0.15 : 0.05,
                  dashArray: scanning ? '5, 10' : '0',
                  weight: 1
                }}
              />
              
              <LocationMarker position={[form.lat, form.lng]} setPosition={setPosition} />

              {/* Render NGO Markers */}
              {ngos.slice(0, 30).map(ngo => (
                <Marker 
                  key={ngo.uid} 
                  position={[ngo.lat, ngo.lng]} 
                  icon={ngoIcon}
                >
                  <Popup>
                    <strong>{ngo.name}</strong><br/>
                    {ngo.distance.toFixed(1)} km away
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Recommendations */}
          <div className="glass p-5">
            <h3 className="font-semibold text-slate-100 mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span>📍</span> 
                <span>NGOs Near You</span>
              </div>
              {scanning && <span className="text-[10px] bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full animate-pulse font-mono tracking-tighter">WIDE SCANNING (15KM)...</span>}
            </h3>
            {scanning && ngos.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-6 gap-2">
                 <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                 <p className="text-xs text-surface-muted italic">Searching a 15km area for partners...</p>
               </div>
            ) : ngos.length === 0 ? (
              <p className="text-sm text-surface-muted italic">No NGOs found near this location.</p>
            ) : (
              <div className="space-y-3">
                {ngos.slice(0, 15).map(ngo => (
                  <div key={ngo.uid} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-surface-border bg-surface-card/50 hover:border-brand-500/30 transition-colors">
                    <div>
                      <h4 className="font-medium text-slate-200 text-sm">{ngo.name}</h4>
                      <p className="text-xs text-brand-400 mt-1">{ngo.distance.toFixed(1)} km away • {ngo.address || 'Local'}</p>
                    </div>
                    <div className="mt-2 sm:mt-0 flex items-center gap-2">
                       <a href={`tel:${ngo.phone}`} className="text-xs bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 px-3 py-1.5 rounded-lg transition-colors border border-cyan-500/20">
                         📞 {ngo.phone}
                       </a>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-surface-muted pt-2 text-center">💡 Submitting your donation makes it available to these partner NGOs.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
