import React, { useState, useRef, useEffect } from 'react';

const QRCodeScanner = ({ onScanSuccess, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (scanning && permissionGranted) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [scanning, permissionGranted]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera by default
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions and try again.');
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' 
        } 
      });
      
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionGranted(true);
      setScanning(true);
      setError(null);
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions and try again.');
    }
  };

  const stopScanning = () => {
    setScanning(false);
    stopCamera();
  };

  const handleManualInput = () => {
    const url = prompt('Enter the Sweet Maria\'s URL manually:');
    if (url && url.includes('sweetmarias.com')) {
      handleQRCodeData(url);
    } else if (url) {
      setError('Please enter a valid Sweet Maria\'s URL');
    }
  };

  const handleQRCodeData = async (qrData) => {
    try {
      setError(null);
      
      // Check if it's a Sweet Maria's URL
      if (qrData.includes('sweetmarias.com')) {
        const API_BASE = import.meta.env.DEV 
          ? 'http://localhost:8000'
          : 'https://roast-backend-production-8883.up.railway.app';
        
        const response = await fetch(`${API_BASE}/bean-profiles/parse-qr`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({ url: qrData })
        });
        
        if (response.ok) {
          const beanData = await response.json();
          onScanSuccess(beanData);
        } else {
          throw new Error('Failed to parse QR code data');
        }
      } else {
        setError('This QR code is not from Sweet Maria\'s. Please scan a Sweet Maria\'s coffee bag.');
      }
    } catch (err) {
      setError('Failed to parse QR code data: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-dark-text-primary">
            Scan Bean QR Code
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {!scanning ? (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                📱
              </div>
              <p className="text-gray-600 dark:text-dark-text-secondary mb-4">
                Scan the QR code from your Sweet Maria's coffee bag
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={requestCameraPermission}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                📷 Open Camera
              </button>
              
              <button
                onClick={handleManualInput}
                className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-medium"
              >
                ✏️ Enter URL Manually
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="relative mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-64 bg-gray-900 rounded-lg object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">Point camera at QR code</span>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <button
                onClick={stopScanning}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Stop Camera
              </button>
              <button
                onClick={handleManualInput}
                className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg"
              >
                Enter URL Manually Instead
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeScanner;
