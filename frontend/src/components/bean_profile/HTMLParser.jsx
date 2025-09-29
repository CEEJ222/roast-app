import React, { useState } from 'react';

const API_BASE = import.meta.env.DEV
  ? 'http://localhost:8000'
  : 'https://roast-backend-production-8883.up.railway.app';

const HTMLParser = ({ isOpen, onParseComplete, onClose }) => {
  const [htmlSource, setHtmlSource] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');

  const handleParse = async () => {
    if (!htmlSource.trim()) {
      setParseError('Please enter HTML source code');
      return;
    }

    setIsParsing(true);
    setParseError('');

    try {
      console.log('DEBUG: Sending HTML parse request to:', `${API_BASE}/api/bean-profiles/parse-html`);
      console.log('DEBUG: Request body:', { html_source: htmlSource.substring(0, 100) + '...' });
      
      const response = await fetch(`${API_BASE}/api/bean-profiles/parse-html`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ html_source: htmlSource })
      });

      console.log('DEBUG: Response status:', response.status);
      console.log('DEBUG: Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DEBUG: Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('DEBUG: Response data:', data);
      
      if (data.success) {
        console.log('DEBUG: Parse successful, calling onParseComplete');
        onParseComplete(data.bean_profile);
        onClose();
      } else {
        console.error('DEBUG: Parse failed:', data.error);
        setParseError(data.error || 'Failed to parse HTML');
      }
    } catch (error) {
      console.error('HTML parsing error:', error);
      setParseError('Failed to parse HTML. Please check the source code and try again.');
    } finally {
      setIsParsing(false);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    setHtmlSource(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 text-white flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                📄 Parse HTML Source Code
              </h3>
              <p className="text-orange-100 text-sm mt-1">
                Extract bean information from coffee supplier websites
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-orange-200 text-2xl transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Instructions */}
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How to use:</h4>
                <ol className="text-sm text-blue-900 dark:text-blue-100 space-y-1 list-decimal list-inside">
                  <li>Go to a coffee supplier website (Sweet Maria's, Blue Bottle, etc.)</li>
                  <li>Right-click on the page and select "View Page Source" or press Ctrl+U (Cmd+U on Mac)</li>
                  <li>Copy all the HTML code (Ctrl+A, then Ctrl+C)</li>
                  <li>Paste it into the text area below</li>
                  <li>Click "Parse HTML" to extract bean information</li>
                </ol>
              </div>
            </div>
          </div>

          {/* HTML Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              HTML Source Code
            </label>
            <div className="relative">
              <textarea
                value={htmlSource}
                onChange={(e) => setHtmlSource(e.target.value)}
                onPaste={handlePaste}
                placeholder="Paste HTML source code here... (Right-click → View Page Source, then copy all)"
                className="w-full h-80 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-xs leading-relaxed resize-none"
                disabled={isParsing}
              />
              {htmlSource && (
                <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  {htmlSource.length.toLocaleString()} characters
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {parseError && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">Parsing Error</h4>
                  <p className="text-sm text-red-900 dark:text-red-100">{parseError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Supported Websites */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Supported Websites</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-green-900 dark:text-green-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Sweet Maria's
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Blue Bottle Coffee
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Counter Culture Coffee
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Most coffee roaster websites
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {htmlSource.trim() ? `Ready to parse ${htmlSource.length.toLocaleString()} characters` : 'Paste HTML source code to begin'}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
                disabled={isParsing}
              >
                Cancel
              </button>
              <button
                onClick={handleParse}
                disabled={!htmlSource.trim() || isParsing}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-lg"
              >
                {isParsing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Parsing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Parse HTML
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HTMLParser;
