import { SquareArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex flex-col text-center max-w-2xl m-auto gap-y-4">
      <h1 className="mb-4 text-2xl font-bold">iteration11 (i11) registry</h1>
      <div>
        <p>
          Inspired by <span className="font-medium">shadcn/ui</span>, the{" "}
          <span className="border bg-stone-200/50 font-medium px-1 py-0.5 rounded">
            i11 registry
          </span>{" "}
          takes a simpler, more focused approach. Heavily biased with my own
          personal preferences, it’s pruned down and expanded beyond UI to
          include functionality, helpers, configurations, and guides that help
          you move fast without the bloat.
        </p>

        <p className="text-fd-muted-foreground mt-2">
          <Button asChild variant="link" className="text-fd-foreground">
            <Link href="/docs">
              Ready to stop reinventing the wheel? Go grab what you need
              <SquareArrowUpRight />
            </Link>
          </Button>{" "}
        </p>
      </div>
    </main>
  );
}
