export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-mint-300/10 border border-mint-300/15 flex items-center justify-center mb-4">
          <Icon className="text-mint-300" size={26} />
        </div>
      )}
      <h3 className="text-lg font-display text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-fg max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
