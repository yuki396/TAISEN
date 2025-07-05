const WEIGHTS = [
  '指定なし',
  '階級なし',
  '77KG',
  '71KG',
  '67.5KG',
  '64KG',
  '61KG',
  '58KG',
  '55KG',
  '53KG',
];

const WeightSelect = ({ value, onChange }: { value: string; onChange: (newWeight: string) => void }) => {
  return (
    <div className="col-span-2">
      <h2 className="mb-1 text-lg">階級</h2>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {WEIGHTS.map(w => (
          <option key={w} value={w}>
            {w}
          </option>
        ))}
      </select>
    </div>
  );
};

export default WeightSelect;