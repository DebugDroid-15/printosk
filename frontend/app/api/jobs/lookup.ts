/**
 * Printosk API - Job Lookup
 * POST /api/jobs/lookup
 * 
 * Look up print jobs by Print ID or email
 */

import { NextRequest, NextResponse } from 'next/server';

interface LookupRequest {
  type: 'printId' | 'email';
  query: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LookupRequest = await request.json();

    // Validate input
    if (!body.type || !body.query) {
      return NextResponse.json(
        { error: 'Missing search parameters' },
        { status: 400 }
      );
    }

    // TODO: In production, you would:
    // 1. Query Supabase for print jobs matching the criteria
    // 2. Filter by type (printId or email)
    // 3. Return job details with status

    // Mock data for demonstration
    const mockJobs = [
      {
        printId: '123456',
        status: 'COMPLETED',
        email: 'user@example.com',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
        files: 3,
      },
      {
        printId: '789012',
        status: 'PENDING',
        email: 'user@example.com',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 23.5 * 60 * 60 * 1000).toISOString(),
        files: 1,
      },
    ];

    // Filter based on type
    let results = mockJobs;
    if (body.type === 'printId') {
      results = mockJobs.filter(job => job.printId === body.query);
    } else if (body.type === 'email') {
      results = mockJobs.filter(job => job.email.toLowerCase() === body.query.toLowerCase());
    }

    return NextResponse.json(
      {
        success: true,
        jobs: results,
        count: results.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error looking up jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
