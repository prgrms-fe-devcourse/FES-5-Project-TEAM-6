import type { BookDetailData } from "@/api/useBookDetail";
import loaderIcon from "@/assets/loading.svg";
import RatingStars from "@/Components/RatingStar";
import { useToggleBookmark } from "@/api/useBookmark";
import { getBookImageURLs } from "@/utils/bookImageUtils";
import { useEffect, useState } from "react";
import { bookmarkRepo } from "@/api/bookmark.repo.supabase";
import BookmarkButton from "./BookmarkButton";
import { useAssignMissions } from "@/api/useMissionsFetching";
import { useAuthStore } from "@/store/useAuthStore";
import tw from "@/utils/tw";
import { showInfoAlert } from "@/Components/sweetAlert";

interface Props {
  data: BookDetailData | undefined;
  isMissionAssigned: boolean | undefined;
  ratingAvg: number;
  reviewSize?: number;
}

function BookDataPatition({
  data,
  ratingAvg,
  reviewSize,
  isMissionAssigned,
}: Props) {
  const isbn13 = data?.book?.isbn13;
  const [missionAssigned, setMissionAssigned] = useState(isMissionAssigned);

  const { mutate: toggleBookmark, isPending: togglePending } =
    useToggleBookmark(isbn13);
  const { mutate: assignMission } = useAssignMissions(isbn13);

  // 서버단에서 북마크 정보 join해서 주는 게 낫나?
  const [isBookmarked, setIsBookmarked] = useState<boolean>();
  const [isbnOpen, setIsbnOpen] = useState<boolean>(false);
  const isLogIn = useAuthStore((s) => s.user?.id) ? true : false;

  useEffect(() => {
    setMissionAssigned(isMissionAssigned);
  }, [isMissionAssigned]);

  // 북마크 여부 체크
  useEffect(() => {
    async function bookmarkCheck() {
      if (!isbn13) return;
      const bookmarked = await bookmarkRepo.isBookmarked(isbn13);
      setIsBookmarked(bookmarked);
    }
    bookmarkCheck();
  }, [isbn13, isLogIn]);

  const handleToggleBookmark = () => {
    if (!isLogIn) {
      showInfoAlert('로그인 필요', '북마크하기 위해서는 로그인해야 합니다')
      return;
    }
    toggleBookmark();
    setIsBookmarked((prev) => !prev);
  };

  if (!data) {
    return (
      <img
        className="h-25 text-center p-1 inline object-cover"
        src={loaderIcon}
        alt="로딩중"
      />
    );
  }

  const { book } = data;
  if (!book) {
    return <div className="py-8">도서 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <>
      {/* 도서 정보 */}
      <div className="relative flex gap-8 p-5">
        {/* 북마크 버튼 */}
        <BookmarkButton
          onClick={handleToggleBookmark}
          isBookmarked={isBookmarked}
          disabled={togglePending}
        />

        {/* 미션 수령하기 버튼 */}
        <button
          type="button"
          className={tw(
            "px-4 py-2 rounded-md text-xl bg-primary text-background-white absolute right-0 bottom-0",
            missionAssigned && "bg-gray-10 text-primary border border-primary"
          )}
          onClick={() => {
            assignMission();
            setMissionAssigned(true);
          }}
          disabled={missionAssigned}
        >
          {missionAssigned ? "미션 수령 완료" : "미션 수령하기"}
        </button>

        <img
          src={getBookImageURLs(book.isbn13)[0] ?? undefined}
          alt=""
          className="h-70"
        />
        <div className="flex flex-col gap-1">
          <h1 className="text-black">{book.bookname}</h1>
          <div className="flex gap-2 text-[#606060]">
            {book.authors.split(";").map((item) => (
              <span key={item}>{item}</span>
            ))}
            <span>{book.publisher}</span>
            <span>{book.publication_year}</span>
          </div>
          <div className="flex items-center gap-2">
            <RatingStars value={ratingAvg} max={5} size={32} showValue />
            <span className="text-[#606060]">{reviewSize || "0"} 리뷰</span>
          </div>
          <div className="py-3">
            <span className="line-clamp-5 text-black">{book.description}</span>
            <div></div>
          </div>

          <p className="flex gap-2 items-center">
            <span>장르 구분</span>

            {book.class_nm.split(" > ").map((item) => (
              <span>{item}</span>
            ))}
          </p>
          <p>
            <button
              type="button"
              className="flex items-center gap-2"
              onClick={() => setIsbnOpen((prev) => !prev)}
            >
              책 정보
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="9"
                viewBox="0 0 17 9"
                fill="none"
              >
                <path d="M1 1L8.5 8L16 1" stroke="black" strokeOpacity="0.57" />
              </svg>
            </button>
            {isbnOpen && <div>ISBN13 : {isbn13}</div>}
          </p>
        </div>
      </div>
    </>
  );
}
export default BookDataPatition;
