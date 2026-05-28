export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-sage-100 border border-sage-200 flex items-center justify-center mb-4">
          <Icon className="text-sage-500" size={26} />
        </div>
      )}
      <h3 className="text-lg font-display text-coal mb-1">{title}</h3>
      {description && <p className="text-sm text-coal-muted max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
