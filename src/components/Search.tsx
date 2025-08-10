const Search = ({ value, onChange }: { value: string; onChange: (newWeight: string) => void; }) => {
  return (
    <div className="md:col-span-8">
      <h2 className="text-lg mb-1">検索</h2>
      <input
        type="text"
        placeholder="選手名を入力"
        className="border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 py-2 px-4 mr-2 w-full"
        onChange={(e) => onChange(e.target.value)}
        value={value}
      />
    </div>
  );
};

export default Search;