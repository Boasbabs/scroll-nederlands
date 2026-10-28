// An item's picture: the learner's own, else a bundled one. With none, the
// fallback shows instead, so a cue never disappears.
import { useEffect, useState, type ReactNode } from 'react';
import type { Picture } from '../../images/pictures';
import { useEnv } from '../env';

/** undefined while loading, null when the item has no picture. Bump `version` after changing it. */
export function usePicture(itemId: string | undefined, version = 0): Picture | null | undefined {
  const { pictures } = useEnv();
  const [picture, setPicture] = useState<Picture | null | undefined>(pictures && itemId ? undefined : null);
  useEffect(() => {
    if (!pictures || !itemId) {
      setPicture(null);
      return undefined;
    }
    let live = true;
    setPicture(undefined);
    pictures.pictureFor(itemId).then(
      (found) => live && setPicture(found ?? null),
      () => live && setPicture(null),
    );
    return () => {
      live = false;
    };
  }, [pictures, itemId, version]);
  return picture;
}

type PictureFrameProps = {
  itemId: string;
  alt: string;
  /** Shown when there is no picture. */
  fallback?: ReactNode;
  /** Keep the picture's space while it loads (where a picture is expected). */
  placeholder?: boolean;
  version?: number;
};

export function PictureFrame({ itemId, alt, fallback = null, placeholder = false, version }: PictureFrameProps) {
  const picture = usePicture(itemId, version);
  if (picture === undefined) return placeholder ? <span className="tn-picture tn-picture--loading" aria-hidden="true" /> : null;
  if (picture === null) return <>{fallback}</>;
  return <img className="tn-picture" src={picture.src} alt={alt} draggable={false} />;
}
