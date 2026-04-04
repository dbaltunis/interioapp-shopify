import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { toast } from "sonner";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    features: ["1 product template", "1 pricing grid", "Basic calculator"],
    current: true,
  },
  {
    name: "Professional",
    price: "$29/month",
    features: [
      "Unlimited templates",
      "Unlimited grids",
      "Unlimited fabrics",
      "Quote management",
    ],
    current: false,
  },
  {
    name: "Enterprise",
    price: "$79/month",
    features: [
      "Everything in Professional",
      "Work orders",
      "Analytics",
      "Priority support",
    ],
    current: false,
  },
];

export default function SettingsPage() {
  const fetch = useAuthenticatedFetch();

  const handleSeedData = async () => {
    try {
      await fetch("/api/seed");
      toast.success("Demo data seeded successfully");
    } catch {
      toast.error("Failed to seed data");
    }
  };

  return (
    <PageLayout title="Settings" description="Manage your account and preferences">
      {/* Billing Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Billing</CardTitle>
          <CardDescription>Choose the plan that fits your business</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={plan.current ? "border-primary" : ""}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {plan.current && <Badge>Current</Badge>}
                  </div>
                  <CardDescription className="text-2xl font-bold text-foreground">
                    {plan.price}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {!plan.current && (
                    <Button className="w-full mt-4" variant="outline">
                      Upgrade
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Management</CardTitle>
          <CardDescription>Seed demo data or export your data</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button variant="outline" onClick={handleSeedData}>
            Seed Demo Data
          </Button>
          <Button variant="outline">Export All Data</Button>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
