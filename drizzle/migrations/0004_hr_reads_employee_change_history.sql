create policy "hr reads employee history" on public.audit_logs for select to authenticated
  using (public.has_perm('hr.employees') and table_name in ('employees','reporting_relationships'));