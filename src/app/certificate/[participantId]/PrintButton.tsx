'use client';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-2 text-sm font-medium text-white bg-[#128C7E] rounded-md hover:bg-[#0e6b5e]"
    >
      Print Certificate
    </button>
  );
} 