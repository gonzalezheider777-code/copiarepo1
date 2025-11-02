export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);

  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
}

export function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (color: string) => {
    const rgb = color
      .match(/\d+/g)
      ?.map((val) => {
        const num = parseInt(val) / 255;
        return num <= 0.03928 ? num / 12.92 : Math.pow((num + 0.055) / 1.055, 2.4);
      }) || [0, 0, 0];

    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsWCAGStandard(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);

  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }

  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function prefersDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function addSkipLink() {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = 'Saltar al contenido principal';
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded';

  document.body.insertBefore(skipLink, document.body.firstChild);
}

export function makeKeyboardAccessible(
  element: HTMLElement,
  handler: (event: KeyboardEvent) => void,
  keys: string[] = ['Enter', ' ']
) {
  if (!element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '0');
  }

  if (!element.hasAttribute('role')) {
    element.setAttribute('role', 'button');
  }

  const handleKeyPress = (event: KeyboardEvent) => {
    if (keys.includes(event.key)) {
      event.preventDefault();
      handler(event);
    }
  };

  element.addEventListener('keydown', handleKeyPress);

  return () => {
    element.removeEventListener('keydown', handleKeyPress);
  };
}

export function setPageTitle(title: string) {
  document.title = `${title} | UniConnect`;
  announceToScreenReader(`Página actual: ${title}`);
}

export function addAriaLabel(element: HTMLElement, label: string) {
  element.setAttribute('aria-label', label);
}

export function addAriaDescribedBy(element: HTMLElement, descriptionId: string) {
  element.setAttribute('aria-describedby', descriptionId);
}

export function setAriaExpanded(element: HTMLElement, expanded: boolean) {
  element.setAttribute('aria-expanded', expanded.toString());
}

export function setAriaSelected(element: HTMLElement, selected: boolean) {
  element.setAttribute('aria-selected', selected.toString());
}

export function setAriaChecked(element: HTMLElement, checked: boolean | 'mixed') {
  element.setAttribute('aria-checked', checked.toString());
}

export function focusElement(element: HTMLElement | null, options?: FocusOptions) {
  if (!element) return;

  setTimeout(() => {
    element.focus(options);
  }, 0);
}

export function getAriaLabelForAction(action: string): string {
  const labels: Record<string, string> = {
    like: 'Dar me gusta a esta publicación',
    comment: 'Comentar en esta publicación',
    share: 'Compartir esta publicación',
    save: 'Guardar esta publicación',
    follow: 'Seguir a este usuario',
    unfollow: 'Dejar de seguir a este usuario',
    delete: 'Eliminar',
    edit: 'Editar',
    send: 'Enviar mensaje',
    close: 'Cerrar',
    menu: 'Abrir menú',
  };

  return labels[action] || action;
}
