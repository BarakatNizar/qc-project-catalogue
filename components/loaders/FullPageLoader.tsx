// components/loaders/FullPageLoader.tsx

interface FullPageLoaderProps {
  label?: string;
}

export default function FullPageLoader({ label = "Loading..." }: FullPageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center backdrop-blur-sm h-[80vh] w-full">
      <div className="flex flex-col items-center gap-6 p-10 border-2 border-primary/20 rounded-3xl bg-base-100 shadow-2xl">
        {/* DaisyUI Loading Spinner */}
        <span className="loading loading-ring loading-lg text-primary scale-150"></span>
        <div className="space-y-2 text-center">
          <h2 className="text-[16px] font-black uppercase tracking-[0.2em] text-primary animate-pulse">
            {label.toUpperCase()}
          </h2>
          <p className="text-[14px] font-bold uppercase opacity-60 tracking-widest">
            Processing Data...
          </p>
        </div>
      </div>
    </div>
  );
}