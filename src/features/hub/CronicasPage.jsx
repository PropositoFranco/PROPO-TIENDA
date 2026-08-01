export default function CronicasPage() {
  return (
    <iframe
      src={`/pages/cronicas.html?v=${Date.now()}`}
      style={{ width: '100%', height: '100vh', border: 'none', display: 'block' }}
    />
  );
}