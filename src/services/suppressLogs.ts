// Suppress benign internal Firestore stream errors early during load phase

const originalError = console.error;
const originalWarn = console.warn;

export const isBenignMessage = (...args: any[]): boolean => {
  try {
    const combinedText = args.map(arg => {
      if (arg === null || arg === undefined) return '';
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return `${arg.name || ''} ${arg.message || ''} ${arg.stack || ''}`;
      try {
        return JSON.stringify(arg);
      } catch (e) {
        let fallback = '';
        for (const key of Object.keys(arg)) {
          try {
            fallback += ` ${key}:${arg[key]}`;
          } catch (_) {}
        }
        return fallback;
      }
    }).join(' ');

    const str = combinedText.toLowerCase();
    return (
      str.includes('disconnecting idle stream') ||
      str.includes('timed out waiting for new targets') ||
      str.includes('grpcconnection rpc') ||
      str.includes('@firebase/firestore') ||
      str.includes('cancelled: disconnecting') ||
      str.includes('disconnecting') ||
      str.includes('idle stream') ||
      str.includes('grpc_connection') ||
      str.includes('listen stream') ||
      str.includes('grpcconnection')
    );
  } catch (err) {
    return false;
  }
};

console.error = function (...args: any[]) {
  if (isBenignMessage(...args)) return;
  originalError.apply(console, args);
};

console.warn = function (...args: any[]) {
  if (isBenignMessage(...args)) return;
  originalWarn.apply(console, args);
};
