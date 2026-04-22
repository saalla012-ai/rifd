type RifdLogoProps = {
  className?: string;
  iconClassName?: string;
  labelClassName?: string;
  showDescriptor?: boolean;
  size?: "sm" | "md";
};

const SIZE_MAP = {
  sm: {
    wrapper: "gap-2",
    iconBox: "h-9 w-9 rounded-lg",
    icon: "h-9 w-9",
    word: "text-lg",
    descriptor: "text-[11px]",
  },
  md: {
    wrapper: "gap-2",
    iconBox: "h-10 w-10 rounded-xl sm:h-11 sm:w-11",
    icon: "h-10 w-10 sm:h-11 sm:w-11",
    word: "text-lg sm:text-xl",
    descriptor: "text-xs",
  },
} as const;

export function RifdLogo({
  className = "",
  iconClassName = "",
  labelClassName = "",
  showDescriptor = true,
  size = "md",
}: RifdLogoProps) {
  const styles = SIZE_MAP[size];

  return (
    <span className={`flex min-w-0 items-center font-bold ${styles.wrapper} ${className}`}>
      <span
        className={`flex items-center justify-center bg-primary text-primary-foreground shadow-elegant ${styles.iconBox} ${iconClassName}`}
        aria-hidden
      >
        <svg
          viewBox="0 0 48 48"
          className={styles.icon}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="6" y="6" width="36" height="36" rx="12" fill="currentColor" opacity="0.12" />
          <circle cx="15" cy="24" r="3.5" fill="currentColor" />
          <path
            d="M18.5 24H25C28.2 24 30.8 21.4 30.8 18.2V17"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18.5 24H25C28.2 24 30.8 26.6 30.8 29.8V31"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18.5 24H31"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="31" y="12" width="6" height="6" rx="2" fill="currentColor" />
          <rect x="31" y="21" width="6" height="6" rx="2" fill="#C9A961" />
          <rect x="31" y="30" width="6" height="6" rx="2" fill="currentColor" />
        </svg>
      </span>

      <span className={`min-w-0 leading-none ${labelClassName}`}>
        <span className={`block font-extrabold text-foreground ${styles.word}`}>رِفد</span>
        {showDescriptor && (
          <span className={`block font-medium text-muted-foreground ${styles.descriptor}`}>للتقنية</span>
        )}
      </span>
    </span>
  );
}