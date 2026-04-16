import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg', isFullScreen = false }) {
  if (!isOpen) return null;

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Centering wrapper with min height of screen, adding py-10 to never hit actual viewport edges */}
      <div className={`flex min-h-screen items-center justify-center ${isFullScreen ? 'p-0' : 'p-4 py-10'}`}>
        <div
          className={`relative bg-navy-900 w-full p-6 animate-fade-in border border-white/5 ${isFullScreen ? 'min-h-screen max-w-full rounded-none border-x-0 border-y-0' : `${maxWidth} rounded-2xl shadow-2xl my-auto inset-x-0`}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-xl leading-none p-1.5 rounded-lg hover:bg-white/5"
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
