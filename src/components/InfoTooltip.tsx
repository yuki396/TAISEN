import { MdInfoOutline } from 'react-icons/md';
import React, { useEffect, useState } from 'react';

// Tooltip component that shows additional information when hovered, focused, or clicked
const InfoTooltip = ({ id, content }: { id: string; content: React.ReactNode }) => {
  const [show, setShow] = useState(false); // State to control tooltip visibility

  useEffect(() => {
    // Close tooltip when the "Escape" key is pressed
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShow(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="relative flex items-center">
      {/* Button that triggers the tooltip (icon button) */}
      <button
        onMouseEnter={() => setShow(true)} // Show tooltip on hover
        onMouseLeave={() => setShow(false)} // Hide tooltip when mouse leaves
        onFocus={() => setShow(true)}       // Show tooltip when focused (keyboard nav)
        onBlur={() => setShow(false)}       // Hide tooltip when focus is lost
        onClick={() => setShow(s => !s)} // Toggle tooltip on click
        className="p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
        type="button"
      >
        {/* Info icon */}
        <MdInfoOutline size={20} className="text-gray-600 dark:text-gray-300" />
      </button>

      {/* Tooltip content */}
      <div
        id={id}
        className={`absolute z-50 top-full right-0 translate-x-20 text-sm text-gray-600 bg-white 
                    shadow-lg border border-gray-200 rounded p-3 mt-2 w-[310px] transform transition-all
                    ${show ? 'opacity-100' : 'opacity-0'}`}
      >
        {content}
      </div>
    </div>
  );
}

export default InfoTooltip;