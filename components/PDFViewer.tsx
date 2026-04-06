"use client";

const PDF_URL =
  "https://www.churchofjesuschrist.org/bc/content/shared/content/english/pdf/language-materials/34406_eng.pdf";

export default function PDFViewer() {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <iframe
        src={PDF_URL}
        title="Book of Mormon"
        className="flex-1 w-full border-none"
        style={{ display: "block" }}
      />
      {/* Fallback shown below the iframe if it's blocked — the iframe itself just shows blank */}
      <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-800 flex items-center gap-2">
        <span>If the PDF does not load above, your browser may be blocking it.</span>
        <a
          href={PDF_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline hover:text-amber-900"
        >
          Open PDF in new tab →
        </a>
      </div>
    </div>
  );
}
