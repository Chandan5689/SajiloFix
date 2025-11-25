import React, { useEffect, useState } from "react";

export function Modal({ isOpen, onClose, title, children }) {
  // State to handle mount/unmount with animation
  const [show, setShow] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setShow(true);
    else {
      // delay unmount to allow animation to finish
      const timeout = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!show) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-gray-300 opacity-50 z-40 transition-opacity duration-300
              ${isOpen ? "opacity-50" : "opacity-0 pointer-events-none"}`}
      />

      {/* Modal box */}
      <div
        className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-300 transform
            ${
              isOpen
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95 pointer-events-none"
            }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative">
          <div className="flex justify-between items-center mb-4">
            <h3 id="modal-title" className="text-xl font-semibold">
              {title}
            </h3>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div>{children}</div>
        </div>
      </div>
    </>
  );
}
