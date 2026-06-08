// src/lib/schoolEnricher.ts

import { chatCompletion, parseJsonResponse} from "@/lib/openrouter";
import { prisma } from "./prisma";
import { DEFAULT_MODEL } from "@/lib/models";

const ENRICHMENT_PROMPT = `You are a college admissions data assistant. Given a university name and application round, provide accurate admissions information.

CRITICAL: For the essays section, list EVERY required essay/writing supplement for this school. Be specific about each one — include the exact prompt if you know it, or a description of what's required. Include the Common App personal statement if the school uses Common App.

Output ONLY valid JSON with this structure:

{
  "deadline": "YYYY-MM-DD for the specific application round requested, or null if that round is not offered",
  "all_deadlines": {
    "EA": "YYYY-MM-DD or null",
    "ED": "YYYY-MM-DD or null",
    "ED2": "YYYY-MM-DD or null",
    "REA": "YYYY-MM-DD or null",
    "RD": "YYYY-MM-DD or null"
  },
  "requirements": {
    "common_app": true/false,
    "coalition_app": true/false,
    "test_policy": "Test required / Test optional / Test blind",
    "letters_of_rec": "Number and description",
    "interview": "Required / Recommended / Not offered"
  },
  "essays": [
    {
      "title": "Short descriptive title (e.g. 'Why Harvard', 'Common App Personal Statement', 'Intellectual Curiosity Essay')",
      "prompt": "The full essay prompt or a description of what's required",
      "word_limit": 650 or null
    }
  ],
  "stats": {
    "acceptance_rate": "percentage as string or null",
    "middle_50_sat": "range as string or null",
    "middle_50_act": "range as string or null"
  },
  "verified": false
}

For the essays array:
- Always include the Common App Personal Statement (650 words) if the school uses Common App
- List each supplemental essay separately
- If a school has a "Why Us" essay, list it
- If a school has short answer questions, list each one
- Be as specific as possible about prompts

The current academic cycle is 2026-2027. All deadlines should be for the 2026-2027 admissions cycle.

Output ONLY the JSON object. No other text.`;

export async function enrichCollegeListEntry(
  collegeListId: string,
  applicationRound: string
): Promise<void> {
  const entry = await prisma.collegeList.findUnique({
    where: { id: collegeListId },
    include: { school: true },
  });

  if (!entry) return;

  const schoolName = entry.school.name;
  const round = applicationRound || entry.application_round;

  let schoolData = entry.school.research_cache as any;

  if (
    !schoolData ||
    !entry.school.research_updated_at ||
    Date.now() - new Date(entry.school.research_updated_at).getTime() >
      30 * 24 * 60 * 60 * 1000
  ) {
    try {
      const raw = await chatCompletion({
        model: DEFAULT_MODEL,
        systemPrompt: ENRICHMENT_PROMPT,
        userMessage: `University: ${schoolName}\nApplication Round: ${round}\nAdmissions Cycle: 2026-2027`,
      });

      schoolData = parseJsonResponse(raw);
      console.log(
        "Enrichment for",
        schoolName,
        JSON.stringify(schoolData, null, 2)
      );

      await prisma.school.update({
        where: { id: entry.school.id },
        data: {
          research_cache: schoolData,
          research_updated_at: new Date(),
        },
      });
    } catch (err) {
      console.error("Enrichment failed for", schoolName, err);
      return;
    }
  }

  if (!schoolData) return;

  // Resolve deadline
  const deadlines = schoolData.deadlines || schoolData.all_deadlines || {};
  let deadlineStr =
    schoolData.deadline ||
    deadlines[round] ||
    deadlines["RD"] ||
    null;

  if (!deadlineStr) {
    const available = Object.values(deadlines).filter(Boolean) as string[];
    if (available.length > 0) {
      deadlineStr = available.sort()[0];
    }
  }

  let parsedDeadline: Date | null = null;
  if (deadlineStr) {
    try {
      const d = new Date(deadlineStr);
      if (!isNaN(d.getTime()) && d.getFullYear() >= 2026) {
        parsedDeadline = d;
      }
    } catch {
      console.error("Invalid deadline format:", deadlineStr);
    }
  }

  // Build notes from requirements
  const req = schoolData.requirements;
  const stats = schoolData.stats;
  const notesParts: string[] = [];

  if (req?.test_policy) notesParts.push(`Testing: ${req.test_policy}`);
  if (req?.letters_of_rec) notesParts.push(`Recs: ${req.letters_of_rec}`);
  if (req?.interview) notesParts.push(`Interview: ${req.interview}`);
  if (stats?.acceptance_rate)
    notesParts.push(`Acceptance rate: ${stats.acceptance_rate}`);
  if (stats?.middle_50_sat) notesParts.push(`SAT: ${stats.middle_50_sat}`);

  if (schoolData.verified === false) {
    notesParts.push("Unverified — please confirm");
  }

  const enrichedNotes = notesParts.join(" | ");

  // Update college list entry
  const updateData: any = {};

  if (parsedDeadline && !entry.deadline) {
    updateData.deadline = parsedDeadline;
  }

  if (enrichedNotes) {
    updateData.notes = entry.notes
      ? `${entry.notes}\n${enrichedNotes}`
      : enrichedNotes;
  }

  if (Object.keys(updateData).length > 0) {
    const updated = await prisma.collegeList.update({
      where: { id: collegeListId },
      data: updateData,
    });
    console.log(
      "Updated college list:",
      schoolName,
      "deadline:",
      updated.deadline
    );
  }

  // Create essay records from enrichment data
  if (schoolData?.essays && Array.isArray(schoolData.essays)) {
    for (const essayData of schoolData.essays) {
      if (!essayData.title) continue;

      const existingEssay = await prisma.essay.findFirst({
        where: {
          student_id: entry.student_id,
          school_id: entry.school_id,
          title: { equals: essayData.title, mode: "insensitive" },
        },
      });

      if (!existingEssay) {
        await prisma.essay.create({
          data: {
            student_id: entry.student_id,
            counselor_id: entry.counselor_id,
            school_id: entry.school_id,
            title: essayData.title,
            prompt: essayData.prompt || null,
            word_limit: essayData.word_limit || null,
            status: "NOT_STARTED",
          },
        });
      }
    }

    console.log(
      "Created essay entries for",
      schoolName,
      "count:",
      schoolData.essays.length
    );
  }
}