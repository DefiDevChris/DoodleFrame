import React from 'react';
import { X, Github } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Wireframe grid background component
const WireframeBackground: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Grid pattern */}
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(139, 92, 246, 0.08)" strokeWidth="1"/>
        </pattern>
        <pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="rgba(139, 92, 246, 0.15)"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)"/>
      <rect width="100%" height="100%" fill="url(#dots)"/>
    </svg>
    
    {/* Connection lines */}
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(139, 92, 246, 0)"/>
          <stop offset="50%" stopColor="rgba(139, 92, 246, 0.2)"/>
          <stop offset="100%" stopColor="rgba(139, 92, 246, 0)"/>
        </linearGradient>
        <linearGradient id="lineGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(99, 102, 241, 0)"/>
          <stop offset="50%" stopColor="rgba(99, 102, 241, 0.15)"/>
          <stop offset="100%" stopColor="rgba(99, 102, 241, 0)"/>
        </linearGradient>
      </defs>
      {/* Horizontal faint lines */}
      <line x1="0" y1="25%" x2="100%" y2="25%" stroke="url(#lineGrad1)" strokeWidth="1"/>
      <line x1="0" y1="75%" x2="100%" y2="75%" stroke="url(#lineGrad2)" strokeWidth="1"/>
      {/* Vertical faint lines */}
      <line x1="25%" y1="0" x2="25%" y2="100%" stroke="url(#lineGrad1)" strokeWidth="1"/>
      <line x1="75%" y1="0" x2="75%" y2="100%" stroke="url(#lineGrad2)" strokeWidth="1"/>
    </svg>

    {/* Wireframe blocks */}
    <div className="absolute top-[15%] left-[10%] w-16 h-16 border border-purple-200/30 rounded-lg rotate-12"/>
    <div className="absolute top-[20%] right-[15%] w-12 h-20 border border-indigo-200/30 rounded-lg -rotate-6"/>
    <div className="absolute bottom-[25%] left-[8%] w-20 h-12 border border-violet-200/30 rounded-lg rotate-3"/>
    <div className="absolute bottom-[20%] right-[10%] w-14 h-14 border border-purple-200/20 rounded-full"/>
    
    {/* Corner accents */}
    <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-purple-200/20 rounded-tl-lg"/>
    <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-purple-200/20 rounded-tr-lg"/>
    <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-purple-200/20 rounded-bl-lg"/>
    <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-purple-200/20 rounded-br-lg"/>
  </div>
);

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-200 overflow-hidden">
        {/* Wireframe Background */}
        <WireframeBackground />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors z-20"
          aria-label="Close"
        >
          <X size={24} className="text-gray-600" />
        </button>

        {/* Header with Logo */}
        <div className="relative bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 px-6 py-6 text-center rounded-t-2xl overflow-hidden">
          {/* Header wireframe overlay */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <pattern id="headerGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
              <rect width="100%" height="100%" fill="url(#headerGrid)"/>
            </svg>
          </div>
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
        <div className="relative px-6 py-5 overflow-y-auto z-10">
          {/* About with wireframe images */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">What is DoodleFrame?</h2>
            <div className="flex gap-4 items-start">
              <p className="text-gray-700 text-sm leading-relaxed flex-1">
                DoodleFrame is a <span className="font-semibold text-purple-600">free, open-source</span> drawing
                and wireframing tool designed for quick mockups, annotations, and sketches.
                Create beautiful wireframes and prototypes in minutes.
              </p>
              {/* Wireframe preview image */}
              <div className="hidden sm:block w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden border border-purple-100 shadow-sm bg-white/50">
                <img 
                  src="/wireframe-mobile.png" 
                  alt="Mobile wireframe preview" 
                  className="w-full h-full object-contain p-2 opacity-80 hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          </div>

          {/* Features Grid with decorative wireframe */}
          <div className="relative mb-6">
            {/* Dashboard wireframe decoration */}
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-40 h-28 opacity-30 hidden md:block pointer-events-none">
              <img 
                src="/wireframe-dashboard.png" 
                alt="" 
                className="w-full h-full object-contain"
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center text-center p-3 rounded-lg bg-white/60 border border-purple-100/50 backdrop-blur-sm">
                <img 
                  src="/icons/drawing-tools.png" 
                  alt="Drawing Tools" 
                  className="w-12 h-12 mb-2 object-contain"
                />
                <p className="font-semibold text-gray-900 text-sm">Drawing Tools</p>
                <p className="text-xs text-gray-600">Pen, shapes, arrows</p>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-lg bg-white/60 border border-violet-100/50 backdrop-blur-sm">
                <img 
                  src="/icons/templates.png" 
                  alt="Templates" 
                  className="w-12 h-12 mb-2 object-contain"
                />
                <p className="font-semibold text-gray-900 text-sm">Templates</p>
                <p className="text-xs text-gray-600">Device frames</p>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-lg bg-white/60 border border-indigo-100/50 backdrop-blur-sm">
                <img 
                  src="/icons/detection.png" 
                  alt="Detection" 
                  className="w-12 h-12 mb-2 object-contain"
                />
                <p className="font-semibold text-gray-900 text-sm">Detection</p>
                <p className="text-xs text-gray-600">OpenCV parsing</p>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-lg bg-white/60 border border-purple-100/50 backdrop-blur-sm">
                <img 
                  src="/icons/export.png" 
                  alt="Export" 
                  className="w-12 h-12 mb-2 object-contain"
                />
                <p className="font-semibold text-gray-900 text-sm">Export</p>
                <p className="text-xs text-gray-600">PNG & projects</p>
              </div>
            </div>
          </div>

          {/* GitHub Link & Button */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-4 relative overflow-hidden">
              {/* Subtle wireframe pattern in dark card */}
              <div className="absolute inset-0 opacity-5">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <pattern id="darkGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/>
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#darkGrid)"/>
                </svg>
              </div>
              <div className="relative flex items-center gap-2 mb-2">
                <Github size={18} className="text-white" />
                <h3 className="text-base font-bold text-white">Open Source</h3>
              </div>
              <p className="relative text-gray-300 mb-3 text-xs leading-relaxed">
                Free and open source. Contribute or star the repo!
              </p>
              <a
                href="https://github.com/DefiDevChris/DoodleFrame"
                target="_blank"
                rel="noopener noreferrer"
                className="relative inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 font-semibold px-3 py-1.5 rounded-lg transition-colors text-xs"
              >
                <Github size={14} />
                View on GitHub
              </a>
            </div>

            {/* Get Started Button */}
            <button
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-8 px-6 rounded-lg transition-all duration-200 shadow-lg shadow-purple-900/30 relative overflow-hidden group"
            >
              {/* Button wireframe accent */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <pattern id="btnGrid" width="15" height="15" patternUnits="userSpaceOnUse">
                    <path d="M 15 0 L 0 0 0 15" fill="none" stroke="white" strokeWidth="0.5"/>
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#btnGrid)"/>
                </svg>
              </div>
              <span className="relative">Get Started →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
