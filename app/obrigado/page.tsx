import Link from "next/link";

export default function ObrigadoPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f7f8fb", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, background: "white", padding: 32, borderRadius: 24, boxShadow: "0 18px 40px rgba(0,0,0,0.08)" }}>
        <h1>Compra recebida ✅</h1>
        <p>Seu pagamento foi processado. Se o checkout estiver usando método com redirecionamento, essa página confirma o retorno.</p>
        <p>O PDF será enviado por email após a confirmação do webhook.</p>
        <Link href="/">Voltar para a loja</Link>
      </div>
    </main>
  );
}
