function FloatingNotice({ message, type = 'success' }) {
  if (!message) return null;

  const baseStyles = 'pointer-events-none rounded-lg border px-5 py-3.5 text-base font-semibold shadow-lg';
  const toneStyles = type === 'error'
    ? 'bg-red-600 border-red-700 text-white'
    : 'bg-emerald-600 border-emerald-700 text-white';

  return (
    <div className={`${baseStyles} ${toneStyles}`}>
      {message}
    </div>
  );
}

export default FloatingNotice;
