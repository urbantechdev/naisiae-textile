import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { appExperience } from '../utils/haptics';

interface FSDocument extends Document {
  webkitFullscreenElement?: Element;
  mozFullScreenElement?: Element;
  msFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
  webkitFullscreenEnabled?: boolean;
  mozFullScreenEnabled?: boolean;
  msFullscreenEnabled?: boolean;
}

interface FSElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

interface FullscreenContextType {
  isFullscreen: boolean;
  isNativeFullscreen: boolean;
  isWindowedKiosk: boolean;
  isAutoFullscreenEnabled: boolean;
  isSupported: boolean;
  enterFullscreen: () => Promise<boolean>;
  exitFullscreen: () => Promise<boolean>;
  toggleFullscreen: () => Promise<boolean>;
  setAutoFullscreenEnabled: (enabled: boolean) => void;
  showKioskPrompt: boolean;
  dismissKioskPrompt: () => void;
}

const FullscreenContext = createContext<FullscreenContextType | null>(null);

const STORAGE_KEY_AUTO_FS = 'pos_auto_fullscreen_enabled_v1';
const STORAGE_KEY_MANUAL_EXIT = 'pos_manual_fullscreen_exit_v1';

export function FullscreenProvider({ children }: { children: React.ReactNode }) {
  const [isNativeFullscreen, setIsNativeFullscreen] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    const doc = document as FSDocument;
    return !!(
      document.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
  });

  const [isWindowedKiosk, setIsWindowedKiosk] = useState<boolean>(false);
  
  // Auto-fullscreen is enabled by default for seamless POS kiosk experience
  const [isAutoFullscreenEnabled, setIsAutoFullscreenEnabledState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTO_FS);
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  const [showKioskPrompt, setShowKioskPrompt] = useState<boolean>(false);
  const userExitedManuallyRef = useRef<boolean>(false);
  const hasTriggeredInitialRef = useRef<boolean>(false);

  // Check if browser Fullscreen API is available
  const isSupported = typeof document !== 'undefined' && !!(
    document.fullscreenEnabled ||
    (document as FSDocument).webkitFullscreenEnabled ||
    (document as FSDocument).mozFullScreenEnabled ||
    (document as FSDocument).msFullscreenEnabled
  );

  const isFullscreen = isNativeFullscreen || isWindowedKiosk;

  // Persist preference
  const setAutoFullscreenEnabled = (enabled: boolean) => {
    setIsAutoFullscreenEnabledState(enabled);
    try {
      localStorage.setItem(STORAGE_KEY_AUTO_FS, String(enabled));
      if (enabled) {
        userExitedManuallyRef.current = false;
        sessionStorage.removeItem(STORAGE_KEY_MANUAL_EXIT);
      }
    } catch (e) {
      console.warn('Storage error:', e);
    }
    appExperience.triggerFeedback('tap');
  };

  const dismissKioskPrompt = () => {
    setShowKioskPrompt(false);
  };

  // Sync native fullscreen state changes
  useEffect(() => {
    const handleFSChange = () => {
      const doc = document as FSDocument;
      const active = !!(
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );

      setIsNativeFullscreen(active);

      if (active) {
        setIsWindowedKiosk(false);
        setShowKioskPrompt(false);
        userExitedManuallyRef.current = false;
        document.body.classList.add('pos-kiosk-active');
      } else {
        document.body.classList.remove('pos-kiosk-active');
        // If it was previously in fullscreen and exited, mark manual exit
        if (!hasTriggeredInitialRef.current) {
          // not initial
        } else {
          userExitedManuallyRef.current = true;
          try {
            sessionStorage.setItem(STORAGE_KEY_MANUAL_EXIT, 'true');
          } catch (e) {}
        }
      }
    };

    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange'
    ];

    events.forEach(evt => document.addEventListener(evt, handleFSChange));
    return () => {
      events.forEach(evt => document.removeEventListener(evt, handleFSChange));
    };
  }, []);

  // Enter Fullscreen implementation
  const enterFullscreen = useCallback(async (): Promise<boolean> => {
    userExitedManuallyRef.current = false;
    try {
      sessionStorage.removeItem(STORAGE_KEY_MANUAL_EXIT);
    } catch (e) {}

    const elem = document.documentElement as FSElement;

    try {
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
        appExperience.triggerFeedback('success');
        return true;
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
        appExperience.triggerFeedback('success');
        return true;
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
        appExperience.triggerFeedback('success');
        return true;
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
        appExperience.triggerFeedback('success');
        return true;
      }
    } catch (err: any) {
      // In iframes or environments where native fullscreen is disallowed by Permissions Policy,
      // gracefully activate CSS Windowed Kiosk Mode to deliver full screen experience
      console.warn('Native Fullscreen denied or restricted, falling back to Windowed Kiosk Mode:', err?.message || err);
    }

    // Fallback: Windowed Kiosk Fullscreen
    setIsWindowedKiosk(true);
    document.body.classList.add('pos-kiosk-active');
    appExperience.triggerFeedback('success');
    return true;
  }, []);

  // Exit Fullscreen implementation
  const exitFullscreen = useCallback(async (): Promise<boolean> => {
    userExitedManuallyRef.current = true;
    try {
      sessionStorage.setItem(STORAGE_KEY_MANUAL_EXIT, 'true');
    } catch (e) {}

    setIsWindowedKiosk(false);
    document.body.classList.remove('pos-kiosk-active');

    const doc = document as FSDocument;
    try {
      if (document.exitFullscreen && document.fullscreenElement) {
        await document.exitFullscreen();
        appExperience.triggerFeedback('tap');
        return true;
      } else if (doc.webkitExitFullscreen && doc.webkitFullscreenElement) {
        await doc.webkitExitFullscreen();
        appExperience.triggerFeedback('tap');
        return true;
      } else if (doc.mozCancelFullScreen && doc.mozFullScreenElement) {
        await doc.mozCancelFullScreen();
        appExperience.triggerFeedback('tap');
        return true;
      } else if (doc.msExitFullscreen && doc.msFullscreenElement) {
        await doc.msExitFullscreen();
        appExperience.triggerFeedback('tap');
        return true;
      }
    } catch (err) {
      console.warn('Exit fullscreen error:', err);
    }

    return true;
  }, []);

  // Toggle Fullscreen
  const toggleFullscreen = useCallback(async (): Promise<boolean> => {
    if (isFullscreen) {
      return await exitFullscreen();
    } else {
      return await enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  // AUTO FULL SCREEN WHEN USING
  // As requested: "auto full screen the platform when using"
  // Browsers enforce that requestFullscreen() must be invoked within a user gesture handler.
  // We attach a capturing user gesture listener (pointerdown, click, touchstart, keydown).
  // On the first interaction when the user starts using the platform, we automatically enter fullscreen!
  useEffect(() => {
    if (!isAutoFullscreenEnabled) return;

    // Check if user already manually exited during this session
    try {
      if (sessionStorage.getItem(STORAGE_KEY_MANUAL_EXIT) === 'true') {
        userExitedManuallyRef.current = true;
      }
    } catch (e) {}

    const handleUserInteraction = (e: Event) => {
      hasTriggeredInitialRef.current = true;

      // Don't auto-enter if user deliberately exited via Esc or exit button,
      // or if already in full screen
      if (isFullscreen || userExitedManuallyRef.current) {
        return;
      }

      // Check if target is inside an element explicitly designated to skip auto-fullscreen
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('[data-skip-auto-fs]')) {
        return;
      }

      // Attempt to enter fullscreen seamlessly on user interaction
      enterFullscreen().catch(() => {
        // Silently handled by fallback
      });
    };

    // Attach to user gesture events
    const interactionEvents = ['pointerdown', 'touchstart', 'keydown'];
    interactionEvents.forEach(evt => {
      window.addEventListener(evt, handleUserInteraction, { capture: true, passive: true });
    });

    return () => {
      interactionEvents.forEach(evt => {
        window.removeEventListener(evt, handleUserInteraction, { capture: true });
      });
    };
  }, [isAutoFullscreenEnabled, isFullscreen, enterFullscreen]);

  // Keyboard shortcut listener (F11 or Alt+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        // Standard browser F11 can be intercepted or enhanced
        e.preventDefault();
        toggleFullscreen();
      } else if (e.altKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen]);

  return (
    <FullscreenContext.Provider
      value={{
        isFullscreen,
        isNativeFullscreen,
        isWindowedKiosk,
        isAutoFullscreenEnabled,
        isSupported,
        enterFullscreen,
        exitFullscreen,
        toggleFullscreen,
        setAutoFullscreenEnabled,
        showKioskPrompt,
        dismissKioskPrompt
      }}
    >
      {children}
    </FullscreenContext.Provider>
  );
}

export function useFullscreen() {
  const context = useContext(FullscreenContext);
  if (!context) {
    throw new Error('useFullscreen must be used within a FullscreenProvider');
  }
  return context;
}
