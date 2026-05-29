import { BADGES, type BadgeSlug } from '@/domain/badges';

export function BadgesGrid({ unlocked }: { unlocked: BadgeSlug[] }) {
  const unlockedSet = new Set<BadgeSlug>(unlocked);
  return (
    <div>
      <p className="text-xs opacity-60 mb-2">Conquistas</p>
      <div className="flex gap-3">
        {Object.values(BADGES).map((b) => {
          const isUnlocked = unlockedSet.has(b.slug);
          return (
            <div
              key={b.slug}
              className={`flex flex-col items-center text-center w-24 p-2 rounded-soft ${
                isUnlocked ? 'bg-mata/10 text-carvao' : 'bg-carvao/5 text-carvao/40'
              }`}
              title={isUnlocked ? b.descricao : `Como desbloquear: ${b.criterio}`}
            >
              <span className="text-2xl mb-1" aria-hidden="true">
                {isUnlocked ? '🏵️' : '🔒'}
              </span>
              <p className="text-xs font-medium">{b.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
