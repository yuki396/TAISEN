'use client'
import { useEffect, useState } from 'react';
import { isLoggedIn, getCurrentUser, getProfileById, updateProfile } from '@/utils/supabaseUtils';
import Image from 'next/image';
import { supabase } from '@/utils/supabaseBrowserClient';
import { MdPerson, MdEdit, MdViewList, MdUpload, MdCancel } from 'react-icons/md';
import { ProfileUI, FightCardUI} from '@/types/types';
import { isSmallFont, insertLineBreak, noBreakDots } from '@/utils/textUtils';

export default function AccountPage() {
  const [profile, setProfile] = useState<ProfileUI | null>(null)
  const [form, setForm] = useState({ username: '', image_url: ''})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [oldImagePath, setoldImagePath] = useState<string | null>(null)
  const [showVoted, setShowVoted] = useState(false)
  const [votedCards, setVotedCards] = useState<FightCardUI[]>([])
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([])
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Display Loading
        setLoading(true)

        // Confirm login
        const loggedIn = await isLoggedIn()
        if (loggedIn) {
          console.log('ログイン中です')
        } else {
          console.log('ログインしていません')
        }

        // Get current userData
        const user = await getCurrentUser();
        if (user) setUserId(user.id);

        // Get user profile info
        if (user){
          const prof = await getProfileById(user.id)

          // Set user profile info
          setProfile(prof);

          // Set user profile info to profle page
          setForm({
            username: prof.username ?? '',
            image_url: prof.image_url ?? ''
          });

          // Get image file name
          if (prof.image_url) {
            const pathMatch = prof.image_url.match(/\/storage\/v1\/object\/public\/profile\/(.+)$/)
            if (pathMatch) {
              setoldImagePath(pathMatch[1])
            }
          };
        };
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message)
        } else {
          setError('不明なエラーが発生しました')
        }
      } finally {
        setLoading(false)
      };
    })();
  }, []);

  // For uploading image 
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    if (!e.target.files || e.target.files.length === 0) return

    // Check image file size
    const file = e.target.files[0]
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError('画像サイズは2MB以下にしてください');
      return;
    }

    // Generate a new file path from the image
    const fileExt = file.name.split('.').pop() // Get the extension
    const uniqueFileName = `${crypto.randomUUID()}.${fileExt}` // Generate file name by adding UUID and extension
    const filePath = `${userId}/${uniqueFileName}` // Generate file path by adding userID and new file name

    try {
      // Upload image to storage
      const { error: uploadError } = await supabase.storage
        .from('profile')
        .upload(
          filePath, 
          file, 
          { cacheControl: '3600',  upsert: false, } // Set cache expiry to 1 hour and prevent overwriting
        )

      if (uploadError) throw uploadError

      // Get public URL of image from storage
      const { data } = supabase.storage.from('profile').getPublicUrl(filePath)
      const publicUrl = data.publicUrl
      if (!publicUrl) throw new Error('公開URLの取得に失敗しました')

      // Dlete old image path from profile table
      if (oldImagePath) {
        await supabase.storage.from('profile').remove([oldImagePath])
      }

      // Set image(public URL) to profle page
      setForm({ ...form, image_url: publicUrl })

      // Set new file path to old image path
      setoldImagePath(filePath)

    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message)
      } else {
        setError('画像のアップロードに失敗しました')
      }
    }
  }
  
  // For getting a list of matches predicted by the user
  const fetchVotedCards = async () => {
    try {
      // Get voted fight card ids
      const user = await getCurrentUser()
      if (user) {
        const { data: voteData, error: voteError } = await supabase
          .from('votes')
          .select(`fight_card_id`)
          .eq('user_id', user.id)
          .eq('vote_type', 'popularity')
        
        if (voteError) {
          console.error('投票済み対戦カードID取得エラー', error)
          return
        }

        // Return voted cards by the user based on the fight card ids
        const fightCardIds = voteData.map(v => v.fight_card_id)
        const { data: cardsData, error: cardsError } = await supabase
          .from("fight_cards")
          .select(`
            id,
            fighter1:fighters!fight_cards_fighter1_id_fkey ( id, name, gender ),
            fighter2:fighters!fight_cards_fighter2_id_fkey ( id, name, gender ),
            organization:organizations!fight_cards_organization_id_fkey ( id, name, gender ),
            weight_class:weight_classes!fight_cards_weight_class_id_fkey ( id, name, gender ),
            fighter1_votes,
            fighter2_votes,
            popularity_votes
          `)
          .in('id', fightCardIds)
          .order("popularity_votes", { ascending: false })

        if (cardsError) {
          console.error('投票済み対戦カード取得エラー', error)
          return
        }
        
        if (!cardsError && cardsData) {
          const votedCards: FightCardUI[] = cardsData.map((v) => ({
            id: v.id,
            fighter1: Array.isArray(v.fighter1) ? v.fighter1[0] ?? null : (v.fighter1 ?? null),
            fighter2: Array.isArray(v.fighter2) ? v.fighter2[0] ?? null : (v.fighter2 ?? null),
            organization: Array.isArray(v.organization) ? v.organization[0] ?? null : (v.organization ?? null),
            weight_class: Array.isArray(v.weight_class) ? v.weight_class[0] ?? null : (v.weight_class ?? null),
            fighter1_votes: v.fighter1_votes ?? 0,
            fighter2_votes: v.fighter2_votes ?? 0,
            popularity_votes: v.popularity_votes ?? 0,
          }));
          setVotedCards(votedCards)
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message)
      } else {
        setError('不明なエラーが発生しました')
      }
    }
  };

  // For updating profile
  const handleUpdate = async () => {
    try {
      setError('')
      // Check if username is empty
      if (!form.username.trim()) {
        setError('ユーザー名を入力してください')
        return
      }
      // Update profile
      if (profile) {
        await updateProfile(profile.id, { username: form.username, image_url: form.image_url })
        setProfile({ ...profile, username: form.username, image_url: form.image_url})
      }
      setEditing(false)
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message)
      } else {
        setError('不明なエラーが発生しました')
      }
    }
  }

  // For deleting votes
  const handleVoteDelete = async () => {
    try {
      // Delete votes for selected fight cards
      const { error } = await supabase
        .from('votes')
        .delete()
        .match({ user_id: userId, vote_type: 'popularity' })
        .in('fight_card_id', selectedCardIds)

      if (error) {
        console.error('削除エラー', error)
        return
      }

      // Fetch updated voted cards
      await fetchVotedCards()
      // Reset selected card ids
      setSelectedCardIds([])
    } catch (e) {
      console.error('削除失敗', e)
    }
  }

  // For toggling card selection
  const toggleCardSelect = (id: number) => {
    setSelectedCardIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )
  }

  if (loading) return <div className="p-4 text-center">読み込み中...</div>

  return (
      <main className="container px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {!editing && profile && (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
              <div className="text-center mt-8">
                <div className="flex items-center justify-center rounded-full overflow-hidden border-4 border-gray-200 mx-auto relative w-32 h-32 ">
                  {profile.image_url ? (
                    <Image src={profile.image_url} alt="Avatar" fill className="object-cover" />
                  ) : (
                    <MdPerson size={100} color="#ccc" />
                  )}
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 mt-6">{profile.username}</h2>
                <p className="text-gray-500 mt-2">{profile.email}</p>
              </div>
              <div className="flex flex-row gap-x-4 justify-center items-center mt-4">
               <button
                 className="flex items-center justify-center gap-x-2 text-white font-semibold bg-blue-600 hover:bg-blue-700 transition duration-200 rounded-lg py-3 px-8 min-w-[200px] cursor-pointer"
                 onClick={() => setEditing(true)}
               >
                 <MdEdit size={20} />
                 <span>編集</span>
               </button>
               <button
                  onClick={async () => {
                    if (!showVoted) {
                      await fetchVotedCards()
                    }
                    setShowVoted(!showVoted)
                  }}
                 className="flex items-center justify-center gap-x-2 text-white font-semibold bg-green-600 hover:bg-green-700 transition duration-200 rounded-lg py-3 px-8 min-w-[200px] cursor-pointer"
               >
                 <MdViewList size={20} />
                 <span>投票済カード</span>
               </button>
              </div>
            </div>
          )}
          {showVoted && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
              <div className="relative bg-white rounded-xl shadow-xl p-6  w-full max-w-5xl max-h-lg mx-12 max-h-[80vh] overflow-y-auto">
                <h3 className="text-xl font-semibold">あなたの投票カード一覧</h3>
                {votedCards.length === 0 ? (
                    <div className="flex justify-center items-center h-60 mt-2">
                      <p className="text-2xl text-gray-400">投票した対戦カードがありません</p>
                    </div>
                  ) : (
                    <div className="grid justify-center items-center gap-5 md:grid-cols-2 lg:grid-cols-3 mt-8">
                      {votedCards.map((card) => {
                        return (
                          <button
                            key={card.id}
                            onClick={() => toggleCardSelect(card.id)}
                            className={`rounded-lg border shadow border-gray-200 bg-gray-50 px-4 py-2 h-[170px] min-w-[300px] md:min-w-[200px] lg:min-w-[200px] cursor-pointer
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
                                    ${isSmallFont(card.fighter1?.name) ? "text-base" : "text-lg"}`}
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

                <div className="flex justify-center gap-x-3 pt-6">
                  <button
                    onClick={() => {setShowVoted(false)}}
                    className="text-white font-semibold rounded-lg bg-gray-600 hover:bg-gray-400 disabled:bg-gray-400 transition duration-200 py-3 px-8 min-w-[150px] cursor-pointer"
                  >
                    閉じる
                  </button>
                  {selectedCardIds.length > 0 && (
                    <button 
                      onClick={handleVoteDelete} 
                      className="text-white rounded-lg font-semibold bg-red-600 hover:bg-red-400 disabled:bg-red-400 transition duration-200 py-3 px-8 min-w-[150px] cursor-pointer"
                    >
                      投票を取り消す
                    </button>
                  )} 
                </div>
              </div>
            </div>
          )}
          {editing && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"/>
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
                  <label className="flex items-center space-x-2 text-white font-medium rounded-lg bg-gray-600 hover:bg-gray-700 transition duration-200 py-2 px-4 cursor-pointer">
                    <MdUpload size={16} />
                    <span>画像を選択</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
                {error && <p className="text-red-600 rounded bg-red-50 border border-red-300 p-2">{error}</p>}

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
                      setEditing(false)
                      setForm({
                        username: profile?.username ?? '',
                        image_url: profile?.image_url ?? ''
                      })
                      setError('')
                    }}
                    className="flex gap-x-2 text-white font-semibold bg-gray-600 hover:bg-gray-400 disabled:bg-gray-400 transition duration-200 rounded-lg py-3 px-8 min-w-[150px] cursor-pointer"
                  >
                    <MdCancel size={20} />
                    <span>キャンセル</span>
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="text-white font-semibold bg-blue-600 hover:bg-blue-400 disabled:bg-blue-400 rounded-lg transition duration-200 py-3 px-8 min-w-[150px] cursor-pointer"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
  )
};