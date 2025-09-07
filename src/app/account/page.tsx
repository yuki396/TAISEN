'use client'
import { useEffect, useState } from 'react';
import { 
  getCurrentUser, 
  fetchProfileById, 
  updateProfile, 
  deletePopuralityVotes, 
  fetchWeightClassesByGender, 
  fetchMyTop4, 
  fetchFightersByGender,
  uploadImage,
  removeImage,
  fetchPopularityVotes,
  fetchFightCards,
  deleteMyTop4
} from '@/utils/supabaseBrowserUtils';
import Image from 'next/image';
import { supabase } from '@/libs/supabaseBrowserClient';
import { MdPerson, MdEdit, MdViewList, MdUpload } from "react-icons/md";
import { FaCrown } from "react-icons/fa";
import { ProfileUI, FightCardUI, MyTop4, Top4UI, Top4, WeightClass, Fighter } from '@/types/types';
import GenderTab from '@/components/GenderTab';
import { isSmallFont, insertLineBreak, noBreakDots } from '@/utils/textUtils';

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [top4loading, setTop4Loading] = useState(true);
  const [weightClassesLoaded, setWeightClassesLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [profile, setProfile] = useState<ProfileUI | null>(null);
  const [form, setForm] = useState({ username: '', image_url: ''});
  const [userId, setUserId] = useState<string | null>(null);
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [weightClasses, setWeightClasses] = useState<WeightClass[]>([]);
  const [gender, setGender] = useState<'male' | 'female'>('male');

  const [editing, setEditing] = useState(false);
  const [oldImagePath, setoldImagePath] = useState<string | null>(null);

  const [votedCards, setVotedCards] = useState<FightCardUI[]>([]);
  const [showVoted, setShowVoted] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);

  const [showTop4, setMyTop4Open] = useState(false);
  const [myTop4, setMyTop4] = useState<Top4UI[]>([]);
  const [originalMyTop4, setOriginalMyTop4] = useState<Top4UI[] | null>(null);
  const [selectedTop4Slots, setSelectedTop4Slots] = useState<string[]>([]);

  const [isTop4Editing, setIsTop4Editing] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [filtered, setFiltered] = useState<Fighter[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedFighter, setSelectedFighter] = useState<Fighter | null>(null);
  
  useEffect(() => {
    (async () => {
      try {
        // Display Loading
        setLoading(true);

        // Get current userData
        const user = await getCurrentUser();
        if (user) setUserId(user.id);

        // Get user profile info
        if (user){
          const {pData, pError} = await fetchProfileById(user.id);
          if (pError) {
            console.error('Failed to fetch profile', JSON.stringify(pError));
            return;
          } else {
            // Set user profile info
            setProfile(pData);

            // Set user profile info to profle page
            setForm({
              username: pData.username ?? '',
              image_url: pData.image_url ?? ''
            });

            // Get image file name
            if (pData.image_url) {
              const pathMatch = pData.image_url.match(/\/storage\/v1\/object\/public\/profile\/(.+)$/);
              if (pathMatch) {
                setoldImagePath(pathMatch[1]);
              }
            };
          };
        };
      } catch (e: unknown) {
        console.error('Unexpected error during loading profile : ', e);
        setErrorMsg('不明なエラーが発生しました。しばらくしてから再試行してください。');
      } finally {
        setLoading(false);
      };
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setWeightClassesLoaded(false);
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
      // Fetch fighters and set initial fighter list
      const { fData, fError } = await fetchFightersByGender(gender);
      if (!fError && fData){
        // Set fighters, organizations
        const fightersList = (fData || []).map(({ id, name, gender}) => ({ id, name, gender }));
        setFighters(fightersList);
      }
      setWeightClassesLoaded(true);
    })();
  }, [gender]);

  // For loading My Top 4
  useEffect(() => {
    (async () => {
      setTop4Loading(true);
      // Ensure weight classes and user ID are loaded
      if (!userId || !weightClassesLoaded) return;
      if (!userId) return;
      
      try {
        // Fetch my Top4 data
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
          const fightersForClass = t4Array.filter(t => t.weightClass?.id === w.id);

          const fighters: Top4UI["fighters"] = [
            { id: -1, name: "NOTHING" },
            { id: -1, name: "NOTHING" },
            { id: -1, name: "NOTHING" },
            { id: -1, name: "NOTHING" },
          ];

          for (const t of fightersForClass) {
            fighters[t.position - 1] = { id: t.fighter.id, name: t.fighter.name }
          }

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
      } finally {
        setTop4Loading(false);
      }
    })();
  }, [userId, gender, weightClassesLoaded]);

  // For updating profile
  const handleUpdate = async () => {
    try {
      setErrorMsg('');

      // Check if username is empty
      if (!form.username.trim()) {
        setErrorMsg('ユーザー名を入力してください');
        return;
      }

      // Check if username is longer than 20
      if (form.username.length > 20) {
        setErrorMsg('ユーザー名は20文字以内で入力してください');
        return;
      }

      // Update profile
      if (profile) {
        const upError = await updateProfile(profile.id, { username: form.username, image_url: form.image_url });
        if (upError) {
          console.error("Failed to update profile : ",JSON.stringify(upError));
          setErrorMsg('更新に失敗しました。しばらくしてから再試行してください。');
          return;
        } else {
          setProfile({ ...profile, username: form.username, image_url: form.image_url});
        }
      }
      setEditing(false);
    } catch (e: unknown) {
      console.error('Unexpected error during updating profile : ', e);
      setErrorMsg('不明なエラーが発生しました。しばらくしてから再試行してください。');
    }
  };

  // For uploading image 
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    if (!e.target.files || e.target.files.length === 0) return;

    // Check image file size
    const file = e.target.files[0];
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMsg('画像サイズは2MB以下にしてください');
      return;
    }

    // Generate a new file path from the image
    const fileExt = file.name.split('.').pop(); // Get the extension
    const uniqueFileName = `${crypto.randomUUID()}.${fileExt}`; // Generate file name by adding UUID and extension
    const filePath = `${userId}/${uniqueFileName}`; // Generate file path by adding userID and new file name

    try {
      // Upload image to storage
      const upError = await uploadImage(filePath, file);
      if (upError) {
        console.error('Failed to uploade image : ', JSON.stringify(upError));
        setErrorMsg('画像のアップロードに失敗しました。しばらくしてから再試行してください。');
      }

      // Get public URL of image from storage
      const { data } = supabase.storage.from('profile').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      if (!publicUrl) {
        setErrorMsg('画像のアップロードに失敗しました。しばらくしてから再試行してください。');
        return;
      }

      // Dlete old image path from profile table
      if (oldImagePath) {
        await removeImage(oldImagePath);
      }

      // Set image(public URL) to profle page
      setForm({ ...form, image_url: publicUrl });

      // Set new file path to old image path
      setoldImagePath(filePath);

    } catch (e: unknown) {
      console.error('Unexpected error during uploading image : ', e);
      setErrorMsg('不明なエラーが発生しました。しばらくしてから再試行してください。');
    }
  };
  
  // For getting a list of matches predicted by the user
  const fetchVotedCards = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        // Get voted　data
        const { votesData, votesError } = await fetchPopularityVotes(user.id);
        if (votesError) {
          console.error('Failed to get popularity votes', JSON.stringify(votesError));
          return;
        }
        if (!votesData || votesData.length === 0) {
          setVotedCards([]);
          return;
        }

        // Return voted cards by the user based on the fight card ids
        const fightCardIds = votesData?.map(v => v.fight_card_id);

        // Get voted card data
        const { cardsData, cardsError } = await fetchFightCards(fightCardIds);
        if (cardsError) {
          console.error('Failed to get voted cards : ', JSON.stringify(cardsError));
          return;
        }
        const votedCards: FightCardUI[] = (cardsData || []).map((v) => ({
          id: v.id,
          fighter1: Array.isArray(v.fighter1) ? v.fighter1[0] ?? null : (v.fighter1 ?? null),
          fighter2: Array.isArray(v.fighter2) ? v.fighter2[0] ?? null : (v.fighter2 ?? null),
          organization: Array.isArray(v.organization) ? v.organization[0] ?? null : (v.organization ?? null),
          weight_class: Array.isArray(v.weight_class) ? v.weight_class[0] ?? null : (v.weight_class ?? null),
          fighter1_votes: v.fighter1_votes ?? 0,
          fighter2_votes: v.fighter2_votes ?? 0,
          popularity_votes: v.popularity_votes ?? 0,
        }));
        setVotedCards(votedCards);
      }
    } catch (e: unknown) {
      console.error('Unexpected error during fetching voted cards : ', e);
      setErrorMsg('不明なエラーが発生しました。しばらくしてから再試行してください。');
    }
  };

  // For deleting popularity vote
  const handleVoteDelete = async () => {
    try {
      // Delete votes for selected fight cards
      const { votesError } = await deletePopuralityVotes(userId, selectedCardIds);

      if (votesError) {
        console.error('Failed to delte vote : ', JSON.stringify(votesError));
        setErrorMsg('投票の取り消しに失敗しました。しばらくしてから再試行してください。');
        return;
      } else {
        // Fetch updated voted cards
        await fetchVotedCards();
        // Reset selected card ids
        setSelectedCardIds([]);
      }
    } catch (e: unknown) {
      console.error('Unexpected error during deleting votes : ', e);
      setErrorMsg('不明なエラーが発生しました。しばらくしてから再試行してください。');
    }
  };

  // For toggling card selection
  const toggleCardSelect = (id: number) => {
    setSelectedCardIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  // For starting edit mode for MyTop4
  const startTop4Edit = () => {
    setOriginalMyTop4(JSON.parse(JSON.stringify(myTop4)));
    setIsTop4Editing(true);
  };

  // For handling serch input
  const handleChange = (value: string) => {
    setSearchInput(value);
    setSelectedFighter(null);
    if (!value) {
      setFiltered([]);
      setSearchOpen(false);
      return;
    }
    const f = fighters.filter((a) => a.name.toLowerCase().includes(value.toLowerCase()));
    setFiltered(f.slice(0, 20));
    setSearchOpen(true);
  };

  // For dragging selected fitghter
  const onDragStartSelected = (e: React.DragEvent, fighter: Fighter) => {
    // Set drag data 
    e.dataTransfer.setData('application/json', JSON.stringify(fighter));
    // Set move effect
    e.dataTransfer.effectAllowed = 'move';
  };

  // For doragging to Top4 fighter slot area
  const handleDropToSlot = (e: React.DragEvent, weightIndex: number, slotIndex: number) => {
    // Prevent default behavior
    e.preventDefault();
    // Get drag data
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    try {
      // Set to Top4 fighter slot area
      const fighter: Fighter = JSON.parse(raw);
      setMyTop4((prev) => {
        const copy = JSON.parse(JSON.stringify(prev)) as Top4UI[];
        if (!copy[weightIndex]) return prev;
        copy[weightIndex].fighters[slotIndex] = { id: fighter.id, name: fighter.name };
        return copy;
      });
    } catch (e: unknown) {
      console.error('Unexpected error during dragging fighter', e);
    }
  };

  // For allowing drop to Top4 fighter slot area
  const handleDragOver = (e: React.DragEvent) => {
    // Prevent default behavior
    e.preventDefault();
    // Set move effect
    e.dataTransfer.dropEffect = 'move';
  };

  // For saving Top4 fighters
  const saveTop4 = async () => {
    try {
      setErrorMsg('');
      // For each weightclass, delete existing user_top4 rows and insert new figehters
      for (const w of myTop4) {
        // Check duplicate names
        const names = w.fighters
          .filter(f => f.id !== -1)
          .map(f => (f.name ?? '').trim().toLowerCase())
          .filter(n => n && n !== 'nothing');

        if (names.length !== new Set(names).size) {
          setErrorMsg(`階級「${w.weightClass.name}」内に同名の選手があります`);
          return;
        }
        
        // Delete existing top 4
        const t4Error = await deleteMyTop4(userId, w.weightClass.id);
        if (t4Error) {
          console.error('Failed to delete my top 4')
          setErrorMsg("選手の登録に失敗しました。しばらくしてから再試行してください。")
          return;
        }

        // Prepare new figehters
        const topFighters: MyTop4[] = w.fighters.map((f, idx) => ({
          user_id: userId,
          weight_class_id: w.weightClass.id,
          fighter_id: f.id,
          position: idx + 1
        })).filter((r) => r.fighter_id !== -1); // skip NOTHING

        // Insert new figehters
        if (topFighters.length > 0) {
          const { error: insError } = await supabase
            .from('user_top4')
            .insert(topFighters);
          if (insError) {
            console.error('insert error', insError);
            setErrorMsg("選手の登録に失敗しました。しばらくしてから再試行してください。")
            return;
          }
        }
      }

      // Fetch my Top4 data and update the UI
      const { t4Data, t4Error } = await fetchMyTop4(userId, gender);
      if (t4Error) {
        console.error('Failed to fetch my top4', JSON.stringify(t4Error));
        return;
      } else if (t4Data) {
        const t4Array: Top4[] = (t4Data || []).map((t) => ({
          fighter: Array.isArray(t.fighter) ? t.fighter[0] ?? null : (t.fighter ?? null),
          weightClass: Array.isArray(t.weight_class) ? t.weight_class[0] ?? null : (t.weight_class ?? null),
          position: t.position
        }));

        // Change to UI format
        const wArray: Top4UI[] = (weightClasses || []).map((w) => {
          const fightersForClass = t4Array.filter(t => t.weightClass?.id === w.id);

          const fighters: Top4UI["fighters"] = [
            { id: -1, name: "NOTHING" },
            { id: -1, name: "NOTHING" },
            { id: -1, name: "NOTHING" },
            { id: -1, name: "NOTHING" },
          ];

          for (const t of fightersForClass) {
            fighters[t.position - 1] = { id: t.fighter.id, name: t.fighter.name }
          }

          return {
            weightClass: { name: w.name === "階級なし" ? "PFP" : w.name, id: w.id },
            fighters,
          };
        });

        setMyTop4(wArray);
        setIsTop4Editing(false);
        setFiltered([]);
        setSearchInput('');
        setSearchOpen(false);
        setSelectedFighter(null);
      }
    } catch (e: unknown) {
      console.error('Unexpected error during getting saving top4 fighters : ', e);
      setErrorMsg('不明なエラーが発生しました。しばらくしてから再試行してください。');
    }
  };

  // For toggling selected Top4 fighters
  const toggleTop4Select = (weightClassId: number, slotIndex: number) => {
    const key = `${weightClassId}_${slotIndex}`; // 例: "12_0"
    setSelectedTop4Slots((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // For deleting Top4 fighters
  const handleTop4Delete = async () => {
    try {
      // Delete Top4 fighters for selected fighter
      for (const slotKey  of selectedTop4Slots) {
        const sep = slotKey.indexOf('_');
        const weightClassId= Number(slotKey.slice(0, sep));
        const position = Number(slotKey.slice(sep + 1)) + 1;
        // Delete existing top 4
        const t4Error = await deleteMyTop4(userId, weightClassId, position);
        if (t4Error) {
          console.error('Failed to delete my top 4')
          return;
        }
      }
      // Fetch my top4 data and update the UI
      const { t4Data, t4Error } = await fetchMyTop4(userId, gender);
      if (t4Error) {
        console.error('Failed to fetch my top4', JSON.stringify(t4Error));
        setErrorMsg('Top4の解除に失敗しました。しばらくしてから再度再試行してください。');
        return;
      } else if (t4Data) {
        const t4Array: Top4[] = (t4Data || []).map((t) => ({
          fighter: Array.isArray(t.fighter) ? t.fighter[0] ?? null : (t.fighter ?? null),
          weightClass: Array.isArray(t.weight_class) ? t.weight_class[0] ?? null : (t.weight_class ?? null),
          position: t.position
        }));

        // Change to UI format
        const wArray: Top4UI[] = (weightClasses || []).map((w) => {
          const fightersForClass = t4Array.filter(t => t.weightClass?.id === w.id);

          const fighters: Top4UI["fighters"] = [
            { id: -1, name: "NOTHING" },
            { id: -1, name: "NOTHING" },
            { id: -1, name: "NOTHING" },
            { id: -1, name: "NOTHING" },
          ];

          for (const t of fightersForClass) {
            fighters[t.position - 1] = { id: t.fighter.id, name: t.fighter.name }
          }

          return {
            weightClass: { name: w.name === "階級なし" ? "PFP" : w.name, id: w.id },
            fighters,
          };
        });

        setMyTop4(wArray);
      }
    } catch (e: unknown) {
      console.error('Unexpected error during deleting votes : ', e);
      setErrorMsg('不明なエラーが発生しました。しばらくしてから再試行してください。');
    } finally {
      setSelectedTop4Slots([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center mt-10">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  } 

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {!editing && profile && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
            <div className="text-center mt-8">
              <div className="relative flex items-center justify-center rounded-full overflow-hidden border-4 border-gray-200 mx-auto w-32 h-32 ">
                {profile.image_url ? (
                  <Image src={profile.image_url} alt="Avatar" fill className="object-cover" />
                ) : (
                  <MdPerson size={100} color="#ccc" />
                )}
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mt-6 mx-20">{profile.username}</h2>
              <p className="text-gray-500 mt-2">{profile.email}</p>
            </div>
            <div className="grid grid-cols-2 grid-rows-2 gap-3 mt-4">
              <button
                className="flex items-center justify-center gap-x-2 text-white font-semibold bg-red-600 hover:bg-red-700 
                          transition duration-200 rounded-lg py-3 px-8 cursor-pointer"
                onClick={() => setEditing(true)}
              >
                <MdEdit size={20} />
                <span>編集</span>
              </button>
              <button
                onClick={() => {
                  fetchVotedCards();
                  setShowVoted(!showVoted);
                }}
                className="flex items-center justify-center gap-x-2 text-white font-semibold bg-black hover:bg-gray-700 
                          transition duration-200 rounded-lg py-3 px-8 cursor-pointer"
              >
                <MdViewList size={20} />
                <span>投票カード</span>
              </button>
              <button
                onClick={ () => {
                  fetchVotedCards();
                  setMyTop4Open(!showTop4);
                }}
                className="flex items-center justify-center gap-x-2 text-white font-semibold bg-black hover:bg-gray-700 
                          transition duration-200 rounded-lg py-3 px-8 cursor-pointer"
              >
                <FaCrown size={20} />
                <span>MyTop4</span>
              </button>
            </div>
          </div>
        )}

        {/* Edit pofile */}
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"                   
              onClick={() => {
                setEditing(false);
                setForm({
                  username: profile?.username ?? '',
                  image_url: profile?.image_url ?? ''
                });
                setErrorMsg('');
              }}
            />
            <div className="relative bg-white rounded-xl p-6 shadow-xl w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-center border-b pb-2">
                プロフィールを編集
              </h3>
              <div className="text-center mt-4">
                <div className="relative flex items-center justify-center overflow-hidden border-4 border-gray-200 rounded-full mx-auto w-32 h-32">
                  {form.image_url ? (
                    <Image src={form.image_url} alt="Avatar Preview" fill className="object-cover" />
                  ) : (
                    <MdPerson size={100} className="text-gray-400" />
                  )}
                </div>
              </div>

              <div className="flex justify-center mt-4">
                <label 
                  className="flex items-center space-x-2 text-white font-medium rounded-lg 
                            bg-gray-600 hover:bg-gray-700 transition duration-200 py-2 px-4 cursor-pointer"
                >
                  <MdUpload size={16} />
                  <span>画像を選択</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              {errorMsg && <p className="text-red-600 rounded bg-red-50 border border-red-300 p-2 mt-2">{errorMsg}</p>}

              <div className="mt-3">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  ユーザー名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  maxLength={20}
                  className="border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent px-3 py-2 w-full"
                  placeholder="ユーザー名を入力してください"
                />
              </div>
              
              <div className="flex justify-center gap-x-4 pt-6">
                <button
                  onClick={() => {
                    setEditing(false);
                    setForm({
                      username: profile?.username ?? '',
                      image_url: profile?.image_url ?? ''
                    });
                    setErrorMsg('');
                  }}
                  className="text-white font-semibold bg-gray-600 hover:bg-gray-400 transition duration-200 rounded-lg py-3 px-8 min-w-[150px] cursor-pointer"
                >
                  <span>キャンセル</span>
                </button>
                <button
                  onClick={handleUpdate}
                  className="text-white font-semibold bg-blue-600 hover:bg-blue-400 rounded-lg 
                            transition duration-200 py-3 px-8 min-w-[150px] cursor-pointer"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* My voted cards */}
        {showVoted && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => { 
                setShowVoted(false);
                setSelectedCardIds([]); 
              }} 
            />
            <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-5xl max-h-lg mx-10 max-h-[90vh] w-full overflow-y-auto">
              <div className="flex justify-between">
                <h3 className="text-xl font-semibold">投票カード一覧</h3>
                <div className="flex">
                  {selectedCardIds.length > 0 && (
                    <button 
                      onClick={handleVoteDelete} 
                      className="text-white rounded-lg font-semibold bg-red-600 hover:bg-red-700 transition duration-200 py-1 px-7 min-w-[150px] cursor-pointer"
                    >
                      投票を取り消す
                    </button>
                  )} 
                  <button
                    onClick={() => {
                      setShowVoted(false);
                      setSelectedCardIds([]);
                    }}
                    className="text-white font-semibold rounded-lg bg-gray-600 hover:bg-gray-400 transition duration-200 py-2 px-7 mx-3 cursor-pointer"
                  >
                    閉じる
                  </button>
                </div>
              </div>
              <div className="border-t border-gray-300 border-radius mt-2"/>
              {votedCards.length === 0 ? (
                  <div className="flex justify-center items-center h-60 mt-2">
                    <p className="text-xl text-gray-400">投票した対戦カードがありません</p>
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 mt-5 mx-3">
                    {votedCards.map((card) => {
                      return (
                        <button
                          key={card.id}
                          onClick={() => toggleCardSelect(card.id)}
                          className={`bg-gray-50 rounded-lg shadow border border-gray-200 px-3 py-2 h-[170px]
                                      min-w-[300px] md:min-w-[200px] lg:min-w-[200px] cursor-pointer
                                      ${selectedCardIds.includes(card.id) ? 'bg-red-100 border-red-300' : ''}`}
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-x-3 h-[100px]">
                              <div 
                                className={`flex-1 font-semibold rounded whitespace-pre-line break-keep overflow-hidden
                                ${isSmallFont(card.fighter1?.name) ? "text-base" : "text-lg"}`}
                              >
                                {noBreakDots(insertLineBreak(card.fighter1?.name, 6))}
                              </div>
                              <span className="text-lg font-semibold">vs</span>
                              <div 
                                className={`flex-1 font-semibold rounded whitespace-pre-line break-keep overflow-hidden 
                                  ${isSmallFont(card.fighter2?.name) ? "text-base" : "text-lg"}`}
                              >
                                {noBreakDots(insertLineBreak(card.fighter2?.name, 6))}
                              </div>
                            </div>
                            <div className="flex gap-x-3 mt-2">
                              <span className="text-black bg-gray-100 rounded px-1 py-1">
                                {card.organization?.name}
                              </span>
                              <span className="text-black bg-gray-100 rounded px-1 py-1">
                                {card.weight_class?.name}
                              </span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )
              }
            </div>
          </div>
        )}

        {/* My Top 4 */}
        {showTop4 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => { if (!isTop4Editing) setMyTop4Open(false) }} />
            <div className="relative flex flex-col bg-white rounded-xl shadow-xl px-5 max-w-5xl max-h-lg mx-10 h-[90vh] w-full">
              <div className="flex justify-between mx-4 mt-6 pb-4">
                <h3 className="text-3xl font-semibold">MyTop4</h3>
                <div className="flex items-center gap-3">
                  {!isTop4Editing ? (
                    <>
                      {selectedTop4Slots.length > 0 ? (
                        <button 
                          onClick={handleTop4Delete} 
                          className="text-white font-semibold rounded-lg bg-red-600 hover:bg-red-700 transition duration-200 py-2 px-4 cursor-pointer"
                        >
                          Top4を解除
                        </button>
                      ) : (
                        <button
                          onClick={startTop4Edit}
                          className="text-white font-semibold rounded-lg bg-red-600 hover:bg-red-700 transition duration-200 py-2 px-4 cursor-pointer"
                        >
                          更新
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => { 
                          setMyTop4Open(false);
                          setSelectedTop4Slots([]);
                          setErrorMsg('');
                        }}
                        className="text-white font-semibold rounded-lg bg-gray-600 hover:bg-gray-400 transition duration-200 py-2 px-4 cursor-pointer"
                      >
                        閉じる
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={saveTop4}
                        className="text-white font-semibold rounded-lg bg-blue-600 hover:bg-blue-400 transition duration-200 py-2 px-4 cursor-pointer"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => {
                          if (originalMyTop4) setMyTop4(originalMyTop4);
                          setIsTop4Editing(false);
                          setSearchInput('');
                          setSearchOpen(false);
                          setFiltered([]);
                          setOriginalMyTop4(null);
                          setSelectedFighter(null);
                          setErrorMsg('');
                        }}
                        className="text-white font-semibold rounded-lg bg-gray-600 hover:bg-gray-400 transition duration-200 py-2 px-4 cursor-pointer"
                      >
                        キャンセル
                      </button>
                    </>
                  )}
                </div>
              </div>
              {!isTop4Editing && (
                <GenderTab
                  value={gender} 
                  onChange={(val) =>{
                    setGender(val);
                    setSelectedTop4Slots([]);
                    setErrorMsg('');  
                  }} 
                />
              )}
              <p className="border-b border-gray-300"/>
              {/* Search area shown only in edit mode */}
              {isTop4Editing && (
                <div className="mt-3">
                  <input
                    value={searchInput}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder="選手名を入力"
                    className="border border-gray-300 rounded px-3 py-2 w-full"
                  />

                  {/* Filetered fighter list */}
                  {searchOpen && filtered.length > 0 && (
                    <ul className="z-20 bg-white rounded shadow border border-gray-300 mt-1 w-full max-h-60 overflow-auto">
                      {filtered.map((f) => (
                        <li
                          key={f.id}
                          onClick={() => {
                            setSelectedFighter(f);
                            setSearchInput(f.name);
                            setSearchOpen(false);
                          }}
                          className="hover:bg-gray-100 px-3 py-2 cursor-pointer"
                        >
                          {f.name}
                        </li>
                      ))}
                    </ul>
                  )}

                  {searchOpen && searchInput && filtered.length === 0 && (
                    <div className="z-10 text-gray-500 bg-white rounded border border-gray-300 px-3 py-2 mt-1 w-full">
                      該当なし
                    </div>
                  )}
                  {errorMsg && (
                    <div className="text-red-600 border border-red-300 bg-red-50 rounded p-2 mt-3 mx-2">{errorMsg}</div>
                  )}

                  {/* Seclected fighter (draggable) */}
                  {selectedFighter && (
                    <div className="flex items-center gap-3 mt-3 ml-3">
                      <div
                        className="flex justify-center items-center text-center shadow-md rounded-lg border border-gray-300 p-2"
                        draggable
                        onDragStart={(e) => onDragStartSelected(e, selectedFighter)}
                      >
                        <p 
                          className={`flex justify-center items-center font-semibold whitespace-pre-line break-keep overflow-hidden
                                      rounded h-[80px] w-[210px] ${isSmallFont(selectedFighter.name) ? "text-lg" : "text-xl"} cursor-pointer`}
                        >
                          {noBreakDots(insertLineBreak(selectedFighter.name, 10))}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Top4 fighter slot area (droppable) */}
              <div className="flex-1 mt-4 overflow-auto">
                { top4loading && weightClassesLoaded ? (
                  <div className="flex justify-center items-center mt-20">
                    <p className="text-gray-500">読み込み中...</p>
                  </div>
                ) : (
                  myTop4.map((t, idx) => (
                    <div key={idx} className="border-b border-gray-300 border-radius pb-6 mx-3">
                      <h2 className="text-2xl font-bold mt-1">{t.weightClass.name}</h2>
                      <div className="grid grid-rows-4 lg:grid-rows-1 lg:grid-cols-4 sm:grid-rows-2 sm:grid-cols-2 gap-4 mt-3">
                        {t.fighters.map((f, slotIdx) => {
                          const isNothing = f.id === -1;
                          const slotKey = `${t.weightClass.id}_${slotIdx}`;
                          return(
                            <button
                              key={slotIdx}
                              disabled={isNothing}
                              onDrop={(e) => handleDropToSlot(e, idx, slotIdx)}
                              onDragOver={handleDragOver}
                              onClick={() => !isTop4Editing && toggleTop4Select(t.weightClass.id, slotIdx)}
                              className={`relative border border-gray-300/50 rounded-lg shadow-[0_5px_25px_rgba(255,0,0,0.3)]
                                          hover:shadow-[0_8px_30px_rgba(255,0,0,0.5)] hover:border-gray-300 transition-shadow 
                                          duration-300 h-[110px] ${isTop4Editing ? 'hover:bg-red-100' : ''}
                                          ${selectedTop4Slots.includes(slotKey) ? 'bg-red-100 border-red-300' : ''}`}
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
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}