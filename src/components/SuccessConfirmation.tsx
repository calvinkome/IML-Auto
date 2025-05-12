import React, { useEffect, useRef } from 'react';

interface SuccessConfirmationProps {
  onClose: () => void;
}

export default function SuccessConfirmation({ onClose }: SuccessConfirmationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle animation and cleanup
    const timer = setTimeout(onClose, 5000);
    
    // Focus management
    const previousFocus = document.activeElement;
    containerRef.current?.focus();

    return () => {
      clearTimeout(timer);
      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      role="alert"
      aria-live="polite"
      tabIndex={-1}
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                 max-w-[90vw] w-[480px] bg-[#e6ffe6] bg-opacity-90 text-[#006600]
                 p-5 sm:p-6 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)] z-[1000]
                 animate-[fadeIn_0.3s_ease-in-out,fadeOut_0.3s_ease-in-out_4.7s]"
      style={{ minHeight: 'min-content' }}
    >
      <div className="flex items-center">
        <svg
          aria-hidden="true"
          className="w-6 h-6 mr-3 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <p className="text-lg font-semibold mb-1">
            Votre réservation a été soumise avec succès
          </p>
          <p className="text-base">
            Un e-mail vous a été envoyé pour le processus de paiement
          </p>
        </div>
      </div>
    </div>
  );
}