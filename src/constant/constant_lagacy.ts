import type { age, gender } from "@/@types/global";

export const sessionStorageKey = "id";

// 프록시/리라이트 공통 prefix (로컬/배포 동일)
const LIB_PROXY_BASE = "/api/data4library";

// 항상 내 도메인 기준 상대경로로 구성
const endpoints = {
  srchBooks: `${LIB_PROXY_BASE}/api/srchBooks`,
  srchDtlList: `${LIB_PROXY_BASE}/api/srchDtlList`,
  recommandList: `${LIB_PROXY_BASE}/api/recommandList`,
  loanItemSrch: `${LIB_PROXY_BASE}/api/loanItemSrch`,
} as const;

const LIBRARY_API_KEY = import.meta.env.VITE_LIBRARY_API_KEY as string;

// 공통 유틸: 쿼리스트링 문자열을 만들어서 fetch에 바로 쓰기 쉽게 반환
function withQuery(base: string, params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

/** =========================
 *  1) 통합 검색
 *  ========================= */
export type SearchFields = Partial<Record<"keyword" | "title" | "author", string>>;

export function makeSearchURL(
  searchParams: SearchFields,
  pageNo: number | string = 1,
  pageSize: number | string = 20
): string {
  const params: Record<string, string> = {
    authKey: LIBRARY_API_KEY,
    pageNo: String(pageNo),
    pageSize: String(pageSize),
    exactMatch: "true",
    format: "json",
  };

  for (const [k, v] of Object.entries(searchParams)) {
    const val = v?.trim();
    if (val) params[k] = val;
  }

  return withQuery(endpoints.srchBooks, params);
}

/** =========================
 *  2) 도서 상세
 *  ========================= */
export function makeBookDetailURL(
  isbn13: string,
  opts?: { loaninfoYN?: "Y" | "N"; displayInfo?: "age" | "sex" | "region" }
): string {
  return withQuery(endpoints.srchDtlList, {
    authKey: LIBRARY_API_KEY,
    isbn13,
    loaninfoYN: opts?.loaninfoYN ?? "Y",
    displayInfo: opts?.displayInfo ?? "age",
    format: "json",
  });
}

/** =========================
 *  3) 추천 도서
 *  ========================= */
export function makeRecommendURL(isbn13: string): string {
  return withQuery(endpoints.recommandList, {
    authKey: LIBRARY_API_KEY,
    isbn13,
    format: "json",
  });
}

/** =========================
 *  4) 대출 인기
 *  ========================= */
export interface PopularBookSearchFields {
  startDt?: string;
  gender?: gender;
  age?: age;
  kdc?: number;
  dtl_kdc?: number;
}

export function makePopularBookSearchUrl(searchParams: PopularBookSearchFields): string {
  const params: Record<string, string> = {
    authKey: LIBRARY_API_KEY,
    format: "json",
    pageNo: "1",
    pageSize: "200",
  };

  for (const [k, v] of Object.entries(searchParams)) {
    if (v == null || v === "") continue;
    params[k] = String(v).trim();
  }

  return withQuery(endpoints.loanItemSrch, params);
}

