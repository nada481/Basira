import dotenv from "dotenv";
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';


dotenv.config({
  path: "../.env"
});
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function test() {
  const { data, error } = await supabase.from("tasks").select("*");

  console.log("DATA:", data);
  console.log("ERROR:", error);
}

test();