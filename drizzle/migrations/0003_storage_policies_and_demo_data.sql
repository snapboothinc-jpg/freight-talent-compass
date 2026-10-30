
-- ===== storage: private evidence bucket, own-folder uploads only; reads via server-signed URLs =====
create policy "evidence upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id='evidence' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "evidence read own uploads" on storage.objects for select to authenticated
  using (bucket_id='evidence' and (storage.foldername(name))[1] = auth.uid()::text);

-- ===== DEMO DATA (clearly labeled, removable with public.remove_demo_data()) =====
do $$
declare
  pw text := extensions.crypt('NextGen-Demo-2026!', extensions.gen_salt('bf'));
  u record;
begin
  for u in select * from (values
    ('00000000-0000-4000-a000-000000000001'::uuid,'superadmin@nextgen.demo','Victor Tan','super_admin'::public.app_role),
    ('00000000-0000-4000-a000-000000000002'::uuid,'admin@nextgen.demo','Nina Ramos','admin'),
    ('00000000-0000-4000-a000-000000000003'::uuid,'hr@nextgen.demo','Liza Mendoza','hr_admin'),
    ('00000000-0000-4000-a000-000000000004'::uuid,'depthead@nextgen.demo','Maria Santos','dept_head'),
    ('00000000-0000-4000-a000-000000000005'::uuid,'supervisor@nextgen.demo','Jose Reyes','supervisor'),
    ('00000000-0000-4000-a000-000000000006'::uuid,'employee@nextgen.demo','Ana Cruz','employee'),
    ('00000000-0000-4000-a000-000000000007'::uuid,'ops@nextgen.demo','Carlo Bautista','ops_manager')) as t(id,email,name,role)
  loop
    insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
    values ('00000000-0000-0000-0000-000000000000',u.id,'authenticated','authenticated',u.email,pw,now(),'{"provider":"email","providers":["email"]}',jsonb_build_object('full_name',u.name),now(),now(),'','','','');
    insert into auth.identities(id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    values (gen_random_uuid(),u.id,u.id::text,jsonb_build_object('sub',u.id::text,'email',u.email,'email_verified',true),'email',now(),now(),now());
    update public.profiles set is_demo=true, full_name=u.name where id=u.id;
    insert into public.user_roles(user_id,role) values (u.id,u.role);
  end loop;

  insert into public.departments(id,code,name,is_demo) values
    ('00000000-0000-4000-b000-000000000001','OPS','Freight Operations',true),
    ('00000000-0000-4000-b000-000000000002','HR','Human Resources',true),
    ('00000000-0000-4000-b000-000000000003','WH','Warehousing',true);
  insert into public.positions(id,code,title,department_id,description,is_demo) values
    ('00000000-0000-4000-c000-000000000001','OPH','Operations Head','00000000-0000-4000-b000-000000000001','Leads freight operations',true),
    ('00000000-0000-4000-c000-000000000002','DSP','Dispatch Supervisor','00000000-0000-4000-b000-000000000001','Supervises dispatch and coordinators',true),
    ('00000000-0000-4000-c000-000000000003','LC','Logistics Coordinator','00000000-0000-4000-b000-000000000001','Coordinates shipments, documents and carriers',true),
    ('00000000-0000-4000-c000-000000000004','HRO','HR Officer','00000000-0000-4000-b000-000000000002','HR operations',true),
    ('00000000-0000-4000-c000-000000000005','LDO','Learning & Development Officer','00000000-0000-4000-b000-000000000002','Runs learning and training',true),
    ('00000000-0000-4000-c000-000000000006','SYS','Systems Administrator','00000000-0000-4000-b000-000000000002','Administers platforms',true),
    ('00000000-0000-4000-c000-000000000007','WHS','Warehouse Supervisor','00000000-0000-4000-b000-000000000003','Supervises warehouse shifts',true),
    ('00000000-0000-4000-c000-000000000008','WHA','Warehouse Associate','00000000-0000-4000-b000-000000000003','Picks, packs and stores goods',true);
  insert into public.employees(id,employee_code,first_name,last_name,email,department_id,position_id,hire_date,user_id,is_demo) values
    ('00000000-0000-4000-d000-000000000001','E001','Maria','Santos','depthead@nextgen.demo','00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000001','2015-03-02','00000000-0000-4000-a000-000000000004',true),
    ('00000000-0000-4000-d000-000000000002','E002','Jose','Reyes','supervisor@nextgen.demo','00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000002','2018-06-11','00000000-0000-4000-a000-000000000005',true),
    ('00000000-0000-4000-d000-000000000003','E003','Ana','Cruz','employee@nextgen.demo','00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000003','2022-01-17','00000000-0000-4000-a000-000000000006',true),
    ('00000000-0000-4000-d000-000000000004','E004','Paolo','Garcia',null,'00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000003','2023-09-04',null,true),
    ('00000000-0000-4000-d000-000000000005','E005','Liza','Mendoza','hr@nextgen.demo','00000000-0000-4000-b000-000000000002','00000000-0000-4000-c000-000000000004','2016-02-01','00000000-0000-4000-a000-000000000003',true),
    ('00000000-0000-4000-d000-000000000006','E006','Ramon','Dela Cruz',null,'00000000-0000-4000-b000-000000000003','00000000-0000-4000-c000-000000000007','2017-05-22',null,true),
    ('00000000-0000-4000-d000-000000000007','E007','Grace','Lim',null,'00000000-0000-4000-b000-000000000003','00000000-0000-4000-c000-000000000008','2024-02-12',null,true),
    ('00000000-0000-4000-d000-000000000008','E008','Carlo','Bautista','ops@nextgen.demo','00000000-0000-4000-b000-000000000002','00000000-0000-4000-c000-000000000005','2019-08-19','00000000-0000-4000-a000-000000000007',true),
    ('00000000-0000-4000-d000-000000000009','E009','Nina','Ramos','admin@nextgen.demo','00000000-0000-4000-b000-000000000002','00000000-0000-4000-c000-000000000006','2020-10-05','00000000-0000-4000-a000-000000000002',true),
    ('00000000-0000-4000-d000-000000000010','E010','Victor','Tan','superadmin@nextgen.demo','00000000-0000-4000-b000-000000000002','00000000-0000-4000-c000-000000000006','2014-01-06','00000000-0000-4000-a000-000000000001',true);
  update public.departments set head_employee_id='00000000-0000-4000-d000-000000000001' where id='00000000-0000-4000-b000-000000000001';
  update public.departments set head_employee_id='00000000-0000-4000-d000-000000000005' where id='00000000-0000-4000-b000-000000000002';
  update public.departments set head_employee_id='00000000-0000-4000-d000-000000000006' where id='00000000-0000-4000-b000-000000000003';
  insert into public.reporting_relationships(employee_id,supervisor_id,effective_from,is_demo) values
    ('00000000-0000-4000-d000-000000000002','00000000-0000-4000-d000-000000000001','2018-06-11',true),
    ('00000000-0000-4000-d000-000000000003','00000000-0000-4000-d000-000000000002','2022-01-17',true),
    ('00000000-0000-4000-d000-000000000004','00000000-0000-4000-d000-000000000002','2023-09-04',true),
    ('00000000-0000-4000-d000-000000000007','00000000-0000-4000-d000-000000000006','2024-02-12',true),
    ('00000000-0000-4000-d000-000000000008','00000000-0000-4000-d000-000000000005','2019-08-19',true);

  insert into public.competency_categories(id,name,description,is_demo) values
    ('00000000-0000-4000-e000-000000000001','Safety & Compliance','Road, cargo and workplace safety',true),
    ('00000000-0000-4000-e000-000000000002','Freight Operations','Planning, documentation and inventory',true),
    ('00000000-0000-4000-e000-000000000003','Leadership','Leading people and shifts',true),
    ('00000000-0000-4000-e000-000000000004','Customer','Customer communication and service',true);
  insert into public.competencies(id,code,name,description,definition,category_id,status,is_mandatory,is_safety_critical,is_demo) values
    ('00000000-0000-4000-f000-000000000001','SAF-01','Road & Cargo Safety Compliance','Applies safety rules to vehicles, loads and dangerous goods','Consistently follows and enforces load securing, dangerous goods and driving-hour rules.','00000000-0000-4000-e000-000000000001','active',true,true,true),
    ('00000000-0000-4000-f000-000000000002','OPS-01','Route Planning & Optimization','Plans efficient, compliant routes','Builds routes that balance cost, time windows and capacity.','00000000-0000-4000-e000-000000000002','active',false,false,true),
    ('00000000-0000-4000-f000-000000000003','OPS-02','Freight Documentation & Customs','Prepares accurate shipping and customs documents','Bills of lading, commercial invoices and customs declarations are complete and correct.','00000000-0000-4000-e000-000000000002','active',false,false,true),
    ('00000000-0000-4000-f000-000000000004','OPS-03','Inventory Control','Keeps stock records accurate','Cycle counts, put-away and stock reconciliation.','00000000-0000-4000-e000-000000000002','active',false,false,true),
    ('00000000-0000-4000-f000-000000000005','LDR-01','Team Leadership','Leads and develops a team','Sets direction, coaches and holds people accountable.','00000000-0000-4000-e000-000000000003','active',false,false,true),
    ('00000000-0000-4000-f000-000000000006','CUS-01','Customer Communication','Keeps customers informed','Proactive, clear updates on shipment status and exceptions.','00000000-0000-4000-e000-000000000004','active',false,false,true);
  insert into public.behavioral_indicators(competency_id,level,indicator) values
    ('00000000-0000-4000-f000-000000000001',1,'Knows the basic safety rules when reminded'),
    ('00000000-0000-4000-f000-000000000001',3,'Checks load securing and paperwork without prompting'),
    ('00000000-0000-4000-f000-000000000001',5,'Designs safety procedures and trains others'),
    ('00000000-0000-4000-f000-000000000002',3,'Plans multi-stop routes that meet delivery windows'),
    ('00000000-0000-4000-f000-000000000003',3,'Prepares standard export documents without errors');
  insert into public.position_competency_requirements(position_id,competency_id,required_level,is_mandatory,is_safety_critical,is_demo) values
    ('00000000-0000-4000-c000-000000000003','00000000-0000-4000-f000-000000000001',3,true,true,true),
    ('00000000-0000-4000-c000-000000000003','00000000-0000-4000-f000-000000000002',3,false,false,true),
    ('00000000-0000-4000-c000-000000000003','00000000-0000-4000-f000-000000000003',4,true,false,true),
    ('00000000-0000-4000-c000-000000000003','00000000-0000-4000-f000-000000000006',3,false,false,true),
    ('00000000-0000-4000-c000-000000000002','00000000-0000-4000-f000-000000000001',4,true,true,true),
    ('00000000-0000-4000-c000-000000000002','00000000-0000-4000-f000-000000000002',4,false,false,true),
    ('00000000-0000-4000-c000-000000000002','00000000-0000-4000-f000-000000000005',3,false,false,true),
    ('00000000-0000-4000-c000-000000000008','00000000-0000-4000-f000-000000000001',3,true,true,true),
    ('00000000-0000-4000-c000-000000000008','00000000-0000-4000-f000-000000000004',3,false,false,true);
  insert into public.competency_assessments(employee_id,competency_id,assessor_id,assessment_date,current_level,evidence_summary,status,reviewer_id,reviewed_at,is_demo) values
    ('00000000-0000-4000-d000-000000000003','00000000-0000-4000-f000-000000000001','00000000-0000-4000-a000-000000000005','2026-08-14',3,'Observed 6 load inspections; all compliant.','approved','00000000-0000-4000-a000-000000000003',now(),true),
    ('00000000-0000-4000-d000-000000000003','00000000-0000-4000-f000-000000000002','00000000-0000-4000-a000-000000000005','2026-08-14',2,'Route plans needed correction on 3 of 10 multi-stop jobs.','approved','00000000-0000-4000-a000-000000000003',now(),true),
    ('00000000-0000-4000-d000-000000000003','00000000-0000-4000-f000-000000000006','00000000-0000-4000-a000-000000000005','2026-08-14',4,'Customer feedback scores above target for two quarters.','approved','00000000-0000-4000-a000-000000000003',now(),true),
    ('00000000-0000-4000-d000-000000000004','00000000-0000-4000-f000-000000000001','00000000-0000-4000-a000-000000000005','2026-08-20',2,'Missed load-securing check on two occasions.','approved','00000000-0000-4000-a000-000000000003',now(),true);

  insert into public.evaluation_profiles(id,position_id,name,description,is_demo) values
    ('00000000-0000-4000-9000-000000000001','00000000-0000-4000-c000-000000000003','Logistics Coordinator Evaluation','Annual evaluation for logistics coordinators',true),
    ('00000000-0000-4000-9000-000000000002','00000000-0000-4000-c000-000000000002','Dispatch Supervisor Evaluation','Annual evaluation for dispatch supervisors',true);
  insert into public.evaluation_profile_versions(id,profile_id,position_id,version_number,status,effective_date,instructions,is_demo) values
    ('00000000-0000-4000-9100-000000000001','00000000-0000-4000-9000-000000000001','00000000-0000-4000-c000-000000000003',1,'draft','2026-01-01','Rate each item 1-5 against the proficiency framework. Attach evidence where marked.',true),
    ('00000000-0000-4000-9100-000000000002','00000000-0000-4000-9000-000000000002','00000000-0000-4000-c000-000000000002',1,'draft',null,'Draft profile - complete before activation.',true);
  insert into public.evaluation_sections(id,version_id,title,description,sort_order) values
    ('00000000-0000-4000-9200-000000000001','00000000-0000-4000-9100-000000000001','Key results','Measurable outcomes for the period',0),
    ('00000000-0000-4000-9200-000000000002','00000000-0000-4000-9100-000000000001','Behaviours & competencies','How the work was done',1),
    ('00000000-0000-4000-9200-000000000003','00000000-0000-4000-9100-000000000002','Team results',null,0);
  insert into public.evaluation_items(version_id,section_id,label,item_type,weight,kpi_target,kpi_unit,competency_id,evidence_required,is_required,sort_order) values
    ('00000000-0000-4000-9100-000000000001','00000000-0000-4000-9200-000000000001','On-time shipment rate','kpi',30,95,'%',null,true,true,0),
    ('00000000-0000-4000-9100-000000000001','00000000-0000-4000-9200-000000000001','Documentation accuracy','rating',25,null,null,'00000000-0000-4000-f000-000000000003',false,true,1),
    ('00000000-0000-4000-9100-000000000001','00000000-0000-4000-9200-000000000002','Safety compliance','rating',25,null,null,'00000000-0000-4000-f000-000000000001',false,true,0),
    ('00000000-0000-4000-9100-000000000001','00000000-0000-4000-9200-000000000002','Customer responsiveness','rating',20,null,null,'00000000-0000-4000-f000-000000000006',false,true,1),
    ('00000000-0000-4000-9100-000000000001','00000000-0000-4000-9200-000000000002','Key achievements this period','long_text',0,null,null,null,false,false,2),
    ('00000000-0000-4000-9100-000000000001','00000000-0000-4000-9200-000000000002','Completed mandatory safety refresher','yes_no',0,null,null,null,false,true,3),
    ('00000000-0000-4000-9100-000000000002','00000000-0000-4000-9200-000000000003','Team on-time dispatch rate','kpi',60,97,'%',null,false,true,0);
  update public.evaluation_profile_versions set status='active', activated_at=now() where id='00000000-0000-4000-9100-000000000001';

  insert into public.evaluation_cycles(id,name,description,period_start,period_end,due_date,self_evaluation,status,is_demo) values
    ('00000000-0000-4000-9300-000000000001','2026 Annual Review','Demo cycle','2026-01-01','2026-12-31','2026-12-15',true,'open',true);
  insert into public.evaluation_assignments(cycle_id,employee_id,evaluator_id,profile_version_id,snapshot,self_evaluation,is_demo)
  select '00000000-0000-4000-9300-000000000001', e, '00000000-0000-4000-d000-000000000002','00000000-0000-4000-9100-000000000001',
    public._build_snapshot('00000000-0000-4000-9100-000000000001'), true, true
  from unnest(array['00000000-0000-4000-d000-000000000003'::uuid,'00000000-0000-4000-d000-000000000004'::uuid]) e;
  perform public._snapshot_gaps('00000000-0000-4000-d000-000000000003');
  perform public._snapshot_gaps('00000000-0000-4000-d000-000000000004');
end $$;

create or replace function public.remove_demo_data() returns jsonb
language plpgsql security definer set search_path=public as $$
begin
  if not public.has_role(auth.uid(),'super_admin') then raise exception 'FORBIDDEN'; end if;
  if exists(select 1 from public.profiles where id=auth.uid() and is_demo) then raise exception 'RULE: sign in with a non-demo Super Admin to remove demo data'; end if;
  delete from public.approval_tasks where employee_id in (select id from public.employees where is_demo);
  delete from public.evaluation_reviews where assignment_id in (select id from public.evaluation_assignments where is_demo);
  delete from public.evaluation_evidence where assignment_id in (select id from public.evaluation_assignments where is_demo);
  delete from public.evaluation_responses where assignment_id in (select id from public.evaluation_assignments where is_demo);
  delete from public.evaluation_assignments where is_demo or employee_id in (select id from public.employees where is_demo);
  delete from public.evaluation_cycles where is_demo;
  delete from public.evaluation_profile_versions where is_demo;
  delete from public.evaluation_profiles where is_demo;
  delete from public.competency_gap_snapshots where employee_id in (select id from public.employees where is_demo);
  delete from public.competency_assessment_evidence where assessment_id in (select id from public.competency_assessments where employee_id in (select id from public.employees where is_demo));
  delete from public.competency_assessments where employee_id in (select id from public.employees where is_demo);
  delete from public.position_competency_requirements where is_demo;
  delete from public.competencies where is_demo;
  delete from public.competency_categories where is_demo;
  delete from public.file_metadata where employee_id in (select id from public.employees where is_demo);
  delete from public.reporting_relationships where is_demo;
  update public.departments set head_employee_id=null where is_demo;
  delete from public.employees where is_demo;
  delete from public.positions where is_demo;
  delete from public.departments where is_demo;
  delete from auth.users where id in (select id from public.profiles where is_demo);
  perform public.log_audit('remove_demo_data','system',null,'{}'::jsonb);
  return jsonb_build_object('ok',true);
end $$;
revoke execute on function public.remove_demo_data() from public, anon;
grant execute on function public.remove_demo_data() to authenticated;
