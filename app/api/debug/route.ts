import { NextResponse } from "next/server";
import { sourceClient, targetClient } from "@/utils/supabase";

export async function GET() {
  try {
    // Environment variables check
    const envCheck = {
      sourceUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      sourceKey: !!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
      targetUrl: !!process.env.NEXT_PUBLIC_TARGET_SUPABASE_URL,
      targetKey: !!process.env.NEXT_PUBLIC_TARGET_SUPABASE_KEY,
    };

    // Try direct table queries first
    const { data: sourceData, error: sourceError } = await sourceClient
      .from('user')  // Try lowercase
      .select('*')
      .limit(1);

    const { data: targetData, error: targetError } = await targetClient
      .from('user')  // Try lowercase
      .select('*')
      .limit(1);

    // If lowercase doesn't work, try uppercase
    if (sourceError?.message?.includes('does not exist')) {
      const { error: upperError } = await sourceClient
        .from('User')
        .select('*')
        .limit(1);
      
      if (!upperError) {
        console.log('Table name is uppercase "User"');
      }
    }

    return NextResponse.json({
      env: envCheck,
      source: {
        connected: !sourceError,
        error: sourceError?.message,
        hasData: !!sourceData,
        firstRecord: sourceData?.[0] ? true : false
      },
      target: {
        connected: !targetError,
        error: targetError?.message,
        hasData: !!targetData,
        firstRecord: targetData?.[0] ? true : false
      }
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
