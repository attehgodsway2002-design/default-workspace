"use client";

import * as React from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export function ShareButton({ name }: { name: string }) {
  const [copied, setCopied] = React.useState(false);

  const share = async () => {
    const url = window.location.href;
    const payload = { title: `${name} on Seen`, text: `${name} — verified on Seen`, url };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Link copied — send it on WhatsApp", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Could not copy the link", "error");
    }
  };

  return (
    <Button variant="outline" size="md" className="h-11" onClick={share} aria-label="Share this listing">
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      Share
    </Button>
  );
}
