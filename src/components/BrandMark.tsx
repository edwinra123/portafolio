export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`brand-mark ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 21s-6.5-4.2-8.7-8.1C1.5 9.7 2.7 6.4 5.8 5.4c1.7-.55 3.5.05 4.5 1.4L12 8.4l1.7-1.6c1-1.35 2.8-1.95 4.5-1.4 3.1 1 4.3 4.3 2.5 7.5C18.5 16.8 12 21 12 21z"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="rgba(255,255,255,0.12)"
        />
        <path
          d="M12 7.5v9M8 12h8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
