import { useEffect, useMemo, useState } from "react";
import FilterButton from "./Components/FilterButton";
import FilterModal from "./Components/FilterModal";
import Roulette from "./Components/Roulette";
import PickBook from "./Components/PickBook";
import { usePopularBookFetching } from "@/api/usePopularBookFetching";
import { shuffle } from "./utils/shuffle";
import Filter from "@/Components/Filter";
import { KDC_CATEGORY_OPTIONS, type KdcItemType } from "@/constant/kdc";
import type { BookmarkItem, PopularBookItem } from "@/@types/global";
import { useFetchBookmarkList } from "./hooks/useFetchBookmarkList";
import { extendItem } from "./utils/extendItem";
import { useAuthStore } from "@/store/useAuthStore";
import { BsShuffle } from "react-icons/bs";
import RouletteSkeleton from "./Components/RouletteSkeleton";
import { showInfoAlert } from "@/Components/sweetAlert";

export interface SearchParam {
  key: string;
  value: string;
}

function RandomRoulette() {
  // 1. 책을 뽑았는지 상태 확인
  // 1-1. 책이 뽑혔는지 여부 및 뽑힌 책
  const [pickBook, setPickBook] = useState<PopularBookItem | BookmarkItem | null>(null);
  // 1-2. 뽑힌 책을 클릭했는지 여부 -> 여부에 따라 책 팝업 뜰지 말지 결정
  const [isOpenPickBook, setIsOpenPickBook] = useState<boolean>(false);



  // 2. 필터탭 상태
  // 2-1. 현재 선택된 필터탭
  const [filterTap, setFilterTap] = useState<"장르" | "연령" | "추천" | null>(null);
  // 2-2. 책 셔플 버튼용 상태
  const [shuffleBook, setShuffleBook] = useState<boolean>(false);
  // 2-3. 연령탭 선택값 기록
  const [ageKey, setAgeKey] = useState<string | null>('8'); // '8' | '14' | ...
  // 2-4. 추천탭 선택값 기록
  const [genderKey, setGenderKey] = useState<string | "all" | "bookmark" | null>('0');
  // 2-4-1. 추천탭 -> 북마크 필터 선택했는지 여부
  const [isBookmarkSelect, setIsBookmarkSelect] = useState<boolean>(false);
  // 2-4-2. 북마크 필터 조건부 렌더링을 위한 유저 존재 확인
  const user = useAuthStore((s) => s.user);
  // 2-5. 장르탭 선택한 값 들고오기
  const [genre, setGenre] = useState<{ top?: KdcItemType; bottom?: KdcItemType } | null>(null);
  // 2-5-1. 장르탭 선택한 값 가공
  const kdc = genre?.top ? genre.top.code[0] : undefined; // 1자리 (0~9)
  const dtl_kdc = genre?.bottom ? genre.bottom.code.slice(0, 2) : undefined; // 2자리(00~99)



  // 3. 장르탭에 넣어줄 필터 항목 가공
  const topItems = useMemo<KdcItemType[]>(
    () => KDC_CATEGORY_OPTIONS.filter((o) => o.code[1] === "0"),
    []
  );
  const bottomItems = useMemo<KdcItemType[]>(
    () => KDC_CATEGORY_OPTIONS.filter((o) => o.code[1] !== "0"),
    []
  );


  // 4. 필터별 api에 전달할 파라미터 가공
  const params = useMemo(() => {
    const p: Record<string, string> = {};
    switch (filterTap) {
      case "장르": {
        if (kdc !== undefined) p.kdc = kdc;
        if (dtl_kdc !== undefined) p.dtl_kdc = dtl_kdc;
        return p;
      }
      case "연령": {
        if (ageKey) p.age = ageKey;
        return p;
      }
      case "추천": {
        if (genderKey && genderKey !== "all" && genderKey !== "bookmark") p.gender = String(genderKey);
        return p;
      }
      default:
        return p;
    }
  }, [filterTap, kdc, dtl_kdc, ageKey, genderKey]);
  console.log(params);


  // 5. 룰렛에 뿌릴 데이터 가져오기
  // 5-1. 북마크 리스트 가져오기
  const { data: bookmarkList, isSuccess, isFetching } = useFetchBookmarkList(isBookmarkSelect);

  // 5-2. 필터링한 책 가져오기
  const { data: bookList, isLoading: isBookListLoading, error: BookListError, isPending: isBookListPending } = usePopularBookFetching(params ?? {});
  if (BookListError) console.error(BookListError, "장르별 책 불러오기 실패");
  // if (isBookListLoading) console.log("장르별 책 가져오는중");
  // if (isBookListPending) console.log('장르 pending...')

  // 5-3. 필터링한 책 가공
  const filterBooks = useMemo(() => {
    const base = bookList?.books ?? [];

    // 5-3-1. 데이터 가져오기 실패한 경우
    if (!isSuccess) return shuffle(base).slice(0, 17);

    // 5-3-2. 북마크 필터를 선택한 경우
    if (isBookmarkSelect) {
      const len = bookmarkList?.length ?? 0;

      // 북마크가 아무것도 없을때 데이터 예외처리
      if (len === 0) {
        return shuffle(base).slice(0, 17);
      }
      // 북마크 갯수가 충분할때
      if (len >= 17) {
        return shuffle(bookmarkList!).slice(0, 17);
      }
      // 북마크 수가 부족할때 확장시키기
      const extendBookmark = extendItem(bookmarkList!);
      return shuffle(extendBookmark).slice(0, 17);
    }
    // 5-3-3. 북마크 필터가 아닐때. 선택된 장르에 대한 데이터 섞어서 반환
    return shuffle(base).slice(0, 17);
  }, [bookList?.books, isBookmarkSelect, bookmarkList, shuffleBook, isSuccess]);


  // 5-3-4. 북마크가 없을때 ux용 예외처리
  useEffect(() => {
    if (!isBookmarkSelect) return;
    if (isSuccess && !isFetching && (bookmarkList?.length ?? 0) === 0) {
      showInfoAlert('북마크가 존재하지 않습니다', '인기작을 불러옵니다')
    }
  }, [isBookmarkSelect, isSuccess, isFetching, bookmarkList]);

  return (
    <div className="relative w-full max-w-[1200px] h-[calc(100vh-80px)] min-h-[900px] mx-auto justify-items-center pt-17 py-2">

      <h1 hidden>Filter header</h1>
      <section className="absolute left-2 flex flex-row gap-3 sm:gap-6 w-[320px] md:w-[370px]">
        {/* 필터 : 장르탭 */}
        <div className="z-10">
          <FilterButton text={"장르"} setFilterTap={setFilterTap} setIsBookmarkSelect={setIsBookmarkSelect} />
          <Filter
            isOpen={filterTap === "장르"}
            topItems={filterTap === "장르" ? topItems : null}
            bottomItems={filterTap === "장르" ? bottomItems : null}
            filterItem={genre}
            setFilterItem={setGenre}
            setFilterTap={setFilterTap}
            className={"absolute sm:p-8 p-5"}
            styleTopItems={'text-xs sm:text-[16px]'}
            styleBottomTotal={'text-sm sm:text-[16px]'}
            styleBottomItems={'text-xs sm:text-[16px] pt-1 sm:pt-0'}
          />
        </div>

        {/* 필터 : 연령탭 */}
        <div className="z-10">
          <FilterButton text={"연령"} setFilterTap={setFilterTap} />
          <FilterModal
            isOpen={filterTap === "연령"}
            text="age"
            selectedKey={ageKey}
            onSelect={(key) => {
              setAgeKey(key);
              setIsBookmarkSelect(false);
            }}
            setFilterTap={setFilterTap}
            category={{
              8: "초등",
              14: "청소년",
              20: "20대",
              30: "30대",
              40: "40대",
              50: "50대",
              60: "60대 이상",
            }}
          />
        </div>

        {/* 필터 : 추천탭 */}
        <div className="z-10">
          <FilterButton text={"추천"} setFilterTap={setFilterTap} />
          <FilterModal
            isOpen={filterTap === "추천"}
            text="gender"
            selectedKey={genderKey}
            onSelect={(key) => {
              setGenderKey(key);
              setIsBookmarkSelect(key === "bookmark");
            }}
            setFilterTap={setFilterTap}
            category={
              user ?
                {
                  all: "인기작",
                  bookmark: "북마크",
                  0: "남성 추천",
                  1: "여성 추천",
                } : {
                  all: "인기작",
                  0: "남성 추천",
                  1: "여성 추천",
                }}
          />
        </div>

        {/* 필터탭 : 셔플 */}
        <button className="flex flex-row h-12 items-center justify-center "
          type="button"
          onClick={() => setShuffleBook(prev => !prev)}>
          <BsShuffle size={18} title="새로 불러오기" className="transition hover:text-primary" />
        </button>
      </section>

      {/* 뽑힌 책 팝업 */}
      <div className="overflow-y-scroll">
        <PickBook
          pickBook={pickBook}
          isOpenPickBook={isOpenPickBook}
          setIsOpenPickBook={setIsOpenPickBook}
        />
      </div>

      {/* 필터 바꿀때 로딩, 펜딩중인 경우 스켈레톤 */}
      {(isBookListPending || isBookListLoading) ? (
        <RouletteSkeleton />
      ) :
        // 룰렛 
        <Roulette
          books={filterBooks}
          filterTap={filterTap}
          setPickBook={setPickBook}
          setIsOpenPickBook={setIsOpenPickBook}
        />
      }
    </div>
  );
}

export default RandomRoulette;
