import tw from "@/utils/tw";
import { useEffect, useRef } from "react";

type Category = {
  8?: "초등";
  14?: "청소년";
  20?: "20대";
  30?: "30대";
  40?: "40대";
  50?: "50대";
  60?: "60대 이상";
  all?: "인기작";
  bookmark?: "북마크";
  0?: "남성 추천";
  1?: "여성 추천";
};

interface Props {
  category: Category;
  text: string;
  isOpen: boolean;
  selectedKey?: string | null;
  onSelect?: (key: string) => void;
  setFilterTap: React.Dispatch<React.SetStateAction<"장르" | "연령" | "추천" | null>>
}

function FilterModal({
  isOpen,
  text,
  category,
  selectedKey,
  onSelect,
  setFilterTap,
}: Props) {
  // 필터 선택값 전달
  const handleSelect = (key: string) => {
    onSelect?.(key);
  };

  // 필터 외부 클릭시 자동 닫힘처리용
  // 외부 영역 지정
  const panelRef = useRef<HTMLDivElement>(null);

  // 외부 클릭시 닫힘 처리
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      // 필터 대분류 버튼을 외부로 인식하지 않게 하기 위해 예외처리
      if ((e.target as Element)?.closest('[data-filter-trigger]')) return;
      // 모달 내부를 클릭할때는 외부로 인식하지 않게 예외처리
      if (panelRef.current && panelRef.current.contains(t)) return;
      setFilterTap(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [isOpen]);

  // 필터탭을 눌렀을때만 보임처리
  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      role="listbox"
      aria-label={text}
      className="flex flex-col justify-center items-center shadow-sm py-4 gap-2 rounded-xl bg-pattern"
    >
      {/* 필터 항목 렌더링 */}
      {Object.entries(category).map(([key, value]) => (
        <button
          type="button"
          key={key}
          aria-label={value}
          className={tw(
            "w-fit text-xs sm:text-[16px] sm:w-19 rounded-lg sm:rounded-xl py-1 px-2 transition break-keep",
            selectedKey === key
              ? "bg-primary text-white"
              : "hover:bg-primary/50 hover:text-white focus:bg-primary focus:text-white",
          )}
          onClick={() => handleSelect(key)}
        >
          {value}
        </button>
      ))}
    </div>
  );
}

export default FilterModal;
