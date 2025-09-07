--------------------------------------------------
-- fight_cards（対戦カードテーブル）
--------------------------------------------------
create table public.fight_cards (
  id serial not null,                             -- 主キー（自動採番）
  fighter1_id integer not null,                   -- 選手1の参照（fighters.id）
  fighter2_id integer not null,                   -- 選手2の参照（fighters.id）
  organization_id integer not null,               -- 団体参照（organizations.id）
  weight_class_id integer not null,               -- 階級参照（weight_classes.id）
  created_by uuid not null,                       -- 作成ユーザー（auth.users.id）
  created_at timestamp with time zone null default now(),  -- 作成日時（デフォルトで現在時刻）
  updated_at timestamp with time zone null default now(),  -- 更新日時（更新トリガー等で更新する想定）
  fighter1_votes integer null default 0,         -- 選手1に対する勝敗予想投票数
  fighter2_votes integer null default 0,         -- 選手2に対する勝敗予想投票数
  popularity_votes integer null default 0,       -- 人気投票数
  constraint fight_cards_pkey primary key (id),  -- 主キー制約
  constraint fight_cards_created_by_fkey foreign KEY (created_by) references auth.users (id), -- created_by → auth.users(id)外部参照制約
  constraint fight_cards_fighter1_id_fkey foreign KEY (fighter1_id) references fighters (id) on delete CASCADE, -- fighter1_id → fighters(id)外部参照制約（選手削除時は同時に削除）
  constraint fight_cards_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE, -- organization_id → organizations(id)外部参照制約（団体削除時は同時に削除）
  constraint fight_cards_fighter2_id_fkey foreign KEY (fighter2_id) references fighters (id) on delete CASCADE, -- fighter2_id → fighters(id)外部参照制約（選手削除時は同時に削除）
  constraint fight_cards_weight_class_id_fkey foreign KEY (weight_class_id) references weight_classes (id) on delete CASCADE, -- weight_class_id → weight_classes(id)外部参照制約（階級削除時は同時に削除）
  constraint fight_cards_check check ((fighter1_id <> fighter2_id)) -- 同一選手同士の作成は禁止する制約
) TABLESPACE pg_default;

-- 重複カードを防ぐ一意インデックス（fighter1/fighter2の順序を正規化して一致判定）
create unique INDEX IF not exists ux_fight_cards_unique_match on public.fight_cards using btree (
  LEAST(fighter1_id, fighter2_id),
  GREATEST(fighter1_id, fighter2_id),
  organization_id,
  weight_class_id
) TABLESPACE pg_default;

-- 1日作成上限チェックを行うトリガー
create trigger trg_check_daily_limit BEFORE INSERT on fight_cards for EACH row
execute FUNCTION check_daily_limit ();

--------------------------------------------------
-- fighter_requests（選手申請テーブル）
--------------------------------------------------
create table public.fighter_requests (
  id bigserial not null,                          -- 主キー（自動採番）
  request_type public.request_type_enum not null,-- リクエスト種別（enum: add/delete）
  player_name text null,                          -- 選手名（addのとき必須）
  target_fighter_id bigint null,                  -- 選手ID（deleteのとき必須）
  delete_reason public.delete_reason_enum null,   -- 削除理由（deleteのとき必須）
  status public.request_status_enum not null default 'pending'::request_status_enum, -- 処理ステータス（pending/approved/rejected）
  created_by uuid null,                           -- 申請者（auth.users.id）
  created_at timestamp with time zone not null default now(), -- 申請日時（デフォルトで現在時刻）
  processed_by uuid null,                         -- 更新担当者（auth.users.id）
  processed_at timestamp with time zone null,     -- 処理日時
  constraint fighter_requests_pkey primary key (id), -- 主キー制約
  constraint fighter_requests_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete CASCADE, -- created_by → auth.users(id)外部参照制約（選手削除時は同時に削除）
  constraint fighter_requests_processed_by_fkey foreign KEY (processed_by) references auth.users (id) on delete set null, -- processed_by → auth.users(id)外部参照制約（選手削除時はnullをセット）
  constraint fighter_requests_target_fighter_id_fkey foreign KEY (target_fighter_id) references fighters (id) on delete set null -- target_fighter_id → fighters(id)外部参照制約（選手削除時はnullをセット）
) TABLESPACE pg_default;

--------------------------------------------------
-- fighter_top4_counts（Top4集計テーブル）
--------------------------------------------------
create table public.fighter_top4_counts (
  weight_class_id integer not null,               -- 階級ID（weight_classes.id）
  fighter_id integer not null,                    -- 選手ID（fighters.id）
  counts bigint not null default 0,               -- カウント（集計値）
  constraint fighter_top4_counts_pkey primary key (weight_class_id, fighter_id), -- 複合主キー制約（階級×選手）
  constraint fk_ft4c_fighter foreign KEY (fighter_id) references fighters (id) on delete CASCADE, -- fighter_id → fighters(id)外部参照制約（選手削除時は同時に削除）
  constraint fk_ft4c_weight_class foreign KEY (weight_class_id) references weight_classes (id) on delete CASCADE -- weight_class_id → weight_classes(id)外部参照制約（階級削除時は同時に削除）
) TABLESPACE pg_default;

