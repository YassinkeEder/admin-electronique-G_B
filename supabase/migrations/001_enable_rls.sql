-- 001_enable_rls.sql
-- Enable Row Level Security and create policies for E‑GovProjetGB
-- Generated: 2026-05-20
-- IMPORTANT: Run this in Supabase SQL editor. Review and adapt to your
-- project before applying to production. Audit log inserts must be done
-- server-side with the Service Role key (no client INSERT policy is created).

-- Helper note: many policies use `auth.uid()` and a subselect to obtain
-- the current user's role: (SELECT role FROM public.profiles WHERE id = auth.uid())

-- ============================================================================
-- profiles
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- [profiles][admin][ALL]: Admins have full access to profiles for management
DROP POLICY IF EXISTS profiles_admin_all ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- [profiles][self][SELECT]: users can read their own profile
DROP POLICY IF EXISTS profiles_select_self ON public.profiles;
CREATE POLICY "profiles_select_self" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- [profiles][self][INSERT]: allow creating profile row only for the same auth uid
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
CREATE POLICY "profiles_insert_self" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- [profiles][self|admin][UPDATE]: users update own profile; admin can update anyone
DROP POLICY IF EXISTS profiles_update_self_or_admin ON public.profiles;
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- [profiles][admin][DELETE]: deletion of profiles restricted to admin
DROP POLICY IF EXISTS profiles_delete_admin ON public.profiles;
CREATE POLICY "profiles_delete_admin" ON public.profiles
  FOR DELETE
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');


-- ============================================================================
-- projects
-- ============================================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- [projects][public][SELECT]: public projects are readable by anyone
DROP POLICY IF EXISTS projects_public_select ON public.projects;
CREATE POLICY "projects_public_select" ON public.projects
  FOR SELECT
  USING (is_public = true);

-- [projects][admin|decideur][SELECT]: admins and decideurs can read all projects
DROP POLICY IF EXISTS projects_admin_decideur_select ON public.projects;
CREATE POLICY "projects_admin_decideur_select" ON public.projects
  FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','decideur'));

-- [projects][chef_projet][SELECT]: chef_projet can read projects they created
DROP POLICY IF EXISTS projects_chef_select_own ON public.projects;
CREATE POLICY "projects_chef_select_own" ON public.projects
  FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'chef_projet' AND created_by = auth.uid());

-- [projects][admin|chef_projet][INSERT]: admin can create; chef_projet may create with created_by = auth.uid()
DROP POLICY IF EXISTS projects_insert_admin_chef ON public.projects;
CREATE POLICY "projects_insert_admin_chef" ON public.projects
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'chef_projet'
      AND created_by = auth.uid()
    )
  );

-- [projects][admin|chef_projet][UPDATE]: admin any; chef_projet only their projects
DROP POLICY IF EXISTS projects_update_admin_chef ON public.projects;
CREATE POLICY "projects_update_admin_chef" ON public.projects
  FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'chef_projet'
      AND created_by = auth.uid()
    )
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'chef_projet'
      AND created_by = auth.uid()
    )
  );

-- [projects][admin|chef_projet][DELETE]: admin or owner may delete
DROP POLICY IF EXISTS projects_delete_admin_chef ON public.projects;
CREATE POLICY "projects_delete_admin_chef" ON public.projects
  FOR DELETE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'chef_projet'
      AND created_by = auth.uid()
    )
  );


-- ============================================================================
-- tasks
-- ============================================================================
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- [tasks][admin|decideur][SELECT]: admin & decideur can read all tasks
DROP POLICY IF EXISTS tasks_admin_decideur_select ON public.tasks;
CREATE POLICY "tasks_admin_decideur_select" ON public.tasks
  FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','decideur'));

-- [tasks][assignee][SELECT]: assigned user can read tasks assigned to them
DROP POLICY IF EXISTS tasks_assigned_select ON public.tasks;
CREATE POLICY "tasks_assigned_select" ON public.tasks
  FOR SELECT
  USING (assigned_to = auth.uid());

-- [tasks][chef_projet][SELECT]: chef_projet can read tasks for their projects
DROP POLICY IF EXISTS tasks_chef_project_select ON public.tasks;
CREATE POLICY "tasks_chef_project_select" ON public.tasks
  FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'chef_projet'
    AND (SELECT created_by FROM public.projects WHERE id = project_id) = auth.uid()
  );

-- [tasks][admin|chef_projet|creator][INSERT]: admin or chef_projet for the project; creator = auth
DROP POLICY IF EXISTS tasks_insert_admin_chef ON public.tasks;
CREATE POLICY "tasks_insert_admin_chef" ON public.tasks
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'chef_projet'
      AND (SELECT created_by FROM public.projects WHERE id = project_id) = auth.uid()
    )
    OR created_by = auth.uid()
  );

