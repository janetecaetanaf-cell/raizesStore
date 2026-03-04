import { IconType } from 'react-icons';

interface IconProps {
  icon: IconType;
  size?: number;
  className?: string;
}

export const Icon = ({ icon: IconComponent, size, className }: IconProps) => {
  const Component = IconComponent as React.ComponentType<{ size?: number; className?: string }>;
  return <Component size={size} className={className} />;
};
