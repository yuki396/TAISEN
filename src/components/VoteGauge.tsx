"use client";

const VoteGauge = ({ leftVotes, rightVotes} :{ leftVotes:number; rightVotes:number; }) => {
  const total = leftVotes + rightVotes;
  const leftPercent = total > 0 ? Math.round((leftVotes / total) * 100): 50;
  const rightPercent = 100 - leftPercent;
  
  return (
    <div
      role="progressbar"
      aria-label="勝率"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={leftPercent}
      className="flex overflow-hidden rounded-md w-full h-4"
    >
      {/* lefg side */}
      <div
        className="transition-width duration-300"
        style={{width: `${leftPercent}%`, backgroundColor: '#EF4444'}}
      />

      {/* right side */}
      <div
        className="transition-width duration-300"
        style={{width: `${rightPercent}%`, backgroundColor: '#3B82F6'}}
      />
    </div>
  );
};

export default VoteGauge;