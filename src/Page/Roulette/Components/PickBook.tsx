import type { BookmarkItem, PopularBookItem } from "@/@types/global";
import { bookmarkRepo } from "@/api/bookmark.repo.supabase";
import { logicRpcRepo } from "@/api/logicRpc.repo.supabase";
import { useBookDetail } from "@/api/useBookDetail";
import { useToggleBookmark } from "@/api/useBookmark";
import { useGetMissionByISBN } from "@/api/useMissionsFetching";
import { useGetReview } from "@/api/useReviewFetching";
import RatingStars from "@/Components/RatingStar";
import BookmarkButton from "@/Page/BookDetail/components/BookmarkButton";
import LoadingSkeleton from "@/Page/Main/Components/LoadingSkeleton";
import { useAuthStore } from "@/store/useAuthStore";
import { getBookImageURLs } from "@/utils/bookImageUtils";
import tw from "@/utils/tw";
import { cva } from "class-variance-authority";
import { useEffect, useMemo, useState } from "react"
import { NavLink } from "react-router-dom";

interface Props {
  pickBook: PopularBookItem | BookmarkItem | null;
  isOpenPickBook: boolean;
  setIsOpenPickBook: React.Dispatch<React.SetStateAction<boolean>>;
}

// 책 페이지에 따른 스타일, 애니메이션 구분
const openBook = cva(
  'absolute origin-top sm:origin-left transition-transform duration-1000 ease-in-out border border-2 border-gray-500 ',
  {
    variants: {
      intent: {
        cover: 'w-full h-full scale-[1.01] transform-[translateY(-2px)_rotateX(20deg)] sm:transform-[translateZ(2px)_rotateY(-2deg)] bg-pattern',
        pageLeft: 'w-full h-full bg-pattern transform-[translateZ(-3px)_translateY(10px)_rotateX(20deg)] sm:transform-[translateZ(1px)_translateX(2px)_rotateY(0deg)]',
        pageRight: 'w-full h-full bg-pattern translate-y-2 rotate-x-0 sm:translate-y-0 sm:translate-x-2 sm:rotate-y-0',
        coverEnd: 'w-full h-full scale-[1.01] transform-[translateY(8px)_rotateX(0deg)] sm:transform-[translateX(10px)_rotateY(0deg)] bg-pattern'
      },
      isOpen: {
        true: '',
        false: ''
      }
    },
    // 책 열릴때 중앙정렬
    compoundVariants: [
      { intent: 'cover', isOpen: true, class: 'transform-[translateY(0px)_rotateX(180deg)] sm:transform-[translateZ(0px)_rotateY(-180deg)]' },
      { intent: 'pageLeft', isOpen: true, class: 'transform-[translateZ(1px)_translateY(0px)_rotateX(180deg)] sm:transform-[translateZ(1px)_translateX(2px)_rotateY(-180deg)]' },
    ]
  }
)

