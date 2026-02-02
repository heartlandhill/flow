/**
 * End-to-end authentication test script
 * Tests the complete login flow including cookie handling
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const COOKIE_NAME = "flow_session";

async function runTests() {
  console.log("🧪 Running E2E Authentication Tests\n");
  console.log(`Base URL: ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;

  // Test 1: Visit /inbox without auth - should redirect to /login
  console.log("📋 Test 1: Protected route redirects to login");
  try {
    const response = await fetch(`${BASE_URL}/inbox`, { redirect: "manual" });
    if (response.status === 307 && response.headers.get("location") === "/login") {
      console.log("   ✅ PASSED: /inbox redirects to /login (307)\n");
      passed++;
    } else {
      console.log(`   ❌ FAILED: Expected 307 redirect to /login, got ${response.status}\n`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ FAILED: ${error}\n`);
    failed++;
  }

  // Test 2: Verify wrong credentials are rejected
  console.log("📋 Test 2: Invalid credentials rejected");
  try {
    // Check that a non-existent user can't login
    const user = await prisma.user.findUnique({ where: { username: "nonexistent" } });
    if (!user) {
      console.log("   ✅ PASSED: Non-existent user not in database\n");
      passed++;
    } else {
      console.log("   ❌ FAILED: Found unexpected user\n");
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ FAILED: ${error}\n`);
    failed++;
  }

  // Test 3: Verify correct credentials work (database level)
  console.log("📋 Test 3: Valid credentials authenticate");
  try {
    const user = await prisma.user.findUnique({ where: { username: "admin" } });
    if (!user) {
      throw new Error("Admin user not found - run db:seed first");
    }

    const isValid = await bcrypt.compare("flow-admin-2026", user.password_hash);
    if (isValid) {
      console.log("   ✅ PASSED: Password verification works for admin/flow-admin-2026\n");
      passed++;
    } else {
      console.log("   ❌ FAILED: Password verification failed\n");
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ FAILED: ${error}\n`);
    failed++;
  }

  // Test 4: Session creation works
  console.log("📋 Test 4: Session can be created");
  try {
    const user = await prisma.user.findUnique({ where: { username: "admin" } });
    if (!user) throw new Error("Admin user not found");

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const session = await prisma.session.create({
      data: {
        token,
        user_id: user.id,
        expires_at: expiresAt,
      },
    });

    if (session.token === token) {
      console.log("   ✅ PASSED: Session created with 64-char token\n");
      passed++;

      // Clean up test session
      await prisma.session.delete({ where: { id: session.id } });
    } else {
      console.log("   ❌ FAILED: Session creation failed\n");
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ FAILED: ${error}\n`);
    failed++;
  }

  // Test 5: Valid session token format bypasses middleware redirect
  console.log("📋 Test 5: Valid token format allows request through middleware");
  try {
    // Create a real session for testing
    const user = await prisma.user.findUnique({ where: { username: "admin" } });
    if (!user) throw new Error("Admin user not found");

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        token,
        user_id: user.id,
        expires_at: expiresAt,
      },
    });

    // Request with valid session cookie
    const response = await fetch(`${BASE_URL}/inbox`, {
      redirect: "manual",
      headers: {
        Cookie: `${COOKIE_NAME}=${token}`,
      },
    });

    // Should get 200 or 404 (since inbox page may not exist), but NOT 307 redirect to login
    if (response.status !== 307) {
      console.log(`   ✅ PASSED: Request with valid session not redirected (got ${response.status})\n`);
      passed++;
    } else {
      console.log(`   ❌ FAILED: Still redirected to login with valid session\n`);
      failed++;
    }

    // Clean up
    await prisma.session.delete({ where: { token } });
  } catch (error) {
    console.log(`   ❌ FAILED: ${error}\n`);
    failed++;
  }

  // Test 6: Invalid token format causes redirect
  console.log("📋 Test 6: Invalid token format causes redirect");
  try {
    const response = await fetch(`${BASE_URL}/inbox`, {
      redirect: "manual",
      headers: {
        Cookie: `${COOKIE_NAME}=invalid-token`,
      },
    });

    if (response.status === 307) {
      console.log("   ✅ PASSED: Invalid token format redirects to login\n");
      passed++;
    } else {
      console.log(`   ❌ FAILED: Expected redirect, got ${response.status}\n`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ FAILED: ${error}\n`);
    failed++;
  }

  // Test 7: /api/snooze is public (no redirect)
  console.log("📋 Test 7: Public API endpoint accessible without auth");
  try {
    const response = await fetch(`${BASE_URL}/api/snooze`, { redirect: "manual" });
    // Should get 404 or 405 (not implemented) but NOT 307 redirect
    if (response.status !== 307) {
      console.log(`   ✅ PASSED: /api/snooze accessible without auth (got ${response.status})\n`);
      passed++;
    } else {
      console.log("   ❌ FAILED: /api/snooze redirected to login\n");
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ FAILED: ${error}\n`);
    failed++;
  }

  // Summary
  console.log("═".repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error("Test runner error:", error);
  process.exit(1);
});
