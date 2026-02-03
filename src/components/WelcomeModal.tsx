import React from 'react';
import { X, Github } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden border border-gray-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
          aria-label="Close"
        >
          <X size={24} className="text-gray-600" />
        </button>

        {/* Header with Logo */}
        <div className="relative bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 px-8 py-12 text-center">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative">
            <img
              src="/doodleframelogo.jpeg"
              alt="DoodleFrame Logo"
              className="w-32 h-32 mx-auto mb-4 rounded-2xl shadow-xl border-4 border-white/20"
            />
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
              Welcome to DoodleFrame
            </h1>
            <p className="text-purple-100 text-lg font-medium">
              Your free drawing & wireframing tool
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          {/* About */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What is DoodleFrame?</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              DoodleFrame is a <span className="font-semibold text-purple-600">free, open-source</span> drawing
              and wireframing tool designed for quick mockups, annotations, and sketches.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Whether you're designing UI mockups, annotating screenshots, or just doodling ideas,
              DoodleFrame gives you the tools you need without the complexity.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Drawing Tools</p>
                <p className="text-sm text-gray-600">Pen, shapes, arrows & more</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-violet-600 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Templates</p>
                <p className="text-sm text-gray-600">Phone, browser, tablet frames</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Object Detection</p>
                <p className="text-sm text-gray-600">OpenCV screenshot parsing</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Export & Save</p>
                <p className="text-sm text-gray-600">PNG export, project files</p>
              </div>
            </div>
          </div>

          {/* GitHub Link */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Github size={24} className="text-white" />
              <h3 className="text-xl font-bold text-white">Open Source</h3>
            </div>
            <p className="text-gray-300 mb-4 text-sm leading-relaxed">
              DoodleFrame is completely free and open source. Contribute, report issues,
              or star the repo to show your support!
            </p>
            <a
              href="https://github.com/DefiDevChris/DoodleFrame"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              <Github size={18} />
              View on GitHub
            </a>
          </div>

          {/* Get Started Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-purple-900/30"
          >
            Get Started →
          </button>
        </div>
      </div>
    </div>
  );
};
