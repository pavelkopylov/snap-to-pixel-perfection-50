import { jsPDF } from "jspdf";
import { ANIMALS, CATEGORY_LABELS, COPY, type CategoryId } from "@/config/aiSafari";
import type { SafariResult } from "@/lib/safari-scoring";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("illustration could not be loaded"));
    img.src = src;
  });
}

export async function downloadCertificate(result: SafariResult, dateLabel: string) {
  const animal = ANIMALS[result.primary];
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const margin = 18;

  doc.setFillColor(252, 251, 247);
  doc.rect(0, 0, W, 297, "F");
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.5);
  doc.rect(margin, margin, W - margin * 2, 297 - margin * 2);

  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.text("AI SAFARI", W / 2, margin + 14, { align: "center" });
  doc.setFontSize(28);
  doc.text("AI Safari Certificate", W / 2, margin + 30, { align: "center" });
  doc.setLineWidth(0.3);
  doc.line(margin + 20, margin + 36, W - margin - 20, margin + 36);

  try {
    const img = await loadImage(animal.image);
    doc.addImage(img, "PNG", W / 2 - 30, margin + 44, 60, 60);
  } catch {
    /* illustration optional in the PDF */
  }

  doc.setFontSize(22);
  doc.text(animal.name, W / 2, margin + 118, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  const desc = doc.splitTextToSize(animal.description, W - margin * 2 - 30);
  doc.text(desc, W / 2, margin + 128, { align: "center" });

  let y = margin + 128 + desc.length * 5 + 10;
  (Object.keys(CATEGORY_LABELS) as CategoryId[]).forEach((key) => {
    const score = result.scores[key];
    doc.setFontSize(9.5);
    doc.text(CATEGORY_LABELS[key], margin + 22, y);
    doc.text(`${score.toFixed(1)} / 5`, W - margin - 22, y, { align: "right" });
    const barW = W - margin * 2 - 44;
    doc.setLineWidth(0.2);
    doc.rect(margin + 22, y + 2, barW, 3);
    doc.setFillColor(20, 20, 20);
    doc.rect(margin + 22, y + 2, (barW * (score - 1)) / 4, 3, "F");
    y += 13;
  });

  y += 4;
  doc.setFont("times", "italic");
  doc.setFontSize(11);
  doc.text(doc.splitTextToSize(`Recommendation: ${animal.tips[0]}`, W - margin * 2 - 30), W / 2, y, {
    align: "center",
  });

  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(`Completed ${dateLabel}`, W / 2, y, { align: "center" });

  // Seal
  const cy = 297 - margin - 46;
  doc.setLineWidth(0.4);
  doc.circle(W / 2, cy, 20);
  doc.circle(W / 2, cy, 17.5);
  doc.setFont("times", "normal");
  doc.setFontSize(8);
  doc.text(doc.splitTextToSize(COPY.certificateSeal, 28), W / 2, cy - 4, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(doc.splitTextToSize(COPY.certificateSmallPrint, W - margin * 2 - 30), W / 2, 297 - margin - 14, {
    align: "center",
  });

  doc.save("ai-safari-certificate.pdf");
}
