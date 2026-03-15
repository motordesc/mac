import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIChat } from "./ai-chat";

export default function AIPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">AI Assistant</h1>
      <Card>
        <CardHeader>
          <CardTitle>Workshop assistant</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ask about today&apos;s services, revenue, inventory levels, customer or vehicle history.
            Example: &quot;How many vehicles were serviced today?&quot; or &quot;Which items need restocking?&quot;
          </p>
        </CardHeader>
        <CardContent>
          <AIChat />
        </CardContent>
      </Card>
    </div>
  );
}
