export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: '2rem', maxWidth: 600 }}>
      <h1>Confidential Gallery API</h1>
      <p>Art recognition backend for Meta Glasses companion app.</p>

      <h2>Endpoints</h2>
      <ul>
        <li>
          <code>POST /api/recognize</code> — Recognize artwork from image
        </li>
        <li>
          <code>GET /api/audio/:artworkId</code> — Get audio description
        </li>
        <li>
          <code>POST /api/artworks/:id/hash</code> — Generate image hash
        </li>
      </ul>

      <h2>Recognition Methods</h2>
      <ol>
        <li>QR code detection (CG-XXXXXX markers)</li>
        <li>Perceptual image hash matching</li>
        <li>AI Vision fallback (OpenAI GPT-4o)</li>
      </ol>
    </main>
  );
}
