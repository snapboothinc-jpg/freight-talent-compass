-- Phase 5, stage 4: demo data (clearly labeled, removable with public.remove_demo_data()).
do $$
begin
  insert into public.courses(id,code,title,description,category,objectives,owner_id,duration_minutes,difficulty,status,completion_rule,is_demo) values
    ('00000000-0000-4000-c100-000000000001','RPF-101','Route Planning Fundamentals','Plan efficient, compliant multi-stop routes.','Freight Operations','Build routes balancing cost, time windows and capacity.','00000000-0000-4000-d000-000000000008',240,'intermediate','approved','all_lessons_and_quiz',true),
    ('00000000-0000-4000-c100-000000000002','LSR-201','Load Securing & DG Safety Refresher','Refresher on load securing and dangerous goods rules.','Safety & Compliance','Apply load securing and DG rules without prompting.','00000000-0000-4000-d000-000000000008',180,'beginner','approved','all_lessons',true),
    ('00000000-0000-4000-c100-000000000003','CDM-301','Customs Documentation Masterclass','Accurate export and customs documentation.','Freight Operations','Prepare standard export documents without errors.','00000000-0000-4000-d000-000000000008',300,'advanced','pending_review','all_lessons',true);
  insert into public.course_sections(id,course_id,title,description,sort_order) values
    ('00000000-0000-4000-c200-000000000001','00000000-0000-4000-c100-000000000001','Route basics','Cost, time windows, capacity',0),
    ('00000000-0000-4000-c200-000000000002','00000000-0000-4000-c100-000000000001','Multi-stop planning','Sequencing and constraints',1),
    ('00000000-0000-4000-c200-000000000003','00000000-0000-4000-c100-000000000002','Load securing','Straps, blocking, inspections',0);
  insert into public.lessons(id,section_id,title,content,duration_minutes,sort_order) values
    ('00000000-0000-4000-c300-000000000001','00000000-0000-4000-c200-000000000001','Reading the route brief','Understand delivery windows, vehicle capacity and cost drivers before planning.',30,0),
    ('00000000-0000-4000-c300-000000000002','00000000-0000-4000-c200-000000000001','Compliance constraints','Driving-hour rules and restricted zones that shape every route.',45,1),
    ('00000000-0000-4000-c300-000000000003','00000000-0000-4000-c200-000000000002','Sequencing stops','Order stops to meet windows with the fewest kilometres.',60,0),
    ('00000000-0000-4000-c300-000000000004','00000000-0000-4000-c200-000000000003','Pre-trip load inspection','The 7-point load securing check every coordinator must verify.',40,0);
  insert into public.course_competency_mappings(course_id,competency_id,target_level) values
    ('00000000-0000-4000-c100-000000000001','00000000-0000-4000-f000-000000000002',3),
    ('00000000-0000-4000-c100-000000000002','00000000-0000-4000-f000-000000000001',3),
    ('00000000-0000-4000-c100-000000000003','00000000-0000-4000-f000-000000000003',4);
  insert into public.quizzes(id,course_id,title,pass_score,max_attempts) values
    ('00000000-0000-4000-c400-000000000001','00000000-0000-4000-c100-000000000001','Route planning check',70,3);
  insert into public.quiz_questions(id,quiz_id,question,options,correct_index,sort_order) values
    ('00000000-0000-4000-c500-000000000001','00000000-0000-4000-c400-000000000001','What comes first when planning a multi-stop route?','["Assign vehicles","Read the delivery windows and constraints","Book carriers","Print manifests"]',1,0),
    ('00000000-0000-4000-c500-000000000002','00000000-0000-4000-c400-000000000001','Which rule can change a route plan late in the day?','["Office seating plan","Driving-hour limits","Canteen menu","Parking layout"]',1,1);
  insert into public.learning_paths(id,title,description,competency_id,status,is_demo) values
    ('00000000-0000-4000-c600-000000000001','Logistics Coordinator Foundations','Core operations learning for new coordinators.','00000000-0000-4000-f000-000000000002','active',true);
  insert into public.learning_path_courses(path_id,course_id,sort_order) values
    ('00000000-0000-4000-c600-000000000001','00000000-0000-4000-c100-000000000001',0),
    ('00000000-0000-4000-c600-000000000001','00000000-0000-4000-c100-000000000002',1);
  insert into public.course_enrollments(id,course_id,employee_id,source,status,assigned_by,is_demo) values
    ('00000000-0000-4000-c700-000000000001','00000000-0000-4000-c100-000000000001','00000000-0000-4000-d000-000000000003','development_plan','in_progress','00000000-0000-4000-a000-000000000007',true),
    ('00000000-0000-4000-c700-000000000002','00000000-0000-4000-c100-000000000002','00000000-0000-4000-d000-000000000004','direct','assigned','00000000-0000-4000-a000-000000000007',true);
  insert into public.lesson_progress(enrollment_id,lesson_id,completed_at) values
    ('00000000-0000-4000-c700-000000000001','00000000-0000-4000-c300-000000000001',now());
  insert into public.development_plans(id,employee_id,title,objectives,responsible_id,target_date,status,is_demo) values
    ('00000000-0000-4000-c800-000000000001','00000000-0000-4000-d000-000000000003','Ana Cruz development plan','Close the route planning gap and prepare for customs documentation.','00000000-0000-4000-d000-000000000002','2026-12-31','active',true),
    ('00000000-0000-4000-c800-000000000002','00000000-0000-4000-d000-000000000004','Paolo Garcia development plan','Address the mandatory safety gap.','00000000-0000-4000-d000-000000000002','2026-11-30','active',true);
  insert into public.development_plan_items(id,plan_id,item_type,title,description,competency_id,course_id,priority,target_date,status,is_demo) values
    ('00000000-0000-4000-c900-000000000001','00000000-0000-4000-c800-000000000001','course','Complete Route Planning Fundamentals','Close the route planning gap (required 3, current 2).','00000000-0000-4000-f000-000000000002','00000000-0000-4000-c100-000000000001','high','2026-11-30','in_progress',true),
    ('00000000-0000-4000-c900-000000000002','00000000-0000-4000-c800-000000000002','course','Complete Load Securing refresher','Mandatory safety-critical gap.','00000000-0000-4000-f000-000000000001','00000000-0000-4000-c100-000000000002','high','2026-10-31','pending',true);
  insert into public.trainers(id,name,email,specialty,is_external,is_demo) values
    ('00000000-0000-4000-ca00-000000000001','Carlo Bautista','ops@nextgen.demo','Learning & development',false,true),
    ('00000000-0000-4000-ca00-000000000002','SafeHaul Training Partners','bookings@safehaul.example','Dangerous goods and load securing',true,true);
  insert into public.training_sessions(id,code,title,type,starts_at,ends_at,venue,delivery_method,trainer_id,capacity,status,related_competency_id,is_demo) values
    ('00000000-0000-4000-cb00-000000000001','DG-2026-11','Dangerous Goods Awareness Drill','drill','2026-11-12 09:00+00','2026-11-12 16:00+00','Depot 2 training room','in_person','00000000-0000-4000-ca00-000000000002',12,'planned','00000000-0000-4000-f000-000000000001',true),
    ('00000000-0000-4000-cb00-000000000002','RP-2026-09','Route Planning Workshop','workshop','2026-09-08 09:00+00','2026-09-08 17:00+00','Head office','in_person','00000000-0000-4000-ca00-000000000001',10,'completed','00000000-0000-4000-f000-000000000002',true);
  insert into public.training_participants(session_id,employee_id,status,is_demo) values
    ('00000000-0000-4000-cb00-000000000001','00000000-0000-4000-d000-000000000003','registered',true),
    ('00000000-0000-4000-cb00-000000000001','00000000-0000-4000-d000-000000000004','registered',true),
    ('00000000-0000-4000-cb00-000000000002','00000000-0000-4000-d000-000000000003','attended',true);
  insert into public.training_attendance(session_id,employee_id,status,remarks,recorded_by,is_demo) values
    ('00000000-0000-4000-cb00-000000000002','00000000-0000-4000-d000-000000000003','present',null,'00000000-0000-4000-a000-000000000007',true);
  insert into public.training_results(session_id,employee_id,score,outcome,feedback,recorded_by,is_demo) values
    ('00000000-0000-4000-cb00-000000000002','00000000-0000-4000-d000-000000000003',82,'passed','Good progress; route sequencing improved.','00000000-0000-4000-a000-000000000007',true);
  insert into public.ai_recommendations(id,employee_id,competency_id,required_level,current_level,gap,recommendation_type,resource_id,
    rationale,expected_outcome,priority,status,model,generated_by,sources,is_demo) values
    ('00000000-0000-4000-cc00-000000000001','00000000-0000-4000-d000-000000000003','00000000-0000-4000-f000-000000000002',3,2,1,'course',
    '00000000-0000-4000-c100-000000000001','Route Planning Fundamentals directly targets the level 3 requirement for Route Planning & Optimization.',
    'Employee plans multi-stop routes that meet delivery windows without correction.','high','pending_review','seeded-demo','00000000-0000-4000-a000-000000000003','["competency_gaps","course_competency_mappings"]',true);
end $$;