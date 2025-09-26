import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RoastCurveGraph from './RoastCurveGraph';
import EnvironmentalConditions from './EnvironmentalConditions';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'  // Local development
  : 'https://roast-backend-production-8883.up.railway.app';  // Production

const RoastDetailPage = ({ roast, onClose, userProfile }) => {
  const { getAuthToken } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (roast) {
      loadRoastEvents();
    }
  }, [roast]);

  const loadRoastEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = await getAuthToken();
      
      // Load events for this roast
      const eventsResponse = await fetch(`${API_BASE}/roasts/${roast.id}/events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);
      } else {
        throw new Error('Failed to load roast events');
      }
    } catch (error) {
      console.error('Error loading roast events:', error);
      setError('Failed to load roast events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    const duration = Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading roast details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!roast) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">☕ Roast Details</h2>
              <p className="opacity-90">{roast.coffee_type} • {formatDate(roast.created_at)}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Roast Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Roast Overview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Roast Overview</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Coffee:</span>
                    <p className="text-gray-900">{roast.coffee_type}</p>
                    {roast.coffee_region && (
                      <p className="text-sm text-gray-600">{roast.coffee_region}</p>
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Process:</span>
                    <p className="text-gray-900">{roast.coffee_process}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Target Roast:</span>
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                      {roast.desired_roast_level}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Machine:</span>
                    <p className="text-gray-900">{roast.machine_label || 'Unknown'}</p>
                  </div>
                </div>
              </div>

              {/* Weights */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Weights</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Weight Before:</span>
                    <p className="text-gray-900">{roast.weight_before_g ? `${roast.weight_before_g}g` : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Weight After:</span>
                    <p className="text-gray-900">{roast.weight_after_g ? `${roast.weight_after_g}g` : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Weight Loss:</span>
                    <p className="text-gray-900">
                      {roast.weight_loss_pct ? `${roast.weight_loss_pct.toFixed(1)}%` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Environmental Conditions */}
              {(roast.temperature_f || roast.humidity_pct || roast.elevation_ft) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Environmental Conditions</h3>
                  <EnvironmentalConditions 
                    conditions={{
                      temperature_f: roast.temperature_f,
                      humidity_pct: roast.humidity_pct,
                      elevation_ft: roast.elevation_ft,
                      pressure_hpa: roast.pressure_hpa
                    }}
                    units={userProfile?.units}
                  />
                </div>
              )}

              {/* Notes */}
              {roast.notes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Notes</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">{roast.notes}</p>
                </div>
              )}
            </div>

            {/* Right Column - Roast Curve and Events */}
            <div className="lg:col-span-2 space-y-6">
              {/* Roast Curve */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-4 py-3 border-b">
                  <h3 className="text-lg font-semibold text-gray-800">Roast Curve</h3>
                </div>
                <div className="p-4">
                  <RoastCurveGraph
                    data={[{
                      id: roast.id,
                      name: roast.coffee_type || 'Unknown',
                      fullName: `${roast.coffee_type || 'Unknown'} - ${formatDate(roast.created_at)}`,
                      events: events
                    }]}
                    mode="historical"
                    showROR={true}
                    showMilestones={true}
                    height={300}
                    title=""
                    units={{ temperature: userProfile?.units?.temperature === 'celsius' ? 'C' : 'F', time: 'min' }}
                    showLegend={true}
                    showGrid={true}
                    showTooltip={true}
                    enableZoom={true}
                    enablePan={true}
                    compact={false}
                    interactive={true}
                    showRoastLabels={true}
                  />
                </div>
              </div>

              {/* Events Log */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-4 py-3 border-b">
                  <h3 className="text-lg font-semibold text-gray-800">Roast Events</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fan</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heat</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temp</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {events.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            No events recorded for this roast.
                          </td>
                        </tr>
                      ) : (
                        events.map((event, index) => (
                          <tr key={`event-${event.id || index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 text-sm font-mono">{formatTime(event.t_offset_sec)}</td>
                            <td className="px-4 py-2 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                event.kind === 'SET' ? 'bg-blue-100 text-blue-800' :
                                event.kind === 'FIRST_CRACK' ? 'bg-amber-100 text-amber-800' :
                                event.kind === 'SECOND_CRACK' ? 'bg-red-100 text-red-800' :
                                event.kind === 'COOL' ? 'bg-cyan-100 text-cyan-800' :
                                event.kind === 'END' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {event.kind.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">{event.fan_level || '—'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{event.heat_level || '—'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {event.temp_f ? `${event.temp_f}°F` : '—'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">{event.note || '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoastDetailPage;