-- [tasks][admin|assignee|chef_projet][UPDATE]: admin or assigned user or project owner
DROP POLICY IF EXISTS tasks_update_admin_chef_assignee ON public.tasks;
CREATE POLICY "tasks_update_admin_chef_assignee" ON public.tasks
  FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR assigned_to = auth.uid()
    OR (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'chef_projet'
      AND (SELECT created_by FROM public.projects WHERE id = project_id) = auth.uid()
    )
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR assigned_to = auth.uid()
    OR (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'chef_projet'
      AND (SELECT created_by FROM public.projects WHERE id = project_id) = auth.uid()
    )
  );

-- [tasks][admin|assignee|chef_projet][DELETE]: admin, assigned user or project owner
DROP POLICY IF EXISTS tasks_delete_admin_chef_assignee ON public.tasks;
CREATE POLICY "tasks_delete_admin_chef_assignee" ON public.tasks
  FOR DELETE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR assigned_to = auth.uid()
    OR (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'chef_projet'
      AND (SELECT created_by FROM public.projects WHERE id = project_id) = auth.uid()
    )
  );


-- ============================================================================
-- metrics
-- ============================================================================
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;

-- [metrics][admin|decideur][SELECT]: admin & decideur read all
DROP POLICY IF EXISTS metrics_admin_decideur_select ON public.metrics;
CREATE POLICY "metrics_admin_decideur_select" ON public.metrics
  FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','decideur'));

-- [metrics][chef_projet][SELECT]: chef_projet read metrics for their projects
DROP POLICY IF EXISTS metrics_chef_project_select ON public.metrics;
CREATE POLICY "metrics_chef_project_select" ON public.metrics
  FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'chef_projet'
    AND (SELECT created_by FROM public.projects WHERE id = project_id) = auth.uid()
  );

-- [metrics][admin|chef_projet][INSERT/UPDATE/DELETE]: admin or chef_projet for project
DROP POLICY IF EXISTS metrics_insert_admin_chef ON public.metrics;
CREATE POLICY "metrics_insert_admin_chef" ON public.metrics
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'chef_projet'
      AND (SELECT created_by FROM public.projects WHERE id = project_id) = auth.uid()
    )
  );

DROP POLICY IF EXISTS metrics_update_admin_chef ON public.metrics;
CREATE POLICY "metrics_update_admin_chef" ON public.metrics
  FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'chef_projet'
      AND (SELECT created_by FROM public.projects WHERE id = project_id) = auth.uid()
    )
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'chef_projet'
      AND (SELECT created_by FROM public.projects WHERE id = project_id) = auth.uid()
    )
  );

DROP POLICY IF EXISTS metrics_delete_admin_chef ON public.metrics;
CREATE POLICY "metrics_delete_admin_chef" ON public.metrics
  FOR DELETE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'chef_projet'
      AND (SELECT created_by FROM public.projects WHERE id = project_id) = auth.uid()
    )
  );


-- ============================================================================
-- comments
-- ============================================================================
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- [comments][admin|decideur][SELECT]: admin and decideur can read all comments
DROP POLICY IF EXISTS comments_admin_decideur_select ON public.comments;
CREATE POLICY "comments_admin_decideur_select" ON public.comments
  FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','decideur'));

-- [comments][author][SELECT]: authors can read their own comments
DROP POLICY IF EXISTS comments_author_select ON public.comments;
CREATE POLICY "comments_author_select" ON public.comments
  FOR SELECT
  USING (author_id = auth.uid());

-- [comments][chef_projet][SELECT]: chef_projet can read comments on their projects/tasks
DROP POLICY IF EXISTS comments_chef_project_select ON public.comments;
CREATE POLICY "comments_chef_project_select" ON public.comments
  FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'chef_projet'
    AND (
      (project_id IS NOT NULL AND (SELECT created_by FROM public.projects WHERE id = project_id) = auth.uid())
      OR (project_id IS NULL AND task_id IS NOT NULL AND (SELECT created_by FROM public.projects WHERE id = (SELECT project_id FROM public.tasks WHERE id = task_id)) = auth.uid())
    )
  );

-- [comments][insert|author|chef|admin]: author = auth OR admin OR chef_projet for their project
DROP POLICY IF EXISTS comments_insert ON public.comments;
CREATE POLICY "comments_insert" ON public.comments
  FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'chef_projet'
      AND (
        (project_id IS NOT NULL AND (SELECT created_by FROM public.projects WHERE id = project_id) = auth.uid())
        OR (project_id IS NULL AND task_id IS NOT NULL AND (SELECT created_by FROM public.projects WHERE id = (SELECT project_id FROM public.tasks WHERE id = task_id)) = auth.uid())
      )
    )
  );

