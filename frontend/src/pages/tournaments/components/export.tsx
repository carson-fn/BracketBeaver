import { useEffect, useRef, useState, type ReactNode } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import type { BracketResponse } from "../../../api/tournamentApi";

type ExportProps = {
  bracket: NonNullable<BracketResponse["bracket"]>;
  isBusy: boolean;
  setIsBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  children: ReactNode;
};

function Export({
  bracket,
  isBusy,
  setIsBusy,
  setError,
  setMessage,
  children,
}: ExportProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const bracketExportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fileBaseName = bracket.tournament.name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

  const handleToggleExportMenu = () => {
    setShowExportMenu((current) => !current);
  };

  const handleExportPNG = async () => {
    setShowExportMenu(false);

    if (!bracketExportRef.current) {
      setError("No bracket to export.");
      return;
    }

    setIsBusy(true);
    setError("");
    setMessage("");

    try {
      const dataUrl = await toPng(bracketExportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `${fileBaseName}-bracket.png`;
      link.href = dataUrl;
      link.click();

      setMessage("Bracket exported as PNG.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Failed to export PNG."
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleExportPDF = async () => {
    setShowExportMenu(false);

    if (!bracketExportRef.current) {
      setError("No bracket to export.");
      return;
    }

    setIsBusy(true);
    setError("");
    setMessage("");

    try {
      const dataUrl = await toPng(bracketExportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const image = new Image();
      image.src = dataUrl;

      image.onload = () => {
        const pdf = new jsPDF({
          orientation: image.width > image.height ? "landscape" : "portrait",
          unit: "px",
          format: [image.width, image.height],
        });

        pdf.addImage(dataUrl, "PNG", 0, 0, image.width, image.height);
        pdf.save(`${fileBaseName}-bracket.pdf`);

        setMessage("Bracket exported as PDF.");
        setIsBusy(false);
      };

      image.onerror = () => {
        setError("Failed to prepare PDF export.");
        setIsBusy(false);
      };
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Failed to export PDF."
      );
      setIsBusy(false);
    }
  };

  const handleCopyShareLink = async () => {
    setShowExportMenu(false);

    if (!bracket.tournament.tournamentId) {
      setError("No bracket to share.");
      return;
    }

    const shareUrl = `${window.location.origin}/tournaments?id=${bracket.tournament.tournamentId}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setError("");
      setMessage("Share link copied to clipboard.");
    } catch {
      setError("Failed to copy link.");
    }
  };

  return (
    <>
      <div className="export-menu-wrapper" ref={exportMenuRef}>
        <button
          type="button"
          className="export-toggle-button"
          onClick={handleToggleExportMenu}
          disabled={isBusy}
        >
          Export
        </button>

        {showExportMenu ? (
          <div className="export-dropdown">
            <button type="button" onClick={handleExportPNG} disabled={isBusy}>
              Export as PNG
            </button>
            <button type="button" onClick={handleExportPDF} disabled={isBusy}>
              Export as PDF
            </button>
            <button type="button" onClick={handleCopyShareLink} disabled={isBusy}>
              Copy Share Link
            </button>
          </div>
        ) : null}
      </div>

      <div ref={bracketExportRef} className="bracket-export-area">
        {children}
      </div>
    </>
  );
}

export default Export;