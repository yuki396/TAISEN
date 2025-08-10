'use client'
import React, { useEffect, useState } from 'react';
import { fetchWeightClassesByGender } from "@/utils/supabaseUtils";
import {WeightClass} from '@/types/types';

const WeightSelect = ({ value, onChange, gender }: { value: string; onChange: (newWeight: string) => void; gender: "male" | "female";}) => {
  const [weightClasses, setWeightClasses] = useState<WeightClass[]>([]);

  useEffect(() => {
    (async () => {
      const { wData, wError } = await fetchWeightClassesByGender(gender);
      if (!wError && wData) {
        setWeightClasses(wData);
      } else {
        console.error("Failed to fetch weight classes : ", wError);
      }
    })();
  }, [gender]);

  return (
    <div className="w-[130] md:col-span-2 md:w-full">
      <h2 className="text-lg mb-1">階級</h2>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 px-3 py-2 w-full cursor-pointer"
      >
        {weightClasses.map(w => (
          <option key={w.id} value={w.name}>
            {w.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default WeightSelect;