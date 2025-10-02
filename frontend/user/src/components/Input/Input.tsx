import React from 'react';
import './Input.css';

interface InputProps {
  type?: 'text' | 'password' | 'email' | 'number' | 'tel';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  id?: string;
  border?: boolean;
  borderColor?: string;
  backgroundColor?: string;
}

export default function Input({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  className, 
  required = false,
  disabled = false,
  name,
  id,
  border = true,
  borderColor = '#e5e7eb',
  backgroundColor = '#FFF'
}: InputProps) {
  const inputClasses = `input ${!border ? 'no-border' : ''} ${className || ''}`.trim();
  
  const inputStyle = {
    borderColor: border ? borderColor : 'transparent',
    backgroundColor: backgroundColor
  };

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={inputClasses}
      style={inputStyle}
      required={required}
      disabled={disabled}
      name={name}
      id={id}
    />
  );
}
