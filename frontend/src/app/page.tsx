const pilares = [
  {
    titulo: "Captura automática",
    texto:
      "Monitorización de canales Telegram con userbot y normalización de mensajes en tiempo real.",
  },
  {
    titulo: "Parsing con IA",
    texto:
      "Extracción estructurada de picks con validación de esquema para evitar ruido y errores.",
  },
  {
    titulo: "Curación y trazabilidad",
    texto:
      "Revisión manual, publicación premium y tracking completo del tip desde origen hasta resultado.",
  },
];

const beneficios = [
  "Menos humo: solo picks revisados",
  "Fuente y hora original visibles",
  "Formato claro para ejecución rápida",
  "Base preparada para yield, CLV y drawdown",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <span className="inline-block rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-300">
          MVP en construcción
        </span>

        <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
          ApuestasTelegram:
          <span className="block text-emerald-400">tips curados, no ruido.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-zinc-300">
          Plataforma enfocada en capturar tips de Telegram, estructurarlos con IA y distribuir solo picks
          revisados en canal premium.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="#estado"
            className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400"
          >
            Ver estado del proyecto
          </a>
          <a
            href="https://apuestas.entrelanzados.es"
            className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold transition hover:border-zinc-500"
          >
            Dominio activo
          </a>
        </div>
      </section>

      <section className="border-y border-zinc-800 bg-zinc-900/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-12 md:grid-cols-3">
          {pilares.map((pilar) => (
            <article key={pilar.titulo} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="text-xl font-semibold text-zinc-100">{pilar.titulo}</h2>
              <p className="mt-3 text-zinc-300">{pilar.texto}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="estado" className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-2xl font-bold">Qué resuelve esta versión</h2>
        <ul className="mt-5 grid gap-3 text-zinc-200 md:grid-cols-2">
          {beneficios.map((item) => (
            <li key={item} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
              {item}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
