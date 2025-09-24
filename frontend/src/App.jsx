import React, { useState, useEffect } from 'react';

const API_BASE = 'https://roast-backend-production-8883.up.railway.app';

function RoastAssistant() {
  const [currentTab, setCurrentTab] = useState('before');
  const [roastId, setRoastId] = useState(null);
  const [startTs, setStartTs] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    model: 'SR800',
    hasExtension: true,
    address: '',
    coffeeRegion: '',
    coffeeType: '',
    coffeeProcess: 'Washed',
    roastLevel: 'City',
    weightBefore: '',
    notes: '',
    fan: 5,
    heat: 5,
    tempF: '',
    weightAfter: ''
  });

  // Timer effect
  useEffect(() => {
    if (!startTs) return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTs * 1000) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTs]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const apiCall = async (url, options = {}) => {
    setLoading(true);
    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const startRoast = async () => {
    const machineLabel = `${formData.model}${formData.hasExtension ? ' + ET' : ''}`;
    
    try {
      const data = await apiCall(`${API_BASE}/roasts`, {
        method: 'POST',
        body: JSON.stringify({
          machine_label: machineLabel,
          address: formData.address,
          coffee_region: formData.coffeeRegion,
          coffee_type: formData.coffeeType,
          coffee_process: formData.coffeeProcess,
          desired_roast_level: formData.roastLevel,
          weight_before_g: parseFloat(formData.weightBefore) || null,
          notes: formData.notes
        })
      });

      setRoastId(data.roast_id);
      setStartTs(data.start_ts);
      setCurrentTab('during');
      setStatus(`Roast started! ID: ${data.roast_id} at ${data.env.resolved_address}`);
      refreshEvents(data.roast_id);
    } catch (error) {
      // Error already handled in apiCall
    }
  };

  const logChange = async () => {
    if (!roastId) return;

    try {
      await apiCall(`${API_BASE}/roasts/${roastId}/events`, {
        method: 'POST',
        body: JSON.stringify({
          kind: 'SET',
          fan_level: formData.fan,
          heat_level: formData.heat,
          temp_f: parseFloat(formData.tempF) || null
        })
      });

      const tempStr = formData.tempF ? `, ${formData.tempF}°F` : '';
      setStatus(`⚙️ Change @ ${formatTime(elapsedTime)} — Fan ${formData.fan}, Heat ${formData.heat}${tempStr}`);
      refreshEvents();
    } catch (error) {
      // Error already handled in apiCall
    }
  };

  const markMilestone = async (kind) => {
    if (!roastId) return;

    try {
      await apiCall(`${API_BASE}/roasts/${roastId}/events`, {
        method: 'POST',
        body: JSON.stringify({ kind })
      });

      const labels = {
        'FIRST_CRACK': 'First crack',
        'SECOND_CRACK': 'Second crack',
        'DROP': 'Drop/Cool'
      };
      setStatus(`🏁 ${labels[kind]} marked @ ${formatTime(elapsedTime)}`);
      refreshEvents();
    } catch (error) {
      // Error already handled in apiCall
    }
  };

  const refreshEvents = async (id = roastId) => {
    if (!id) return;
    try {
      const data = await apiCall(`${API_BASE}/roasts/${id}/events`);
      // Your backend returns the array directly, not wrapped in an object
      setEvents(data); // This is correct
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const finishRoast = async () => {
    if (!roastId) return;

    try {
      await apiCall(`${API_BASE}/roasts/${roastId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          weight_after_g: parseFloat(formData.weightAfter) || null
        })
      });

      setStatus(`✅ Roast finished! Weight out: ${formData.weightAfter}g`);
    } catch (error) {
      // Error already handled in apiCall
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 text-white">
          <h1 className="text-3xl font-bold">☕ FreshRoast Assistant</h1>
          <p className="opacity-90">Professional roast logging and analysis</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {[
            { key: 'before', label: '1) Before', icon: '🚦' },
            { key: 'during', label: '2) During', icon: '⏱️' },
            { key: 'after', label: '3) After', icon: '✅' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCurrentTab(tab.key)}
              disabled={tab.key === 'during' && !roastId}
              className={`flex-1 px-6 py-4 font-medium transition-all ${
                currentTab === tab.key
                  ? 'border-b-3 border-orange-500 text-orange-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              } ${tab.key === 'during' && !roastId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Loading indicator */}
          {loading && (
            <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-700">
              Processing...
            </div>
          )}

          {/* Status message */}
          {status && (
            <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-400 text-green-700">
              {status}
            </div>
          )}

          {/* Before Tab */}
          {currentTab === 'before' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Setup Your Roast</h2>
                <p className="text-gray-600">Configure your machine and coffee details</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Machine Setup</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">FreshRoast Model</label>
                    <select
                      value={formData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="SR540">SR540</option>
                      <option value="SR800">SR800</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="extension"
                      checked={formData.hasExtension}
                      onChange={(e) => handleInputChange('hasExtension', e.target.checked)}
                      className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="extension" className="text-sm font-medium text-gray-700">Extension Tube Installed</label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Roasting Location</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="123 Main St, Los Angeles, CA"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Used for environmental data logging</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Coffee Details</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Coffee Type</label>
                    <input
                      type="text"
                      value={formData.coffeeType}
                      onChange={(e) => handleInputChange('coffeeType', e.target.value)}
                      placeholder="Ethiopia Yirgacheffe"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                    <input
                      type="text"
                      value={formData.coffeeRegion}
                      onChange={(e) => handleInputChange('coffeeRegion', e.target.value)}
                      placeholder="Yirgacheffe, Sidama, etc."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Process</label>
                      <select
                        value={formData.coffeeProcess}
                        onChange={(e) => handleInputChange('coffeeProcess', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="Washed">Washed</option>
                        <option value="Natural">Natural</option>
                        <option value="Honey">Honey</option>
                        <option value="Anaerobic">Anaerobic</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Target Roast</label>
                      <select
                        value={formData.roastLevel}
                        onChange={(e) => handleInputChange('roastLevel', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="City">City</option>
                        <option value="City Plus">City Plus</option>
                        <option value="Full City">Full City</option>
                        <option value="Full City Plus">Full City Plus</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight Before Roast (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weightBefore}
                      onChange={(e) => handleInputChange('weightBefore', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  placeholder="Any special notes about this roast..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="text-center pt-4">
                <button
                  onClick={startRoast}
                  disabled={loading || !formData.address || !formData.coffeeType}
                  className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-lg hover:from-orange-700 hover:to-red-700 font-bold text-lg shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  🚦 Start Roast Session
                </button>
              </div>
            </div>
          )}

          {/* During Tab */}
          {currentTab === 'during' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Active Roast Session</h2>
                <div className="text-5xl font-mono font-bold text-orange-600 bg-gray-100 rounded-lg py-4">
                  ⏱️ {formatTime(elapsedTime)}
                </div>
              </div>

              {/* Controls */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Roaster Controls</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fan: {formData.fan}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="9"
                      value={formData.fan}
                      onChange={(e) => handleInputChange('fan', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>9</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heat: {formData.heat}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="9"
                      value={formData.heat}
                      onChange={(e) => handleInputChange('heat', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>9</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">BT/ET Temp (°F)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.tempF}
                      onChange={(e) => handleInputChange('tempF', e.target.value)}
                      placeholder="Optional"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <button
                  onClick={logChange}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50"
                >
                  ⚙️ Log Change
                </button>
                <button
                  onClick={refreshEvents}
                  disabled={loading}
                  className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 font-medium transition disabled:opacity-50"
                >
                  🔄 Refresh
                </button>
                <button
                  onClick={() => markMilestone('FIRST_CRACK')}
                  disabled={loading}
                  className="bg-amber-600 text-white px-4 py-3 rounded-lg hover:bg-amber-700 font-medium transition disabled:opacity-50"
                >
                  🔥 First Crack
                </button>
                <button
                  onClick={() => markMilestone('SECOND_CRACK')}
                  disabled={loading}
                  className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 font-medium transition disabled:opacity-50"
                >
                  🔥 Second Crack
                </button>
                <button
                  onClick={() => markMilestone('DROP')}
                  disabled={loading}
                  className="bg-cyan-600 text-white px-4 py-3 rounded-lg hover:bg-cyan-700 font-medium transition disabled:opacity-50"
                >
                  🧊 Drop/Cool
                </button>
              </div>

              {/* Events Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <h3 className="text-lg font-medium text-gray-800">Roast Event Log</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Time</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Event</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Fan</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Heat</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Temp °F</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Note</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {events.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            No events logged yet. Start making adjustments!
                          </td>
                        </tr>
                      ) : (
                        events.map((event, index) => (
                          <tr key={event.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 text-sm font-mono">{formatTime(event.t_offset_sec)}</td>
                            <td className="px-4 py-2 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                event.kind === 'SET' ? 'bg-blue-100 text-blue-800' :
                                event.kind === 'FIRST_CRACK' ? 'bg-amber-100 text-amber-800' :
                                event.kind === 'SECOND_CRACK' ? 'bg-red-100 text-red-800' :
                                'bg-cyan-100 text-cyan-800'
                              }`}>
                                {event.kind.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">{event.fan_level ?? '—'}</td>
                            <td className="px-4 py-2 text-sm">{event.heat_level ?? '—'}</td>
                            <td className="px-4 py-2 text-sm">{event.temp_f ?? '—'}</td>
                            <td className="px-4 py-2 text-sm">{event.note || '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* After Tab */}
          {currentTab === 'after' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Complete Your Roast</h2>
                <p className="text-gray-600">Record final measurements and notes</p>
              </div>
              
              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight After Roast (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weightAfter}
                    onChange={(e) => handleInputChange('weightAfter', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center text-lg"
                  />
                </div>

                <button
                  onClick={finishRoast}
                  disabled={loading || !formData.weightAfter}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-lg hover:from-green-700 hover:to-emerald-700 font-bold text-lg shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  ✅ Complete Roast Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RoastAssistant;