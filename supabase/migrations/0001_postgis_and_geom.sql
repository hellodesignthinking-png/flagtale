-- KLAI PostGIS 마이그레이션 (빌드 스펙 §3·§5)
-- Prisma 가 만들지 못하는 공간 컬럼/인덱스/함수를 추가한다.
-- 실행: Supabase SQL Editor 또는  psql "$DATABASE_URL" -f supabase/migrations/0001_postgis_and_geom.sql
--       (Prisma 테이블 생성: npx prisma migrate dev  먼저)

-- 1) PostGIS 확장
create extension if not exists postgis;

-- 2) Place 공간 컬럼 (행정동 폴리곤, WGS84)
alter table "Place" add column if not exists geom geometry(MultiPolygon, 4326);
create index if not exists place_geom_gix on "Place" using gist (geom);

-- 3) 결제 크레딧 원자적 증가 (PortOne 웹훅 grantEntitlement 에서 호출)
create or replace function increment_credits(p_user_id text, p_amount int)
returns void language sql as $$
  update "AppUser" set credits = credits + p_amount where id = p_user_id;
$$;

-- 4) bbox 로 행정동 조회 (지도 /api/places 공간 쿼리 예시)
--    select admCd2, name, st_asgeojson(geom) as geometry
--    from "Place"
--    where geom && st_makeenvelope(:minlng,:minlat,:maxlng,:maxlat, 4326);

-- 5) (선택) Row Level Security — 정밀 진단·구매내역 보호 (스펙 §15)
-- alter table "ReportPurchase" enable row level security;
-- create policy "own purchases" on "ReportPurchase" for select using (auth.uid()::text = "userId");
