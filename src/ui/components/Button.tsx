import type { ComponentPropsWithRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ink' | 'ghost' | 'correct' | 'wrong';

type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  block?: boolean;
};

/** Tactile button: a bottom edge it squashes into on press, springing back on release. */
export function Button({ variant = 'primary', size = 'md', block = false, className, type = 'button', ...rest }: ButtonProps) {
  const classes = ['tn-btn', `tn-btn--${variant}`, size === 'sm' && 'tn-btn--sm', block && 'tn-btn--block', className]
    .filter(Boolean)
    .join(' ');
  return <button type={type} className={classes} {...rest} />;
}
