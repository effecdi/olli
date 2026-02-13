import { db } from "../server/db";
import { trendingAccounts } from "../shared/models/app";
import { sql } from "drizzle-orm";

const trendingData = [
  // 최신검색 인스타툰계정순 (Latest/Trending Instatoon Accounts)
  { rankType: "latest", rank: 1, handle: "majo.sadie", displayName: "마조앤새디", category: "일상/유머", followers: 1120000, avgViews: 850000, description: "일상 속 공감 에피소드를 귀여운 캐릭터로 풀어내는 인기 인스타툰" },
  { rankType: "latest", rank: 2, handle: "yeonnamdong539", displayName: "연남동539", category: "일상/감성", followers: 980000, avgViews: 720000, description: "연남동 일상을 감성적으로 담아내는 인스타툰 작가" },
  { rankType: "latest", rank: 3, handle: "mung_gae_toon", displayName: "멍개툰", category: "반려동물", followers: 870000, avgViews: 650000, description: "강아지와 함께하는 일상을 그리는 귀여운 반려동물 인스타툰" },
  { rankType: "latest", rank: 4, handle: "soon_bap", displayName: "순밥", category: "일상/공감", followers: 750000, avgViews: 580000, description: "직장인 일상 공감 웹툰으로 많은 사랑을 받는 작가" },
  { rankType: "latest", rank: 5, handle: "mogumogu_toon", displayName: "모구모구", category: "먹방/요리", followers: 680000, avgViews: 520000, description: "맛있는 음식과 요리를 귀여운 캐릭터로 소개하는 푸드 인스타툰" },
  { rankType: "latest", rank: 6, handle: "bbomi_diary", displayName: "뽀미일기", category: "육아/가족", followers: 620000, avgViews: 480000, description: "아이와 함께하는 육아 일상을 따뜻하게 그려내는 인스타툰" },
  { rankType: "latest", rank: 7, handle: "ddalgee_draw", displayName: "딸기드로우", category: "연애/감성", followers: 560000, avgViews: 430000, description: "달콤한 연애 이야기를 감성적인 터치로 풀어내는 인스타툰" },
  { rankType: "latest", rank: 8, handle: "cat_butler_toon", displayName: "집사툰", category: "반려동물", followers: 510000, avgViews: 390000, description: "고양이 집사의 일상을 재미있게 그려내는 인스타툰 작가" },
  { rankType: "latest", rank: 9, handle: "office_saram", displayName: "오피스사람", category: "직장/유머", followers: 470000, avgViews: 360000, description: "직장인이라면 누구나 공감할 사무실 에피소드 인스타툰" },
  { rankType: "latest", rank: 10, handle: "happy_beagle", displayName: "해피비글", category: "일상/힐링", followers: 430000, avgViews: 330000, description: "비글과 함께하는 힐링 일상 인스타툰" },

  // 조회수 많은 인스타툰계정순 (Most Viewed Instatoon Accounts)
  { rankType: "most_viewed", rank: 1, handle: "majo.sadie", displayName: "마조앤새디", category: "일상/유머", followers: 1120000, avgViews: 850000, description: "일상 속 공감 에피소드를 귀여운 캐릭터로 풀어내는 인기 인스타툰" },
  { rankType: "most_viewed", rank: 2, handle: "soon_bap", displayName: "순밥", category: "일상/공감", followers: 750000, avgViews: 780000, description: "직장인 일상 공감 웹툰으로 많은 사랑을 받는 작가" },
  { rankType: "most_viewed", rank: 3, handle: "yeonnamdong539", displayName: "연남동539", category: "일상/감성", followers: 980000, avgViews: 720000, description: "연남동 일상을 감성적으로 담아내는 인스타툰 작가" },
  { rankType: "most_viewed", rank: 4, handle: "mung_gae_toon", displayName: "멍개툰", category: "반려동물", followers: 870000, avgViews: 650000, description: "강아지와 함께하는 일상을 그리는 귀여운 반려동물 인스타툰" },
  { rankType: "most_viewed", rank: 5, handle: "kimchi_family", displayName: "김치패밀리", category: "가족/유머", followers: 540000, avgViews: 620000, description: "대가족의 유쾌한 일상을 그려내는 가족 인스타툰" },
  { rankType: "most_viewed", rank: 6, handle: "mogumogu_toon", displayName: "모구모구", category: "먹방/요리", followers: 680000, avgViews: 520000, description: "맛있는 음식과 요리를 귀여운 캐릭터로 소개하는 푸드 인스타툰" },
  { rankType: "most_viewed", rank: 7, handle: "bbomi_diary", displayName: "뽀미일기", category: "육아/가족", followers: 620000, avgViews: 480000, description: "아이와 함께하는 육아 일상을 따뜻하게 그려내는 인스타툰" },
  { rankType: "most_viewed", rank: 8, handle: "ddalgee_draw", displayName: "딸기드로우", category: "연애/감성", followers: 560000, avgViews: 430000, description: "달콤한 연애 이야기를 감성적인 터치로 풀어내는 인스타툰" },
  { rankType: "most_viewed", rank: 9, handle: "travel_doodle", displayName: "여행낙서", category: "여행/감성", followers: 490000, avgViews: 410000, description: "전국 여행지를 귀여운 일러스트로 기록하는 인스타툰" },
  { rankType: "most_viewed", rank: 10, handle: "cat_butler_toon", displayName: "집사툰", category: "반려동물", followers: 510000, avgViews: 390000, description: "고양이 집사의 일상을 재미있게 그려내는 인스타툰 작가" },

  // 실시간 검색 순위 (Real-time Search Rankings)
  { rankType: "realtime", rank: 1, handle: "majo.sadie", displayName: "마조앤새디", category: "일상/유머", followers: 1120000, avgViews: 850000, description: "일상 속 공감 에피소드를 귀여운 캐릭터로 풀어내는 인기 인스타툰" },
  { rankType: "realtime", rank: 2, handle: "ddalgee_draw", displayName: "딸기드로우", category: "연애/감성", followers: 560000, avgViews: 430000, description: "새 시리즈 연재 시작으로 실검 급상승" },
  { rankType: "realtime", rank: 3, handle: "mung_gae_toon", displayName: "멍개툰", category: "반려동물", followers: 870000, avgViews: 650000, description: "강아지와 함께하는 일상을 그리는 귀여운 반려동물 인스타툰" },
  { rankType: "realtime", rank: 4, handle: "coffee_toon", displayName: "커피툰", category: "카페/일상", followers: 380000, avgViews: 290000, description: "카페 일상과 커피 이야기를 감성적으로 풀어내는 인스타툰" },
  { rankType: "realtime", rank: 5, handle: "yeonnamdong539", displayName: "연남동539", category: "일상/감성", followers: 980000, avgViews: 720000, description: "연남동 일상을 감성적으로 담아내는 인스타툰 작가" },
  { rankType: "realtime", rank: 6, handle: "soon_bap", displayName: "순밥", category: "일상/공감", followers: 750000, avgViews: 580000, description: "직장인 일상 공감 웹툰으로 많은 사랑을 받는 작가" },
  { rankType: "realtime", rank: 7, handle: "gym_toon", displayName: "짐툰", category: "운동/건강", followers: 320000, avgViews: 250000, description: "헬스장 일상을 유머러스하게 그려내는 운동 인스타툰" },
  { rankType: "realtime", rank: 8, handle: "bbomi_diary", displayName: "뽀미일기", category: "육아/가족", followers: 620000, avgViews: 480000, description: "아이와 함께하는 육아 일상을 따뜻하게 그려내는 인스타툰" },
  { rankType: "realtime", rank: 9, handle: "school_daze", displayName: "학교대즈", category: "학원/공감", followers: 410000, avgViews: 310000, description: "학생들의 학교생활 에피소드를 재밌게 그려내는 인스타툰" },
  { rankType: "realtime", rank: 10, handle: "kimchi_family", displayName: "김치패밀리", category: "가족/유머", followers: 540000, avgViews: 620000, description: "대가족의 유쾌한 일상을 그려내는 가족 인스타툰" },
];

async function seed() {
  console.log("Seeding trending accounts...");
  await db.delete(trendingAccounts);
  for (const account of trendingData) {
    await db.insert(trendingAccounts).values(account);
  }
  console.log(`Seeded ${trendingData.length} trending accounts.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
