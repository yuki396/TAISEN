'use client'
import React, { useEffect, useState } from 'react';
import { fetchWeightClassesByGender } from '@/utils/supabaseBrowserUtils';
import {WeightClass} from '@/types/types';

const WeightSelect = ({ value, onChange, gender }: { value: string; onChange: (newWeight: string) => void; gender: 'male' | 'female';}) => {
  const [weightClasses, setWeightClasses] = useState<WeightClass[]>([]);

  useEffect(() => {
    (async () => {
      const { wData, wError } = await fetchWeightClassesByGender(gender);
      if (wError) {
        console.error('Failed to fetch weight classes : ', JSON.stringify(wError));
      } else {
        const withDefault = [
          { id: -1, name: '指定なし', gender },
          ...(wData ?? [])
        ];
        setWeightClasses(withDefault ?? []);
      }
    })();
  }, [gender]);

  return (
    <div className="col-span-1 lg:col-span-2 lg:w-full">
      <h2 className="text-lg mb-1">階級</h2>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="font-bold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 px-3 py-2 w-full cursor-pointer"
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