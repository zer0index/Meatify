import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertTemp(temp: number, toCelsius: boolean): number {
  // If toCelsius is true, convert from Fahrenheit to Celsius
  // If toCelsius is false, convert from Celsius to Fahrenheit
  return toCelsius
    ? Math.round(((temp - 32) * 5) / 9)
    : Math.round((temp * 9) / 5 + 32);
}

export function formatTemp(temp: number, isCelsius: boolean): string {
  if (typeof temp !== "number" || isNaN(temp)) return "--";
  return `${temp}°${isCelsius ? "C" : "F"}`;
}

export function getMeatInfo(meatType: string | number) {
  // Example meat info with images
  const meatTypes: Record<string, { label: string; image: string }> = {
    beef_brisket: { label: "Beef Brisket", image: "/images/beef_brisket.jpg" },
    beef_ribs: { label: "Beef Ribs", image: "/images/beef_ribs.jpg" },
    beef_tenderloin: { label: "Beef Tenderloin", image: "/images/beef_tenderloin.jpg" },
    pork_shoulder: { label: "Pork Shoulder", image: "/images/pork_shoulder.jpg" },
    pork_ribs: { label: "Pork Ribs", image: "/images/pork_ribs.jpg" },
    pork_tenderloin: { label: "Pork Tenderloin", image: "/images/pork_tenderloin.jpg" },
    chicken_breast: { label: "Chicken Breast", image: "/images/chicken_breast.jpg" },
    chicken_thigh: { label: "Chicken Thigh", image: "/images/chicken_thigh.jpg" },
    lamb_chops: { label: "Lamb Chops", image: "/images/lamb_chops.jpg" },
    // Add more as needed
  };
  return meatTypes[meatType] || { label: String(meatType), image: "" };
}

export function formatFloat(value: number): string {
  if (typeof value !== "number" || isNaN(value)) return "--";
  return value.toFixed(2);
}
