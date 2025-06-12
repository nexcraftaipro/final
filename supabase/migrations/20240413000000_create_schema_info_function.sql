-- Create a function to get schema information
CREATE OR REPLACE FUNCTION public.get_schema_info()
RETURNS TABLE (
  table_name text,
  column_count bigint
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    table_name::text,
    COUNT(column_name)::bigint as column_count
  FROM 
    information_schema.columns
  WHERE 
    table_schema = 'public'
  GROUP BY 
    table_name
  ORDER BY 
    table_name;
$$;

-- Set permissions for the function
GRANT EXECUTE ON FUNCTION public.get_schema_info() TO anon, authenticated, service_role;

-- Comment on the function
COMMENT ON FUNCTION public.get_schema_info() IS 'Returns a list of tables in the public schema with their column counts'; 