
import React, { useEffect, useState } from 'react';
import { fetchOrganizations } from "@/utils/supabaseUtils";
import { Organization } from '@/types/types';

const OrganizationSelect = ({ value, onChange }: { value: string; onChange: (newOrg: string) => void; }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    (async () => {
      const { oData, oError } = await fetchOrganizations();
      if (!oError && oData) {
        setOrganizations(oData);
      } else {
        console.error("Failed to fetch organizations : ", oError);
      }
    })();
  }, []);
    
  return (
    <div className="md:col-span-2 md:w-full w-[150]">
      <h2 className="text-lg mb-1">団体</h2>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full px-3 py-2 cursor-pointer"
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
