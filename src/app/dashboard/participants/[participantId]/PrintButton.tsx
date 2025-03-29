'use client';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-3 py-2 text-sm font-medium text-[#128C7E] bg-white border border-[#128C7E] rounded-md hover:bg-gray-50"
    >
      Print Certificate
    </button>
  );
} 