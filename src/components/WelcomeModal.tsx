import React from 'react';
import { X, Github } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
          aria-label="Close"
        >
          <X size={24} className="text-gray-600" />
        </button>

        {/* Header with Logo */}
        <div className="relative bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 px-6 py-6 text-center">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative flex items-center justify-center gap-4">
            <img
              src="/doodleframelogo.jpeg"
              alt="DoodleFrame Logo"
              className="w-16 h-16 rounded-xl shadow-xl border-2 border-white/20"
            />
            <div className="text-left">
              <h1 className="text-2xl font-black text-white mb-1 tracking-tight">
                Welcome to DoodleFrame
              </h1>
              <p className="text-purple-100 text-sm font-medium">
                Your free drawing & wireframing tool
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto">
          {/* About */}
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">What is DoodleFrame?</h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              DoodleFrame is a <span className="font-semibold text-purple-600">free, open-source</span> drawing
              and wireframing tool designed for quick mockups, annotations, and sketches.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-2 h-2 bg-purple-600 rounded-full mb-2" />
              <p className="font-semibold text-gray-900 text-sm">Drawing Tools</p>
              <p className="text-xs text-gray-600">Pen, shapes, arrows</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-2 h-2 bg-violet-600 rounded-full mb-2" />
              <p className="font-semibold text-gray-900 text-sm">Templates</p>
              <p className="text-xs text-gray-600">Device frames</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-2 h-2 bg-indigo-600 rounded-full mb-2" />
              <p className="font-semibold text-gray-900 text-sm">Detection</p>
              <p className="text-xs text-gray-600">OpenCV parsing</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-2 h-2 bg-purple-600 rounded-full mb-2" />
              <p className="font-semibold text-gray-900 text-sm">Export</p>
              <p className="text-xs text-gray-600">PNG & projects</p>
            </div>
          </div>

          {/* GitHub Link & Button */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Github size={18} className="text-white" />
                <h3 className="text-base font-bold text-white">Open Source</h3>
              </div>
              <p className="text-gray-300 mb-3 text-xs leading-relaxed">
                Free and open source. Contribute or star the repo!
              </p>
              <a
                href="https://github.com/DefiDevChris/DoodleFrame"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 font-semibold px-3 py-1.5 rounded-lg transition-colors text-xs"
              >
                <Github size={14} />
                View on GitHub
              </a>
            </div>

            {/* Get Started Button */}
            <button
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-8 px-6 rounded-lg transition-all duration-200 shadow-lg shadow-purple-900/30"
            >
              Get Started →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
