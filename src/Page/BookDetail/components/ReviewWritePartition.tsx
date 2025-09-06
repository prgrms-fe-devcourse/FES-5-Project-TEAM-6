import type { BookDetailData } from "@/api/useBookDetail";
import { useSetReviewWithFiles } from "@/api/useReviewFetching";
import RatingStars from "@/Components/RatingStar";
import { showInfoAlert } from "@/Components/sweetAlert";
import { useProfileStore } from "@/store/useProfileStore";
import { setFilePreview } from "@/utils/setFilePreview";
import React, { useId, useState } from "react";
import { BiImageAdd } from "react-icons/bi";

interface Props {
  data: BookDetailData | undefined;
}

// TODO : 같은 유저 중복 입력 방어
function ReviewWritePartition({ data }: Props) {
  const reviewId = useId();
  const { id } = useProfileStore();
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [image, setImage] = useState<File>();
  const { mutate } = useSetReviewWithFiles();

  const uploadImgId = useId();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!id) {
      showInfoAlert(
        "로그인 필요",
        "리뷰는 로그인 후에 작성하실 수 있습니다"
      )
      return;
    }

    if (rating === 0) {
      showInfoAlert(
        "평점 입력 필요",
        "평점을 입력해주세요"
      )
      return;
    }

    // 아직 데이터가 없으면 리턴
    if (!data) return;

    const { isbn13, bookname: title } = data.book;
    mutate({
      isbn13,
      title,
      content,
      score: rating,
      uid: id,
      image_file: image,
    });

    setImagePreview(null);
    setImage(undefined);
    setRating(0);
    setContent("");
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setImage(file);
      setFilePreview(file, setImagePreview);
    } else {
      showInfoAlert("오류", "유효하지 않은 파일입니다.");
    }
  };

  return (
    <div className="p-4">
      <form
        className="flex flex-col items-end gap-2"
        action=""
        onSubmit={handleSubmit}
      >
        <div className="relative w-full flex border border-gray-300 bg-white rounded-2xl p-6 gap-2">
          {imagePreview && (
            <img
              className="max-w-20 object-cover"
              src={imagePreview}
              alt="업로드한 이미지"
            />
          )}

          <label htmlFor={reviewId} className="a11y">
            리뷰 작성
          </label>
          <textarea
            className="flex-1 border-0  resize-none focus:outline-0"
            rows={4}
            name={reviewId}
            id={reviewId}
            onChange={(e) => setContent(e.target.value)}
            value={content}
            placeholder="리뷰를 작성해주세요"
          ></textarea>

          {/* 이미지 버튼 */}
          <label htmlFor={uploadImgId}>
            <BiImageAdd
              size={32}
              className="absolute right-5 bottom-5 text-gray-400 cursor-pointer hover:text-black transition"
            />
          </label>
          <input
            className="hidden"
            type="file"
            id={uploadImgId}
            onChange={handleUploadImage}
          />
        </div>
        <div className="flex items-center gap-4">
          <RatingStars
            value={rating}
            max={5}
            size={28}
            showValue
            inputMode
            setter={setRating}
          />
          <button
            className="bg-primary-black text-white hover:text-primary-black text-[20px] font-light
            box-border border border-primary-black px-4 py-2 rounded-md hover:bg-inherit transition "
            type="submit"
          >
            리뷰 작성하기
          </button>
        </div>
      </form>
    </div>
  );
}
export default ReviewWritePartition;
