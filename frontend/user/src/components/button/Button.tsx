interface ButtonProps {
  text: string;
  color?: string;
  rounded?: boolean;
  onClick?: () => void;
}

export default function Button({
    text,
    color = '#1F55A2',
    onClick,
    rounded
}: ButtonProps) {
  const baseClasses = 'm-2 px-4 py-2 text-white';
  const roundedClasses = rounded ? 'rounded-full' : 'rounded-md';
  const className = `${baseClasses} ${roundedClasses}`.trim();

  return (
    <button
      className={className}
      style={{ backgroundColor: color }}
      onClick={onClick}
    >
      {text}
    </button>
  );
}
