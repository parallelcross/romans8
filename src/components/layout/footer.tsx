"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const copyrights = {
  csb: "Scripture quotations from the CSB® © 2017 Holman Bible Publishers. Used by permission.",
  esv: "Scripture quotations from the ESV® © 2001 Crossway. Used by permission.",
};

const scripturePages = ["/practice", "/run"];

export function Footer() {
  const pathname = usePathname();
  const [translation, setTranslation] = useState<"csb" | "esv" | null>(null);

  const showFooter = scripturePages.some((page) => pathname.startsWith(page));

  useEffect(() => {
    if (!showFooter) return;

    fetch("/api/user")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.translation) {
          setTranslation(data.translation as "csb" | "esv");
        }
      })
      .catch(() => {});
  }, [showFooter]);

  if (!showFooter) return null;

  return (
    <footer className="border-t py-4 mt-auto">
      <div className="container-page">
        <p className="text-xs text-muted-foreground/70 text-center">
          {translation ? copyrights[translation] : copyrights.csb}
        </p>
      </div>
    </footer>
  );
}
