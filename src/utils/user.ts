export const getDefaultProfileImage = (name: string): string => {
  const initial = name.charAt(0).toUpperCase();
  const svg = `
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#3b82f6" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="20" fill="#ffffff">
        ${initial}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};
