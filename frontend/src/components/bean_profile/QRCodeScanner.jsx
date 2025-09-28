import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRCodeScanner = ({ onScanSuccess, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          qrbox: { width: 250, height: 250 },
          fps: 5,
        }
      );

      scanner.render(
        (decodedText) => {
          console.log('QR Code detected:', decodedText);
          handleQRCodeData(decodedText);
        },
        (error) => {
          // Don't log every scan attempt as error
          if (error && !error.includes('No QR code found')) {
            console.log('QR Scanner error:', error);
          }
        }
      );

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [scanning]);

  const handleQRCodeData = async (qrData) => {
    try {
      setError(null);
      
      // Check if it's a Sweet Maria's URL
      if (qrData.includes('sweetmarias.com')) {
        const beanData = await parseSweetMariasData(qrData);
        onScanSuccess(beanData);
      } else {
        setError('This QR code is not from Sweet Maria\'s. Please scan a Sweet Maria\'s coffee bag.');
      }
    } catch (err) {
      setError('Failed to parse QR code data: ' + err.message);
    }
  };

  const parseSweetMariasData = async (url) => {
    try {
      // Use a CORS proxy or backend endpoint to fetch the page
      const response = await fetch(`/api/parse-bean-data?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bean data');
      }
      
      const beanData = await response.json();
      return beanData;
    } catch (error) {
      throw new Error('Failed to parse Sweet Maria\'s data: ' + error.message);
    }
  };

  const startScanning = () => {
    setScanning(true);
    setError(null);
  };

  const stopScanning = () => {
    setScanning(false);
    if (scannerRef.current) {
      scannerRef.current.clear();
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
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                📱
              </div>
              <p className="text-gray-600 dark:text-dark-text-secondary">
                Position the QR code from your Sweet Maria's coffee bag in front of the camera
              </p>
            </div>
            <button
              onClick={startScanning}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Start Scanning
            </button>
          </div>
        ) : (
          <div>
            <div id="qr-reader" className="mb-4"></div>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}
            <button
              onClick={stopScanning}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              Stop Scanning
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeScanner;
