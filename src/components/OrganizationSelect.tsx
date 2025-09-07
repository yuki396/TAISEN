
import React, { useEffect, useState } from 'react';
import { fetchOrganizations } from '@/utils/supabaseBrowserUtils';
import { Organization } from '@/types/types';

const OrganizationSelect = ({ value, onChange }: { value: string; onChange: (newOrg: string) => void; }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    (async () => {
      const { oData, oError } = await fetchOrganizations();
      if (oError) {
        console.error('Failed to fetch organizations : ', JSON.stringify(oError));
      } else {
        const withDefault = [
          { id: -1, name: '指定なし' },
          ...(oData ?? [])
        ];
        setOrganizations(withDefault ?? []);
      }
    })();
  }, []);
    
  return (
    <div className="col-span-1 lg:col-span-2 lg:w-full">
      <h2 className="text-lg mb-1">団体</h2>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-bold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 px-3 py-2 w-full cursor-pointer"
      >
        {organizations.map((org) => (
          <option key={org.id} value={org.name}>
            {org.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default OrganizationSelect;
