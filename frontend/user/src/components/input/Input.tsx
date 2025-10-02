import React from 'react';

interface InputProps {
  type?: 'text' | 'password' | 'email' | 'number' | 'tel';
  placeholder?: string;
  value?: string;
  border?: boolean;
  width?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Input({
  type = 'text',
  placeholder,
  value,
  border = true,
  width,
  required = false,
  disabled = false,
  onChange
}: InputProps) {
  const baseClasses = 'm-2 px-4 py-3 rounded-lg text-base text-gray-700 bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200 hover:border-gray-300 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed disabled:border-gray-200 placeholder:text-gray-400';
  const borderClasses = border ? 'border-2 border-gray-200 focus:border-blue-500' : '';
  const className = `${baseClasses} ${borderClasses}`.trim();

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
    />
  );
}
