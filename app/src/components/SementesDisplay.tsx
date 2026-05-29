export function SementesDisplay({ total }: { total: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-3xl" aria-hidden="true">🌱</span>
      <div>
        <p className="font-display text-2xl text-mata leading-none">{total}</p>
        <p className="text-xs opacity-60">Sementes</p>
      </div>
    </div>
  );
}
