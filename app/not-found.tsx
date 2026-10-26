import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return <div className="page-shell flex min-h-[55vh] items-center justify-center py-16"><div className="max-w-lg text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-primary"><Compass size={27}/></span><p className="eyebrow mt-5">404 · Not found</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">This page isn't available</h1><p className="mt-3 text-sm leading-6 text-base-content/60">The item may have been removed, hidden from your role, or the address may be incorrect.</p><Link href="/" className="btn btn-primary mt-6 gap-2"><ArrowLeft size={16}/>Return home</Link></div></div>;
}
