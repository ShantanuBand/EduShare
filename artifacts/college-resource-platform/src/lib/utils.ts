import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getFileIconColor(fileType: string) {
  const type = fileType.toUpperCase();
  if (type.includes('PDF')) return 'bg-red-500/10 text-red-600 border-red-200';
  if (type.includes('PPT')) return 'bg-orange-500/10 text-orange-600 border-orange-200';
  if (type.includes('DOC') || type.includes('WORD')) return 'bg-blue-500/10 text-blue-600 border-blue-200';
  if (type.includes('XLS') || type.includes('EXCEL')) return 'bg-green-500/10 text-green-600 border-green-200';
  if (type.includes('IMG') || type.includes('PNG') || type.includes('JPG')) return 'bg-purple-500/10 text-purple-600 border-purple-200';
  return 'bg-gray-500/10 text-gray-600 border-gray-200';
}
