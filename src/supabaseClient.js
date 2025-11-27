// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pvuasqbturdvvgkoamzs.supabase.co"; // ← change
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2dWFzcWJ0dXJkdnZna29hbXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTgzNzAsImV4cCI6MjA3OTY3NDM3MH0.BIw0yygNhUiqLsGderHPNm8N8b1_2TiCaePm7hSwSQs"; // ← change

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
