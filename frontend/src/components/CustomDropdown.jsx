import React, { useState, useRef, useEffect } from 'react';

const CustomDropdown = ({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  className = "",
  disabled = false,
  error = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option => {
    const searchText = typeof option === 'string' ? option : option.label || option.value;
    return searchText.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (option) => {
    const selectedValue = typeof option === 'string' ? option : option.value;
    onChange(selectedValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleInputClick = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Input Field */}
      <div
        className={`
          w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary
          cursor-pointer flex items-center justify-between
          ${error 
            ? 'border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-900/20' 
            : 'border-gray-300 dark:border-dark-border-primary'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={handleInputClick}
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : (() => {
            if (!value) return "";
            const selectedOption = options.find(option => 
              (typeof option === 'string' ? option : option.value) === value
            );
            return typeof selectedOption === 'string' ? selectedOption : selectedOption?.label || selectedOption?.value || "";
          })()}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-tertiary"
        />
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-dark-bg-secondary border border-gray-300 dark:border-dark-border-primary rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => {
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionLabel = typeof option === 'string' ? option : option.label || option.value;
              const isSelected = value === optionValue;
              
              return (
                <div
                  key={index}
                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary cursor-pointer text-gray-900 dark:text-dark-text-primary flex items-center justify-between"
                  onClick={() => handleSelect(option)}
                >
                  <span>{optionLabel}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 text-indigo-600 dark:text-dark-accent-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              );
            })
          ) : (
            <div className="px-3 py-2 text-gray-500 dark:text-dark-text-tertiary">
              No options found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
