import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

const BeanProfileSearch = ({
  beanProfiles = [],
  onSelect,
  selectedProfileId = null,
  placeholder = "Search bean profiles...",
  className = "",
  showDetails = true,
  defaultOpen = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [inputRef, setInputRef] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // Calculate dropdown position
  const updateDropdownPosition = () => {
    if (inputRef) {
      const rect = inputRef.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  // Update position when dropdown opens
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
    }
  }, [isOpen, inputRef]);

  // Filter profiles based on search term
  const filteredProfiles = useMemo(() => {
    if (!searchTerm.trim()) return beanProfiles;
    
    const term = searchTerm.toLowerCase();
    return beanProfiles.filter(profile => 
      profile.name?.toLowerCase().includes(term) ||
      profile.origin?.toLowerCase().includes(term) ||
      profile.variety?.toLowerCase().includes(term) ||
      profile.process_method?.toLowerCase().includes(term) ||
      profile.supplier_name?.toLowerCase().includes(term)
    );
  }, [beanProfiles, searchTerm]);

  // Get selected profile details
  const selectedProfile = beanProfiles.find(p => p.id === selectedProfileId);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredProfiles.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredProfiles.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredProfiles.length) {
          handleSelect(filteredProfiles[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSelect = (profile) => {
    onSelect(profile);
    setSearchTerm(profile.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = (e) => {
    // Delay closing to allow click events on dropdown items
    setTimeout(() => setIsOpen(false), 150);
  };

  const clearSelection = () => {
    setSearchTerm('');
    onSelect(null);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={setInputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary"
        />
        
        {/* Clear button */}
        {searchTerm && (
          <button
            onClick={clearSelection}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && createPortal(
        <div 
          className="fixed z-[100] bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-border-primary rounded-lg shadow-lg max-h-60 overflow-y-auto"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width
          }}
        >
          {filteredProfiles.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-dark-text-secondary">
              {searchTerm ? 'No profiles found' : 'No bean profiles available'}
            </div>
          ) : (
            filteredProfiles.map((profile, index) => (
              <div
                key={profile.id}
                onClick={() => handleSelect(profile)}
                className={`px-4 py-3 cursor-pointer text-sm transition-colors ${
                  index === highlightedIndex
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100'
                    : 'hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{profile.name}</div>
                    {showDetails && (
                      <div className="text-xs text-gray-500 dark:text-dark-text-secondary mt-1">
                        <div className="flex flex-wrap gap-2">
                          {profile.origin && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                              📍 {profile.origin}
                            </span>
                          )}
                          {profile.process_method && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                              ⚙️ {profile.process_method}
                            </span>
                          )}
                          {profile.variety && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                              🌱 {profile.variety}
                            </span>
                          )}
                        </div>
                        {profile.supplier_name && (
                          <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                            via {profile.supplier_name}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedProfileId === profile.id && (
                    <div className="ml-2 text-indigo-600 dark:text-indigo-400">
                      ✓
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>,
        document.body
      )}

      {/* Selected Profile Summary */}
      {selectedProfile && !isOpen && (
        <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
          <div className="flex items-start">
            <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
            <div className="text-sm flex-1">
              <p className="text-green-800 dark:text-green-200 font-medium">
                {selectedProfile.name}
              </p>
              <p className="text-green-700 dark:text-green-300">
                {selectedProfile.origin} • {selectedProfile.process_method}
                {selectedProfile.variety && ` • ${selectedProfile.variety}`}
              </p>
              {selectedProfile.supplier_name && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  via {selectedProfile.supplier_name}
                </p>
              )}
            </div>
            <button
              onClick={clearSelection}
              className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeanProfileSearch;
