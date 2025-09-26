import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const LoginForm = () => {
  const { signInWithGoogle, signInWithGitHub, signInWithEmail, signUpWithEmail } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)
      await signInWithGoogle()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGitHubSignIn = async () => {
    try {
      setLoading(true)
      setError(null)
      await signInWithGitHub()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      
      if (isSignUp) {
        await signUpWithEmail(email, password)
        setError('Account created successfully! You are now signed in.')
      } else {
        await signInWithEmail(email, password)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:bg-dark-gradient flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-dark-bg-secondary rounded-xl shadow-2xl dark:shadow-dark-xl overflow-hidden border dark:border-dark-border-primary">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-purple-700 dark:bg-accent-gradient-vibrant px-6 py-8 text-white text-center">
          <h1 className="text-3xl font-bold mb-2">☕ FreshRoast Assistant</h1>
          <p className="opacity-90">Professional roast logging and analysis</p>
        </div>

        {/* Login Form */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">Welcome Back</h2>
            <p className="text-gray-600 dark:text-dark-text-secondary">Sign in to access your roast logs and continue your coffee journey</p>
          </div>

          {error && (
            <div className={`mb-6 p-4 border rounded-lg ${
              error.includes('Account created successfully') 
                ? 'bg-green-50 dark:bg-dark-bg-tertiary border-green-200 dark:border-dark-accent-success' 
                : 'bg-red-50 dark:bg-dark-bg-tertiary border-red-200 dark:border-dark-accent-error'
            }`}>
              <p className={`text-sm ${
                error.includes('Account created successfully') 
                  ? 'text-green-700 dark:text-dark-accent-success' 
                  : 'text-red-700 dark:text-dark-accent-error'
              }`}>{error}</p>
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="mb-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-dark-accent-primary focus:border-transparent dark:bg-dark-bg-tertiary dark:text-dark-text-primary"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-dark-accent-primary focus:border-transparent dark:bg-dark-bg-tertiary dark:text-dark-text-primary"
                  placeholder="Enter your password"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-700 via-purple-600 to-purple-700 dark:bg-accent-gradient-vibrant text-white py-2 px-4 rounded-lg hover:from-indigo-800 hover:via-purple-700 hover:to-purple-800 dark:hover:from-dark-accent-primary dark:hover:to-dark-accent-tertiary font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg dark:shadow-vibrant-glow"
              >
                {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </div>
          </form>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-dark-border-primary" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-dark-bg-secondary text-gray-500 dark:text-dark-text-tertiary">Or continue with</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center px-6 py-4 border border-gray-300 dark:border-dark-border-primary rounded-lg shadow-sm bg-white dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-primary font-medium hover:bg-gray-50 dark:hover:bg-dark-bg-quaternary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-dark-accent-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600 dark:border-dark-accent-primary mr-3"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </div>
              )}
            </button>

            <button
              onClick={handleGitHubSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center px-6 py-4 border border-gray-300 dark:border-dark-border-primary rounded-lg shadow-sm bg-white dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-primary font-medium hover:bg-gray-50 dark:hover:bg-dark-bg-quaternary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-dark-accent-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Continue with GitHub
              </div>
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginForm
