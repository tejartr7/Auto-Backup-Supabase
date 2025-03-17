import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const targetSupabase = createClient(
  process.env.TARGET_SUPABASE_URL!,
  process.env.TARGET_SUPABASE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    console.log("Fetching data from source...");
    const { data, error } = await supabase.from("your_table").select("*");
    if (error) throw error;

    if (data.length > 0) {
      console.log(`Backing up ${data.length} records...`);
      const { error: insertError } = await targetSupabase
        .from("your_backup_table")
        .insert(data);
      if (insertError) throw insertError;
    }

    return res.status(200).json({ message: "Backup completed" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
