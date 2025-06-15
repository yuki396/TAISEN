--------------------------------------------------
-- fighte_cards
--------------------------------------------------
CREATE TABLE public.fight_cards (
  id serial NOT NULL,
  fighter1_id integer NOT NULL,
  fighter2_id integer NOT NULL,
  organization_id integer,
  weight_class_id integer,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  fighter1_votes integer DEFAULT 0,
  fighter2_votes integer DEFAULT 0,
  popularity_votes integer DEFAULT 0,

  CONSTRAINT fight_cards_pkey PRIMARY KEY (id),
  CONSTRAINT fight_cards_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id),
  CONSTRAINT fight_cards_fighter1_id_fkey FOREIGN KEY (fighter1_id) REFERENCES fighters (id),
  CONSTRAINT fight_cards_fighter2_id_fkey FOREIGN KEY (fighter2_id) REFERENCES fighters (id),
  CONSTRAINT fight_cards_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations (id),
  CONSTRAINT fight_cards_weight_class_id_fkey FOREIGN KEY (weight_class_id) REFERENCES weight_classes (id),

  -- 同じ選手同士の対戦カードを禁止
  CONSTRAINT fight_cards_check CHECK ((fighter1_id <> fighter2_id))
);

-- organization + weight_class の組み合わせ検索を高速化
CREATE INDEX IF NOT EXISTS idx_fight_cards_org_wc 
ON public.fight_cards USING btree (organization_id, weight_class_id);

-- 同じ選手同士の順序違い対戦カードの作成禁止（順序を統一）
CREATE UNIQUE INDEX IF NOT EXISTS ux_fight_cards_pair 
ON public.fight_cards USING btree (
  LEAST(fighter1_id, fighter2_id),
  GREATEST(fighter1_id, fighter2_id)
);

-- fighters.name の検索を高速化（完全一致・前方一致）
CREATE INDEX IF NOT EXISTS idx_fighters_name ON fighters USING btree (name);

--------------------------------------------------
-- fighters
--------------------------------------------------
create table public.fighters (
  id serial not null,
  name text not null,
  created_at timestamp with time zone default now(),
  constraint fighters_pkey primary key (id)
);
insert into public.fighters (name)
values 
    ('武尊')
    ('那須川天心')

--------------------------------------------------
-- organizations
--------------------------------------------------
create table public.organizations (
  id serial not null,
  name text not null,
  created_at timestamp with time zone default now(),
  constraint organizations_pkey primary key (id),
  constraint organizations_name_key unique (name)
);

-- 初期データの挿入
insert into public.organizations (name)
values 
  ('団体なし'),
  ('Rise'),
  ('K-1'),
  ('ONE'),
  ('Glory'),
  ('Knockout'),
  ('ShootBoxing');

--------------------------------------------------
-- weight_classes
--------------------------------------------------
create table public.weight_classes (
  id serial not null,
  name text not null,
  created_at timestamp with time zone default now(),
  constraint weight_classes_pkey primary key (id),
  constraint weight_classes_name_key unique (name)
);

-- 初期データの挿入
insert into public.weight_classes (name)
values 
  ('階級なし'),
  ('77KG'),
  ('71KG'),
  ('67.5KG'),
  ('64KG'),
  ('61KG'),
  ('58KG'),
  ('55KG'),
  ('53KG')

--------------------------------------------------
-- profiles
--------------------------------------------------
create table public.profiles (
  id uuid not null,
  username text not null,
  email text not null,
  image_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_username_key unique (username),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
);

-- profiles.username の検索を高速化（完全一致・前方一致）
create index IF not exists idx_profiles_username on public.profiles using btree (username);

--------------------------------------------------
-- votes
--------------------------------------------------
create table public.votes (
  id serial not null,
  user_id uuid not null,
  fight_card_id integer not null,
  vote_type text not null,
  vote_for integer,
  created_at timestamp with time zone default now(),
  constraint votes_pkey primary key (id),
--　同じユーザーが同じ対戦カードに対して同じ vote_type （"popularity" または "prediction"）で複数回投票できない制約です。
  constraint votes_user_id_fight_card_id_vote_type_key unique (user_id, fight_card_id, vote_type),
  constraint votes_fight_card_id_fkey foreign KEY (fight_card_id) references fight_cards (id),
  constraint votes_user_id_fkey foreign KEY (user_id) references auth.users (id),
  constraint votes_vote_for_check check ((vote_for = any (array[1, 2]))),
  constraint votes_vote_type_check check (
    (
      vote_type = any (array['prediction'::text, 'popularity'::text])
    )
  )
);

create trigger trg_vote_insert
after INSERT on votes for EACH row
execute FUNCTION update_vote_counters_on_insert ();

create trigger trg_vote_delete
after DELETE on votes for EACH row
execute FUNCTION update_vote_counters_on_delete ();

--------------------------------------------------
-- 関数
--------------------------------------------------
--	投票をした同時に、fight_cardsテーブルのvotesを+1する関数
CREATE OR REPLACE FUNCTION update_vote_counters_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.vote_type = 'prediction' THEN
    IF NEW.vote_for = 1 THEN
      UPDATE fight_cards SET fighter1_votes = fighter1_votes + 1 WHERE id = NEW.fight_card_id;
    ELSIF NEW.vote_for = 2 THEN
      UPDATE fight_cards SET fighter2_votes = fighter2_votes + 1 WHERE id = NEW.fight_card_id;
    END IF;

  ELSIF NEW.vote_type = 'popularity' THEN
    UPDATE fight_cards SET popularity_votes = popularity_votes + 1 WHERE id = NEW.fight_card_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--	投票と取り消したと同時に、fight_cardsテーブルのvotesを-1する関数
CREATE OR REPLACE FUNCTION update_vote_counters_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.vote_type = 'prediction' THEN
    IF OLD.vote_for = 1 THEN
      UPDATE fight_cards SET fighter1_votes = fighter1_votes - 1 WHERE id = OLD.fight_card_id;
    ELSIF OLD.vote_for = 2 THEN
      UPDATE fight_cards SET fighter2_votes = fighter2_votes - 1 WHERE id = OLD.fight_card_id;
    END IF;

  ELSIF OLD.vote_type = 'popularity' THEN
    UPDATE fight_cards SET popularity_votes = popularity_votes - 1 WHERE id = OLD.fight_card_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

--　アカウント登録と同時にProfilesテーブルにusername、id、emailをInsertする関数
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, email)
  values (new.id, split_part(new.email, '@', 1), new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();