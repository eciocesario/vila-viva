/**
 * Estado gracioso pra telas que dependem de rede e foram abertas offline.
 * Usado no lugar de erros crus (ex: Pessoas) ou mensagens enganosas
 * (ex: "perfil não encontrado") quando a causa real é falta de conexão.
 */
export function OfflineNotice() {
  return (
    <div className="text-center py-10 px-4">
      <p className="text-3xl mb-2" aria-hidden="true">📴</p>
      <p className="text-sm text-carvao/70 max-w-xs mx-auto">
        Você está offline. Esta tela precisa de conexão pra carregar — o que você
        já abriu antes continua disponível no Feed e nas Vagas.
      </p>
    </div>
  );
}
