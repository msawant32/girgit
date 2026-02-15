export function Timer({ seconds }) {
  const getTimerClass = () => {
    if (seconds <= 5) return 'timer timer-danger';
    if (seconds <= 10) return 'timer timer-warning';
    return 'timer text-gray-700';
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="text-center">
      <div className={getTimerClass()}>
        {formatTime(seconds)}
      </div>
      <div className="text-sm text-gray-500 mt-1">Time Remaining</div>
    </div>
  );
}
