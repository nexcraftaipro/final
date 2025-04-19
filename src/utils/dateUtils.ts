import { differenceInDays, parseISO, isAfter } from 'date-fns';

export const getTimeRemaining = (expirationDate: string): string => {
  const now = new Date();
  const expDate = parseISO(expirationDate);
  const daysRemaining = differenceInDays(expDate, now);

  if (daysRemaining < 0) return 'Expired';
  return `${daysRemaining} days`;
};

export const isPremiumExpired = (expirationDate: string): boolean => {
  const now = new Date();
  const expDate = parseISO(expirationDate);
  return isAfter(now, expDate);
};
