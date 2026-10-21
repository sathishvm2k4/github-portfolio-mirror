import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";

interface CopyButtonProps extends Omit<ButtonProps, "onClick" | "children"> {
  text: string;
  label?: string;
  copiedLabel?: string;
  toastMessage?: string;
}

/** Copies text to the clipboard and fires a toast. */
export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  toastMessage = "Copied to clipboard",
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for non-secure contexts.
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    toast.success(toastMessage);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="sm" onClick={onCopy} {...props}>
      {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
      {copied ? copiedLabel : label}
    </Button>
  );
}
