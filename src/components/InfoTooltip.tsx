import { MdInfoOutline } from 'react-icons/md';
import { useState, useEffect, useRef } from 'react';

// Tooltip component that shows additional information when hovered, focused, or clicked
const InfoTooltip = ({ id, content }: { id: string; content: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close tooltip when the "Escape" key is pressed
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShow(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Handle click outside to close it
  useEffect(() => {
    // For handling click outside
    const handleClickOutside = (e: MouseEvent) => {
      // Check if dropdown is open and,
      // if the click is outside(the clicked element is not among the elements referenced by ref)
      if (ref.current && !ref.current.contains(e.target as Node)) {
        // close dropdown
        setShow(false);
      }
    };
    // Add event listener for clciking mouse
    document.addEventListener('mousedown', handleClickOutside);
    // Cleanup event listener on unmount
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
    

  return (
    <div ref={ref} className="relative flex items-center">
      {/* Button that triggers the tooltip (icon button) */}
      <button
        onClick={() => setShow(s => !s)} // Toggle tooltip on click
        className={`rounded hover:bg-gray-100 ${show ? 'ring-2 ring-blue-500' : ''} cursor-pointer`}
        type="button"
      >
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