--------------------------------------------------
-- fighters（選手テーブル）
--------------------------------------------------
create table public.fighters (
  id serial not null,                              -- 主キー（自動採番）
  name character varying(30) not null,             -- 選手名（最大30文字）
  created_at timestamp with time zone null default now(), -- 作成日時（デフォルトで現在時刻）
  gender text not null default ''::text,           -- 性別（デフォルトで''）
  constraint fighters_pkey primary key (id),       -- 主キー制約
  constraint unique_fighter_name unique (name)     -- 選手名ユニーク制約
) TABLESPACE pg_default;

-- 選手名での検索を早めるインデックス
create index IF not exists idx_fighters_name on public.fighters using btree (name) TABLESPACE pg_default;

--------------------------------------------------
-- organizations（団体テーブル）
--------------------------------------------------
create table public.organizations (
  id serial not null,                              -- 主キー（自動採番）
  name text not null,                              -- 団体名
  created_at timestamp with time zone null default now(), -- 作成日時（デフォルトで現在時刻）
  constraint organizations_pkey primary key (id),  -- 主キー制約
  constraint organizations_name_key unique (name)  -- 団体名ユニーク制約
) TABLESPACE pg_default;

--------------------------------------------------
-- weight_classes（階級テーブル）
--------------------------------------------------
create table public.weight_classes (
  id serial not null,                              -- 主キー（自動採番）
  name text not null,                              -- 階級名
  created_at timestamp with time zone null default now(), -- 作成日時（デフォルトで現在時刻）
  gender text null,                                -- 性別
  constraint weight_classes_pkey primary key (id), -- 主キー制約
  constraint unique_weight_class_name_gender unique (name, gender) -- （name, gender）ユニーク制約
) TABLESPACE pg_default;

--------------------------------------------------
-- profiles（プロフィールテーブル）
--------------------------------------------------
create table public.profiles (
  id uuid not null,                                -- 主キー（auth.users.id）
  username text not null,                          -- 表示名 / ユーザー名
  email text not null,                             -- メールアドレス
  image_url text null,                             -- プロフィール画像
  created_at timestamp with time zone null default now(), -- 作成日時（デフォルトで現在時刻）
  updated_at timestamp with time zone null default now(), -- 更新日時（デフォルトで現在時刻）
  is_admin boolean null default false,             -- 管理者フラグ
  constraint profiles_pkey primary key (id),       -- 主キー制約
  constraint profiles_email_key unique (email),    --　メールユニーク制約
  constraint profiles_username_key unique (username), -- ユーザー名
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE, -- id → auth.users(id)外部参照制約（auth削除時は同時に削除）
  constraint profiles_username_length_check check ((char_length(username) <= 20)) -- ユーザー名を最大20文字にする制約
) TABLESPACE pg_default;

-- 管理者以外の管理者権限（is_admin）の変更を防ぐトリガー
create trigger trg_prevent_is_admin_change BEFORE
update on profiles for EACH row
execute FUNCTION prevent_is_admin_change ();

--------------------------------------------------
-- top4_fighters_per_class（Top4表示ビュー）
-- 各階級・性別ごとの上位4選手を算出して表示するビュー
--------------------------------------------------
create view public.top4_fighters_per_class as
select
  ranked.weight_class_id,  -- 階級ID
  ranked.fighter_id,       -- 選手ID
  ranked.counts,           -- 集計値
  ranked.rank,             -- 順位
  ranked.gender            -- 性別
from
  (
    select
      ft4c.weight_class_id,  -- 階級ID
      ft4c.fighter_id,       -- 選手ID
      ft4c.counts,           -- 集計値
      f.gender,              -- 選手の性別
      row_number() over (    -- 順位付け
        partition by
          ft4c.weight_class_id,  -- 階級ごと
          f.gender               -- 性別ごと
        order by
          ft4c.counts desc       -- 投票数の多い順
      ) as rank
    from
      fighter_top4_counts ft4c
      join fighters f on ft4c.fighter_id = f.id
  ) ranked
where
  ranked.rank <= 4;   -- 上位4位までを表示

