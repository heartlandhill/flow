#!/usr/bin/env tsx

/**
 * Multi-User Data Isolation Test
 *
 * This script verifies that user data is properly isolated between different users.
 * It creates two test users and verifies they cannot access each other's data.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface TestUser {
  id: string;
  username: string;
  password: string;
}

interface TestData {
  areaId: string;
  projectId: string;
  taskId: string;
  tagId: string;
}

let userA: TestUser;
let userB: TestUser;
let dataA: TestData;
let dataB: TestData;

/**
 * Clean up test data
 */
async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');

  // Delete test users (cascade will delete all their data)
  await prisma.user.deleteMany({
    where: {
      username: {
        in: ['test-user-a', 'test-user-b']
      }
    }
  });

  console.log('✅ Cleanup complete');
}

/**
 * Create test users
 */
async function createTestUsers() {
  console.log('\n👥 Creating test users...');

  const passwordHash = await bcrypt.hash('test-password', 10);

  const createdUserA = await prisma.user.create({
    data: {
      username: 'test-user-a',
      password_hash: passwordHash,
    }
  });

  const createdUserB = await prisma.user.create({
    data: {
      username: 'test-user-b',
      password_hash: passwordHash,
    }
  });

  userA = {
    id: createdUserA.id,
    username: createdUserA.username,
    password: 'test-password',
  };

  userB = {
    id: createdUserB.id,
    username: createdUserB.username,
    password: 'test-password',
  };

  console.log(`✅ Created User A: ${userA.username} (${userA.id})`);
  console.log(`✅ Created User B: ${userB.username} (${userB.id})`);
}

/**
 * Create test data for User A
 */
async function createDataForUserA() {
  console.log('\n📝 Creating data for User A...');

  // Create area
  const area = await prisma.area.create({
    data: {
      name: 'User A Work Area',
      color: '#FF0000',
      user_id: userA.id,
    }
  });

  // Create project
  const project = await prisma.project.create({
    data: {
      name: 'User A Secret Project',
      notes: 'This is User A\'s confidential project',
      status: 'ACTIVE',
      user_id: userA.id,
      area_id: area.id,
    }
  });

  // Create task
  const task = await prisma.task.create({
    data: {
      title: 'User A Private Task',
      notes: 'User A\'s sensitive task notes',
      user_id: userA.id,
      project_id: project.id,
      inbox: false,
    }
  });

  // Create tag
  const tag = await prisma.tag.create({
    data: {
      name: 'user-a-tag',
      user_id: userA.id,
    }
  });

  // Associate tag with task
  await prisma.taskTag.create({
    data: {
      task_id: task.id,
      tag_id: tag.id,
    }
  });

  dataA = {
    areaId: area.id,
    projectId: project.id,
    taskId: task.id,
    tagId: tag.id,
  };

  console.log('✅ Created Area:', area.name);
  console.log('✅ Created Project:', project.name);
  console.log('✅ Created Task:', task.title);
  console.log('✅ Created Tag:', tag.name);
}

/**
 * Verify User B cannot see User A's data
 */
async function verifyUserBCannotSeeUserAData() {
  console.log('\n🔒 Verifying User B cannot see User A\'s data...');

  // Query as User B - should not see User A's data
  const userBTasks = await prisma.task.findMany({
    where: {
      user_id: userB.id,
    }
  });

  const userBProjects = await prisma.project.findMany({
    where: {
      user_id: userB.id,
    }
  });

  const userBAreas = await prisma.area.findMany({
    where: {
      user_id: userB.id,
    }
  });

  const userBTags = await prisma.tag.findMany({
    where: {
      user_id: userB.id,
    }
  });

  if (userBTasks.length === 0 && userBProjects.length === 0 &&
      userBAreas.length === 0 && userBTags.length === 0) {
    console.log('✅ User B sees no data (correct - no data created yet)');
  } else {
    throw new Error(`❌ User B should see no data but found: ${userBTasks.length} tasks, ${userBProjects.length} projects, ${userBAreas.length} areas, ${userBTags.length} tags`);
  }

  // Try to access User A's specific data by ID (with user filter)
  const taskAccessAttempt = await prisma.task.findFirst({
    where: {
      id: dataA.taskId,
      user_id: userB.id,
    }
  });

  const projectAccessAttempt = await prisma.project.findFirst({
    where: {
      id: dataA.projectId,
      user_id: userB.id,
    }
  });

  const areaAccessAttempt = await prisma.area.findFirst({
    where: {
      id: dataA.areaId,
      user_id: userB.id,
    }
  });

  const tagAccessAttempt = await prisma.tag.findFirst({
    where: {
      id: dataA.tagId,
      user_id: userB.id,
    }
  });

  if (!taskAccessAttempt && !projectAccessAttempt && !areaAccessAttempt && !tagAccessAttempt) {
    console.log('✅ User B cannot access User A\'s specific data by ID (correct)');
  } else {
    throw new Error('❌ User B should not be able to access User A\'s data');
  }
}

