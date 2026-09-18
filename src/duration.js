export function formatDuration(value) {
  const milliseconds = Number(value);
  const totalSeconds = Math.floor(
    (Number.isFinite(milliseconds) ? Math.max(0, milliseconds) : 0) / 1000,
  );
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  const pair = (number) => String(number).padStart(2, "0");
  return hours
    ? `${hours}:${pair(minutes)}:${pair(seconds)}`
    : `${pair(totalMinutes)}:${pair(seconds)}`;
}
