import { useBookDetail } from "@/api/useBookDetail";
import { useGetMissionDetailByTemplateID } from "@/api/useGetMissionDetailByTemplateID";
import { useUserBadges } from "@/api/useUserBadges";
import ConfettiCongrats from "@/Components/ConfettiCongrats";
import { useAuthStore } from "@/store/useAuthStore";
import tw from "@/utils/tw";
import { useEffect, useMemo } from "react";
import PopupProgress from "./PopupProgress";

interface Props {
  isbn13?: string
  missionCompletePopup: boolean
  missionTemplateID: string
  onClose: () => void;
}

function MissionCompletePopup({ isbn13, missionCompletePopup, missionTemplateID, onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  // 미션 세부 정보 가져오기
  const {
    data: missionDetailData,
    isPending: isMissionDetailDataPending,
    error: missionDetailDataError
  } = useGetMissionDetailByTemplateID(missionTemplateID ?? '');
  console.log(missionDetailData?.[0].reward.code);

  // 미션에 관련된 책 제목 가져오기
  const {
    data: bookName,
    isPending: isBookNamePending,
    error: bookNameError
  } = useBookDetail(isbn13);

  // 뱃지 목록 가져오기
  const {
    data: badges,
    isPending: isBadgesPending,
    error: badgesError
  } = useUserBadges(user?.id ?? '');
  console.log(badges);


  // 미션 종류 분기
  const isOpen = useMemo(() => {
    if (!missionCompletePopup) return false;

    const kind = missionDetailData?.[0].kind;
    if (!kind) return false;
    if (kind === "achievement") return true;

    return !!bookName?.book.bookname;
  }, [missionCompletePopup, missionDetailData, bookName?.book.bookname])





  // 미션 팝업 배경 스크롤 방지 처리
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    }

  }, [isOpen])


  // 디버깅 로그
  if (isMissionDetailDataPending) console.log("미션 상세 정보 가져오는중...");
  if (isBookNamePending) console.log("책 정보 가져오는중...");
  if (isBadgesPending) console.log('뱃지 정보 가져오는중...');

  if (missionDetailDataError) console.error(missionDetailDataError, "미션 상세 정보 불러오기 실패");
  if (bookNameError && missionDetailData?.[0]?.kind !== "achievement") console.log("책 이름 가져오기 실패");
  if (badgesError) console.log('뱃지 정보 불러오기 실패');



  // 닫기 이벤트
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);


  const kind = missionDetailData?.[0].kind

  // 달성한 미션의 뱃지 이미지 가져오기
  const code = missionDetailData?.[0]?.reward?.code
  const badgeImageUrl = useMemo(() => badges?.find(b => b.code === code)?.image ?? null, [badges, code])



  if (!isOpen) return null;


  return (
    missionDetailData &&
    <div className="fixed inset-0 z-[1000]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm w-screen h-screen flex items-center justify-center"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}>
        <ConfettiCongrats onPointerDown={(e) => e.stopPropagation()} message="" />
        <div
          className={tw(kind === 'mission' ? "popup bg-pattern shadow-lg w-2/5 max-w-[500px] md:min-h-[600px] rounded-3xl" :
            "popup bg-pattern shadow-lg w-1/3 max-w-[500px] h-fit rounded-3xl")}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="w-full h-full px-10 py-10 flex flex-col justify-between items-center">
            <PopupProgress
              styleTop='w-full justify-center items-center -mb-0'
              styleWrraper="py-0 shadow-none mx-0 rounded-none px-0"
              styleNickname="hidden"
              styleMissionCount="absolute left-0 mt-8"
              styleMiddle="w-full"
              styleLevel="-top-[30px] right-1 text-[10px]"
              styleProgress="mb-3 md:mb-10"
              styleTrophy="absolute -right-2 w-9 h-9 bottom-2 md:bottom-8 md:w-11 md:h-11 md:ml-2 mb-0"
              stylefire="hidden"
            />
            {
              kind === 'mission' ?
                (<>
                  {/* 폭죽 터지는 애니메이션이면 좋을듯 */}
                  <img className="w-20 md:w-30 h-fit pb-5 pt-8" src="/missionComplete.png" alt="미션 완료 축하" />
                  <h1 className="text-primary-black text-lg sm:text-xl md:text-3xl font-bold pb-4 sm:pb-8">Congratulations!</h1>
                  <div className="font-medium text-sm md:text-xl pb-7 text-center md:pb-12 flex items-center flex-col break-keep">
                    <div>
                      <span>{bookName?.book.bookname}의<br /></span>
                      <span className="text-primary">{missionDetailData[0].name} &nbsp;</span>
                      <span>미션을 완료했습니다</span>
                    </div>
                  </div>
                </>) : (
                  <>
                    {/* 진강님 뱃지 이미지 유틸 사용 */}
                    <img className="w-20 md:w-30 h-fit pb-5 pt-8" src={badgeImageUrl ?? "/missionComplete.png"} alt="미션 완료 축하" />
                    <h1 className="text-primary-black text-[16px] sm:text-xl md:text-3xl font-bold pb-2 sm:pb-5">Congratulations!</h1>
                    <div className="font-medium text-sm md:text-xl pb-7 text-center md:pb-12 flex items-center flex-col break-keep">
                      <div>
                        <span className="text-primary">{missionDetailData[0].name} &nbsp;</span>
                        <span>업적을 달성했습니다</span>
                      </div>
                    </div>
                  </>
                )

            }
            <button type="button" onClick={onClose} className="bg-primary w-full h-[40px] md:h-[60px] rounded-2xl text-white md:text-xl">확인</button>
          </div>
        </div>
        {/* </div> */}
      </div>
    </div>
  )
}
export default MissionCompletePopup