export default function DispatchLoading() {
  return (
    <div className="loading-container animate-fade-in" style={{ height: '60vh' }}>
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="spinner-lg" />
        <p className="text-slate-500 font-medium">Loading Dispatch Portal...</p>
      </div>
    </div>
  );
}
