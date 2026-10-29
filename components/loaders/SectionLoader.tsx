// components/loaders/SectionLoader.tsx

interface SectionLoaderProps {
  label?: string;
  minHeight?: string;
}

export default function SectionLoader({ label = "Fetching Data", minHeight = "300px" }: SectionLoaderProps) {
  return (
    <div 
      className="flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed border-base-300 bg-base-200/30" 
      style={{ minHeight }}
    >
      <div className="flex flex-col items-center gap-3">
        <span className="loading loading-bars loading-md text-base-content/50"></span>
        <span className="text-[16px] font-black uppercase tracking-widest opacity-60">
          {label}
        </span>
      </div>
    </div>
  );
}