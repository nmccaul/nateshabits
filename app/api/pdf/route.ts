export const dynamic = "force-dynamic";

const PDF_URL =
  "https://www.churchofjesuschrist.org/bc/content/shared/content/english/pdf/language-materials/34406_eng.pdf";

export async function GET() {
  const res = await fetch(PDF_URL, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    return new Response("Failed to fetch PDF", { status: 502 });
  }

  const buffer = await res.arrayBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
