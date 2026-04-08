import { PrismaClient, Classification, ApplicationRound, ApplicationStatus, ActionItemStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.counselorNote.deleteMany();
  await prisma.actionItem.deleteMany();
  await prisma.session.deleteMany();
  await prisma.collegeList.deleteMany();
  await prisma.student.deleteMany();
  await prisma.schoolAlias.deleteMany();
  await prisma.school.deleteMany();
  await prisma.counselor.deleteMany();

  const counselor = await prisma.counselor.create({
    data: {
      name: "Sarah Mitchell",
      email: "s.mitchell@school.edu",
      password_hash: await hash("testpassword123", 12),
    },
  });

  const schools = await Promise.all([
    prisma.school.create({
      data: {
        name: "Northwestern University",
        aliases: { create: [
          { alias: "northwestern" },
          { alias: "nu" },
          { alias: "northwestern u" },
        ]},
      },
    }),
    prisma.school.create({
      data: {
        name: "Boston University",
        aliases: { create: [
          { alias: "boston university" },
          { alias: "bu" },
          { alias: "boston u" },
        ]},
      },
    }),
    prisma.school.create({
      data: {
        name: "University of Wisconsin-Madison",
        aliases: { create: [
          { alias: "university of wisconsin-madison" },
          { alias: "uw-madison" },
          { alias: "uw madison" },
          { alias: "wisconsin" },
        ]},
      },
    }),
    prisma.school.create({
      data: {
        name: "University of California, Los Angeles",
        aliases: { create: [
          { alias: "university of california, los angeles" },
          { alias: "ucla" },
        ]},
      },
    }),
    prisma.school.create({
      data: {
        name: "University of California, Berkeley",
        aliases: { create: [
          { alias: "university of california, berkeley" },
          { alias: "uc berkeley" },
          { alias: "berkeley" },
          { alias: "cal" },
        ]},
      },
    }),
    prisma.school.create({
      data: {
        name: "Northeastern University",
        aliases: { create: [
          { alias: "northeastern" },
          { alias: "northeastern university" },
          { alias: "neu" },
        ]},
      },
    }),
    prisma.school.create({
      data: {
        name: "University of Washington",
        aliases: { create: [
          { alias: "university of washington" },
          { alias: "uw" },
          { alias: "u-dub" },
          { alias: "udub" },
        ]},
      },
    }),
    prisma.school.create({
      data: {
        name: "Santa Clara University",
        aliases: { create: [
          { alias: "santa clara" },
          { alias: "santa clara university" },
          { alias: "scu" },
        ]},
      },
    }),
  ]);

  const [northwestern, bu, uwMadison, ucla, berkeley, northeastern, uw, santaClara] = schools;

  const maya = await prisma.student.create({
    data: {
      counselor_id: counselor.id,
      first_name: "Maya",
      last_name: "Chen",
      grade: 12,
      gpa: 3.87,
      test_scores: { SAT: 1460, AP_Environmental_Science: 5, AP_Calc_AB: 4, AP_English_Lang: 4 },
      intended_major: "Environmental Science",
      extracurriculars: "Environmental Club president, varsity cross country, volunteer at local nature conservancy, summer research internship at UW-Madison Limnology Lab",
      family_context: "Parents supportive, budget-conscious. Interested in merit aid. Older sibling attended UW-Madison.",
    },
  });

  const james = await prisma.student.create({
    data: {
      counselor_id: counselor.id,
      first_name: "James",
      last_name: "Okafor",
      grade: 12,
      gpa: 3.95,
      test_scores: { SAT: 1520, AP_CS_A: 5, AP_Physics_C: 5, AP_Calc_BC: 5 },
      intended_major: "Computer Science",
      extracurriculars: "Robotics team captain, hackathon organizer, tutoring program for underclassmen, personal app development projects",
      family_context: "First-generation college student. Financial aid is critical. Very motivated family, parents work multiple jobs.",
    },
  });

  const sofia = await prisma.student.create({
    data: {
      counselor_id: counselor.id,
      first_name: "Sofia",
      last_name: "Ramirez",
      grade: 11,
      gpa: 3.72,
      test_scores: { PSAT: 1280 },
      intended_major: "Undecided — leaning Psychology or Communications",
      extracurriculars: "School newspaper editor, debate team, peer mediation program, part-time job at family restaurant",
      family_context: "Bilingual household. Parents want her close to home. Need to explore schools in the Midwest seriously.",
    },
  });

  // Maya's college list
  const mayaCollegeLists = await Promise.all([
    prisma.collegeList.create({
      data: {
        student_id: maya.id,
        school_id: northwestern.id,
        counselor_id: counselor.id,
        classification: Classification.REACH,
        application_round: ApplicationRound.ED,
        status: ApplicationStatus.IN_PROGRESS,
        deadline: new Date("2025-11-01"),
        notes: "Top choice. Strong environmental science program. Supplement in progress.",
      },
    }),
    prisma.collegeList.create({
      data: {
        student_id: maya.id,
        school_id: bu.id,
        counselor_id: counselor.id,
        classification: Classification.LIKELY,
        application_round: ApplicationRound.RD,
        status: ApplicationStatus.NOT_STARTED,
        deadline: new Date("2026-01-05"),
      },
    }),
    prisma.collegeList.create({
      data: {
        student_id: maya.id,
        school_id: uwMadison.id,
        counselor_id: counselor.id,
        classification: Classification.TARGET,
        application_round: ApplicationRound.EA,
        status: ApplicationStatus.NOT_STARTED,
        deadline: new Date("2025-11-01"),
        notes: "Legacy — sibling attended. Strong in-state option if family wants to save.",
      },
    }),
    prisma.collegeList.create({
      data: {
        student_id: maya.id,
        school_id: ucla.id,
        counselor_id: counselor.id,
        classification: Classification.REACH,
        application_round: ApplicationRound.RD,
        status: ApplicationStatus.NOT_STARTED,
        deadline: new Date("2025-11-30"),
      },
    }),
    prisma.collegeList.create({
      data: {
        student_id: maya.id,
        school_id: berkeley.id,
        counselor_id: counselor.id,
        classification: Classification.REACH,
        application_round: ApplicationRound.RD,
        status: ApplicationStatus.NOT_STARTED,
        deadline: new Date("2025-11-30"),
        notes: "CNR admit rate dropping. May need to reclassify.",
      },
    }),
    prisma.collegeList.create({
      data: {
        student_id: maya.id,
        school_id: northeastern.id,
        counselor_id: counselor.id,
        classification: Classification.TARGET,
        application_round: ApplicationRound.EA,
        status: ApplicationStatus.NOT_STARTED,
        deadline: new Date("2025-11-01"),
      },
    }),
    prisma.collegeList.create({
      data: {
        student_id: maya.id,
        school_id: uw.id,
        counselor_id: counselor.id,
        classification: Classification.LIKELY,
        application_round: ApplicationRound.RD,
        status: ApplicationStatus.NOT_STARTED,
        deadline: new Date("2026-01-15"),
      },
    }),
    prisma.collegeList.create({
      data: {
        student_id: maya.id,
        school_id: santaClara.id,
        counselor_id: counselor.id,
        classification: Classification.LIKELY,
        application_round: ApplicationRound.RD,
        status: ApplicationStatus.NOT_STARTED,
        deadline: new Date("2026-01-07"),
      },
    }),
  ]);

  // Maya's sessions — dates in 2025
  await prisma.session.create({
    data: {
      student_id: maya.id,
      counselor_id: counselor.id,
      date: new Date("2025-03-10"),
      raw_notes: "Initial meeting with Maya and parents. Discussed overall goals — she wants environmental science, preferably on the coasts or Midwest. Strong interest in Northwestern. Parents want to keep UW-Madison on the list for financial reasons. Built initial college list of 8 schools. Discussed timeline for EA/ED deadlines in November.",
      parsed_summary: "Built initial 8-school college list. Northwestern ED is top choice. UW-Madison as financial safety. EA deadlines for Northwestern, UW-Madison, and Northeastern all November 1. Need to start supplement essays immediately.",
    },
  });

  await prisma.session.create({
    data: {
      student_id: maya.id,
      counselor_id: counselor.id,
      date: new Date("2025-03-24"),
      raw_notes: "Maya has started the Northwestern supplement but is struggling with the 'why Northwestern' prompt. We brainstormed angles — her summer research connects well to their environmental policy program. She should reference Professor Horton's coastal resilience work. Activities list is 80% done. Teacher rec request going to Ms. Patel this week.",
      parsed_summary: "Northwestern supplement in progress. Suggested connecting summer research experience to environmental policy program. Activities list nearly complete. Teacher recommendation from Ms. Patel to be requested this week.",
    },
  });

  // Maya's action items — dates in 2025
  await prisma.actionItem.create({
    data: {
      student_id: maya.id,
      counselor_id: counselor.id,
      college_list_id: mayaCollegeLists[0].id,
      description: "Draft Northwestern supplemental essay — connect summer research to environmental policy program",
      due_date: new Date("2025-04-15"),
      status: ActionItemStatus.IN_PROGRESS,
    },
  });

  await prisma.actionItem.create({
    data: {
      student_id: maya.id,
      counselor_id: counselor.id,
      description: "Request teacher recommendation from Ms. Patel",
      due_date: new Date("2025-03-28"),
      status: ActionItemStatus.COMPLETE,
    },
  });

  await prisma.actionItem.create({
    data: {
      student_id: maya.id,
      counselor_id: counselor.id,
      description: "Finalize activities list",
      due_date: new Date("2025-04-20"),
      status: ActionItemStatus.IN_PROGRESS,
    },
  });

  // James's action item
  await prisma.actionItem.create({
    data: {
      student_id: james.id,
      counselor_id: counselor.id,
      description: "Complete CSS Profile for financial aid applications",
      due_date: new Date("2025-05-01"),
      status: ActionItemStatus.OPEN,
    },
  });

  // Counselor note on Sofia
  await prisma.counselorNote.create({
    data: {
      student_id: sofia.id,
      counselor_id: counselor.id,
      content: "Sofia seems uncertain about major. Next session should explore what draws her to psychology vs communications. May help narrow school list once direction is clearer.",
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });