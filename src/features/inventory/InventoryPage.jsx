export default function InventoryPage() {
  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="font-cinzel text-2xl font-black text-gold-gradient mb-6">
        🎒 Inventario
      </h1>
      <div className="bg-gradient-to-br from-dark-400/90 to-dark-800/90 
        border border-gold/15 rounded-xl p-8 text-center">
        <div className="text-5xl mb-4">🎒</div>
        <h2 className="font-cinzel text-lg text-gold-light mb-2">Tu Arsenal</h2>
        <p className="text-purple-muted">
          Aquí verás todos tus objetos adquiridos en la Tienda del Templo.
        </p>
      </div>
    </div>
  );
}
