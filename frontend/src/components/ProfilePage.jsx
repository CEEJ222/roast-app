import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'
  : 'https://roast-app-backend.vercel.app'

const ProfilePage = ({ onClose }) => {
  const { user, getAuthToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  // Profile data
  const [profile, setProfile] = useState({
    display_name: '',
    email: '',
    address: '',
    avatar_url: '',
    units: {
      temperature: 'fahrenheit',
      elevation: 'feet'
    }
  })
  
  // Machine data
  const [machines, setMachines] = useState([])
  const [editingMachine, setEditingMachine] = useState(null)
  const [showAddMachine, setShowAddMachine] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [newMachine, setNewMachine] = useState({
    name: '',
    model: '',
    has_extension: false
  })

  useEffect(() => {
    loadProfile()
    loadMachines()
  }, [])

  const apiCall = async (url, options = {}) => {
    setLoading(true)
    setError(null)
    try {
      const token = await getAuthToken()
      
      const headers = { 'Content-Type': 'application/json' }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      } else {
        throw new Error('No authentication token available')
      }
      
      const response = await fetch(url, {
        headers,
        ...options
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || `HTTP ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const loadProfile = async () => {
    try {
      const data = await apiCall(`${API_BASE}/user/profile`)
      setProfile(data)
    } catch (error) {
      // Error already handled in apiCall
    }
  }

  const loadMachines = async () => {
    try {
      const data = await apiCall(`${API_BASE}/user/machines`)
      setMachines(data)
    } catch (error) {
      // Error already handled in apiCall
    }
  }

  const updateProfile = async () => {
    try {
      await apiCall(`${API_BASE}/user/profile`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          display_name: profile.display_name,
          address: profile.address,
          units: profile.units
        })
      })
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      // Error already handled in apiCall
    }
  }

  const addMachine = async () => {
    try {
      await apiCall(`${API_BASE}/user/machines`, {
        method: 'POST',
        body: JSON.stringify(newMachine)
      })
      setNewMachine({ name: '', model: '', has_extension: false })
      setShowAddMachine(false)
      loadMachines()
      setSuccess('Machine added successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      // Error already handled in apiCall
    }
  }

  const updateMachine = async (machineId, updatedMachine) => {
    try {
      await apiCall(`${API_BASE}/user/machines/${machineId}`, {
        method: 'PATCH',
        body: JSON.stringify(updatedMachine)
      })
      setEditingMachine(null)
      loadMachines()
      setSuccess('Machine updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      // Error already handled in apiCall
    }
  }

  const deleteMachine = async (machineId) => {
    setConfirmDelete(machineId)
  }

  const confirmDeleteMachine = async () => {
    try {
      await apiCall(`${API_BASE}/user/machines/${confirmDelete}`, {
        method: 'DELETE'
      })
      loadMachines()
      setSuccess('Machine deleted successfully!')
      setTimeout(() => setSuccess(null), 3000)
      setConfirmDelete(null)
    } catch (error) {
      // Error already handled in apiCall
    }
  }

  const cancelDelete = () => {
    setConfirmDelete(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Profile Settings</h1>
            <p className="opacity-90">Manage your profile and machines</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Status Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Section */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Profile Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={profile.display_name}
                      onChange={(e) => setProfile({...profile, display_name: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      value={profile.address}
                      onChange={(e) => setProfile({...profile, address: e.target.value})}
                      placeholder="Enter your full address..."
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Used to fetch elevation, temperature, humidity, and pressure data for each roast.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700">Unit Preferences</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Temperature</label>
                        <select
                          value={profile.units?.temperature || 'fahrenheit'}
                          onChange={(e) => setProfile({...profile, units: {...profile.units, temperature: e.target.value}})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
                        >
                          <option value="fahrenheit">Fahrenheit (°F)</option>
                          <option value="celsius">Celsius (°C)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Elevation</label>
                        <select
                          value={profile.units?.elevation || 'feet'}
                          onChange={(e) => setProfile({...profile, units: {...profile.units, elevation: e.target.value}})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
                        >
                          <option value="feet">Feet (ft)</option>
                          <option value="meters">Meters (m)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={updateProfile}
                    disabled={loading}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 font-medium transition disabled:opacity-50"
                  >
                    Update Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Machines Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Your Machines</h2>
                <button
                  onClick={() => setShowAddMachine(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition"
                >
                  Add Machine
                </button>
              </div>

              {/* Add Machine Form */}
              {showAddMachine && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Add New Machine</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Machine Name
                      </label>
                      <input
                        type="text"
                        value={newMachine.name}
                        onChange={(e) => setNewMachine({...newMachine, name: e.target.value})}
                        placeholder="e.g., My SR800"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Model
                        </label>
                        <select
                          value={newMachine.model}
                          onChange={(e) => setNewMachine({...newMachine, model: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
                        >
                          <option value="">Select a model...</option>
                          <option value="SR800">SR800</option>
                          <option value="SR540">SR540</option>
                        </select>
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newMachine.has_extension}
                            onChange={(e) => setNewMachine({...newMachine, has_extension: e.target.checked})}
                            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Extension Tube</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={addMachine}
                        disabled={!newMachine.name.trim() || loading}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium transition disabled:opacity-50"
                      >
                        Add Machine
                      </button>
                      <button
                        onClick={() => {
                          setShowAddMachine(false)
                          setNewMachine({ name: '', model: '', has_extension: false })
                        }}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 font-medium transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Machines List */}
              <div className="space-y-3">
                {machines.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No machines added yet.</p>
                    <p className="text-sm">Add your first machine to get started!</p>
                  </div>
                ) : (
                  machines.map((machine) => (
                    <div key={machine.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      {editingMachine?.id === machine.id ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Machine Name
                            </label>
                            <input
                              type="text"
                              value={editingMachine.name}
                              onChange={(e) => setEditingMachine({...editingMachine, name: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Model
                              </label>
                              <select
                                value={editingMachine.model}
                                onChange={(e) => setEditingMachine({...editingMachine, model: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
                              >
                                <option value="">Select a model...</option>
                                <option value="SR800">SR800</option>
                                <option value="SR450">SR450</option>
                              </select>
                            </div>
                            <div className="flex items-center">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={editingMachine.has_extension}
                                  onChange={(e) => setEditingMachine({...editingMachine, has_extension: e.target.checked})}
                                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Extension Tube</span>
                              </label>
                            </div>
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => updateMachine(machine.id, editingMachine)}
                              disabled={!editingMachine.name.trim() || loading}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium transition disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingMachine(null)}
                              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 font-medium transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-800">{machine.name}</h4>
                            <p className="text-sm text-gray-600">
                              {machine.model}{machine.has_extension ? ' + Extension Tube' : ''}
                            </p>
                          </div>
                          
                          {confirmDelete === machine.id ? (
                            // Confirmation UI
                            <div className="flex space-x-2">
                              <button
                                onClick={confirmDeleteMachine}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                              >
                                Confirm Delete
                              </button>
                              <button
                                onClick={cancelDelete}
                                className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            // Edit/Delete buttons
                            <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingMachine({...machine})}
                              className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Edit machine"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteMachine(machine.id)}
                              className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete machine"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
