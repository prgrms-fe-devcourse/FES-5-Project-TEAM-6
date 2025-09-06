import { useUserMissions } from "@/api/useUserMissions";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useMemo, useState } from "react";
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

export default function Progress({
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
    if (user?.id) fetchUser(user.id);
  }, [user?.id, fetchUser]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setAnimatedPercent(progressPercent);
      setTimeout(() => setShowIcons(true), 1500);
    });
    return () => cancelAnimationFrame(id);
  }, [progressPercent]);

  // 아이콘 수 계산: 보라(25) / 노랑(5) / 빨강(1), 최대 5개 표시
  const { purple, yellow, red } = useMemo(() => {
    const PURPLE = 25, YELLOW = 5, CAP = 5;
    let p = Math.floor(completedCount / PURPLE);
    let y = Math.floor((completedCount % PURPLE) / YELLOW);
    let r = completedCount % YELLOW;
    let overflow = p + y + r - CAP;
    if (overflow > 0) {
      const trim = (n: number) => { const t = Math.min(n, overflow); overflow -= t; return n - t; };
      r = trim(r); y = trim(y); p = trim(p);
    }
    return { purple: p, yellow: y, red: r };
  }, [completedCount]);

  if (isLoading) return <div>로딩중...</div>;
  if (error) return <div>에러가 발생했습니다</div>;
  if (!data) return null;

  const wrapperClass = styleWrraper;

  return (
    <section
      className={tw(
        "w-full rounded-2xl px-4 md:px-6 py-6 shadow-md relative",
        wrapperClass
      )}
    >
      {/* 좌: 인사 + 게이지 / 우: 미션 수 + 아이콘 */}
      <div
        className={tw(
          "grid gap-4 md:gap-6 md:grid-cols-[minmax(0,1fr)_auto] items-start",
          styleTop
        )}
      >
        {/* LEFT */}
        <div>
          <div className={tw("text-[28px] font-bold mb-12", styleNickname)}>
            Hello as {nickname ?? "Any"} !
          </div>

          {/* 게이지 영역(트로피/레벨 오버레이) */}
          <div className={tw("relative max-w-[700px] mt-4 md:mt-3", styleMiddle)}>
            <div
              className={tw("w-full h-5 bg-gray-200 rounded-full overflow-hidden", styleProgress)}
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

            {/* LV: 게이지 '위' 오른쪽(트로피 고려해 살짝 왼쪽) */}
            <span className={tw("absolute -top-5 right-12 text-sm font-semibold", styleLevel)}>
              LV.{level}
            </span>

            {/* 트로피: 게이지 오른쪽 끝 중앙 고정 */}
            <img
              src="/trophy.svg"
              alt="trophy"
              className={tw(
                "absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 md:w-11 md:h-11",
                styleTrophy
              )}
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
          <div className={tw("text-sm text-gray-700", styleMissionCount)}>
            미션 {completedCount}개 클리어
          </div>

          {/* 아이콘 줄 – 높이 고정으로 레이아웃 안정화 */}
          <div
            className={tw(
              "flex items-center gap-1 min-h-[28px] mt-13 transition-opacity duration-700",
              showIcons ? "opacity-100" : "opacity-0",
              stylefire
            )}
            aria-label={`연속 클리어 아이콘: 보라 ${purple}개, 노랑 ${yellow}개, 빨강 ${red}개`}
          >
            {Array.from({ length: purple }).map((_, i) => (
              <img key={`purple-${i}`} src="/fire_book_pup.svg" alt="purple streak (25)" className="w-7 h-7" />
            ))}
            {Array.from({ length: yellow }).map((_, i) => (
              <img key={`yellow-${i}`} src="/fire_book_yellow.svg" alt="yellow streak (5)" className="w-7 h-7" />
            ))}
            {Array.from({ length: red }).map((_, i) => (
              <img key={`red-${i}`} src="/fire_book.svg" alt="red streak (1)" className="w-7 h-7" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