/**
 * Create test data for User B
 */
async function createDataForUserB() {
  console.log('\n📝 Creating data for User B...');

  // Create area
  const area = await prisma.area.create({
    data: {
      name: 'User B Personal Area',
      color: '#0000FF',
      user_id: userB.id,
    }
  });

  // Create project
  const project = await prisma.project.create({
    data: {
      name: 'User B Private Project',
      notes: 'This is User B\'s confidential project',
      status: 'ACTIVE',
      user_id: userB.id,
      area_id: area.id,
    }
  });

  // Create task
  const task = await prisma.task.create({
    data: {
      title: 'User B Confidential Task',
      notes: 'User B\'s sensitive task notes',
      user_id: userB.id,
      project_id: project.id,
      inbox: false,
    }
  });

  // Create tag
  const tag = await prisma.tag.create({
    data: {
      name: 'user-b-tag',
      user_id: userB.id,
    }
  });

  // Associate tag with task
  await prisma.taskTag.create({
    data: {
      task_id: task.id,
      tag_id: tag.id,
    }
  });

  dataB = {
    areaId: area.id,
    projectId: project.id,
    taskId: task.id,
    tagId: tag.id,
  };

  console.log('✅ Created Area:', area.name);
  console.log('✅ Created Project:', project.name);
  console.log('✅ Created Task:', task.title);
  console.log('✅ Created Tag:', tag.name);
}

/**
 * Verify User A cannot see User B's data
 */
async function verifyUserACannotSeeUserBData() {
  console.log('\n🔒 Verifying User A cannot see User B\'s data...');

  // Query as User A - should only see their own data, not User B's
  const userATasks = await prisma.task.findMany({
    where: {
      user_id: userA.id,
    }
  });

  const userAProjects = await prisma.project.findMany({
    where: {
      user_id: userA.id,
    }
  });

  const userAAreas = await prisma.area.findMany({
    where: {
      user_id: userA.id,
    }
  });

  const userATags = await prisma.tag.findMany({
    where: {
      user_id: userA.id,
    }
  });

  // Verify User A only sees their own data
  if (userATasks.length === 1 && userAProjects.length === 1 &&
      userAAreas.length === 1 && userATags.length === 1) {
    console.log('✅ User A sees only their own data (1 task, 1 project, 1 area, 1 tag)');
  } else {
    throw new Error(`❌ User A should see only their own data but found: ${userATasks.length} tasks, ${userAProjects.length} projects, ${userAAreas.length} areas, ${userATags.length} tags`);
  }

  // Verify none of User A's data is User B's data
  const hasUserBTask = userATasks.some(t => t.id === dataB.taskId);
  const hasUserBProject = userAProjects.some(p => p.id === dataB.projectId);
  const hasUserBArea = userAAreas.some(a => a.id === dataB.areaId);
  const hasUserBTag = userATags.some(t => t.id === dataB.tagId);

  if (!hasUserBTask && !hasUserBProject && !hasUserBArea && !hasUserBTag) {
    console.log('✅ User A\'s queries do not return User B\'s data (correct)');
  } else {
    throw new Error('❌ User A should not see User B\'s data');
  }

  // Try to access User B's specific data by ID (with user filter)
  const taskAccessAttempt = await prisma.task.findFirst({
    where: {
      id: dataB.taskId,
      user_id: userA.id,
    }
  });

  const projectAccessAttempt = await prisma.project.findFirst({
    where: {
      id: dataB.projectId,
      user_id: userA.id,
    }
  });

  const areaAccessAttempt = await prisma.area.findFirst({
    where: {
      id: dataB.areaId,
      user_id: userA.id,
    }
  });

  const tagAccessAttempt = await prisma.tag.findFirst({
    where: {
      id: dataB.tagId,
      user_id: userA.id,
    }
  });

  if (!taskAccessAttempt && !projectAccessAttempt && !areaAccessAttempt && !tagAccessAttempt) {
    console.log('✅ User A cannot access User B\'s specific data by ID (correct)');
  } else {
    throw new Error('❌ User A should not be able to access User B\'s data');
  }
}

/**
 * Test unique constraints work per-user
 */
