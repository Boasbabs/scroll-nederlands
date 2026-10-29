import type { CSSProperties } from 'react';
import { Icon, type IconName } from './Icon';

/** What a tile stands for: one colour per kind of activity (theme.css), or `soft` for a Settings row. */
export type TileKind = 'lessons' | 'reviews' | 'practice' | 'words' | 'ear' | 'articles' | 'checkpoint' | 'packs' | 'soft';

/** A rounded square with a glyph, as Finch puts a coloured tile in front of each quest. */
export function IconTile({ icon, kind, size = 40 }: { icon: IconName; kind: TileKind; size?: number }) {
  return (
    <span className={`tn-icon-tile tn-icon-tile--${kind}`} style={{ '--tile-size': `${size}px` } as CSSProperties} aria-hidden="true">
      <Icon name={icon} size={Math.round(size * 0.55)} />
    </span>
  );
}
