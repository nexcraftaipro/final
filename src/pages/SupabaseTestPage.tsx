import { SupabaseTest } from "@/components/SupabaseTest";

export default function SupabaseTestPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
      <SupabaseTest />
    </div>
  );
} 