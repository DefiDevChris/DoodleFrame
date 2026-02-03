import React from 'react';
import { CheckCircle } from 'lucide-react';

interface DetectionModalProps {
  isOpen: boolean;
  objectCount: number;
  onClose: () => void;
}

export const DetectionModal: React.FC<DetectionModalProps> = ({
  isOpen,
  objectCount,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500/30 blur-2xl rounded-full" />
            <CheckCircle className="w-16 h-16 text-purple-400 relative" strokeWidth={2} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white text-center mb-2">
          Detection Complete
        </h2>

        {/* Object Count */}
        <div className="text-center mb-6">
          <p className="text-gray-400 text-sm mb-3">Successfully detected</p>
          <div className="inline-flex items-baseline gap-2 bg-gray-800/50 border border-gray-700 rounded-lg px-6 py-3">
            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
              {objectCount}
            </span>
            <span className="text-xl font-semibold text-gray-400">
              {objectCount === 1 ? 'object' : 'objects'}
            </span>
          </div>
        </div>

        {/* Info Message */}
        <p className="text-center text-gray-500 text-sm mb-6">
          Objects have been added to the canvas.
          <br />
          The background has been filled for easier editing.
        </p>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg shadow-purple-900/30"
        >
          Got it!
        </button>
      </div>
    </div>
  );
};
