export async function onRequestGet() {
  return new Response(JSON.stringify({ ok: true, msg: "Boosteryuk Functions Active" }), {
    headers: { "Content-Type": "application/json" }
  });
}
