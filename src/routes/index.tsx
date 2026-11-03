import { createFileRoute, Link } from "@tanstack/react-router";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Owly" },
      { name: "description", content: "Owly — crée ton compte et connecte-toi." },
      { property: "og:title", content: "Owly" },
      { property: "og:description", content: "Owly — crée ton compte et connecte-toi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

function Home() {
  const session = lovable.auth.getSession();
  const signedIn = !!session;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <h1 className="text-5xl font-semibold tracking-tight text-foreground">🦉 Owly</h1>
      <Button asChild>
        <Link to={signedIn ? "/dashboard" : "/auth"}>
          {signedIn ? "Mon espace" : "Se connecter / S'inscrire"}
        </Link>
      </Button>
    </main>
  );
}