-- [comments][update][author|admin|chef]: author or admin or chef_projet for project
DROP POLICY IF EXISTS comments_update ON public.comments;
CREATE POLICY "comments_update" ON public.comments
  FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR author_id = auth.uid()
    OR (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'chef_projet'
      AND (
        (project_id IS NOT NULL AND (SELECT created_by FROM public.projects WHERE id = project_id) = auth.uid())
        OR (project_id IS NULL AND task_id IS NOT NULL AND (SELECT created_by FROM public.projects WHERE id = (SELECT project_id FROM public.tasks WHERE id = task_id)) = auth.uid())
      )
    )
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR author_id = auth.uid()
    OR (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'chef_projet'
      AND (
        (project_id IS NOT NULL AND (SELECT created_by FROM public.projects WHERE id = project_id) = auth.uid())
        OR (project_id IS NULL AND task_id IS NOT NULL AND (SELECT created_by FROM public.projects WHERE id = (SELECT project_id FROM public.tasks WHERE id = task_id)) = auth.uid())
      )
    )
  );

-- [comments][delete][author|admin]: author or admin
DROP POLICY IF EXISTS comments_delete ON public.comments;
CREATE POLICY "comments_delete" ON public.comments
  FOR DELETE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR author_id = auth.uid()
  );


-- ============================================================================
-- notifications
-- ============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- [notifications][recipient|admin|decideur][SELECT]: recipient or admin/decideur
DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','decideur')
  );

-- [notifications][insert][recipient|admin]: allow creation when targeting recipient or admin
DROP POLICY IF EXISTS notifications_insert ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- [notifications][update][recipient|admin]: recipient or admin can update (mark read)
DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- [notifications][delete][recipient|admin]: recipient or admin
DROP POLICY IF EXISTS notifications_delete ON public.notifications;
CREATE POLICY "notifications_delete" ON public.notifications
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );


-- ============================================================================
-- audit_logs
-- ============================================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- [audit_logs][admin][SELECT]: only admin can read audit logs
DROP POLICY IF EXISTS audit_logs_admin_select ON public.audit_logs;
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs
  FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- NOTE: No INSERT policy created on purpose. Audit rows must be written server-side
-- using the Supabase Service Role key (which bypasses RLS). This prevents clients
-- from writing arbitrary audit entries.


-- ============================================================================
-- organizations
-- ============================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- [organizations][admin|decideur][SELECT]: admin and decideur read all
DROP POLICY IF EXISTS organizations_admin_decideur_select ON public.organizations;
CREATE POLICY "organizations_admin_decideur_select" ON public.organizations
  FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','decideur'));

-- [organizations][member][SELECT]: members can read their organization
DROP POLICY IF EXISTS organizations_member_select ON public.organizations;
CREATE POLICY "organizations_member_select" ON public.organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations uo
      WHERE uo.user_id = auth.uid() AND uo.organization_id = organizations.id
    )
  );

-- [organizations][admin][ALL]: writes restricted to admin
DROP POLICY IF EXISTS organizations_admin_write ON public.organizations;
CREATE POLICY "organizations_admin_write" ON public.organizations
  FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');


-- ============================================================================
-- user_organizations
-- ============================================================================
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

-- [user_organizations][admin][ALL]: admin manages mappings
DROP POLICY IF EXISTS user_organizations_admin_all ON public.user_organizations;
CREATE POLICY "user_organizations_admin_all" ON public.user_organizations
  FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- [user_organizations][user][SELECT]: users can read their own entries
DROP POLICY IF EXISTS user_organizations_select_self ON public.user_organizations;
CREATE POLICY "user_organizations_select_self" ON public.user_organizations
  FOR SELECT
  USING (user_id = auth.uid());


-- ============================================================================
-- permissions
-- ============================================================================
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- [permissions][admin][ALL]: admin manages permission metadata
DROP POLICY IF EXISTS permissions_admin_all ON public.permissions;
CREATE POLICY "permissions_admin_all" ON public.permissions
  FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- [permissions][decideur][SELECT]: decideur can read permission catalog
DROP POLICY IF EXISTS permissions_decideur_select ON public.permissions;
CREATE POLICY "permissions_decideur_select" ON public.permissions
  FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'decideur');


-- ============================================================================
-- role_permissions
-- ============================================================================
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- [role_permissions][admin][ALL]: admin manages mappings
DROP POLICY IF EXISTS role_permissions_admin_all ON public.role_permissions;
CREATE POLICY "role_permissions_admin_all" ON public.role_permissions
  FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- [role_permissions][decideur][SELECT]: decideur read-only
DROP POLICY IF EXISTS role_permissions_decideur_select ON public.role_permissions;
CREATE POLICY "role_permissions_decideur_select" ON public.role_permissions
  FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'decideur');

-- End of file
