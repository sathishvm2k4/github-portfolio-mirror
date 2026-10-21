import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  FileText,
  FlaskConical,
  GitCommitHorizontal,
  Layers,
  Loader2,
  ScanSearch,
  Sparkles,
  Target,
} from "lucide-react";
import { createAudit, TARGET_ROLES, type TargetRole } from "@/lib/api";
import { Header } from "@/components/hiremirror/header";
import { SampleReport } from "@/components/hiremirror/sample-report";
import { auditRequestKey } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "HireMirror — See Your GitHub the Way Recruiters Do",
        description:
          "A free portfolio auditor for students: score your public GitHub repos against what internship recruiters actually check, and get a prioritized fix list.",
      },
      { property: "og:title", content: "HireMirror — See Your GitHub the Way Recruiters Do" },
      {
        property: "og:description",
        content: "Score your public GitHub repos against what internship recruiters actually check.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "HireMirror — See Your GitHub the Way Recruiters Do" },
      {
        name: "twitter:description",
        content: "Score your public GitHub repos against what internship recruiters actually check.",
      },
    ],
  }),
  component: Index,
});

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <WhatWeCheck />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<TargetRole>("JAVA_BACKEND_INTERN");
  const [starting, setStarting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const handle = username.trim();
    if (!handle) {
      toast.error("Enter a GitHub username to audit.");
      return;
    }
    setStarting(true);
    try {
      const { auditId } = await createAudit(handle, role);
      localStorage.setItem(
        auditRequestKey(auditId),
        JSON.stringify({ username: handle, targetRole: role }),
      );
      await navigate({ to: "/audit/$auditId", params: { auditId } });
    } catch {
      toast.error("Could not start the audit. Please try again.");
      setStarting(false);
    }
  };

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-[480px] gradient-brand opacity-[0.08] blur-[120px]"
      />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pb-28 lg:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" />
            Free · Public repos only · No signup
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            See your GitHub the way <span className="text-gradient">recruiters</span> do.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            HireMirror audits your public repos against the checklist a recruiter runs in their
            first ten seconds — then hands you a prioritized fix list before the real application
            window opens.
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-8 rounded-2xl border border-border bg-card/80 p-4 shadow-lg backdrop-blur sm:p-5"
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="grid gap-1.5">
                <Label htmlFor="username" className="text-xs font-medium text-muted-foreground">
                  GitHub username
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. torvalds"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="font-mono"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="role" className="text-xs font-medium text-muted-foreground">
                  Target role
                </Label>
                <Select value={role} onValueChange={(v) => setRole(v as TargetRole)}>
                  <SelectTrigger id="role" className="w-full sm:w-52">
                    <SelectValue placeholder="Pick a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="submit"
              disabled={starting}
              size="lg"
              className="mt-4 w-full gradient-brand font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-ring sm:w-auto"
            >
              {starting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Starting audit…
                </>
              ) : (
                <>
                  <ScanSearch className="size-4" /> Audit my GitHub
                </>
              )}
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Takes about a minute. We only read public data and never store it.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <SampleReport />
        </motion.div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    title: "Enter your username",
    detail: "Just your public GitHub handle and the internship role you're aiming for.",
  },
  {
    title: "We score your public repos",
    detail: "READMEs, tests, commit hygiene, project depth and polish — graded 0-100.",
  },
  {
    title: "Get a fix list",
    detail: "Prioritized, concrete actions plus resume bullets you can copy today.",
  },
];

function HowItWorks() {
  return (
    <section className="border-t border-border/60 bg-card/40 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div {...fadeUp} transition={{ duration: 0.6 }}>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            How it works
          </h2>
        </motion.div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              {...fadeUp}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <span className="font-mono text-3xl font-bold text-gradient">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-semibold text-foreground">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const CHECKS = [
  {
    icon: FileText,
    title: "README",
    detail: "Does each repo explain itself, run, and show its value in under a minute?",
  },
  {
    icon: FlaskConical,
    title: "Tests",
    detail: "Real, runnable tests — the fastest signal that code actually works.",
  },
  {
    icon: GitCommitHorizontal,
    title: "Commit history",
    detail: "Frequency and message quality: \"update\" vs \"Add CSV export\".",
  },
  {
    icon: Layers,
    title: "Project depth",
    detail: "Original architecture and features beyond a tutorial walkthrough.",
  },
  {
    icon: Sparkles,
    title: "Polish",
    detail: "Pinned repos, profile README, topics, descriptions, demo links.",
  },
  {
    icon: Target,
    title: "Tech-stack fit",
    detail: "Does the repo story match the internship role you're targeting?",
  },
];

function WhatWeCheck() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div {...fadeUp} transition={{ duration: 0.6 }}>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            What we check
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            The same six things a recruiter scans before deciding whether to open your code.
          </p>
        </motion.div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CHECKS.map((c, i) => (
            <motion.div
              key={c.title}
              {...fadeUp}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <c.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold text-foreground">{c.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: "Is it free?",
    a: "Yes. Auditing your public GitHub profile is completely free — no account, no credit card.",
  },
  {
    q: "Is my data stored?",
    a: "No. Audits run in memory and nothing is persisted. The only thing kept on your device is your own last score in your browser's local storage so we can show your progress between audits.",
  },
  {
    q: "Does it read private repos?",
    a: "No. HireMirror only reads public GitHub data — exactly what a recruiter can see. We never request access to your account and there is nothing to connect or authorize.",
  },
  {
    q: "How accurate is the score?",
    a: "It's a checklist-based guide, not a prediction of interview results. It measures what is visible and verifiable in your public repos — documentation, tests, commit hygiene, depth and polish — which is what recruiters screen on first.",
  },
];

function Faq() {
  return (
    <section className="border-t border-border/60 bg-card/40 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <motion.div {...fadeUp} transition={{ duration: 0.6 }}>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Frequently asked
          </h2>
        </motion.div>
        <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.1 }} className="mt-8">
          <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-6">
            {FAQS.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-sm font-medium sm:text-base">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg gradient-brand">
              <ScanSearch className="size-4 text-primary-foreground" />
            </span>
            <span className="font-bold tracking-tight text-foreground">
              Hire<span className="text-gradient">Mirror</span>
            </span>
          </div>
          <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
            The score is a checklist-based guide, not a prediction of interview results. Only
            public GitHub data is used. Not affiliated with GitHub.
          </p>
        </div>
      </div>
    </footer>
  );
}
