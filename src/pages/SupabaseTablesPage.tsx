import { SupabaseTablesCheck } from "@/components/SupabaseTablesCheck";
import { SupabaseSchemaCheck } from "@/components/SupabaseSchemaCheck";

export default function SupabaseTablesPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Supabase Tables</h1>
      <div className="grid grid-cols-1 gap-6">
        <SupabaseTablesCheck />
        <SupabaseSchemaCheck />
      </div>
    </div>
  );
} 