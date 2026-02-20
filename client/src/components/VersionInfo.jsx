export function VersionInfo() {
  const version = import.meta.env.VITE_APP_VERSION || '1.0.0';
  const buildTime = import.meta.env.VITE_BUILD_TIME || 'dev';

  return (
    <div className="fixed bottom-2 right-2 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded shadow-sm backdrop-blur-sm">
      v{version} {buildTime !== 'dev' && `• ${new Date(buildTime).toLocaleDateString()}`}
    </div>
  );
}
