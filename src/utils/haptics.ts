/**
 * Native Mobile App Experience Utilities
 * Implements lightweight tactile haptic feedbacks and synthesized acoustic tap signals
 * to make the web app feel like an installable local native application.
 */

class AppExperienceEngine {
  private audioCtx: AudioContext | null = null;

  // Lazily initialize audio context to respect browser user interaction gesture restrictions
  private initAudio() {
    if (!this.audioCtx) {
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioCtxClass();
      } catch (err) {
        console.warn('Web Audio API not supported on this browser:', err);
      }
    }
    // Resume context if suspended (common in iOS browsers)
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Triggers a native-style browser vibration pattern if supported
   */
  public triggerHaptic(style: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') {
    if (typeof window === 'undefined' || !window.navigator || !window.navigator.vibrate) {
      return;
    }

    try {
      switch (style) {
        case 'light':
          window.navigator.vibrate(10);
          break;
        case 'medium':
          window.navigator.vibrate(25);
          break;
        case 'heavy':
          window.navigator.vibrate(60);
          break;
        case 'success':
          window.navigator.vibrate([15, 30, 20]);
          break;
        case 'error':
          window.navigator.vibrate([60, 50, 60]);
          break;
        default:
          window.navigator.vibrate(10);
      }
    } catch (e) {
      // Ignore vibration failures if system is blocked/muted
    }
  }

  /**
   * Synthesizes native-style interactive app sounds on client-taps
   */
  public playSound(mode: 'tap' | 'success' | 'cart_add' | 'pop') {
    if (typeof window === 'undefined') return;
    
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      osc.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;

      if (mode === 'tap') {
        // High, brief organic bubble sound
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (mode === 'success') {
        // Dual ascending soft tones
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(660, now + 0.08);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (mode === 'cart_add') {
        // Double sweet bounce chime
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
        gainNode.gain.setValueAtTime(0.06, now);
        gainNode.gain.setValueAtTime(0.04, now + 0.06);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (mode === 'pop') {
        // Pop sound
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch (e) {
      console.warn('Subtle sound synthesis bypassed:', e);
    }
  }

  /**
   * Combined tap event handler (Trigger Sound + Tactile Feedback)
   */
  public triggerFeedback(type: 'tap' | 'success' | 'cart_add' | 'pop' = 'tap') {
    this.playSound(type);
    
    const hapticStyle = 
      type === 'success' ? 'success' : 
      type === 'cart_add' ? 'medium' : 
      type === 'pop' ? 'medium' : 'light';
      
    this.triggerHaptic(hapticStyle);
  }
}

export const appExperience = new AppExperienceEngine();
