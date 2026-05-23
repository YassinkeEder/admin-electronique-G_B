// prisma/seed.ts

import {
  PrismaClient,
  UserRole,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  KpiType,
  ProjectRegion,
  ProjectSector,
  NotificationType,
  PermissionAction,
  PermissionResource,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV !== 'production') {
    console.log("🌱 Seeding database...");
  }

  // ============================================================================
  // PROFILES
  // ============================================================================

  const admin = await prisma.profile.create({
    data: {
      id: crypto.randomUUID(),
      fullName: "Admin National",
      email: "admin@egov.gb",
      role: UserRole.admin,
      department: "Ministère du Numérique",
      phone: "+245900000001",
    },
  });

  const chefProjet = await prisma.profile.create({
    data: {
      id: crypto.randomUUID(),
      fullName: "Fatou Mendes",
      email: "fatou@egov.gb",
      role: UserRole.chef_projet,
      department: "Infrastructure",
      phone: "+245900000002",
    },
  });

  const decideur = await prisma.profile.create({
    data: {
      id: crypto.randomUUID(),
      fullName: "Carlos Djalo",
      email: "carlos@egov.gb",
      role: UserRole.decideur,
      department: "Planification",
      phone: "+245900000003",
    },
  });

  const publicUser = await prisma.profile.create({
    data: {
      id: crypto.randomUUID(),
      fullName: "Public User",
      email: "public@egov.gb",
      role: UserRole.public,
    },
  });

  // ============================================================================
  // ORGANIZATIONS
  // ============================================================================

  const org1 = await prisma.organization.create({
    data: {
      name: "Ministère de la Santé",
      slug: "ministere-sante",
      description: "Gestion des projets de santé publique",
      region: ProjectRegion.Bissau,
    },
  });

  const org2 = await prisma.organization.create({
    data: {
      name: "Ministère de l’Éducation",
      slug: "ministere-education",
      description: "Transformation numérique éducative",
      region: ProjectRegion.Gabu,
    },
  });

  // ============================================================================
  // USER ORGANIZATIONS
  // ============================================================================

  await prisma.userOrganization.createMany({
    data: [
      {
        userId: admin.id,
        organizationId: org1.id,
        role: "super_admin",
        isAdmin: true,
      },
      {
        userId: chefProjet.id,
        organizationId: org1.id,
        role: "project_manager",
        isAdmin: true,
      },
      {
        userId: decideur.id,
        organizationId: org2.id,
        role: "director",
        isAdmin: false,
      },
    ],
  });

  // ============================================================================
  // PROJECTS
  // ============================================================================

  const project1 = await prisma.project.create({
    data: {
      name: "Plateforme Nationale e-Santé",
      description:
        "Digitalisation des services médicaux et dossiers patients.",
      budgetXof: BigInt(250000000),
      spentXof: BigInt(120000000),
      startDate: new Date("2025-01-01"),
      endDate: new Date("2026-12-31"),
      status: ProjectStatus.IN_PROGRESS,
      region: ProjectRegion.Bissau,
      sector: ProjectSector.Health,
      progress: 55,
      beneficiaries: 50000,
      createdBy: admin.id,
      updatedBy: chefProjet.id,
      organizationId: org1.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: "Smart Education GB",
      description:
        "Modernisation numérique des écoles publiques de Guinée-Bissau.",
      budgetXof: BigInt(180000000),
      spentXof: BigInt(70000000),
      startDate: new Date("2025-03-01"),
      endDate: new Date("2027-06-30"),
      status: ProjectStatus.PLANNED,
      region: ProjectRegion.Gabu,
      sector: ProjectSector.Education,
      progress: 20,
      beneficiaries: 30000,
      createdBy: admin.id,
      updatedBy: decideur.id,
      organizationId: org2.id,
    },
  });

  // ============================================================================
  // TASKS
  // ============================================================================

  const task1 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: "Développement API Santé",
      description: "Créer les endpoints sécurisés pour les patients.",
      progress: 70,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      startDate: new Date("2025-01-10"),
      dueDate: new Date("2025-07-01"),
      assignedTo: chefProjet.id,
      createdBy: admin.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: "Dashboard Analytics",
      description: "Créer les KPI et graphiques temps réel.",
      progress: 40,
      status: TaskStatus.REVIEW,
      priority: TaskPriority.MEDIUM,
      startDate: new Date("2025-02-01"),
      dueDate: new Date("2025-08-15"),
      assignedTo: decideur.id,
      createdBy: chefProjet.id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      projectId: project2.id,
      title: "Audit des écoles",
      description: "Collecte des données des établissements scolaires.",
      progress: 15,
      status: TaskStatus.TODO,
      priority: TaskPriority.CRITICAL,
      startDate: new Date("2025-04-01"),
      dueDate: new Date("2025-09-01"),
      assignedTo: decideur.id,
      createdBy: admin.id,
    },
  });

  // ============================================================================
  // METRICS
  // ============================================================================

  await prisma.metric.createMany({
    data: [
      {
        projectId: project1.id,
        kpiType: KpiType.completion_rate,
        value: 55,
        unit: "%",
        targetValue: 100,
        periodLabel: "Q1 2026",
        recordedAt: new Date(),
      },
      {
        projectId: project1.id,
        kpiType: KpiType.roi,
        value: 2.4,
        unit: "ratio",
        targetValue: 3,
        periodLabel: "Q1 2026",
        recordedAt: new Date(),
      },
      {
        projectId: project2.id,
        kpiType: KpiType.delay_index,
        value: 1.1,
        unit: "index",
        targetValue: 1,
        periodLabel: "Q1 2026",
        recordedAt: new Date(),
      },
    ],
  });

  // ============================================================================
  // COMMENTS
  // ============================================================================

  const comment1 = await prisma.comment.create({
    data: {
      content:
        "Le projet avance correctement mais nécessite plus de développeurs.",
      authorId: admin.id,
      projectId: project1.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: "Nous devons renforcer la sécurité des APIs.",
      authorId: chefProjet.id,
      taskId: task1.id,
      parentId: comment1.id,
    },
  });

  // ============================================================================
  // AUDIT LOGS
  // ============================================================================

  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: "CREATE_PROJECT",
        tableName: "projects",
        recordId: project1.id,
        actionType: "CREATE",
        resourceType: "PROJECT",
        changes: {
          project: "Plateforme Nationale e-Santé",
        },
      },
      {
        userId: chefProjet.id,
        action: "UPDATE_TASK",
        tableName: "tasks",
        recordId: task1.id,
        actionType: "UPDATE",
        resourceType: "TASK",
        changes: {
          progress: 70,
        },
      },
    ],
  });

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================

  await prisma.notification.createMany({
    data: [
      {
        userId: chefProjet.id,
        type: NotificationType.task_overdue,
        title: "Tâche en retard",
        message: "La tâche API Santé approche de sa deadline.",
        relatedResource: "task",
        relatedId: task1.id,
      },
      {
        userId: decideur.id,
        type: NotificationType.project_delay,
        title: "Projet à surveiller",
        message: "Le projet Smart Education GB présente un retard.",
        relatedResource: "project",
        relatedId: project2.id,
      },
    ],
  });

  // ============================================================================
  // PERMISSIONS
  // ============================================================================

  const permissions = [];

  for (const resource of Object.values(PermissionResource)) {
    for (const action of Object.values(PermissionAction)) {
      permissions.push({
        name: `${resource}_${action}`,
        description: `${action} access on ${resource}`,
        resource,
        action,
      });
    }
  }

  await prisma.permission.createMany({
    data: permissions,
    skipDuplicates: true,
  });

  // ============================================================================
  // ROLE PERMISSIONS
  // ============================================================================

  const allPermissions = await prisma.permission.findMany();

  for (const permission of allPermissions) {
    await prisma.rolePermission.create({
      data: {
        role: UserRole.admin,
        permissionId: permission.id,
      },
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log("✅ Database seeded successfully!");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });