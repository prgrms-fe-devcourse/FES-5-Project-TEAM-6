import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
gsap.registerPlugin(useGSAP);

const books = Array(17).fill(0)

function RouletteSkeleton() {

  const pinRef = useRef<HTMLImageElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const bookRefs = useRef<HTMLButtonElement[]>([]);

  useGSAP(() => {
    if (!wheelRef.current) return;

    const radius = wheelRef.current.offsetWidth / 2;
    const centerX = radius;
    const centerY = wheelRef.current.offsetHeight / 2;
    const total = bookRefs.current.length;
    const slice = (2 * Math.PI) / total;

    bookRefs.current.forEach((book, index) => {
      const rad = index * slice;
      const x = radius * Math.sin(rad) + centerX;
      const y = -radius * Math.cos(rad) + centerY;
      gsap.set(book, {
        rotation: `${rad}rad`,
        xPercent: -50,
        yPercent: -50,
        x,
        y,
      });
    });
  }, { scope: wheelRef });

  return (
    <>
      <img ref={pinRef} className="absolute bottom-125 z-[9] drop-shadow-[var(--shadow-pin)]" src="/pin.svg" alt="룰렛 핀" />

      <div className="wrapper absolute bottom-0 w-full h-[550px] overflow-hidden flex flex-row items-center justify-center">
        <div ref={wheelRef} className="wheel absolute top-30 w-[1000px] h-[1000px] origin-[50%_50%]">
          {
            books.map((_book, index) => (
              <button
                inert
                type="button"
                key={index}
                ref={(el) => { if (el) bookRefs.current[index] = el; }}
                data-index={index}
                className="img 
                  absolute top-0 left-0 h-50 w-33 px-4 rounded-2xl shadow-book  
                  bg-[linear-gradient(110deg,#EAEAEA_25%,#f5f5f5_37%,#EAEAEA_63%)]
                  bg-[length:200%_100%] animate-shimmer"
              >
                <img className="w-fit h-fit object-contain" src='/pickitbook_logo.svg' alt='표지' />
              </button>
            ))}
        </div>
      </div>
    </>
  )
}
export default RouletteSkeleton