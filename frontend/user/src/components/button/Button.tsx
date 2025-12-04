import type { ReactNode } from 'react';

interface ButtonProps {
  text: string;
  color?: string;
  rounded?: boolean;
  onClick?: () => void;
  size?: 'base' | 'lg' | string;
  bold?: boolean;
  type?: 'button' | 'submit' | 'reset';
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  text,
  color = '#1F55A2',
  onClick,
  rounded,
  size = 'base',
  bold = true,
  type = 'button',
  rightIcon,
  fullWidth = false,
}: ButtonProps) {

  const sizeClasses = (() => {
    switch (size) {
      case 'base':
        return 'px-4 py-2 text-sm';
      case 'lg':
        return 'px-10 py-3 text-lg';
      default:
        return 'px-4 py-2 text-sm';
    }
  })();

  const weightClass = bold ? 'font-bold' : 'font-normal';
  const widthClass = fullWidth ? 'w-full' : '';
  const layoutClass = rightIcon ? 'flex items-center justify-between' : '';
  const baseClasses = `${sizeClasses} ${weightClass} ${widthClass} ${layoutClass} text-white cursor-pointer`;
  const roundedClasses = rounded
    ? 'rounded-full'
    : (size === 'lg' ? 'rounded-2xl' : 'rounded-xl');
  const className = `${baseClasses} ${roundedClasses}`.trim();

  return (
    <button
      className={className}
      style={{ backgroundColor: color }}
      type={type}
      onClick={onClick}
    >
      <span>{text}</span>
      {rightIcon}
    </button>
  );
}
