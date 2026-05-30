import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackClient } from "./TrackClient";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Enter your CHOP. order code to see real-time delivery status.",
};

function LoadingFallback() {
  return (
    <Container className="py-10 md:py-16">
      <div className="mx-auto max-w-xl animate-pulse motion-reduce:animate-none space-y-4">
        <div className="h-6 w-1/2 rounded-full bg-paper-2 mx-auto" />
        <div className="h-12 rounded-full bg-paper-2" />
        <div className="h-32 rounded-2xl bg-paper-2" />
      </div>
    </Container>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TrackClient />
    </Suspense>
  );
}
