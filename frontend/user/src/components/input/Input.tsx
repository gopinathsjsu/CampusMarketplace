import React from 'react';

interface InputProps {
  type?: 'text' | 'password' | 'email' | 'number' | 'tel';
  placeholder?: string;
  value?: string;
  border?: boolean;
  rounded?: boolean;
  width?: string;
  size?: 'base' | 'lg' | string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
}

export default function Input({
  type = 'text',
  placeholder,
  value,
  border = true,
  rounded,
  width,
  size = 'base',
  required = false,
  disabled = false,
  onChange,
  onKeyDown,
  className: customClassName,
}: InputProps) {
  const sizeClasses = (() => {
    switch (size) {
      case 'base':
        return 'px-6 py-2 text-base';
      case 'lg':
        return 'px-10 py-2 text-lg';
      default:
        return 'px-3 py-2 text-base';
    }
  })();

  const roundedClasses = rounded
    ? 'rounded-full'
    : (size === 'lg' ? 'rounded-2xl' : 'rounded-xl');

  const baseClasses = `${sizeClasses} ${roundedClasses} text-gray-700 bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200 hover:border-gray-300 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed disabled:border-gray-200 placeholder:text-gray-400`;
  const borderClasses = border ? 'border-2 border-gray-200 focus:border-blue-500' : '';
  const className = `${baseClasses} ${borderClasses} ${customClassName || ''}`.trim();

  const inputStyle = width ? { width } : {};

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      className={className}
      style={inputStyle}
      required={required}
      disabled={disabled}
      onChange={onChange}
      onKeyDown={onKeyDown}
    />
  );
}
