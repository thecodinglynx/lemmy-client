/**
 * KeyboardManager - Global keyboard event handling and shortcut management
 *
 * Features:
 * - Global keyboard event handling with context awareness
 * - Customizable key bindings with conflict resolution
 * - Context-aware shortcuts for different app states
 * - Help system integration with shortcut documentation
 * - Accessibility support with proper focus management
 */

export interface KeyBinding {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  preventDefault?: boolean;
  context?: string | string[];
  description: string;
  action: (event: KeyboardEvent) => void;
}

export interface KeyboardContext {
  name: string;
  priority: number;
  isActive: () => boolean;
}

export class KeyboardManager {
  private bindings = new Map<string, KeyBinding>();
  private contexts = new Map<string, KeyboardContext>();
  private isEnabled = true;
  private helpVisible = false;
  private onHelpToggle?: (visible: boolean) => void;

  constructor() {
    this.setupGlobalListeners();
    this.registerDefaultBindings();
  }

  /**
   * Register a keyboard shortcut
   */
  register(binding: KeyBinding): void {
    const key = this.createKeySignature(binding);

    // Check for conflicts
    if (this.bindings.has(key)) {
      console.warn(`Keyboard shortcut conflict detected for: ${key}`);
    }

    this.bindings.set(key, binding);
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(binding: Partial<KeyBinding>): void {
    const key = this.createKeySignature(binding);
    this.bindings.delete(key);
  }

  /**
   * Register a context for context-aware shortcuts
   */
  registerContext(context: KeyboardContext): void {
    this.contexts.set(context.name, context);
  }

  /**
   * Enable or disable keyboard handling
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Get all registered shortcuts for help display
   */
  getShortcuts(): KeyBinding[] {
    return Array.from(this.bindings.values());
  }

  /**
   * Set help toggle callback
   */
  setHelpToggleCallback(callback: (visible: boolean) => void): void {
    this.onHelpToggle = callback;
  }

  /**
   * Create a unique key signature for a binding
   */
  private createKeySignature(binding: Partial<KeyBinding>): string {
    const modifiers = [];
    if (binding.ctrlKey) modifiers.push('ctrl');
    if (binding.altKey) modifiers.push('alt');
    if (binding.shiftKey) modifiers.push('shift');
    if (binding.metaKey) modifiers.push('meta');

    return `${modifiers.join('+') + (modifiers.length ? '+' : '')}${binding.key?.toLowerCase()}`;
  }

  /**
   * Check if a binding is valid in the current context
   */
  private isBindingValidInContext(binding: KeyBinding): boolean {
    if (!binding.context) return true;

    const contexts = Array.isArray(binding.context)
      ? binding.context
      : [binding.context];

    return contexts.some((contextName) => {
      const context = this.contexts.get(contextName);
      return context ? context.isActive() : true;
    });
  }

  /**
   * Setup global keyboard event listeners
   */
  private setupGlobalListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    // Skip if user is typing in an input field
    if (this.isInputElement(event.target as Element | null)) return;

    const key = this.createKeySignature({
      key: event.key,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey,
    });

    const binding = this.bindings.get(key);

    if (binding && this.isBindingValidInContext(binding)) {
      if (binding.preventDefault !== false) {
        event.preventDefault();
      }

      try {
        binding.action(event);
      } catch (error) {
        console.error('Error executing keyboard shortcut:', error);
      }
    }
  }

  /**
   * Handle keyup events (for special cases)
   */
  private handleKeyUp(_event: KeyboardEvent): void {
    // Handle any keyup-specific logic here
  }

  /**
   * Check if the target element is an input element
   */
  private isInputElement(element: Element | null): boolean {
    if (!element || !element.tagName) return false;

    const tagName = element.tagName.toLowerCase();
    const inputTypes = ['input', 'textarea', 'select'];

    if (inputTypes.includes(tagName)) return true;

    // Check for contenteditable
    if (element.getAttribute('contenteditable') === 'true') return true;

    // Check for role=textbox
    if (element.getAttribute('role') === 'textbox') return true;

    return false;
  }

  /**
   * Register default keyboard shortcuts
   */
  private registerDefaultBindings(): void {
    // Register built-in help shortcut
    this.register({
      key: 'h',
      description: 'Show/hide keyboard shortcuts help',
      action: () => {
        this.helpVisible = !this.helpVisible;
        this.onHelpToggle?.(this.helpVisible);
      },
    });

    // Register escape key for closing overlays
    this.register({
      key: 'Escape',
      description: 'Close overlays and exit fullscreen',
      action: (_event) => {
        // Exit fullscreen if active
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }

        // Close help if visible
        if (this.helpVisible) {
          this.helpVisible = false;
          this.onHelpToggle?.(false);
        }
      },
    });
  }

  /**
   * Cleanup event listeners
   */
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    this.bindings.clear();
    this.contexts.clear();
  }
}

// Global keyboard manager instance
export const keyboardManager = new KeyboardManager();
