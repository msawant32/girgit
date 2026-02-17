export function Logo({ size = "large", className = "", clickable = false, onClick }) {
  const sizeClasses = {
    small: "text-2xl sm:text-3xl",
    medium: "text-3xl sm:text-4xl",
    large: "text-4xl sm:text-5xl",
    xlarge: "text-5xl sm:text-6xl"
  };

  const content = (
    <>
      <span className={`${sizeClasses[size]} chameleon-icon`}>
        🦎
      </span>
      <h1 className={`${sizeClasses[size]} font-bold chameleon-icon`}>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
          Girgit
        </span>
      </h1>
    </>
  );

  if (clickable && onClick) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center justify-center gap-2 hover:opacity-80 transition-opacity cursor-pointer ${className}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {content}
    </div>
  );
}