function PickBook({ pickBook, isOpenPickBook, setIsOpenPickBook }: Props) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isBookmark, setIsBookmark] = useState<boolean>(false);
  const user = useAuthStore((s) => s.user);
  const userId = user?.id

  const isbn13 = pickBook?.isbn13 ?? undefined;
  const open = !!(isbn13 && isOpenPickBook);

  // 1. 책 상세 정보 조회
  const { status: bookStatus, data: bookData } = useBookDetail(isbn13 ?? '');
  // 2. 책 미션 조회
  const { data: missionData } = useGetMissionByISBN(isbn13 ?? '');

  // 2-1. 책 미션 데이터 가공 (완료 여부)
  const missions = missionData ?
    missionData
      .map(({ name, description, completed, reward, }) => ({ name, description, completed, reward }))
      .sort((a, b) => b.reward.amount - a.reward.amount)
      .filter(m => !m.completed) : [];

  // 3. 북마크 여부 조회에 따라 북마크 표시
  useEffect(() => {
    const bookmarkCheck = async () => {
      if (!isbn13) return;
      const bookmarked = await bookmarkRepo.isBookmarked(isbn13);
      setIsBookmark(bookmarked);
    }
    bookmarkCheck();
  }, [isbn13]);

  // 3-1. 북마크 처리중인지 확인
  const { mutate: toggleBookmark, isPending: togglePending } = useToggleBookmark(isbn13, userId)

  // 3-2. 북마크 이벤트 핸들러
  const handleBookMark = () => {
    setIsBookmark(prev => !prev);
    toggleBookmark()
  }

  // 4. 별점 표시용 리뷰 데이터 불러오기
  const { data: reviewData } = useGetReview(isbn13 ?? '')

  // 4-1. 별점 계산
  const ratingAvg = useMemo(() => {
    let summary = 0;
    if (!reviewData) return 0;
    reviewData.map((item) => (summary += item.score));
    return summary === 0
      ? summary
      : Math.ceil((summary / reviewData?.length) * 10) / 10;
  }, [reviewData]);

  // 5. 책 팝업 클릭시에 해당 책의 미션이 유저에게 등록되도록 
  useEffect(() => {
    if (isOpenPickBook) {
      const insertMissionsToUser = () => {
        logicRpcRepo.setBundle(isbn13 ?? '');
      }
      insertMissionsToUser();
    }
  }, [isbn13, isOpenPickBook])


  // 6. 책 닫기
  useEffect(() => {
    setIsOpen(false);
    if (pickBook) console.log(pickBook)
  }, [isbn13])

  // 7. 책 열기
  const handleOpenBook = () => {
    setIsOpen(prev => !prev);
  }

  // 8. 책 닫기 (esc 또는 바깥 영역 클릭으로)
  const handleCloseBook = () => {
    setIsOpen(false);
    setIsOpenPickBook(false);
  }

  // 8-1. esc로 책 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setIsOpenPickBook(false);

      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);


  // 원작: 흔한남매 ;그림: 유난희
  // 에드 콘웨이 지음 ;이종인 옮김
  // 지은이: 히가시노 게이고 ;옮긴이: 양윤옥
  // 김준성,안상준 지음
  // 송민섭 지음
  // 글: 김미영 ;정보글: 최은하
  // 기시미 이치로,전경아 옮김
  // 지은이: 양귀자


  // 9. 장르 데이터 가공 (제일 소분류 장르만 가져오도록. 장르 없는 경우는 null 처리)
  const defineGenre = (): string | null => {
    const copy = bookData?.book.class_nm;
    if (copy?.length === undefined) return null;
    if (!copy.indexOf('>')) return copy.trim();
    const genreArr = copy?.split(' > ').reverse()
    console.log(genreArr)
    return genreArr[0]
  }
  // xl : 1280 lg : 1024 md : 768 sm : 640

  return (
    <>
      <h1 hidden>Pick Book</h1>
      {
        open &&
        (bookStatus === 'pending' || !bookData?.book ? (<LoadingSkeleton />)
          : (
            <div key={isbn13} className="fixed inset-0 z-[1000]">
              {/* 책 팝업 뒷배경 블러처리 */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm w-full h-full flex items-center justify-center" onPointerDown={handleCloseBook}>
                {/* 책 팝업 영역 */}
                <section className="book flex items-center justify-center" onPointerDown={(e) => e.stopPropagation()} role="dialog" aria-modal='true' aria-labelledby="pickbook popup">
                  <div className="container relative z-20 perspective-distant [perspective-origin:center] flex justify-center">
                    <div className={tw("book relative w-[300px] h-[400px] sm:w-[320px] sm:h-[470px] lg:w-[400px] lg:h-[588px] xl:w-[473px] xl:h-[696px] top-0 sm:left-0 transform-3d transition-top sm:transition-left duration-700 ease-in-out",
                      isOpen ? 'top-[200px] sm:top-0 sm:left-[160px] lg:left-[200px] xl:left-[236px]' : '')}>

                      {/* 4. 책 뒷면 */}
                      <div className={tw(openBook({ intent: 'coverEnd', isOpen }), "coverEnd")}>
                        <img
                          className="w-[100%] h-[100%]"
                          src={getBookImageURLs(bookData.book.isbn13)[0]}
                          alt={`${bookData.book.bookname} 뒷면`}
                        />
                      </div>

                      {/* 책 중간 심지 */}
                      <div className="absolute w-full h-3 sm:w-3 sm:h-full 
                      -translate-x-0 translate-y-0 -rotate-z-0 origin-left bg-gray-500 pageGap"></div>

                      {/* 3. 책 오른쪽 영역 (미션 정보) */}
                      <div className={tw(openBook({ intent: 'pageRight', isOpen }), "pt-13 lg:pt-20 pb-9 px-9 flex flex-col", "pageRight")}>
                        {/* 3-1. 북마크 */}
                        <BookmarkButton
                          className={'absolute -top-2 left-8'}
                          onClick={handleBookMark}
                          isBookmarked={isBookmark}
                          disabled={togglePending}
                          size={48}
                        />
                        {/* 3-2. 책 닫기 x 버튼 */}
                        <button type="button" onClick={handleCloseBook} className="absolute sm:top-9 right-9">
                          <img className="w-4 lg:w-6" src="/close.svg" alt="닫기" /></button>

                        {/* 3-3. 미션 렌더링 */}
                        <div className="flex flex-col gap-2 lg:gap-4 xl:gap-6">
                          <p className="font-semibold text-lg lg:text-2xl text-primary-black pl-1">미션</p>
                          <div className="w-full px-2 flex flex-row justify-between gap-1" >
                            <p className="text-xs sm:text-sm lg:text-[16px] xl:text-[18px]">
                              <span className="text-primary text-sm sm:text-[16px] lg:text-[18px] xl:text-[20px]">{bookData.book.bookname}</span>
                              의<br /> 미션이 도착했어요!
                            </p>
                          </div>
                          {
                            missions.map(({ name, description }, index) => (
                              index === 0 ? (
                                // 3-3-1. 점수가 제일 높은 미션 (부스트 스타일)
                                <div key={index} className="w-full border border-gray-300 bg-white px-6 py-3 lg:px-7 lg:py-4 xl:px-8 xl:py-5 rounded-2xl sm:rounded-3xl flex flex-row justify-between gap-1" >
                                  <div>
                                    <p className="text-xs lg:text-sm xl:text-[16px] text-primary">{name}</p>
                                    <p className="text-xs lg:text-sm xl:text-[16px] ">{description}</p>
                                  </div>
                                  <img className="w-5 lg:w-6 xl:w-8" src="/fire_book_yellow.svg" alt="책 미션" />
                                </div>
                              ) : (
                                // 3-3-2. 그 의 미션들
                                <div key={index} className="w-full bg-white px-6 py-3 lg:px-7 lg:py-4 xl:px-8 xl:py-5 rounded-2xl sm:rounded-3xl flex flex-col">
                                  <p className="text-xs lg:text-sm xl:text-[16px]">{name}</p>
                                  <p className="text-xs lg:text-sm xl:text-[16px]">{description}</p>
                                </div>
                              )
                            ))
                          }

                        </div>

                        <div className="absolute hidden text-sm sm:flex bottom-5 right-9">
                          <NavLink to={`/book_detail/?isbn13=${bookData.book.isbn13}`}>
                            <button className="w-fit flex gap-2" title={`${bookData.book.bookname} 상세 페이지로 이동`}>
                              <img className="w-[18px] h-[18px]" src="/magnifier.png" alt="상세 페이지로 이동" />
                              책 보러가기
                            </button>
                          </NavLink>
                        </div>
                      </div>

                      {/* 2. 책 왼쪽 영역 (책 상세 정보 영역) */}
                      <div className={tw(openBook({ intent: 'pageLeft', isOpen }), "pt-15 sm:pt-13 pb-9 px-9", "pageLeft")}>
                        {/* 2-1. 책 표지 여닫는 버튼 */}
                        <div className="absolute bottom-[8px] sm:bottom-[11px] right-[9px] sm:right-[11px] w-10 h-10 sm:w-14 sm:h-14 rotate-135 bg-pattern z-10"></div>
                        <button onClick={handleOpenBook} className="absolute bottom-0 right-0 w-7 h-7 sm:w-10 sm:h-10 bg-gray-700"></button>

                        {/* 2-2. 책 상세 정보 영역 */}
                        <div className="rotate-x-180 sm:-rotate-z-180 flex flex-col gap-2">

                          {/* 2-2-1. 책 이름 */}
                          <p className="font-semibold text-lg md:text-xl lg:text-2xl text-primary-black pr-5 sm:pr-0">{bookData.book.bookname}</p>

                          {/* 2-2-2. 책 평점 */}
                          <RatingStars value={ratingAvg ? ratingAvg : 0} size={28} gap={2} />

                          {/* 2-2-3. 작가, 출판사, 장르, isbn13 */}
                          <div className="flex flex-row flex-wrap gap-2.5 lg:gap-4 xl:gap-6 pb-2">
                            <div className="flex items-center w-fit px-3 py-1.5 lg:px-5 lg:py-2.5 bg-stone-200 rounded-2xl" aria-label="작가">
                              <p className="text-xs lg:text-sm xl:text-[16px] font-semibold text-primary-black ">{bookData.book.authors}</p></div>
                            <div className="font-semibold text-primary-black flex items-center w-fit px-3 py-1.5 lg:px-5 lg:py-2.5 bg-stone-200 rounded-2xl" aria-label="출판사">
                              <p className="text-xs lg:text-sm xl:text-[16px] font-semibold text-primary-black ">{bookData.book.publisher}</p></div>
                            <div className="font-semibold text-primary-black flex items-center w-fit px-3 py-1.5 lg:px-5 lg:py-2.5 bg-stone-200 rounded-2xl" aria-label="장르">
                              <p className="text-xs lg:text-sm xl:text-[16px] font-semibold text-primary-black ">{defineGenre() ?? ''}</p></div>
                            <div className="font-semibold text-primary-black flex items-center w-fit px-3 py-1.5 lg:px-5 lg:py-2.5 bg-stone-200 rounded-2xl" aria-label="isbn13">
                              <p className="text-xs lg:text-sm xl:text-[16px] font-semibold text-primary-black ">{isbn13}</p></div>
                          </div>

                          {/* 2-2-4. 책 설명 */}
                          <div>
                            <p className="text-xs lg:text-sm xl:text-[16px] line-clamp-[7] lg:line-clamp-[12]">
                              {bookData.book.description}
                            </p>
                          </div>
                          <div className="absolute -bottom-10 right-0 text-xs sm:hidden">
                            <NavLink to={`/book_detail/?isbn13=${bookData.book.isbn13}`}>
                              <button className="w-fit flex gap-1" title={`${bookData.book.bookname} 상세 페이지로 이동`}>
                                <img className="w-4 h-4" src="/magnifier.png" alt="상세 페이지로 이동" />
                                책 보러가기
                              </button>
                            </NavLink>
                          </div>
                        </div>
                      </div>

                      {/* 1. 책 표지 */}
                      <div className={tw(openBook({ intent: 'cover', isOpen, }), "cover")}>
                        <button type='button' onClick={handleOpenBook} className="w-full h-full">
                          <img
                            className="w-[100%] h-[100%]"
                            src={getBookImageURLs(bookData.book.isbn13)[0]}
                            alt={`${bookData.book.bookname} 표지`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </section >
              </div>
            </div>
          )
        )
      }
    </>

  )
}
export default PickBook
