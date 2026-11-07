import { Icon as Iconify } from '@iconify/react';

interface IconProps {
  icon?: string;
  size?: number | string;
  className?: string;
  color?: string;
  inline?: boolean;
}

const Icon = ({ icon, size = 18, className, color, inline = true }: IconProps) => {
  if (!icon) return null;

  return (
    <Iconify
      icon={icon}
      width={size}
      height={size}
      className={className}
      color={color}
      inline={inline}
    />
  );
};

export default Icon;
