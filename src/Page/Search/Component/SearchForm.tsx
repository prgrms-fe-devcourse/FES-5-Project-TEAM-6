import React, { useId, useRef, useState } from "react";
import { BiSearch } from "react-icons/bi";
import type { SearchKey } from "@/@types/global";
import Filter from "@/Components/Filter";
import type { KdcItemType } from "@/constant/kdc";
import {
  MdOutlineKeyboardArrowDown,
  MdOutlineKeyboardArrowUp,
} from "react-icons/md";
import gsap from "gsap";
import tw from "@/utils/tw";
import { showInfoAlert } from "@/Components/sweetAlert";

interface Props {
  onSearch: ({ key, value }: { key: SearchKey; value: string }) => void;
  initialValue: string;
  disabled?: boolean;
}

const DEFAULT_TOP: KdcItemType = { code: "00", value: "키워드" };

const searchKeyMap: Record<string, SearchKey> = {
  "00": "keyword",
  "10": "title",
  "20": "author",
};

function SearchForm({ onSearch, initialValue, disabled }: Props) {
  const [value, setValue] = useState(initialValue);
  const [searchKey, setSearchKey] = useState<{
    top?: KdcItemType;
    bottom?: KdcItemType;
  } | null>({ top: DEFAULT_TOP });
  const [pannelOpen, setPannelOpen] = useState<boolean>(false);

  const textareaId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // TODO: 애니메이션 커스텀 훅으로 분리 시도
  // 필터 패널 열기
  const openPanel = (instant = false) => {
    const el = panelRef.current;
    if (!el) return;
    if (instant) gsap.set(el, { height: "auto", opacity: 1 });
    else
      gsap.fromTo(
        el,
        { height: 0, opacity: 0 },
        {
          height: "auto",
          opacity: 1,
          duration: 0.22,
          ease: "power2.out",
          clearProps: "height",
        }
      );
    setPannelOpen(true);
  };

  // 필터 패널 닫기
  const closePanel = (instant = false) => {
    const el = panelRef.current;
    if (!el) return;
    if (instant) gsap.set(el, { height: 0, opacity: 0 });
    else
      gsap.to(el, { height: 0, opacity: 0, duration: 0.18, ease: "power2.in" });
    setPannelOpen(false);
  };

  // 엔터 눌렀을 때 검색 동작하도록
  const handleTextKeydown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      // submit 동작을 form에 위임시킴
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  // 입력시 줄바꿈 동작 ( 검색어 추천 또는 추가 처리 )
  function handleInputText() {
    const cur = textareaRef.current;

    if (cur) {
      setValue(cur.value);
      cur.style.height = "auto";
      cur.style.height = `${cur.scrollHeight}px`;
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (disabled) return;
    const v = value.trim();

    if (!v) {
      showInfoAlert('검색어를 입력해주세요')
      return;
    }

    const code = searchKey?.top?.code ?? "00";
    const key = searchKeyMap[code] ?? "keyword";

    if (searchKey?.top?.code) onSearch({ key, value: v });
  }

  return (
    <div className="w-full py-4">
      <form
        onSubmit={handleSubmit}
        className="flex justify-between items-center bg-white h-14 px-4 rounded-2xl gap-4"
      >
        <div className="relative">
          <button
            type="button"
            className={tw(
              "flex items-center w-20 bg-primary p-2 rounded-md text-white font-semibold transition justify-between",
              pannelOpen && "bg-slate-50 text-primary outline outline-primary"
            )}
            onClick={() => (pannelOpen ? closePanel() : openPanel())}
          >
            <span className="text-nowrap">{searchKey?.top?.value}</span>
            {pannelOpen ? (
              <MdOutlineKeyboardArrowUp className="text-primary h-4 w-4 shrink-0" />
            ) : (
              <MdOutlineKeyboardArrowDown className="text-white w-4 h-4 shrink-0" />
            )}
          </button>

          {/* 필터 보여주는 영역 (접혔다가 열림) */}
          <div
            ref={panelRef}
            className="absolute left-0 top-full mt-2 z-50 min-w-[100px] overflow-hidden rounded-xl shadow-lg bg-white/90 backdrop-blur"
            style={{ height: 0, opacity: 0 }}
          >
            <Filter
              isOpen={pannelOpen}
              onClose={() => closePanel()}
              topItems={[
                { code: "00", value: "키워드" },
                { code: "10", value: "도서명" },
                { code: "20", value: "저자" },
              ]}
              filterItem={searchKey}
              className="p-4"
              setFilterItem={(v) => {
                closePanel(false);
                setSearchKey(v);
              }}
            />
          </div>
        </div>

        <label className="a11y" htmlFor={textareaId}>
          검색창
        </label>
        <textarea
          className="resize-none bg-white w-[90%] focus:outline-0"
          rows={1}
          name={textareaId}
          id={textareaId}
          ref={textareaRef}
          onChange={handleInputText}
          onKeyDown={handleTextKeydown}
          placeholder="검색어를 입력하세요"
          disabled={disabled}
          value={value}
        />
        <button type="submit" className="cursor-pointer">
          <BiSearch size={32} className="text-primary" />
        </button>
      </form>
    </div>
  );
}
export default SearchForm;
