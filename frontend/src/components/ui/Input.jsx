import { useState } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Modern Input Component with floating labels and animations
 */
const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  error = '',
  icon = null,
  placeholder = '',
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.length > 0;

  return (
    <div className={`relative ${className}`}>
      {/* Icon */}
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none z-10">
          {icon}
        </div>
      )}

      {/* Input */}
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className={`
          w-full px-4 py-3 ${icon ? 'pl-10' : ''}
          bg-[var(--bg-secondary)] 
          border-2 rounded-lg
          text-[var(--text-primary)]
          placeholder-[var(--text-tertiary)]
          transition-all duration-200
          focus:outline-none
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error 
            ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-2 focus:ring-[var(--color-error)]/20' 
            : 'border-[var(--border-color)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20'
          }
        `}
        {...props}
      />

      {/* Floating Label */}
      {label && (
        <motion.label
          className={`
            absolute left-4 pointer-events-none
            text-[var(--text-tertiary)]
            transition-all duration-200
            ${icon ? 'left-10' : 'left-4'}
            ${isFocused || hasValue
              ? '-top-2.5 text-xs px-1 bg-[var(--bg-primary)]'
              : 'top-1/2 -translate-y-1/2 text-base'
            }
            ${isFocused && !error ? 'text-[var(--color-primary)]' : ''}
            ${error ? 'text-[var(--color-error)]' : ''}
          `}
          animate={{
            fontSize: isFocused || hasValue ? '0.75rem' : '1rem',
            y: isFocused || hasValue ? 0 : '-50%'
          }}
        >
          {label}
          {required && <span className="text-[var(--color-error)] ml-0.5">*</span>}
        </motion.label>
      )}

      {/* Error Message */}
      {error && (
        <motion.p
          className="mt-1 text-xs text-[var(--color-error)]"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  icon: PropTypes.node,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

export default Input;
