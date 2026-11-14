import React from "react";
const paths = {
  arrow: "M5 12h14m-5-5 5 5-5 5",
  back: "M19 12H5m5-5-5 5 5 5",
  down: "m6 9 6 6 6-6",
  search: "m21 21-4.5-4.5M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  calendar:
    "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2",
  coffee:
    "M4 8h12v8a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Zm12 1h2a4 4 0 0 1 0 8h-2M7 2v3m4-3v3m4-3v3",
  food: "M4 2v6a3 3 0 0 0 6 0V2M7 2v20m12 0V2c-4 3-4 9 0 10",
  dessert: "M5 10h14v11H5V10Zm-2 4h18M7 10V7h10v3M12 7V4m0-3v1",
  grid: "M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  filter: "M4 7h16M7 12h10m-6 5h2",
  star: "m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z",
  check: "m5 12 4 4L19 6",
  verified:
    "m12 2 3 2 4 1 1 4 2 3-2 3-1 4-4 1-3 2-3-2-4-1-1-4-2-3 2-3 1-4 4-1 3-2Zm-5 10 3 3 7-7",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
  user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 22v-3a8 8 0 0 1 16 0v3",
  users:
    "M15 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM2 22v-3a8 8 0 0 1 16 0v3m-1-19a4 4 0 0 1 0 8m4 11v-4a6 6 0 0 0-3-5",
  clock: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Zm-10-6v6l4 2",
  cart: "M3 8h18l-2-6H5L3 8Zm2 3v10h14V11M2 21h20M8 2v6m8-6v6",
  close: "m6 6 12 12M6 18 18 6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  shield: "m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Zm-5 10 3 3 7-7",
  flag: "M4 22V3m0 0c5-4 10 4 16 0v11c-6 4-11-4-16 0",
  external:
    "M15 3h6v6m0-6L10 14M11 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 4 5 5-5 5m-9-5h14",
  upload: "M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7",
  edit: "m16 3 5 5M3 21l5-1L21 7l-5-5L3 15v6Z",
  heart:
    "M20.8 4.6c-2.2-2.2-5.8-2.2-8 0l-.8.8-.8-.8a5.7 5.7 0 0 0-8 8L12 22l8.8-9.4a5.7 5.7 0 0 0 0-8Z",
  lock: "M5 10h14v12H5V10Zm3 0V6a4 4 0 0 1 8 0v4",
  mail: "M2 4h20v16H2V4Zm0 0 10 9L22 4",
  info: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Zm-10-1v6m0-10h.01",
  home: "m2 11 10-9 10 9M5 9v13h14V9m-10 13v-8h6v8",
  spark: "m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z",
  message: "M21 3H3v14h5l4 5 4-5h5V3ZM7 8h10M7 12h7",
  menu: "M3 6h18M3 12h18M3 18h18",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Zm14 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  leaf: "M20 3C9 1 1 8 6 16c8 5 15-3 14-13ZM4 21 16 9",
};
export function Icon({ name, size = 20, className = "", ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d={paths[name] || paths.spark} />
    </svg>
  );
}
