import type { ReviewItemType } from "@/@types/global";
import { useToggleLike } from "@/api/useLikeFetching";
import { useGetReplyByParentId } from "@/api/useReviewReplyFetching";
import RatingStars from "@/Components/RatingStar";
import { timeFormatter } from "@/utils/timeFormatter";
import React, { useEffect, useRef, useState } from "react";
import profileDefault from "@/assets/profile_default.png";
import loadingImg from "@/assets/loading.svg";
import { type UseMutateFunction } from "@tanstack/react-query";
import { showInfoAlert, showWarningAlert } from "@/Components/sweetAlert";
import tw from "@/utils/tw";

type ReplyVars = { content: string; parent_id: number };

interface Props {
  item: ReviewItemType;
  isAnonymous?: boolean;
  uid?: string;
  setReplyCallback: (vars: ReplyVars) => void;
  deleteReviewCallback: UseMutateFunction<boolean, Error, number, unknown>;
}

function ReviewItem({
  item,
  isAnonymous,
  uid,
  setReplyCallback,
  deleteReviewCallback,
}: Props) {
  const { mutate, isPending } = useToggleLike(item.id);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [commentCount, setCommentCountCount] = useState<number>(
    item.comment_count
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [reply, setReply] = useState<string>("");

  // 여기서 불러올 수밖에 없군?
  const { data: replyData, isFetching: replyFetching } = useGetReplyByParentId(
    item.id,
    {
      enabled: isOpen,
    }
  );

  // item : reviewList는 갱신되지 않으므로, reply가 갱신되면 그 값으로 갱신
  useEffect(() => {
    if (replyData) setCommentCountCount(replyData?.length);
  }, [replyData]);

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
      setReply(cur.value);
      cur.style.height = "auto";
      cur.style.height = `${cur.scrollHeight}px`;
    }
  }

  const kst = timeFormatter(item.created_at);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setReplyCallback({ parent_id: item.id, content: reply });
    setReply("");
  };

  const handleDelete = () => {
    showWarningAlert(
      "정말 삭제하시겠습니까?",
      "리뷰 기록은 복구되지 않습니다.",
      "네, 삭제합니다",
      "취소",
    ).then((result) => {
      if (result.isConfirmed) {
        deleteReviewCallback(item.id);
      }
    });
  };

  return (
    <li className="flex flex-col p-4 bg-white rounded-md gap-2">
      {/* 헤더 영역 */}
      <header className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <img
            className="h-8 rounded-full"
            src={item.profile_image ?? profileDefault}
            alt="/propile_default.png"
          />
          <span>{item.nickname}</span>
        </div>
        <div className="flex gap-4 text-gray-400">
          <span>{kst!.slice(0, 10) + " " + kst!.slice(11, 16)}</span>
          {item.user_id === uid && (
            <>
              <button
                type="button"
                className="cursor-pointer"
                onClick={handleDelete}
              >
                삭제
              </button>
              {/* <button type="button" className="cursor-pointer">
                편집
              </button> */}
            </>
          )}
        </div>
      </header>

      {/* 컨텐츠 영역 */}
      <section className="flex">
        {item.image_url && (
          <img
            src={item.image_url}
            alt="리뷰 이미지"
            className="max-w-40 object-cover"
          />
        )}
        <div>
          <p className="font-bold">{item.title}</p>
          <p>{item.content}</p>
        </div>
      </section>

      {/* 푸터 영역 */}
      <footer className="flex justify-between items-center">
        <RatingStars value={item.score} showValue />
        <div className="flex gap-4">
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              // 없으면 undefined, 있으면 isAnonymous=false네 ㅋㅋ;
              if (isAnonymous === undefined)
                showInfoAlert(
                  "로그인 필요",
                  "로그인 이후에 이용할 수 있습니다"
                )
              else mutate();
            }}
          >
            <span
              className={tw(
                "transition",
                item.liked_by_me ? "text-amber-400" : "bg-white"
              )}
            >
              유용해요 {item.like_count}
            </span>
          </button>
          <button type="button" onClick={() => setIsOpen((prev) => !prev)}>
            댓글 {commentCount}
          </button>
        </div>
      </footer>

      <div>
        {isOpen && (
          <div className="flex flex-col">
            <form
              action=""
              className="flex w-full gap-2"
              onSubmit={handleSubmit}
            >
              <textarea
                className="resize-none bg-white w-[90%] focus:outline-0 border border-background-gray rounded-md p-2 flex-1"
                rows={1}
                ref={textareaRef}
                onChange={handleInputText}
                onKeyDown={handleTextKeydown}
                placeholder="댓글을 입력하세요"
                value={reply}
              />
              <button
                className="bg-primary-black text-white hover:text-primary-black font-light
            box-border border border-primary-black px-2 py-1 rounded-md hover:bg-inherit transition "
                type="submit"
              >
                댓글 남기기
              </button>
            </form>
            {/* 얘도 분리하면 Depth가 너무 깊을 것 같다. */}
            {replyFetching && (
              <div className="w-full flex items-center justify-center pt-2">
                <img src={loadingImg} alt="로딩중" />
              </div>
            )}
            <ul className="flex flex-col gap-4 mt-4">
              {replyData?.map(
                ({
                  id,
                  content,
                  profile_image,
                  nickname,
                  author_id,
                  created_at,
                }) => (
                  <li key={id} className="flex gap-3 items-start">
                    <img
                      className="h-8 w-8 rounded-full self-start flex-shrink-0 mt-1"
                      src={profile_image ?? profileDefault}
                      alt="프로필 이미지"
                    />

                    {/* 텍스트 영역 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2 text-gray-500">
                        <span className="font-medium text-gray-900">
                          {nickname}
                        </span>
                        <span className="text-sm">
                          {timeFormatter(created_at!).slice(0, 10)}
                        </span>

                        {author_id === uid && (
                          <div className="ml-auto flex gap-3 text-sm">
                            {/* <button type="button" className="cursor-pointer">
                              편집
                            </button> */}
                            {/* <button type="button" className="cursor-pointer">
                              삭제
                            </button> */}
                          </div>
                        )}
                      </div>

                      {/* 본문 */}
                      <p className="mt-1 break-words whitespace-pre-wrap">
                        {content}
                      </p>
                    </div>
                  </li>
                )
              )}
            </ul>
          </div>
        )}
      </div>
    </li>
  );
}
export default ReviewItem;
