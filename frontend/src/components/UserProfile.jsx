import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ProfilePage from './ProfilePage'

const UserProfile = () => {
  const { user, signOut } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showProfilePage, setShowProfilePage] = useState(false)

  const handleSignOut = async () => {
    try {
      console.log('Attempting to sign out...')
      await signOut()
      console.log('Sign out successful')
      // Close the dropdown after successful sign out
      setShowDropdown(false)
    } catch (error) {
      console.error('Error signing out:', error)
      // Even if there's an error, close the dropdown
      setShowDropdown(false)
    }
  }

  const getUserDisplayName = () => {
    if (user?.user_metadata?.display_name) {
      return user.user_metadata.display_name
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'User'
  }

  const getUserAvatar = () => {
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url
    }
    return null // We'll use a custom gradient avatar instead
  }

  const getInitials = () => {
    const name = getUserDisplayName()
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  const getAvatarGradient = () => {
    // Generate a consistent gradient based on the user's initials
    const initials = getInitials()
    const colors = [
      'from-orange-400 to-red-500',
      'from-blue-400 to-purple-500', 
      'from-green-400 to-blue-500',
      'from-purple-400 to-pink-500',
      'from-red-400 to-orange-500',
      'from-indigo-400 to-blue-500'
    ]
    const colorIndex = initials.charCodeAt(0) % colors.length
    return colors[colorIndex]
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        {getUserAvatar() ? (
          <img
            src={getUserAvatar()}
            alt={getUserDisplayName()}
            className="w-8 h-8 rounded-full border-2 border-white/20"
          />
        ) : (
          <div className={`w-8 h-8 rounded-full border-2 border-white/20 bg-gradient-to-br ${getAvatarGradient()} flex items-center justify-center`}>
            <span className="text-white text-xs font-semibold">{getInitials()}</span>
          </div>
        )}
        <div className="text-left">
          <p className="text-sm font-medium text-white">{getUserDisplayName()}</p>
          {!user?.user_metadata?.display_name && (
            <p className="text-xs text-white/70">{user?.email}</p>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-white/70 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg dark:shadow-dark-xl border border-gray-200 dark:border-dark-border-primary z-20">
            <div className="p-4 border-b border-gray-100 dark:border-dark-border-primary">
              <div className="flex items-center space-x-3">
                {getUserAvatar() ? (
                  <img
                    src={getUserAvatar()}
                    alt={getUserDisplayName()}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarGradient()} flex items-center justify-center`}>
                    <span className="text-white text-lg font-semibold">{getInitials()}</span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-dark-text-primary">{getUserDisplayName()}</p>
                  {!user?.user_metadata?.display_name && (
                    <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">{user?.email}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-2">
              <button
                onClick={() => {
                  setShowProfilePage(true)
                  setShowDropdown(false)
                }}
                className="w-full flex items-center px-4 py-3 text-left text-gray-700 dark:text-dark-text-primary hover:bg-gray-50 dark:hover:bg-dark-bg-quaternary rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-3 text-gray-400 dark:text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile Settings
              </button>
              
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-4 py-3 text-left text-gray-700 dark:text-dark-text-primary hover:bg-gray-50 dark:hover:bg-dark-bg-quaternary rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-3 text-gray-400 dark:text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      {/* Profile Page Modal */}
      {showProfilePage && (
        <ProfilePage onClose={() => setShowProfilePage(false)} />
      )}
    </div>
  )
}

export default UserProfile
