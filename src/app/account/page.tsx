'use client'

import { useEffect, useState } from 'react'
import { isLoggedIn, getCurrentUser, getProfileById, updateProfile } from '@/utils/supabaseFunction'
import Image from 'next/image'
import { supabase } from '@/utils/supabaseBrowserClient'
import { MdPerson } from 'react-icons/md'
import { ProfileUI, FightCardUI} from '@/types/types';

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
    // For getting and display profile info
    (async () => {
      try {
        //Display Loading
        setLoading(true)

        // Confirm login
        const loggedIn = await isLoggedIn()
        if (loggedIn) {
          console.log('ログイン中です')
        } else {
          console.log('ログインしていません')
        }

        // Get user info
        const user = await getCurrentUser();
        if (user) setUserId(user.id);

        //Get user profile info
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

    // Generate a new file path from the image
    const file = e.target.files[0] //Get the file name
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
  
  // For getting a list of matches predicted by logged-in users
  const fetchVotedCards = async () => {
    try {
      // Get current userData
      const user = await getCurrentUser()
      
      if (user) {
        // Get voted fight card ids
        const { data: voteData, error: voteError } = await supabase
          .from('votes')
          .select(`fight_card_id`)
          .eq('user_id', user.id)
          .eq('vote_type', 'popularity')
        
        if (voteError) {
          console.error('投票済み対戦カードID取得エラー', error)
          return
        }

        // Change ids to array
        const fightCardIds = voteData.map(v => v.fight_card_id)

        // 
        const { data: cardsData, error: cardsError } = await supabase
          .from("fight_cards")
          .select(`
            id,
            fighter1:fighters!fight_cards_fighter1_id_fkey ( id, name ),
            fighter2:fighters!fight_cards_fighter2_id_fkey ( id, name ),
            organization:organizations!fight_cards_organization_id_fkey ( id, name ),
            weight_class:weight_classes!fight_cards_weight_class_id_fkey ( id, name ),
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

  const handleUpdate = async () => {
    try {
      setError('')
      if (profile) {
        await updateProfile(profile.id, {
          username: form.username,
          image_url: form.image_url
        })
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
    if (!userId || selectedCardIds.length === 0) return

    try {
      const { error } = await supabase
        .from('votes')
        .delete()
        .match({ user_id: userId, vote_type: 'popularity' })
        .in('fight_card_id', selectedCardIds)

      if (error) {
        console.error('削除エラー', error)
        return
      }

      await fetchVotedCards()
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
    <div className="flex">
      <main className="flex-1 p-6">
        <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-md space-y-4">
          <h2 className="text-xl font-bold border-b pb-2">アカウント情報</h2>
          {!editing && profile && (
            <>
              <div className="flex justify-center">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border bg-gray-100 flex items-center justify-center">
                  {profile.image_url ? (
                    <Image src={profile.image_url} alt="Avatar" fill className="object-cover" />
                  ) : (
                    <MdPerson size={40} color="#ccc" />
                  )}
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">ユーザー名:</span>
                  <span>{profile.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">メールアドレス:</span>
                  <span>{profile.email}</span>
                </div>
              </div>

              <div className="text-right space-x-2">
                <button
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700"
                  onClick={() => setEditing(true)}
                >
                  編集
                </button>
                <button
                  onClick={async () => {
                    if (!showVoted) {
                      await fetchVotedCards()
                    }
                    setShowVoted(!showVoted)
                  }}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded cursor-pointer hover:bg-green-700"
                >
                  投票済みカード
                </button>
              </div>
            </>
          )}
          {showVoted && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
              <div className="relative bg-white p-6 rounded-xl shadow-xl w-full max-w-4xl max-h-lg mx-4 space-y-4">
                <h3 className="text-lg font-semibold mb-2">あなたの投票カード一覧</h3>
                {votedCards.length === 0 ? (
                    <div className="flex justify-center items-center h-60">
                      <p className="text-2xl text-gray-400">投票した対戦カードがありません</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
                      {votedCards.map((card) => {
                        return (
                          <button
                            key={card.id}
                            onClick={() => toggleCardSelect(card.id)}
                            className={`p-4 border rounded-lg shadow border-gray-200 bg-gray-50 transition-colors 
                                        ${selectedCardIds.includes(card.id) ? 'bg-red-100 border-red-300' : ''}`}
                          >
                            <div className="grid grid-cols-1">
                              <div className="flex space-x-4">
                                <div className="text-xl font-semibold">
                                  {card.fighter1?.name}
                                </div>
                                <span className="text-xl font-semibold">vs</span>
                                <div className="text-xl font-semibold">
                                  {card.fighter2?.name}
                                </div>
                              </div>
                              <div className="flex space-x-4">
                                <div className="flex space-x-4 mt-3">
                                  <span className="text-black bg-gray-100 rounded px-1 py-1">
                                    {card.organization?.name}
                                  </span>
                                  <span className="text-black bg-gray-100 rounded px-1 py-1">
                                    {card.weight_class?.name}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )
                }
                <div className="flex space-x-2">
                  <button
                    onClick={() => {setShowVoted(false)}}
                    className="px-4 py-2 bg-gray-200 rounded cursor-pointer hover:bg-gray-300"
                  >
                    閉じる
                  </button>
                  {selectedCardIds.length > 0 && (
                    <button 
                      onClick={handleVoteDelete} 
                      className={`px-4 py-2 bg-red-600 text-white rounded cursor-pointer hover:bg-red-700 
                                  ${selectedCardIds.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
              <div className="relative bg-white p-6 rounded-xl shadow-xl w-full max-w-md mx-4 space-y-4">
                <h3 className="text-lg font-semibold text-center border-b pb-2">
                  プロフィールを編集
                </h3>
                <div className="flex justify-center">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border bg-gray-100 flex items-center justify-center">
                    {form.image_url ? (
                      <Image src={form.image_url} alt="Avatar Preview" fill className="object-cover" />
                    ) : (
                      <MdPerson size={40} color="#ccc" />
                    )}
                  </div>
                </div>
                <label className="block text-sm font-medium">ユーザー名</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full border px-3 py-2 rounded cursor-pointer"
                />
                <label className="block text-sm font-medium">アイコン画像</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full border px-3 py-2 rounded cursor-pointer"
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    onClick={() => {
                      setEditing(false)
                      setForm({
                        username: profile?.username ?? '',
                        image_url: profile?.image_url ?? ''
                      })
                      setError('')
                    }}
                    className="px-4 py-2 bg-gray-200 rounded cursor-pointer hover:bg-gray-300"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="px-4 py-2 bg-green-600 text-white rounded cursor-pointer hover:bg-green-700"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
};