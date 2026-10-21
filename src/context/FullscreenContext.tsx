import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

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
}

const FullscreenContext = createContext<FullscreenContextType | null>(null);

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

  const [isWindowedKiosk, setIsWindowedKiosk] = useState<boolean>(true);

  // Check if browser Fullscreen API is available
  const isSupported = typeof document !== 'undefined' && !!(
    document.fullscreenEnabled ||
    (document as FSDocument).webkitFullscreenEnabled ||
    (document as FSDocument).mozFullScreenEnabled ||
    (document as FSDocument).msFullscreenEnabled
  );

  const isFullscreen = isNativeFullscreen || isWindowedKiosk;

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
        document.body.classList.add('pos-kiosk-active');
        document.documentElement.classList.add('pos-kiosk-active');
      } else {
        // Fallback to windowed kiosk mode so platform remains full screen
        setIsWindowedKiosk(true);
        document.body.classList.add('pos-kiosk-active');
        document.documentElement.classList.add('pos-kiosk-active');
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
    const elem = document.documentElement as FSElement;

    try {
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
        return true;
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
        return true;
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
        return true;
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
        return true;
      }
    } catch {
      // In iframes or environments where native fullscreen is disallowed by Permissions Policy,
      // gracefully activate CSS Windowed Kiosk Mode to deliver full screen experience
    }

    setIsWindowedKiosk(true);
    document.body.classList.add('pos-kiosk-active');
    document.documentElement.classList.add('pos-kiosk-active');
    return true;
  }, []);

  // Exit Fullscreen implementation
  const exitFullscreen = useCallback(async (): Promise<boolean> => {
    const doc = document as FSDocument;
    try {
      if (document.exitFullscreen && document.fullscreenElement) {
        await document.exitFullscreen();
        return true;
      } else if (doc.webkitExitFullscreen && doc.webkitFullscreenElement) {
        await doc.webkitExitFullscreen();
        return true;
      }
    } catch {
      // silently handle
    }

    setIsWindowedKiosk(false);
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

  // AUTOMATIC FULLSCREEN ON OPENING OR USING THE PLATFORM
  useEffect(() => {
    // 1. Immediately apply full screen kiosk styling on open
    document.body.classList.add('pos-kiosk-active');
    document.documentElement.classList.add('pos-kiosk-active');

    // 2. Attempt immediate native fullscreen (works if allowed by environment / standalone)
    const elem = document.documentElement as FSElement;
    if (elem.requestFullscreen && !document.fullscreenElement) {
      elem.requestFullscreen().catch(() => {});
    }

    // 3. Automatically trigger native fullscreen on first gesture/use of the platform
    const handleAutoFullscreenOnUse = () => {
      if (!document.fullscreenElement) {
        enterFullscreen().catch(() => {});
      }
    };

    const interactionEvents = ['pointerdown', 'click', 'touchstart', 'touchend', 'keydown'];
    interactionEvents.forEach(evt => {
      window.addEventListener(evt, handleAutoFullscreenOnUse, { capture: true, passive: true });
    });

    return () => {
      interactionEvents.forEach(evt => {
        window.removeEventListener(evt, handleAutoFullscreenOnUse, { capture: true });
      });
    };
  }, [enterFullscreen]);

  return (
    <FullscreenContext.Provider
      value={{
        isFullscreen,
        isNativeFullscreen,
        isWindowedKiosk,
        isAutoFullscreenEnabled: true,
        isSupported,
        enterFullscreen,
        exitFullscreen,
        toggleFullscreen
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
