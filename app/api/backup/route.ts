import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { sourceClient, targetClient, TABLE_BACKUP_ORDER } from "@/utils/supabase";

export async function POST() {
  const headersList = headers();
  const authHeader = (await headersList).get("Authorization");

  if (authHeader !== `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const backupResults = [];

    for (const tableName of TABLE_BACKUP_ORDER) {
      // Check if target table is empty
      const { count: targetCount } = await targetClient
        .from(tableName)
        .select("*", { count: "exact", head: true });

      if (targetCount === 0) {
        // Full backup for empty table
        const { data: sourceData, error: sourceError } = await sourceClient
          .from(tableName)
          .select("*")
          .order("created_at", { ascending: true });

        if (sourceError)
          throw new Error(
            `Error fetching ${tableName}: ${sourceError.message}`
          );

        if (sourceData?.length) {
          // Split into chunks to handle large datasets
          const chunkSize = 500;
          for (let i = 0; i < sourceData.length; i += chunkSize) {
            const chunk = sourceData.slice(i, i + chunkSize);
            const { error: insertError } = await targetClient
              .from(tableName)
              .insert(chunk);

            if (insertError)
              throw new Error(
                `Error inserting ${tableName}: ${insertError.message}`
              );
          }
        }

        backupResults.push({
          table: tableName,
          action: "full_backup",
          count: sourceData?.length || 0,
        });
      } else {
        // Incremental backup
        const { data: lastBackup } = await targetClient
          .from("backup_metadata")
          .select("last_backup_date")
          .single();

        const lastBackupDate =
          lastBackup?.last_backup_date || new Date().toISOString();

        // Get changed records since last backup
        const { data: changedData, error: changeError } = await sourceClient
          .from(tableName)
          .select("*")
          .gt("updated_at", lastBackupDate)
          .order("updated_at", { ascending: true });

        if (changeError)
          throw new Error(
            `Error fetching changes for ${tableName}: ${changeError.message}`
          );

        if (changedData?.length) {
          // Handle updates in chunks
          const chunkSize = 500;
          for (let i = 0; i < changedData.length; i += chunkSize) {
            const chunk = changedData.slice(i, i + chunkSize);
            const { error: upsertError } = await targetClient
              .from(tableName)
              .upsert(chunk, {
                onConflict: getPrimaryKeyForTable(tableName),
              });

            if (upsertError)
              throw new Error(
                `Error updating ${tableName}: ${upsertError.message}`
              );
          }
        }

        backupResults.push({
          table: tableName,
          action: "incremental_backup",
          count: changedData?.length || 0,
        });
      }
    }

    // Update backup metadata
    const { error: metadataError } = await targetClient
      .from("backup_metadata")
      .upsert({
        id: 1,
        last_backup_date: new Date().toISOString(),
        status: "success",
        last_results: backupResults,
      });

    if (metadataError) throw metadataError;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: backupResults,
    });
  } catch (error) {
    console.error("Backup failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

function getPrimaryKeyForTable(tableName: string): string {
  const primaryKeys: Record<string, string> = {
    User: "id",
    Payment: "id",
    Recipe: "id",
    Macros: "id",
    MealPlan: "id",
    CheckedIngredient: "id",
    EmailLog: "id",
    UserRecipe: "id",
    Blog: "id",
  };
  return primaryKeys[tableName] || "id";
}
