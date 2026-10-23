export const landingPackages = [
  { name: 'toast', title: 'Toast', en: 'Small messages. Just in time.', ko: '필요한 순간, 작은 소식 하나.' },
] as const;

export type LandingPackage = (typeof landingPackages)[number];

export function getLandingPackage(name: string) {
  return landingPackages.find(item => item.name === name);
}
