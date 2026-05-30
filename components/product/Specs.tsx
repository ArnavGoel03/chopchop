export function Specs({ specs }: { specs: Record<string, string> }) {
  const entries = Object.entries(specs);
  if (entries.length === 0) return null;

  return (
    <section aria-label="Product specifications">
      <div className="overflow-hidden rounded-2xl border border-line">
        <table className="w-full text-sm" aria-label="Specifications table">
          <caption className="sr-only">Product specifications</caption>
          <tbody>
            {entries.map(([key, val], i) => (
              <tr
                key={key}
                className={`flex items-start gap-4 px-5 py-3.5 ${
                  i % 2 === 0 ? "bg-paper" : "bg-paper-2"
                } ${i !== entries.length - 1 ? "border-b border-line" : ""}`}
              >
                <td className="w-36 shrink-0 font-semibold text-ink">{key}</td>
                <td className="text-ink-soft">{val}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