--------------------------------------------------
-- user_top4（ユーザーTop4テーブル）
-- 各ユーザーが選択した階級ごとのTop4情報を保持
--------------------------------------------------
create table public.user_top4 (
  id bigserial not null,                           -- 主キー（自動採番）
  user_id uuid not null,                           -- ユーザーID（profiles.id）
  weight_class_id integer not null,                -- 階級ID（weight_classes.id）
  fighter_id integer not null,                     -- 選手ID（fighters.id）
  created_at timestamp with time zone null default now(), -- 作成日時（デフォルトで現在時刻）
  position smallint not null default 1,            -- 順位（1〜4）
  constraint user_top4_pkey primary key (id),      -- 主キー制約
  constraint ux_user_top4_unique unique (user_id, weight_class_id, fighter_id), -- （user_id, weight_class_id, fighter_id）ユニーク制約
  constraint user_top4_fighter_id_fkey foreign KEY (fighter_id) references fighters (id) on delete CASCADE, -- fighter_id → fighters(id)外部参照制約（選手削除時は同時に削除）
  constraint user_top4_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE, -- user_id → profiles(id)外部参照制約（プロフィール削除時は同時に削除）
  constraint user_top4_weight_class_id_fkey foreign KEY (weight_class_id) references weight_classes (id) on delete CASCADE, -- weight_class_id → weight_classes(id)外部参照制約（階級削除時は同時に削除）
  constraint chk_user_top4_position check (
    (
      ("position" >= 1)
      and ("position" <= 4)
    )
  ) -- positionは1〜4に制限する制約
) TABLESPACE pg_default;

-- ユーザーごとの検索を高速化するインデックス
create index IF not exists idx_user_top4_by_user on public.user_top4 using btree (user_id) TABLESPACE pg_default;

-- user_top4の削除時/挿入時にTop4集計をインクリメント/デクリメントするトリガー
create trigger trg_ft4c_dec
after DELETE on user_top4 for EACH row
execute FUNCTION ft4c_dec ();

create trigger trg_ft4c_inc
after INSERT on user_top4 for EACH row
execute FUNCTION ft4c_inc ();

--------------------------------------------------
-- votes（投票テーブル）
-- 対戦カードに対する投票を保持（勝敗予想/人気投票）
--------------------------------------------------
create table public.votes (
  id serial not null,                              -- 主キー（自動採番）
  user_id uuid not null,                           -- 投票ユーザー（auth.users.id）
  fight_card_id integer not null,                  -- 対戦カードID（fight_cards.id）
  vote_type text not null,                         -- 投票種別（'prediction' or 'popularity'）
  vote_for integer null,                           -- 投票先（1 = 選手1, 2 = 選手2）※ popularityではnull
  created_at timestamp with time zone null default now(), -- 投票日時（デフォルトで現在時刻）
  constraint votes_pkey primary key (id),          -- 主キー制約
  constraint votes_user_id_fight_card_id_vote_type_key unique (user_id, fight_card_id, vote_type), -- （user_id, fight_card_id, vote_types）ユニーク制約
  constraint votes_fight_card_id_fkey foreign KEY (fight_card_id) references fight_cards (id) on delete CASCADE, -- カード削除時は投票も削除
  constraint votes_user_id_fkey foreign KEY (user_id) references auth.users (id), -- user_id → auth.users(id)外部参照制約（auth削除時は同時に削除）
  constraint votes_vote_for_check check ((vote_for = any (array[1, 2]))), -- vote_forは1または2のみ許可
  constraint votes_vote_type_check check (
    (
      vote_type = any (array['prediction'::text, 'popularity'::text])
    )
  ) -- vote_typeはpredictionまたはpopularityに限定
) TABLESPACE pg_default;

-- ユーザー×投票種別×カードのクエリを高速化するインデックス
create index IF not exists idx_votes_user_type_card on public.votes using btree (user_id, vote_type, fight_card_id) TABLESPACE pg_default;

-- ユーザー別検索を高速化するインデックス
create index IF not exists idx_votes_by_user on public.votes using btree (user_id) TABLESPACE pg_default;

-- popularity投票の1日上限をチェックするトリガー
create trigger trg_check_user_vote_limit BEFORE INSERT on votes for EACH row
execute FUNCTION check_user_popularity_vote_limit ();

-- 投票削除時にfight_cardsの投票カウンタを更新するトリガー
create trigger trg_vote_delete
after DELETE on votes for EACH row
execute FUNCTION update_vote_counters_on_delete ();

-- 投票挿入時にfight_cardsの投票カウンタを更新するトリガー
create trigger trg_vote_insert
after INSERT on votes for EACH row
execute FUNCTION update_vote_counters_on_insert ();

--------------------------------------------------
-- その他
--------------------------------------------------
-- 連番のリセットコマンド
SELECT pg_get_serial_sequence('public.votes', 'id') AS seq_name;
SELECT setval(
  pg_get_serial_sequence('public.votes', 'id'),
  COALESCE((SELECT MAX(id) FROM public.votes), 0) + 1,
  false
);
SELECT last_value, is_called FROM public.votes_id_seq;