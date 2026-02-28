import pool from "../assets/icons/pool-sports-swimmer-svgrepo-com.svg";
import borrow from "../assets/icons/borrow.svg";
import yeild from "../assets/icons/yeild.svg";
import trendDown from "../assets/icons/trendDown.svg";

interface Slide {
  id: number;
  text: string;
  img?: string;
}

const slides: Slide[] = [
  { id: 1, text: "isolated markets", img: pool },
  { id: 2, text: "Low borrow rates", img: trendDown },
  { id: 3, text: "High LTV", img: borrow },
  { id: 4, text: "High yield on deposits", img: yeild },
];

export default function RollingBelt() {
  return (
    <div className="relative w-full overflow-hidde py-6">
      <div className="flex whitespace-nowrap animate-scroll">
        {[...slides, ...slides].map((slide, index) => (
          <div
            key={index}
            className="flex flex-col items-center bg-black px-10 py-6 w-[300px] rounded-[16px] border border-gray-500 gap-6 mx-4 shrink-0"
          >
            <img src={slide.img} alt="" className="w-[56px]" />
            <p className="text-[24px]">{slide.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
