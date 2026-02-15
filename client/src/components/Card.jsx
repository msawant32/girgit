export function Card({ children, className = '', title = null }) {
  return (
    <div className={`card ${className}`}>
      {title && <h2 className="text-2xl font-bold mb-4 text-gray-800">{title}</h2>}
      {children}
    </div>
  );
}
