export default function EnvDebug() {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
      <h1>Environment Debug</h1>
      <p><strong>VITE_API_URL:</strong> "{apiUrl}"</p>
      <p><strong>VITE_GEMINI_API_KEY:</strong> "{geminiKey ? geminiKey.substring(0, 20) + '...' : 'NOT SET'}"</p>
      <hr />
      <p><strong>All import.meta.env:</strong></p>
      <pre>{JSON.stringify(import.meta.env, null, 2)}</pre>
    </div>
  );
}
