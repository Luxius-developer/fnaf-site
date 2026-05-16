export async function onRequest(context) {
  return new Response(JSON.stringify({ message: "Hello from Cloudflare" }), {
    headers: { 'Content-Type': 'application/json' }
  });
}