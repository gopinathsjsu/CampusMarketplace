import './Button.css';

interface ButtonProps {
  text: string;
  color?: string;
  onClick?: () => void;
  className?: string;
  rounded?: boolean;
}

export default function Button({ text, color = '#1F55A2', onClick, className, rounded }: ButtonProps) {
  const buttonClasses = `btn ${rounded ? 'btn-rounded' : ''} ${className || ''}`.trim();
  
  return (
    <button 
      className={buttonClasses}
      style={{ backgroundColor: color }}
      onClick={onClick}
    >
      {text}
    </button>
  );
}
