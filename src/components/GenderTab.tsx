'use client'
import React from 'react';
import { GiBoxingGlove } from 'react-icons/gi';

const GenderTab = ({ value, onChange }: { value: 'male' | 'female'; onChange: (newGender: 'male' | 'female') => void; }) => {
  const tabs: { key: 'male' | 'female'; color: string }[] = [ { key: 'male', color: '' }, { key: 'female', color: '#e3342f' }];

  return (
    <div className="flex w-50 sm:w-80">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`flex-1 text-center font-semibold border border-gray-200 py-2 px-4 cursor-pointer ${
            value === tab.key
              ? "border-b-4 border-b-red-400"
              : "opacity-30 hover:opacity-200"
          }`}
          onClick={() => onChange(tab.key)}
        >
          <GiBoxingGlove
            size={23}
            style={{ color: tab.color }}
            className="mx-auto"
          />
        </button>
      ))}
    </div>
  );
};

export default GenderTab;