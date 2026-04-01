type PageShellProps = {
  title: string;
  description: string;
};

export function PageShell({ title, description }: PageShellProps) {
  return (
    <section className="app-card p-6">
      <h1 className="app-title">{title}</h1>
      <p className="app-subtitle">{description}</p>
    </section>
  );
}
