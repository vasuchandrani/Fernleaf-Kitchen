export default function CatalogueLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-fade-in">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Menu</p>
          <h1>Catalogues</h1>
          <p className="page-subtitle">Build menu versions from the default catalogue and manage dish availability.</p>
        </div>
      </div>
      
      {children}
    </div>
  );
}
