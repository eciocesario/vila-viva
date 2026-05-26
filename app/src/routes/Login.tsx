import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    try {
      await signIn(email);
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao enviar link.');
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-4xl text-terra mb-2">Vila Viva</h1>
        <p className="text-sm mb-6 opacity-70">
          Ambiente de testes restrito. Informe o e-mail cadastrado para receber o link de entrada.
        </p>
        <form onSubmit={handle} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full px-4 py-3 rounded-soft border border-carvao/20 bg-white"
            disabled={status === 'sending' || status === 'sent'}
          />
          <button
            type="submit"
            disabled={status === 'sending' || status === 'sent'}
            className="w-full px-4 py-3 rounded-soft bg-terra text-areia font-medium disabled:opacity-50"
          >
            {status === 'sending' ? 'Enviando…' : status === 'sent' ? 'Link enviado' : 'Receber link'}
          </button>
        </form>
        {status === 'sent' && (
          <p className="mt-4 text-sm text-mata">Cheque seu e-mail — o link expira em 1h.</p>
        )}
        {status === 'error' && (
          <p className="mt-4 text-sm text-terra">{errorMsg}</p>
        )}
        <p className="mt-8 text-xs opacity-60">
          <a href="/privacidade" className="underline">Política de privacidade</a>
        </p>
      </div>
    </main>
  );
}
