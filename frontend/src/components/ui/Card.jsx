import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Glassmorphic Card Component with hover effects
 */
const Card = ({
  children,
  className = '',
  hover = true,
  gradient = false,
  padding = 'md',
  ...props
}) => {
  const baseStyles = `
    glass rounded-xl
    transition-all duration-200
  `;

  const hoverStyles = hover ? 'card-hover' : '';
  const gradientStyles = gradient ? 'gradient-border' : '';

  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const cardContent = (
    <div className={`${baseStyles} ${hoverStyles} ${paddingStyles[padding]} ${className}`} {...props}>
      {children}
    </div>
  );

  if (gradient) {
    return (
      <motion.div
        className={gradientStyles}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {cardContent}
    </motion.div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  hover: PropTypes.bool,
  gradient: PropTypes.bool,
  padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg'])
};

export default Card;
