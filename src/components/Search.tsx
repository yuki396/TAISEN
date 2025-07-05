const Search = ({ value, onChange }: { value: string; onChange: (newWeight: string) => void }) => {
  return (
    <div className="col-span-8">
      <h2 className="mb-1 text-lg">検索</h2>
      <input
        type="text"
        placeholder="選手名を入力"
        className="w-full border border-gray-300 rounded-lg py-2 px-4 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onChange={(e) => onChange(e.target.value)}
        value={value}
      />
    </div>
  );
};

export default Search;