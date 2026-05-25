export default function TypingDots() {
  return (
    <div className="flex items-end gap-3 px-4 py-3 bg-ink-700 border border-mint-300/10 rounded-2xl rounded-bl-sm w-fit">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-mint-300 animate-pulse"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
