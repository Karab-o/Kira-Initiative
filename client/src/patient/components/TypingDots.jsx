export default function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-white border border-[#E5DDD7] rounded-2xl rounded-bl-sm w-fit shadow-soft">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-sage-300 animate-pulse"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </div>
  );
}
