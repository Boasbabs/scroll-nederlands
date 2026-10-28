// The het mnemonic (docs/fluent-forever-plan.md, Phase 3): the learner pictures
// every het-word one way ("made of gold"), so the image carries the article.
// De-words, the large majority, get no image.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { articleItemId, articleOf, nounIdOf } from '../../articles/assemble';
import type { CurriculumIndex } from '../../curriculum/assemble';
import { HET_IMAGE_MAX, HET_IMAGES } from '../../storage/store';
import { Button } from '../components/Button';
import { useEnv } from '../env';

/** Whether an item is a singular het-noun, or the de/het item of one. */
export function isHetNoun(course: CurriculumIndex, itemId: string): boolean {
  const noun = course.item(nounIdOf(itemId));
  return Boolean(noun && course.item(articleItemId(noun.id)) && articleOf(noun.dutch) === 'het');
}

export function HetBadge() {
  return (
    <span className="tn-het__badge" lang="nl">
      het
    </span>
  );
}

/** "het · Picture it made of gold." The first ready-made image stands in until the learner picks. */
export function HetLine() {
  const { prefs } = useEnv();
  return (
    <p className="tn-het">
      <HetBadge />
      <span>Picture it {prefs.hetImage ?? HET_IMAGES[0]}.</span>
    </p>
  );
}

/** The ready-made images and the learner's own words, as chips. Picking one saves it. */
export function HetImageChoice({ label = 'Your image for het-words' }: { label?: string }) {
  const { prefs, setPrefs } = useEnv();
  const current = prefs.hetImage;
  const ownWords = current !== undefined && !(HET_IMAGES as ReadonlyArray<string>).includes(current);
  const [writing, setWriting] = useState(ownWords);
  const [own, setOwn] = useState(ownWords ? current : '');
  const field = useRef<HTMLInputElement>(null);
  const opened = useRef(false);
  // Choosing "My own" puts the cursor in the field (not when Settings opens with own words already saved).
  useEffect(() => {
    if (writing && opened.current) field.current?.focus();
  }, [writing]);

  function save(event: FormEvent) {
    event.preventDefault();
    if (own.trim()) void setPrefs({ hetImage: own });
  }

  return (
    <div className="tn-het-choice">
      <div className="tn-chips" role="group" aria-label={label}>
        {HET_IMAGES.map((image) => (
          <button
            key={image}
            type="button"
            className="tn-choice-chip"
            aria-pressed={!writing && current === image}
            onClick={() => {
              setWriting(false);
              void setPrefs({ hetImage: image });
            }}
          >
            {image}
          </button>
        ))}
        <button
          type="button"
          className="tn-choice-chip"
          aria-pressed={writing}
          onClick={() => {
            opened.current = true;
            setWriting(true);
          }}
        >
          My own
        </button>
      </div>
      {writing ? (
        <form className="tn-het-choice__own tn-rise-in" onSubmit={save}>
          <label className="tn-het-choice__label">
            Picture it…
            <input
              ref={field}
              className="tn-input"
              value={own}
              maxLength={HET_IMAGE_MAX}
              placeholder="covered in glitter"
              autoComplete="off"
              onChange={(event) => setOwn(event.target.value)}
            />
          </label>
          <Button size="sm" type="submit" disabled={!own.trim() || own.trim() === current}>
            Save
          </Button>
        </form>
      ) : null}
    </div>
  );
}

/**
 * On a card that introduces nouns: for a het-noun, the badge and the image
 * line; the first time, the choice of image instead.
 */
export function HetIntro({ itemIds }: { itemIds: ReadonlyArray<string> }) {
  const { course, prefs } = useEnv();
  if (!itemIds.some((id) => isHetNoun(course, id))) return null;
  if (prefs.hetImage !== undefined) return <HetLine />;
  return (
    <div className="tn-het-pick" role="group" aria-label="Picture het-words">
      <p className="tn-het">
        <HetBadge />
        <span>A het-word. Picture every het-word the same way, and the picture will tell you “het”. How?</span>
      </p>
      <HetImageChoice />
    </div>
  );
}
