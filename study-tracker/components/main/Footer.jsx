'use client';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="flex items-center justify-center border-t border-gray-200 bg-white px-12 py-6 text-center">
      <p className="text-xs text-gray-400">
        {year} <span className="font-medium text-gray-600">Basira</span> · Developed by Nada
      </p>
    </footer>
  );
}