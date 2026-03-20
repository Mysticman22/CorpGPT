import { motion } from 'framer-motion';
import { LucideLoader2 } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Modern Button Component with variants, sizes, and animations
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyles = `
    relative inline-flex items-center justify-center
    font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
    disabled:opacity-50 disabled:cursor-not-allowed
    overflow-hidden
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]
      text-white shadow-md hover:shadow-lg hover:shadow-primary/50
      focus:ring-[var(--color-primary)]
      active:scale-95
    `,
    secondary: `
      glass border border-[var(--glass-border)]
      text-[var(--text-primary)] hover:border-[var(--color-primary)]
      focus:ring-[var(--color-primary)]
      active:scale-95
    `,
    ghost: `
      bg-transparent text-[var(--text-primary)]
      hover:bg-[var(--bg-tertiary)]
      focus:ring-[var(--color-primary)]
    `,
    danger: `
      bg-[var(--color-error)] text-white
      shadow-md hover:shadow-lg hover:shadow-red-500/50
      focus:ring-[var(--color-error)]
      active:scale-95
    `,
    success: `
      bg-[var(--color-success)] text-white
      shadow-md hover:shadow-lg hover:shadow-green-500/50
      focus:ring-[var(--color-success)]
      active:scale-95
    `
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2'
  };

  return (
    <motion.button
      type={type}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      {...props}
    >
      {/* Ripple Effect Background */}
      <span className="absolute inset-0 overflow-hidden rounded-lg">
        <span className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
      </span>

      {/* Content */}
      {loading ? (
        <LucideLoader2 className="animate-spin" size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span className="relative">{children}</span>
        </>
      )}
    </motion.button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger', 'success']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  icon: PropTypes.node,
  className: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func
};

export default Button;
