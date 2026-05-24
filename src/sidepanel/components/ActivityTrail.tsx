import type { ActivityTrailItem } from '../types';

interface ActivityTrailProps {
  items: ActivityTrailItem[];
}

export function ActivityTrail({ items }: ActivityTrailProps) {
  if (items.length === 0) return null;

  const recentItems = items.slice(-8);

  return (
    <section className="activity-trail" aria-label="Agent activity">
      {recentItems.map((item) => (
        <div className={`activity-trail-item activity-${item.status}`} key={item.id}>
          <span className="activity-emoji">{item.emoji ?? ''}</span>
          <span className="activity-label">
            {item.tool}: {item.label}
            {item.count > 1 ? ` (x${item.count})` : ''}
          </span>
        </div>
      ))}
    </section>
  );
}
