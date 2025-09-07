'use client';
import React, { useEffect, useState } from 'react';
import GenderTab from '@/components/GenderTab';
import {  WeightClass, Top4, Top4UI } from '@/types/types'
import { getCurrentUser, fetchMyTop4, fetchWeightClassesByGender, fetchTop4Counts } from '@/utils/supabaseBrowserUtils';
import { insertLineBreak, isSmallFont, noBreakDots } from '@/utils/textUtils'; 

export default function Top4FightersPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [weightClasses, setWeightClasses] = useState<WeightClass[]>([]);

  const [top4, setTop4] = useState<Top4UI[]>([]);
  const [myTop4, setMyTop4] = useState<Top4UI[]>([]);
  const [isMyTop4Open, setMyTop4Open] = useState(false);

  const [loading, setLoading] = useState(true); 

	useEffect(() => {
		(async () => {
        // Get current userData
        const user = await getCurrentUser();
        if (user) setUserId(user.id);
        // Fetch weight classes by gender
        const { wData, wError } = await fetchWeightClassesByGender(gender);
        if (wError) {
          console.error('Failed to fetch top4 view data', JSON.stringify(wError));
          return;
        } else {
          const wArray: WeightClass[] = (wData || []).map((w) => ({
            id: w.id,
            name: w.name,
            gender: w.gender
          }));
          setWeightClasses(wArray);
        }
		})();
	}, [gender]);

  // For fetching top4 fighter
  useEffect(() => {
    (async () => {
      // Display Loading 
      setLoading(true);
      try {
        // Ensure weight classes and user ID are loaded
        if (!weightClasses.length){
          setLoading(false);
          return;
        }
        // Fetch top4 data sorted by votes, separated by gender
        const { t4cData, t4cError } = await fetchTop4Counts(gender);
        if (t4cError) {
          console.error('Failed to fetch top4 view data', JSON.stringify(t4cError));
          return;
        } else {
          const t4Array: Top4[] = (t4cData || []).map((t) => ({
            fighter: Array.isArray(t.fighter) ? t.fighter[0] ?? null : (t.fighter ?? null),
            weightClass: Array.isArray(t.weight_class) ? t.weight_class[0] ?? null : (t.weight_class ?? null),
            position: t.rank
          }));

          // Change to UI format
          const wArray: Top4UI[] = (weightClasses || []).map((w) => {
            const fightersForClass = t4Array
              .filter(t => t.weightClass?.id === w.id)
              .map(t => t.fighter)
              .filter((f): f is { id: number; name: string } => f !== null);

            const fighters = [
              fightersForClass[0] ?? { id: -1, name: "NOTHING" },
              fightersForClass[1] ?? { id: -1, name: "NOTHING" },
              fightersForClass[2] ?? { id: -1, name: "NOTHING" },
              fightersForClass[3] ?? { id: -1, name: "NOTHING" },
            ] as Top4UI["fighters"];

            return {
              weightClass: { name: w.name === "階級なし" ? "PFP" : w.name, id: w.id },
              fighters,
            };
          });

          setTop4(wArray);
        }
      } catch (e:unknown) {
                console.error('Unexpected error during getting top4 fighters : ', e);
        setWeightClasses([]);
      } finally {
        setLoading(false);
      }
		})();
  }, [gender, weightClasses]);

  // For loading My Top 4
  useEffect(() => {
    (async () => {
      // Ensure weight classes and user ID are loaded
      if (!weightClasses.length) return;
      if (!userId) return;
      
      try {
        // Fetch my top4 data
        const { t4Data, t4Error } = await fetchMyTop4(userId, gender);
        if (t4Error) {
          console.error('Failed to fetch top4 view data', JSON.stringify(t4Error));
          return;
        } else {
          const t4Array: Top4[] = (t4Data || []).map((t) => ({
            fighter: Array.isArray(t.fighter) ? t.fighter[0] ?? null : (t.fighter ?? null),
            weightClass: Array.isArray(t.weight_class) ? t.weight_class[0] ?? null : (t.weight_class ?? null),
            position: t.position
          }));

          // Change to UI format
          const wArray: Top4UI[] = (weightClasses || []).map((w) => {
            const fightersForClass = t4Array
              .filter(t => t.weightClass?.id === w.id)
              .map(t => t.fighter)
              .filter((f): f is { id: number; name: string } => f !== null);

            const fighters = [
              fightersForClass[0] ?? { id: -1, name: "NOTHING" },
              fightersForClass[1] ?? { id: -1, name: "NOTHING" },
              fightersForClass[2] ?? { id: -1, name: "NOTHING" },
              fightersForClass[3] ?? { id: -1, name: "NOTHING" },
            ] as Top4UI["fighters"];

            return {
              weightClass: { name: w.name === "階級なし" ? "PFP" : w.name, id: w.id },
              fighters,
            };
          });

          setMyTop4(wArray);
        }
      } catch (e: unknown) {
        console.error('Unexpected error during loading my top4 data : ', e);
        setMyTop4([]);
      }
		})();
  }, [userId, gender, weightClasses]);

  return (
    <div className="min-h-screen p-4">
      <div className="flex justify-between">
        <GenderTab value={gender} onChange={setGender} />
        {userId &&
          <button
            type="button"
            onClick={() => setMyTop4Open(true)}
            className={`text-white text-lg ${gender==="male" ? "bg-black hover:opacity-60" : "bg-red-600 hover:bg-red-700"} rounded shadow-md px-3 py-1 mb-2 cursor-pointer`}
          >
            My Top 4
          </button>
        }
      </div>
      {/* Top4 */}
      <div className="rounded shadow-md ">
        {loading ? (
          <div className="border-t border-gray-300 border-radius pt-4 pb-2 mt-3 mx-4">
            <p className="text-center text-gray-500 m-4 p-8">読み込み中...</p>
          </div>
        ) : (top4.map((t, idx) => (
          <div key={idx} className="border-t border-gray-300 border-radius pt-4 pb-2 mt-3 mx-4">
            <h2 className="text-2xl font-bold">{t.weightClass.name}</h2>
            <div className="grid grid-rows-4 lg:grid-rows-1 lg:grid-cols-4 sm:grid-rows-2 sm:grid-cols-2 gap-4 mt-4">
              {t.fighters.map((f, i) => {
                return (
                  <div
                    key={i}
                    className="relative border border-gray-300/50 rounded-lg shadow-[0_5px_25px_rgba(255,0,0,0.3)] 
                              hover:shadow-[0_8px_30px_rgba(255,0,0,0.5)] hover:border-gray-350 transition-shadow 
                              duration-300 h-[110px]"
                  >
                    {/* Small ember */}
                    <span className="ember" style={{ left: "12%", top: "-8%", animationDelay: "0s" }} />
                    <span className="ember" style={{ left: "60%", top: "-14%", animationDelay: "0.45s" }} />
                    <span className="ember" style={{ left: "85%", top: "-6%", animationDelay: "0.9s" }} />
                    <p 
                      className={`flex items-center justify-center text-center flex-1 font-semibold whitespace-pre-line break-keep min-h-[62px]
                                rounded px-2 py-1 h-full min-w-[100px] cursor-pointer ${isSmallFont(f.name) ? "text-xl" : "text-2xl"}`}
                    >
                      {noBreakDots(insertLineBreak(f.name, 9))}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )))}
      </div>

      {/* My Top4 */}
      {isMyTop4Open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => { setMyTop4Open(false) }} />
          <div className="relative flex flex-col bg-white rounded-xl shadow-xl px-5 max-w-5xl max-h-lg mx-10 max-h-[90vh] w-full">
            <div className="flex justify-between border-b border-gray-300 mx-4 mt-6 pb-4">
              <h3 className="text-3xl font-semibold">MyTop4</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMyTop4Open(false)}
                  className="text-white font-semibold rounded-lg bg-gray-600 hover:bg-gray-400
                            transition duration-200 py-2 px-7 cursor-pointer"
                >
                  閉じる
                </button>
              </div>
            </div>
            <div className="flex-1 mt-4 overflow-auto">
              {myTop4.map((t, idx) => (
                <div key={idx} className="border-b border-gray-300 border-radius pb-6 mx-3">
                  <h2 className="text-2xl font-bold mt-1">{t.weightClass.name}</h2>
                  <div className="grid grid-rows-4 lg:grid-rows-1 lg:grid-cols-4 sm:grid-rows-2 sm:grid-cols-2 gap-4 mt-3">
                    {t.fighters.map((f, i) => (
                      <div
                        key={i}
                        className={`relative border border-gray-300/50 rounded-lg shadow-[0_5px_25px_rgba(255,0,0,0.3)]
                                    hover:shadow-[0_8px_30px_rgba(255,0,0,0.5)] hover:border-gray-300 transition-shadow 
                                    duration-300 h-[110px]`}
                      >
                        {/* Small ember */}
                        <span className="ember" style={{ left: "12%", top: "-8%", animationDelay: "0s" }} />
                        <span className="ember" style={{ left: "60%", top: "-14%", animationDelay: "0.45s" }} />
                        <span className="ember" style={{ left: "85%", top: "-6%", animationDelay: "0.9s" }} />
                        <p 
                          className={`flex justify-center items-center text-center font-semibold whitespace-pre-line break-keep overflow-hidden
                                      rounded px-2 py-1 ${isSmallFont(f.name) ? "text-xl" : "text-2xl"} h-full cursor-pointer`}
                        >
                          {noBreakDots(insertLineBreak(f.name, 9))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
