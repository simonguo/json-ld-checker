import type { ReactNode } from 'react';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  icon?: ReactNode;
}

export default function TabButton({ active, onClick, children, icon }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200
        whitespace-nowrap border-b-2
        ${active 
          ? 'text-primary-600 border-primary-500' 
          : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
        }
      `}
    >
      {icon && <span className={active ? 'text-primary-600' : 'text-gray-400'}>{icon}</span>}
      {children}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-400 to-primary-600 rounded-t-full" />
      )}
    </button>
  );
}
