export default function LoadingPage() {
  return <div className="page-shell py-12" aria-label="Loading"><div className="skeleton mb-4 h-8 w-64"/><div className="skeleton mb-8 h-4 w-96 max-w-full"/><div className="grid gap-5 md:grid-cols-3">{[1,2,3].map((item) => <div key={item} className="panel p-5"><div className="skeleton h-32 w-full"/><div className="skeleton mt-5 h-5 w-3/4"/><div className="skeleton mt-3 h-4 w-full"/><div className="skeleton mt-2 h-4 w-5/6"/></div>)}</div></div>;
}
