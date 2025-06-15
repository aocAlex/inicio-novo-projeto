
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const navigation = [
  { shortcut: '1', href: '/dashboard' },
  { shortcut: '2', href: '/clients' },
  { shortcut: '3', href: '/processes' },
  { shortcut: '4', href: '/templates' },
  { shortcut: '5', href: '/petitions' },
  { shortcut: '6', href: '/deadlines' },
  { shortcut: '7', href: '/settings' },
];

export const useKeyboardShortcuts = (toggleSidebar?: () => void) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + B to toggle sidebar (only if toggle function is provided)
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        if (toggleSidebar) {
          toggleSidebar();
        }
        return;
      }

      // Number keys for navigation (when not in input)
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const shortcut = event.key;
      const navItem = navigation.find(item => item.shortcut === shortcut);
      
      if (navItem) {
        event.preventDefault();
        navigate(navItem.href);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, toggleSidebar]);
};
