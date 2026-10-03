// Runs separately from the app so it can observe app failures.
const url = process.env.MONITOR_URL;
if (!url) throw new Error('MONITOR_URL is required');
let wasDown = false;
async function check() {
  let healthy = false;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    healthy = response.ok && (await response.json()).status === 'ok';
  } catch { /* An unreachable service is unhealthy. */ }
  console.log(JSON.stringify({ time: new Date().toISOString(), url, status: healthy ? 'UP' : 'DOWN' }));
  if (!healthy || wasDown) {
    const text = `VoiceCare ${healthy ? 'RECOVERED' : 'ALERT: service DOWN'}: ${url}`;
    console.error(text);
    if (process.env.ALERT_WEBHOOK_URL) {
      try {
        const response = await fetch(process.env.ALERT_WEBHOOK_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }), signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) console.error('Alert delivery failed');
      } catch { console.error('Alert delivery failed'); }
    }
  }
  wasDown = !healthy;
}
(async () => {
  for (;;) {
    await check();
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
})();
