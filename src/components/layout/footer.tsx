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

  const showCopyright = scripturePages.some((page) => pathname.startsWith(page));

  useEffect(() => {
    if (!showCopyright) return;

    fetch("/api/user")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.translation) {
          setTranslation(data.translation as "csb" | "esv");
        }
      })
      .catch(() => {});
  }, [showCopyright]);

  return (
    <footer className="border-t py-6 mt-auto">
      <div className="container-page space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>Memorize Romans 8</p>
          <p>v1.0</p>
        </div>
        {showCopyright && (
          <p className="text-xs text-muted-foreground/70 text-center sm:text-left">
            {translation ? copyrights[translation] : (
              <>
                {copyrights.csb}
                <br className="sm:hidden" />
                <span className="hidden sm:inline"> • </span>
                {copyrights.esv}
              </>
            )}
          </p>
        )}
      </div>
    </footer>
  );
}
