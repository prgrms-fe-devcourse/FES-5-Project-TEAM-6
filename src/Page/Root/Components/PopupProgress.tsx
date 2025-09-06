import { useUserMissions } from "@/api/useUserMissions";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from "react";
import { useProfileStore } from "@/store/useProfileStore";
import tw from "@/utils/tw";


interface Props {
  stylefire?: string;
  styleWrraper?: string;
  styleNickname?: string;
  styleMissionCount?: string;
  styleMiddle?: string;
  styleLevel?: string;
  styleProgress?: string;
  styleTrophy?: string;
  styleTop?: string;
}

export default function PopupProgress({
  stylefire,
  styleWrraper,
  styleNickname,
  styleMissionCount,
  styleMiddle,
  styleLevel,
  styleProgress,
  styleTrophy,
  styleTop,
}: Props) {
  const { user } = useAuthStore();
  const { nickname, fetchUser } = useProfileStore();
  const { data, isLoading, error } = useUserMissions(user?.id ?? "");
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const [showIcons, setShowIcons] = useState(false);
  const progressPercent = data?.progressPercent ?? 0;
  const level = data?.level ?? 0;
  const missions = data?.missions ?? [];
  const completedCount = missions.filter((m) => m.completed).length;

  useEffect(() => {
    if (user?.id) {
      fetchUser(user.id);
    }
  }, [user?.id, fetchUser]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setAnimatedPercent(progressPercent);
      setTimeout(() => setShowIcons(true), 1500);
    });
    return () => cancelAnimationFrame(id);
  }, [progressPercent]);

  if (isLoading) return <div>로딩중...</div>;
  if (error) return <div>에러가 발생했습니다</div>;
  if (!data) return null;

  return (
    <div className={tw("w-full max-w-[900px] mx-auto rounded-xl px-8 py-6 shadow-md relative", styleWrraper)}>
      {/* 상단 */}
      <div className={tw("flex justify-between items-start -mb-4", styleTop)}>
        <div className={tw("text-[28px] font-bold", styleNickname)}>
          Hello as {nickname ?? "Any"} !
        </div>
        <div className={tw("text-sm font-medium mt-3", styleMissionCount)}>미션 {completedCount}개 클리어</div>
      </div>

      {/* 레벨 + 게이지 + 트로피 */}
      <div className="flex items-center gap-2 mt-8">
        <div className={tw("relative flex-1 max-w-[600px]", styleMiddle)}>
          <div className={tw("absolute -top-5 right-0 text-sm font-semibold", styleLevel)}>
            LV.{level}
          </div>
          <div
            className={tw("h-5 bg-gray-200 rounded-full overflow-hidden mb-10", styleProgress)}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Number(animatedPercent) || 0}
          >
            <div
              className="h-full bg-yellow-500 transition-all duration-1000 ease-out"
              style={{ width: `${animatedPercent}%` }}
            />
          </div>
        </div>
        <img src="/trophy.svg" alt="trophy" className={tw("w-11 h-11 ml-2 mb-13", styleTrophy)} />
      </div>

      {/* 불 아이콘 */}
      <div className={tw('flex justify-end gap-0.5 -mt-23 transition-opacity duration-700', showIcons ? "opacity-100" : "opacity-0", stylefire)}>
        {Array.from({ length: Math.floor(completedCount / 5) }).map((_, i) => (
          <img key={`yellow-${i}`} src="/fire_book_yellow.svg" alt="yellow streak" className="w-7 h-7" />
        ))}
        {Array.from({ length: completedCount % 5 }).map((_, i) => (
          <img key={`red-${i}`} src="/fire_book.svg" alt="red streak" className="w-7 h-7" />
        ))}
      </div>
    </div>
  );
}