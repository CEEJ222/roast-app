import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000'
  : 'https://roast-backend-production-8883.up.railway.app'

const SetupWizard = ({ onComplete }) => {
  const { user, getAuthToken } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Form data
  const [displayName, setDisplayName] = useState('')
  const [machines, setMachines] = useState([])
  const [address, setAddress] = useState('')
  const [currentMachine, setCurrentMachine] = useState({
    name: '',
    model: 'SR800',
    has_extension: false
  })

  // Get user's display name from auth data
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setDisplayName(user.user_metadata.full_name)
    } else if (user?.email) {
      setDisplayName(user.email.split('@')[0])
    }
  }, [user])

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

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleSkipAll = async () => {
    // Skip the entire setup wizard
    onComplete()
  }

  const addMachine = () => {
    if (currentMachine.name.trim()) {
      setMachines([...machines, { ...currentMachine }])
      setCurrentMachine({
        name: '',
        model: 'SR800',
        has_extension: false
      })
    }
  }

  const removeMachine = (index) => {
    setMachines(machines.filter((_, i) => i !== index))
  }

  const handleComplete = async () => {
    try {
      // Update user profile with display name and address
      if (displayName.trim() || address.trim()) {
        await apiCall(`${API_BASE}/user/profile`, {
          method: 'PATCH',
          body: JSON.stringify({ 
            display_name: displayName,
            address: address
          })
        })
      }

      // Add all machines
      for (const machine of machines) {
        await apiCall(`${API_BASE}/user/machines`, {
          method: 'POST',
          body: JSON.stringify(machine)
        })
      }

      onComplete()
    } catch (error) {
      // Error already handled in apiCall
    }
  }

  const steps = [
    {
      title: "Welcome! From your Roast Buddy!",
      subtitle: "Let's set up your profile",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-5xl">☕</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">Welcome to Roast Buddy!</h2>
            <p className="text-gray-600 dark:text-dark-text-secondary">
              We're excited to help you track and perfect your coffee roasting journey.
              Let's start by setting up your profile.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
            />
            <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-1">
              This is how your name will appear in the app
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Add Your Roasting Machines",
      subtitle: "Tell us about your setup",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-4xl">⚙️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">Your Roasting Setup</h2>
            <p className="text-gray-600 dark:text-dark-text-secondary">
              Add the roasting machines you use. You can add multiple machines if you have them.
            </p>
          </div>

          {/* Add Machine Form */}
          <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-dark-text-primary mb-4">Add a Machine</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-1">
                  Machine Name
                </label>
                <input
                  type="text"
                  value={currentMachine.name}
                  onChange={(e) => setCurrentMachine({...currentMachine, name: e.target.value})}
                  placeholder="e.g., My SR800"
                  className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-1">
                  Model
                </label>
                <select
                  value={currentMachine.model}
                  onChange={(e) => setCurrentMachine({...currentMachine, model: e.target.value})}
                  className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                >
                  <option value="SR800">SR800</option>
                  <option value="SR540">SR540</option>
                </select>
              </div>
              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={currentMachine.has_extension}
                    onChange={(e) => setCurrentMachine({...currentMachine, has_extension: e.target.checked})}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-dark-text-primary">Extension Tube</span>
                </label>
              </div>
            </div>
            <button
              onClick={addMachine}
              disabled={!currentMachine.name.trim()}
              className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              Done
            </button>
          </div>

          {/* Machine List */}
          {machines.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-dark-text-primary mb-4">Your Machines</h3>
              <div className="space-y-3">
                {machines.map((machine, index) => (
                  <div key={index} className="bg-white dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border-primary rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-dark-text-primary">{machine.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                        {machine.model}{machine.has_extension ? ' + Extension Tube' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => removeMachine(index)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {machines.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-dark-text-secondary">No machines added yet. Add at least one machine to continue.</p>
            </div>
          )}
        </div>
      )
    },
    {
      title: "Add Your Location",
      subtitle: "Help us personalize your experience",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-5xl">📍</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">Your Location</h2>
            <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
              Add your address to get personalized environmental data for each roast.
            </p>
            
            <div className="bg-blue-50 dark:bg-dark-bg-tertiary border border-blue-200 dark:border-dark-border-primary rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-dark-text-primary mb-2">📍 Providing your location helps us collect the following data for each roast:</h3>
              <ul className="text-sm text-blue-700 dark:text-dark-text-secondary space-y-1">
                <li>• <strong>Elevation:</strong> Affects roasting time and heat transfer</li>
                <li>• <strong>Temperature & Humidity:</strong> Impact bean moisture and roast development</li>
                <li>• <strong>Barometric Pressure:</strong> Influences heat retention and airflow</li>
              </ul>
              <p className="text-xs text-blue-600 dark:text-dark-text-tertiary mt-2">
                This data is only used to enhance your roasting experience and is never shared with third parties.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                  Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your full address..."
                  rows={3}
                  className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
                />
                <p className="text-xs text-gray-500 dark:text-dark-text-secondary mt-1">
                  We'll fetch real-time elevation, temperature, humidity, and pressure data for your location.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "You're All Set!",
      subtitle: "Ready to start roasting",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-5xl">🎉</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary dark:text-dark-text-primary mb-2">Setup Complete!</h2>
            <p className="text-gray-600 dark:text-dark-text-secondary dark:text-dark-text-secondary">
              You're ready to start tracking your coffee roasting sessions.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-4">Your Profile</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-green-400">Display Name:</span>
                <span className="font-medium text-green-800 dark:text-green-300">{displayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-green-400">Machines:</span>
                <span className="font-medium text-green-800 dark:text-green-300">{machines.length}</span>
              </div>
              {address && (
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-400">Location:</span>
                  <span className="font-medium text-green-800 dark:text-green-300 text-sm">{address}</span>
                </div>
              )}
            </div>
          </div>

          {machines.length > 0 && (
            <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-dark-text-primary mb-4">Your Machines</h3>
              <div className="space-y-2">
                {machines.map((machine, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <span className="text-gray-700 dark:text-dark-text-primary">{machine.name}</span>
                    <span className="text-sm text-gray-500 dark:text-dark-text-secondary">
                      {machine.model}{machine.has_extension ? ' + ET' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-light-gradient-blue dark:bg-dark-gradient flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-dark-card rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-purple-700 dark:bg-accent-gradient-vibrant px-6 py-8 text-white text-center relative">
          <button
            onClick={handleSkipAll}
            className="absolute top-4 right-4 text-sm text-amber-200 hover:text-white underline"
          >
            Skip Setup
          </button>
          <h1 className="text-3xl font-bold mb-2"><span className="text-5xl">☕</span> Roast Buddy</h1>
          <p className="opacity-90">Initial Setup</p>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            {steps.map((_, index) => (
              <div key={index} className="flex items-center">
                <div className="w-8 h-8 flex items-center justify-center text-lg font-medium">
                  {index < currentStep ? '✅' : index === steps.length - 1 ? '🎉' : index === 0 ? '👽' : index === 1 ? '⚙️' : index === 2 ? '📍' : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${
                    index < currentStep ? 'bg-green-600' : index === currentStep - 1 ? 'bg-indigo-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {steps[currentStep].content}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <div className="flex space-x-3">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className="px-6 py-3 bg-gray-300 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-primary rounded-lg hover:bg-gray-400 dark:hover:bg-dark-bg-quaternary font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
              {currentStep < steps.length - 1 && (
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 bg-gray-100 dark:bg-dark-bg-tertiary text-gray-600 dark:text-dark-text-secondary rounded-lg hover:bg-gray-200 dark:hover:bg-dark-bg-quaternary font-medium transition border border-gray-300 dark:border-dark-border-primary"
                >
                  Skip
                </button>
              )}
            </div>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={
                  (currentStep === 0 && !displayName.trim()) ||
                  (currentStep === 1 && machines.length === 0) ||
                  loading
                }
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Processing...' : 'Next'}
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Setting up...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SetupWizard
