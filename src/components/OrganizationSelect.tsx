const ORGANIZATIONS = [
  '指定なし',
  '団体なし',
  'Rise',
  'K-1',
  'ONE',
  'Glory',
  'Knockout',
  'ShootBoxing',
];

const OrganizationSelect = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (newOrg: string) => void;
}) => {
  return (
    <div className="col-span-2">
      <h2 className="mb-1 text-lg">団体</h2>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {ORGANIZATIONS.map((org) => (
          <option key={org} value={org}>
            {org}
          </option>
        ))}
      </select>
    </div>
  );
};

export default OrganizationSelect;
