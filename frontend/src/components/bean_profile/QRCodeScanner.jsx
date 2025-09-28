import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const QRCodeScanner = ({ onScanSuccess, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  const startCamera = async () => {
    try {
      // Check if camera is already running
      if (html5QrcodeScannerRef.current) {
        return;
      }

      setError(null);
      
      // Create QR code scanner with enhanced camera configuration
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        // Enhanced camera constraints for better focus
        videoConstraints: {
          facingMode: 'environment', // Use back camera
          focusMode: 'continuous', // Enable continuous autofocus
          whiteBalanceMode: 'continuous',
          exposureMode: 'continuous',
          // Additional constraints for better image quality
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        // Supported formats
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39
        ],
        // Experimental features for better scanning
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        },
        // Show torch/flashlight control if available
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
        useBarCodeDetectorIfSupported: true
      };

      html5QrcodeScannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        config,
        false // verbose
      );

      // Start scanning with enhanced error handling
      await html5QrcodeScannerRef.current.render(
        (decodedText, decodedResult) => {
          handleQRCodeData(decodedText);
        },
        (errorMessage) => {
          // Don't show every scanning error, only meaningful ones
          if (errorMessage && !errorMessage.includes('No QR code found')) {
            console.log('QR Code scanning error:', errorMessage);
          }
        }
      );

      setScanning(true);
      setPermissionGranted(true);

    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied or not available. Please check permissions and try again.');
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear().catch(err => {
        console.error('Error stopping camera:', err);
      });
      html5QrcodeScannerRef.current = null;
    }
    setScanning(false);
  };

  const requestCameraPermission = async () => {
    try {
      // Test camera access first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionGranted(true);
      setError(null);
      startCamera();
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions and try again.');
      console.error('Permission error:', err);
    }
  };

  const stopScanning = () => {
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
      stopCamera(); // Stop scanning once we get a result
      
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
        // Restart scanning after showing error
        setTimeout(() => {
          setError(null);
          startCamera();
        }, 3000);
      }
    } catch (err) {
      setError('Failed to parse QR code data: ' + err.message);
      // Restart scanning after showing error
      setTimeout(() => {
        setError(null);
        startCamera();
      }, 3000);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-hidden">
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
            {/* QR Code Scanner Container */}
            <div 
              ref={scannerRef}
              id="qr-reader" 
              className="w-full mb-4 rounded-lg overflow-hidden"
            />
            
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