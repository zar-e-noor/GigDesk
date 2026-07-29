import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-6 text-ink">
          Invoices your clients can <span className="text-accent">sign in seconds.</span>
        </h1>
        <p className="text-lg text-ink-soft mb-10 max-w-md mx-auto">
          Create an invoice, share a link, watch it get viewed and signed — live.
        </p>
        <Link href="/signup">
          <button className="bg-accent text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-accent-dark transition-colors">
            Get started free
          </button>
        </Link>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-bold text-ink mb-2">Fast</h3>
            <p className="text-sm text-ink-soft">Create an invoice in under a minute.</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">🔄</div>
            <h3 className="font-bold text-ink mb-2">Live tracking</h3>
            <p className="text-sm text-ink-soft">See the moment a client opens it.</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">✍️</div>
            <h3 className="font-bold text-ink mb-2">E-sign</h3>
            <p className="text-sm text-ink-soft">No printing, no scanning.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
