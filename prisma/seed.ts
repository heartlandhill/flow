import { PrismaClient, ProjectStatus, ProjectType } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data in correct order (respecting foreign keys)
  await prisma.taskTag.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.area.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.notificationSubscription.deleteMany();

  // Create User first (needed for all data)
  const passwordHash = await hash("flow-admin-2026", 12);
  const user = await prisma.user.create({
    data: {
      username: "admin",
      password_hash: passwordHash,
    },
  });
  console.log(`Created user: ${user.username}`);

  // Create Areas (10 life areas based on GTD principles)
  const areas = await Promise.all([
    prisma.area.create({ data: { name: "Home", color: "#E8A87C", sort_order: 0, user_id: user.id } }),
    prisma.area.create({ data: { name: "Work", color: "#5B8BD4", sort_order: 1, user_id: user.id } }),
    prisma.area.create({ data: { name: "School", color: "#9B7ED4", sort_order: 2, user_id: user.id } }),
    prisma.area.create({ data: { name: "Health", color: "#9ED4A0", sort_order: 3, user_id: user.id } }),
    prisma.area.create({ data: { name: "Family", color: "#D49BA5", sort_order: 4, user_id: user.id } }),
    prisma.area.create({ data: { name: "Friends", color: "#5BC4BF", sort_order: 5, user_id: user.id } }),
    prisma.area.create({ data: { name: "Service", color: "#D4B85B", sort_order: 6, user_id: user.id } }),
    prisma.area.create({ data: { name: "Finance", color: "#6B8BA3", sort_order: 7, user_id: user.id } }),
    prisma.area.create({ data: { name: "Spiritual", color: "#A085D4", sort_order: 8, user_id: user.id } }),
    prisma.area.create({ data: { name: "Recreation", color: "#D4855B", sort_order: 9, user_id: user.id } }),
  ]);

  const [homeArea, work, _school, health, _family, _friends, _service, _finance, spiritual, recreation] = areas;
  console.log(`Created ${areas.length} areas`);

  // Create Tags
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: "Computer", icon: "💻", sort_order: 0, user_id: user.id } }),
    prisma.tag.create({ data: { name: "Errands", icon: "🏃", sort_order: 1, user_id: user.id } }),
    prisma.tag.create({ data: { name: "Calls", icon: "📞", sort_order: 2, user_id: user.id } }),
    prisma.tag.create({ data: { name: "Home", icon: "🏠", sort_order: 3, user_id: user.id } }),
    prisma.tag.create({ data: { name: "Waiting For", icon: "⏳", sort_order: 4, user_id: user.id } }),
    prisma.tag.create({ data: { name: "Deep Focus", icon: "🎯", sort_order: 5, user_id: user.id } }),
  ]);

  const [computer, errands, calls, home, waitingFor, deepFocus] = tags;
  console.log(`Created ${tags.length} tags`);

  // Helper for dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const addDays = (days: number): Date => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return date;
  };

  // Create Projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: "GTD App Development",
        area_id: work.id,
        user_id: user.id,
        status: ProjectStatus.ACTIVE,
        type: ProjectType.SEQUENTIAL,
        review_interval_days: 7,
        next_review_date: today,
        sort_order: 0,
      },
    }),
    prisma.project.create({
      data: {
        name: "Q1 Marketing Plan",
        area_id: work.id,
        user_id: user.id,
        status: ProjectStatus.ACTIVE,
        type: ProjectType.PARALLEL,
        review_interval_days: 7,
        next_review_date: today,
        sort_order: 1,
      },
    }),
    prisma.project.create({
      data: {
        name: "Apartment Renovation",
        area_id: homeArea.id,
        user_id: user.id,
        status: ProjectStatus.ACTIVE,
        type: ProjectType.PARALLEL,
        review_interval_days: 7,
        next_review_date: today,
        sort_order: 0,
      },
    }),
    prisma.project.create({
      data: {
        name: "Learn Japanese",
        area_id: recreation.id,
        user_id: user.id,
        status: ProjectStatus.SOMEDAY,
        type: ProjectType.PARALLEL,
        sort_order: 1,
      },
    }),
    prisma.project.create({
      data: {
        name: "Marathon Training",
        area_id: health.id,
        user_id: user.id,
        status: ProjectStatus.ACTIVE,
        type: ProjectType.SEQUENTIAL,
        review_interval_days: 7,
        next_review_date: today,
        sort_order: 0,
      },
    }),
    prisma.project.create({
      data: {
        name: "Daily Devotional Habit",
        area_id: spiritual.id,
        user_id: user.id,
        status: ProjectStatus.SOMEDAY,
        type: ProjectType.PARALLEL,
        sort_order: 0,
      },
    }),
  ]);

  const [gtdApp, marketing, apartment, japanese, marathon, devotional] = projects;
  console.log(`Created ${projects.length} projects`);

  // Create Tasks
  // Inbox tasks (4)
  const inboxTasks = await Promise.all([
    prisma.task.create({
      data: {
        title: "Research best practices for database indexing",
        inbox: true,
        user_id: user.id,
        sort_order: 0,
        tags: { create: [{ tag_id: computer.id }] },
      },
    }),
    prisma.task.create({
      data: {
        title: "Buy new running shoes",
        inbox: true,
        user_id: user.id,
        sort_order: 1,
        tags: { create: [{ tag_id: errands.id }] },
      },
    }),
    prisma.task.create({
      data: {
        title: "Call dentist to schedule cleaning",
        inbox: true,
        user_id: user.id,
        sort_order: 2,
        tags: { create: [{ tag_id: calls.id }] },
      },
    }),
    prisma.task.create({
      data: {
        title: "Read article on GTD weekly reviews",
        inbox: true,
        user_id: user.id,
        sort_order: 3,
      },
    }),
  ]);

  // GTD App Development tasks (3 + 1 completed)
  const gtdTasks = await Promise.all([
    prisma.task.create({
      data: {
        title: "Define database schema for tasks and projects",
        inbox: false,
        user_id: user.id,
        project_id: gtdApp.id,
        due_date: today,
        sort_order: 0,
        tags: { create: [{ tag_id: computer.id }, { tag_id: deepFocus.id }] },
      },
    }),
    prisma.task.create({
      data: {
        title: "Design the inbox view wireframe",
        inbox: false,
        user_id: user.id,
        project_id: gtdApp.id,
        due_date: addDays(1),
        sort_order: 1,
      },
    }),
    prisma.task.create({
      data: {
        title: "Set up CI/CD pipeline",
        inbox: false,
        user_id: user.id,
        project_id: gtdApp.id,
        due_date: addDays(3),
        sort_order: 2,
        tags: { create: [{ tag_id: computer.id }] },
      },
    }),
    prisma.task.create({
      data: {
        title: "Set up project repository",
        inbox: false,
        user_id: user.id,
        project_id: gtdApp.id,
        completed: true,
        completed_at: new Date(),
        sort_order: 3,
      },
    }),
  ]);

  // Q1 Marketing Plan tasks (3)
  const marketingTasks = await Promise.all([
    prisma.task.create({
      data: {
        title: "Draft social media calendar",
        inbox: false,
        user_id: user.id,
        project_id: marketing.id,
        due_date: addDays(2),
        sort_order: 0,
        tags: { create: [{ tag_id: computer.id }] },
      },
    }),
    prisma.task.create({
      data: {
        title: "Review competitor analysis",
        inbox: false,
        user_id: user.id,
        project_id: marketing.id,
        sort_order: 1,
        tags: { create: [{ tag_id: deepFocus.id }] },
      },
    }),
    prisma.task.create({
      data: {
        title: "Schedule team brainstorm",
        inbox: false,
        user_id: user.id,
        project_id: marketing.id,
        due_date: addDays(5),
        sort_order: 2,
        tags: { create: [{ tag_id: calls.id }] },
      },
    }),
  ]);

  // Apartment Renovation tasks (3)
  const apartmentTasks = await Promise.all([
    prisma.task.create({
      data: {
        title: "Get quotes from contractors",
        inbox: false,
        user_id: user.id,
        project_id: apartment.id,
        sort_order: 0,
        tags: { create: [{ tag_id: calls.id }, { tag_id: errands.id }] },
      },
    }),
    prisma.task.create({
      data: {
        title: "Pick paint colors for bedroom",
        inbox: false,
        user_id: user.id,
        project_id: apartment.id,
        due_date: addDays(4),
        sort_order: 1,
        tags: { create: [{ tag_id: home.id }] },
      },
    }),
    prisma.task.create({
      data: {
        title: "Order kitchen cabinet hardware",
        inbox: false,
        user_id: user.id,
        project_id: apartment.id,
        sort_order: 2,
        tags: { create: [{ tag_id: computer.id }, { tag_id: errands.id }] },
      },
    }),
  ]);

  // Marathon Training tasks (3 + 1 completed)
  const marathonTasks = await Promise.all([
    prisma.task.create({
      data: {
        title: "Complete 10K training run",
        inbox: false,
        user_id: user.id,
        project_id: marathon.id,
        due_date: today,
        sort_order: 0,
      },
    }),
    prisma.task.create({
      data: {
        title: "Book sports massage appointment",
        inbox: false,
        user_id: user.id,
        project_id: marathon.id,
        due_date: addDays(6),
        sort_order: 1,
        tags: { create: [{ tag_id: calls.id }] },
      },
    }),
    prisma.task.create({
      data: {
        title: "Research nutrition plans",
        inbox: false,
        user_id: user.id,
        project_id: marathon.id,
        sort_order: 2,
        tags: { create: [{ tag_id: computer.id }] },
      },
    }),
    prisma.task.create({
      data: {
        title: "5K baseline run",
        inbox: false,
        user_id: user.id,
        project_id: marathon.id,
        completed: true,
        completed_at: new Date(),
        sort_order: 3,
      },
    }),
  ]);

  const totalTasks = inboxTasks.length + gtdTasks.length + marketingTasks.length +
                     apartmentTasks.length + marathonTasks.length;
  console.log(`Created ${totalTasks} tasks`);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