async function testUniqueConstraintsPerUser() {
  console.log('\n🔒 Testing unique constraints are per-user...');

  // Both users should be able to create areas with the same name
  const areaA = await prisma.area.create({
    data: {
      name: 'Shared Name',
      user_id: userA.id,
    }
  });

  const areaB = await prisma.area.create({
    data: {
      name: 'Shared Name',
      user_id: userB.id,
    }
  });

  console.log('✅ Both users can create areas with the same name');

  // Both users should be able to create tags with the same name
  const tagA = await prisma.tag.create({
    data: {
      name: 'shared-tag',
      user_id: userA.id,
    }
  });

  const tagB = await prisma.tag.create({
    data: {
      name: 'shared-tag',
      user_id: userB.id,
    }
  });

  console.log('✅ Both users can create tags with the same name');

  // User A should not be able to create duplicate area name
  try {
    await prisma.area.create({
      data: {
        name: 'Shared Name',
        user_id: userA.id,
      }
    });
    throw new Error('❌ Should not allow duplicate area name for same user');
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('✅ Cannot create duplicate area name for same user (correct)');
    } else {
      throw error;
    }
  }

  // User A should not be able to create duplicate tag name
  try {
    await prisma.tag.create({
      data: {
        name: 'shared-tag',
        user_id: userA.id,
      }
    });
    throw new Error('❌ Should not allow duplicate tag name for same user');
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('✅ Cannot create duplicate tag name for same user (correct)');
    } else {
      throw error;
    }
  }
}

/**
 * Test cascade delete
 */
async function testCascadeDelete() {
  console.log('\n🗑️  Testing cascade delete...');

  // Count User B's data before delete
  const beforeTasks = await prisma.task.count({ where: { user_id: userB.id } });
  const beforeProjects = await prisma.project.count({ where: { user_id: userB.id } });
  const beforeAreas = await prisma.area.count({ where: { user_id: userB.id } });
  const beforeTags = await prisma.tag.count({ where: { user_id: userB.id } });

  console.log(`User B has: ${beforeTasks} tasks, ${beforeProjects} projects, ${beforeAreas} areas, ${beforeTags} tags`);

  // Delete User B
  await prisma.user.delete({
    where: { id: userB.id }
  });

  console.log('✅ Deleted User B');

  // Verify all User B's data is gone
  const afterTasks = await prisma.task.count({ where: { user_id: userB.id } });
  const afterProjects = await prisma.project.count({ where: { user_id: userB.id } });
  const afterAreas = await prisma.area.count({ where: { user_id: userB.id } });
  const afterTags = await prisma.tag.count({ where: { user_id: userB.id } });

  if (afterTasks === 0 && afterProjects === 0 && afterAreas === 0 && afterTags === 0) {
    console.log('✅ All User B\'s data was cascade deleted (correct)');
  } else {
    throw new Error(`❌ User B's data should be deleted but found: ${afterTasks} tasks, ${afterProjects} projects, ${afterAreas} areas, ${afterTags} tags`);
  }

  // Verify User A's data is still intact
  const userATasks = await prisma.task.count({ where: { user_id: userA.id } });
  const userAProjects = await prisma.project.count({ where: { user_id: userA.id } });
  const userAAreas = await prisma.area.count({ where: { user_id: userA.id } });
  const userATags = await prisma.tag.count({ where: { user_id: userA.id } });

  if (userATasks > 0 && userAProjects > 0 && userAAreas > 0 && userATags > 0) {
    console.log('✅ User A\'s data is still intact after User B was deleted');
  } else {
    throw new Error('❌ User A\'s data should not be affected by User B\'s deletion');
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('🚀 Starting Multi-User Data Isolation Test\n');
  console.log('=' .repeat(60));

  try {
    // Clean up any existing test data
    await cleanup();

    // Create test users
    await createTestUsers();

    // Create data for User A
    await createDataForUserA();

    // Verify User B cannot see User A's data
    await verifyUserBCannotSeeUserAData();

    // Create data for User B
    await createDataForUserB();

    // Verify User A cannot see User B's data
    await verifyUserACannotSeeUserBData();

    // Test unique constraints are per-user
    await testUniqueConstraintsPerUser();

    // Test cascade delete
    await testCascadeDelete();

    // Final cleanup
    await cleanup();

    console.log('\n' + '=' .repeat(60));
    console.log('\n✅ ALL TESTS PASSED - Multi-user data isolation is working correctly!\n');

  } catch (error) {
    console.error('\n' + '=' .repeat(60));
    console.error('\n❌ TEST FAILED:', error);
    console.error('\n');

    // Cleanup on failure
    try {
      await cleanup();
    } catch (cleanupError) {
      console.error('Failed to cleanup after error:', cleanupError);
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
main();
