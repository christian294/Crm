import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.dealContact.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.tagOnRecord.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const passwordHash = await bcrypt.hash("demo1234", 12);
  const user = await prisma.user.create({
    data: {
      email: "demo@opendesk.com",
      name: "Alex Morgan",
      passwordHash,
    },
  });
  console.log("✓ Created demo user");

  // Create companies
  const companiesData = [
    { name: "Meridian Technologies", domain: "meridiantech.com", industry: "Technology", size: "LARGE" as const, status: "ACTIVE" as const, phone: "+1 (415) 555-0101", email: "info@meridiantech.com", city: "San Francisco", state: "CA", country: "US" },
    { name: "Apex Digital Solutions", domain: "apexdigital.io", industry: "Software", size: "MEDIUM" as const, status: "ACTIVE" as const, phone: "+1 (512) 555-0102", email: "hello@apexdigital.io", city: "Austin", state: "TX", country: "US" },
    { name: "Greenfield Consulting", domain: "greenfieldconsulting.com", industry: "Consulting", size: "SMALL" as const, status: "PROSPECT" as const, phone: "+1 (212) 555-0103", email: "info@greenfieldconsulting.com", city: "New York", state: "NY", country: "US" },
    { name: "Stellar Analytics", domain: "stellaranalytics.co", industry: "Data & Analytics", size: "MEDIUM" as const, status: "ACTIVE" as const, phone: "+1 (303) 555-0104", email: "contact@stellaranalytics.co", city: "Denver", state: "CO", country: "US" },
    { name: "NovaBridge Software", domain: "novabridge.dev", industry: "Software", size: "SMALL" as const, status: "PROSPECT" as const, phone: "+1 (206) 555-0105", email: "team@novabridge.dev", city: "Seattle", state: "WA", country: "US" },
    { name: "Coastal Media Group", domain: "coastalmedia.com", industry: "Media & Entertainment", size: "LARGE" as const, status: "ACTIVE" as const, phone: "+1 (310) 555-0106", email: "press@coastalmedia.com", city: "Los Angeles", state: "CA", country: "US" },
    { name: "Summit Healthcare", domain: "summithealth.org", industry: "Healthcare", size: "ENTERPRISE" as const, status: "ACTIVE" as const, phone: "+1 (617) 555-0107", email: "partnerships@summithealth.org", city: "Boston", state: "MA", country: "US" },
    { name: "Redwood Financial", domain: "redwoodfinancial.com", industry: "Financial Services", size: "LARGE" as const, status: "INACTIVE" as const, phone: "+1 (312) 555-0108", email: "info@redwoodfinancial.com", city: "Chicago", state: "IL", country: "US" },
    { name: "BluePeak Manufacturing", domain: "bluepeakmfg.com", industry: "Manufacturing", size: "ENTERPRISE" as const, status: "ACTIVE" as const, phone: "+1 (704) 555-0109", email: "sales@bluepeakmfg.com", city: "Charlotte", state: "NC", country: "US" },
    { name: "Catalyst Education", domain: "catalystedu.com", industry: "Education", size: "MEDIUM" as const, status: "PROSPECT" as const, phone: "+1 (503) 555-0110", email: "hello@catalystedu.com", city: "Portland", state: "OR", country: "US" },
  ];

  const companies = await Promise.all(
    companiesData.map((c) =>
      prisma.company.create({ data: { ...c, ownerId: user.id } })
    )
  );
  console.log("✓ Created 10 companies");

  // Create contacts
  const contactsData = [
    { firstName: "Sarah", lastName: "Chen", email: "sarah.chen@meridiantech.com", title: "VP of Engineering", department: "Engineering", companyIndex: 0, status: "ACTIVE" as const, source: "REFERRAL" as const },
    { firstName: "James", lastName: "Rodriguez", email: "james.r@meridiantech.com", title: "Product Manager", department: "Product", companyIndex: 0, status: "ACTIVE" as const, source: "WEB" as const },
    { firstName: "Emily", lastName: "Watson", email: "ewatson@meridiantech.com", title: "CTO", department: "Engineering", companyIndex: 0, status: "ACTIVE" as const, source: "MANUAL" as const },
    { firstName: "Michael", lastName: "Park", email: "mpark@apexdigital.io", title: "CEO", department: "Executive", companyIndex: 1, status: "ACTIVE" as const, source: "REFERRAL" as const },
    { firstName: "Lisa", lastName: "Thompson", email: "lisa.t@apexdigital.io", title: "Head of Sales", department: "Sales", companyIndex: 1, status: "ACTIVE" as const, source: "MANUAL" as const },
    { firstName: "David", lastName: "Kim", email: "dkim@apexdigital.io", title: "Senior Developer", department: "Engineering", companyIndex: 1, status: "LEAD" as const, source: "WEB" as const },
    { firstName: "Rachel", lastName: "Greene", email: "rgreene@greenfieldconsulting.com", title: "Managing Partner", department: "Leadership", companyIndex: 2, status: "LEAD" as const, source: "REFERRAL" as const },
    { firstName: "Tom", lastName: "Harrison", email: "tharrison@greenfieldconsulting.com", title: "Senior Consultant", department: "Consulting", companyIndex: 2, status: "LEAD" as const, source: "MANUAL" as const },
    { firstName: "Nina", lastName: "Patel", email: "nina@stellaranalytics.co", title: "Data Science Lead", department: "Analytics", companyIndex: 3, status: "ACTIVE" as const, source: "WEB" as const },
    { firstName: "Alex", lastName: "Turner", email: "aturner@stellaranalytics.co", title: "VP of Operations", department: "Operations", companyIndex: 3, status: "ACTIVE" as const, source: "MANUAL" as const },
    { firstName: "Jordan", lastName: "Lee", email: "jlee@stellaranalytics.co", title: "Account Manager", department: "Sales", companyIndex: 3, status: "ACTIVE" as const, source: "REFERRAL" as const },
    { firstName: "Megan", lastName: "Foster", email: "mfoster@novabridge.dev", title: "Co-founder", department: "Executive", companyIndex: 4, status: "LEAD" as const, source: "WEB" as const },
    { firstName: "Chris", lastName: "Nakamura", email: "cnakamura@novabridge.dev", title: "Lead Architect", department: "Engineering", companyIndex: 4, status: "LEAD" as const, source: "MANUAL" as const },
    { firstName: "Olivia", lastName: "Martinez", email: "olivia@coastalmedia.com", title: "Creative Director", department: "Creative", companyIndex: 5, status: "ACTIVE" as const, source: "REFERRAL" as const },
    { firstName: "Ryan", lastName: "Brooks", email: "rbrooks@coastalmedia.com", title: "Head of Partnerships", department: "Business Dev", companyIndex: 5, status: "ACTIVE" as const, source: "MANUAL" as const },
    { firstName: "Sophie", lastName: "Andersson", email: "sandersson@coastalmedia.com", title: "Marketing Director", department: "Marketing", companyIndex: 5, status: "ACTIVE" as const, source: "WEB" as const },
    { firstName: "Daniel", lastName: "Wright", email: "dwright@summithealth.org", title: "Chief Information Officer", department: "IT", companyIndex: 6, status: "ACTIVE" as const, source: "REFERRAL" as const },
    { firstName: "Amanda", lastName: "Liu", email: "aliu@summithealth.org", title: "Procurement Manager", department: "Procurement", companyIndex: 6, status: "ACTIVE" as const, source: "MANUAL" as const },
    { firstName: "Kevin", lastName: "O'Brien", email: "kobrien@summithealth.org", title: "IT Director", department: "IT", companyIndex: 6, status: "ACTIVE" as const, source: "MANUAL" as const },
    { firstName: "Patricia", lastName: "Simmons", email: "psimmons@redwoodfinancial.com", title: "CFO", department: "Finance", companyIndex: 7, status: "INACTIVE" as const, source: "REFERRAL" as const },
    { firstName: "Robert", lastName: "Chang", email: "rchang@redwoodfinancial.com", title: "VP of Technology", department: "Technology", companyIndex: 7, status: "INACTIVE" as const, source: "MANUAL" as const },
    { firstName: "Jennifer", lastName: "Blake", email: "jblake@redwoodfinancial.com", title: "Operations Manager", department: "Operations", companyIndex: 7, status: "CHURNED" as const, source: "MANUAL" as const },
    { firstName: "Marcus", lastName: "Johnson", email: "mjohnson@bluepeakmfg.com", title: "Plant Manager", department: "Operations", companyIndex: 8, status: "ACTIVE" as const, source: "REFERRAL" as const },
    { firstName: "Karen", lastName: "Sullivan", email: "ksullivan@bluepeakmfg.com", title: "Purchasing Director", department: "Procurement", companyIndex: 8, status: "ACTIVE" as const, source: "MANUAL" as const },
    { firstName: "Brian", lastName: "Hoffman", email: "bhoffman@bluepeakmfg.com", title: "VP of Engineering", department: "Engineering", companyIndex: 8, status: "ACTIVE" as const, source: "WEB" as const },
    { firstName: "Natalie", lastName: "Ross", email: "nross@bluepeakmfg.com", title: "Quality Assurance Lead", department: "QA", companyIndex: 8, status: "ACTIVE" as const, source: "MANUAL" as const },
    { firstName: "Tyler", lastName: "Bennett", email: "tbennett@catalystedu.com", title: "Founder", department: "Executive", companyIndex: 9, status: "LEAD" as const, source: "WEB" as const },
    { firstName: "Grace", lastName: "Kim", email: "gkim@catalystedu.com", title: "Head of Curriculum", department: "Education", companyIndex: 9, status: "LEAD" as const, source: "REFERRAL" as const },
    { firstName: "Sam", lastName: "Reeves", email: "sreeves@catalystedu.com", title: "Technology Director", department: "IT", companyIndex: 9, status: "LEAD" as const, source: "MANUAL" as const },
    { firstName: "Diana", lastName: "Vasquez", email: "dvasquez@catalystedu.com", title: "Partnerships Manager", department: "Business Dev", companyIndex: 9, status: "LEAD" as const, source: "WEB" as const },
  ];

  const contacts = await Promise.all(
    contactsData.map(({ companyIndex, ...c }) =>
      prisma.contact.create({
        data: { ...c, companyId: companies[companyIndex].id, ownerId: user.id },
      })
    )
  );
  console.log("✓ Created 30 contacts");

  // Create deals
  const dealsData = [
    { name: "Enterprise License Agreement", value: 250000, stage: "NEGOTIATION" as const, probability: 75, companyIndex: 0, expectedClose: 30 },
    { name: "Platform Migration Project", value: 85000, stage: "PROPOSAL" as const, probability: 50, companyIndex: 0, expectedClose: 45 },
    { name: "Annual SaaS Subscription", value: 36000, stage: "CLOSED_WON" as const, probability: 100, companyIndex: 1, expectedClose: -15 },
    { name: "Custom Integration Package", value: 120000, stage: "QUALIFIED" as const, probability: 25, companyIndex: 1, expectedClose: 60 },
    { name: "Consulting Engagement", value: 45000, stage: "PROSPECT" as const, probability: 10, companyIndex: 2, expectedClose: 90 },
    { name: "Analytics Dashboard Build", value: 67000, stage: "PROPOSAL" as const, probability: 50, companyIndex: 3, expectedClose: 30 },
    { name: "Data Pipeline Optimization", value: 92000, stage: "NEGOTIATION" as const, probability: 75, companyIndex: 3, expectedClose: 20 },
    { name: "MVP Development Contract", value: 150000, stage: "QUALIFIED" as const, probability: 25, companyIndex: 4, expectedClose: 75 },
    { name: "Brand Campaign Platform", value: 78000, stage: "CLOSED_WON" as const, probability: 100, companyIndex: 5, expectedClose: -30 },
    { name: "Content Management System", value: 55000, stage: "PROPOSAL" as const, probability: 50, companyIndex: 5, expectedClose: 40 },
    { name: "EHR Integration Suite", value: 340000, stage: "NEGOTIATION" as const, probability: 75, companyIndex: 6, expectedClose: 25 },
    { name: "Patient Portal Redesign", value: 180000, stage: "PROSPECT" as const, probability: 10, companyIndex: 6, expectedClose: 120 },
    { name: "Financial Reporting Tool", value: 95000, stage: "CLOSED_LOST" as const, probability: 0, companyIndex: 7, expectedClose: -45 },
    { name: "IoT Monitoring System", value: 210000, stage: "QUALIFIED" as const, probability: 25, companyIndex: 8, expectedClose: 60 },
    { name: "E-Learning Platform", value: 72000, stage: "PROSPECT" as const, probability: 10, companyIndex: 9, expectedClose: 90 },
  ];

  const now = new Date();
  const deals = await Promise.all(
    dealsData.map(({ companyIndex, expectedClose, ...d }) => {
      const expectedCloseDate = new Date(now);
      expectedCloseDate.setDate(expectedCloseDate.getDate() + expectedClose);
      const actualCloseDate =
        d.stage === "CLOSED_WON" || d.stage === "CLOSED_LOST"
          ? new Date(now.getTime() + expectedClose * 86400000)
          : undefined;
      return prisma.deal.create({
        data: {
          ...d,
          value: d.value,
          expectedCloseDate,
          actualCloseDate,
          companyId: companies[companyIndex].id,
          ownerId: user.id,
        },
      });
    })
  );
  console.log("✓ Created 15 deals");

  // Create deal-contact associations
  const dealContactPairs = [
    [0, 0], [0, 1], [0, 2], [1, 0], [1, 1],
    [2, 3], [2, 4], [3, 3], [3, 5],
    [4, 6], [4, 7],
    [5, 8], [5, 9], [6, 8], [6, 10],
    [7, 11], [7, 12],
    [8, 13], [8, 14], [9, 14], [9, 15],
    [10, 16], [10, 17], [11, 16], [11, 18],
    [12, 19], [12, 20],
    [13, 22], [13, 23], [13, 24],
    [14, 26], [14, 27],
  ];
  await Promise.all(
    dealContactPairs.map(([di, ci]) =>
      prisma.dealContact.create({
        data: { dealId: deals[di].id, contactId: contacts[ci].id },
      })
    )
  );
  console.log("✓ Created deal-contact associations");

  // Create activities
  const activityTypes = ["CALL", "EMAIL", "MEETING", "NOTE", "OTHER"] as const;
  const activitiesData = [
    { type: "CALL" as const, subject: "Discovery call with Sarah", contactIndex: 0, dealIndex: 0, companyIndex: 0, daysAgo: 1, duration: 45 },
    { type: "EMAIL" as const, subject: "Sent proposal to Meridian", contactIndex: 1, dealIndex: 1, companyIndex: 0, daysAgo: 2 },
    { type: "MEETING" as const, subject: "Quarterly business review", contactIndex: 2, dealIndex: 0, companyIndex: 0, daysAgo: 7, duration: 60 },
    { type: "NOTE" as const, subject: "Key decision-maker identified", description: "Emily Watson is the final approver for the enterprise deal. Need to schedule a follow-up.", contactIndex: 2, companyIndex: 0, daysAgo: 3 },
    { type: "CALL" as const, subject: "Follow-up with Michael Park", contactIndex: 3, dealIndex: 3, companyIndex: 1, daysAgo: 1, duration: 30 },
    { type: "EMAIL" as const, subject: "Contract renewal confirmation", contactIndex: 4, dealIndex: 2, companyIndex: 1, daysAgo: 15 },
    { type: "MEETING" as const, subject: "Product demo for Apex team", contactIndex: 3, dealIndex: 3, companyIndex: 1, daysAgo: 5, duration: 90 },
    { type: "NOTE" as const, subject: "Budget approved for Q2", description: "Michael confirmed budget allocation. Moving to proposal stage next week.", contactIndex: 3, companyIndex: 1, daysAgo: 4 },
    { type: "CALL" as const, subject: "Initial outreach to Greenfield", contactIndex: 6, dealIndex: 4, companyIndex: 2, daysAgo: 10, duration: 20 },
    { type: "EMAIL" as const, subject: "Sent company overview deck", contactIndex: 7, companyIndex: 2, daysAgo: 8 },
    { type: "MEETING" as const, subject: "Analytics requirements gathering", contactIndex: 8, dealIndex: 5, companyIndex: 3, daysAgo: 3, duration: 120 },
    { type: "CALL" as const, subject: "Pricing discussion with Nina", contactIndex: 8, dealIndex: 6, companyIndex: 3, daysAgo: 2, duration: 35 },
    { type: "NOTE" as const, subject: "Technical requirements documented", description: "Stellar needs real-time dashboard with 5 data source integrations. Estimated 8-week timeline.", dealIndex: 5, companyIndex: 3, daysAgo: 3 },
    { type: "EMAIL" as const, subject: "Proposal sent for data pipeline", contactIndex: 9, dealIndex: 6, companyIndex: 3, daysAgo: 1 },
    { type: "CALL" as const, subject: "Introduction call with NovaBridge", contactIndex: 11, dealIndex: 7, companyIndex: 4, daysAgo: 14, duration: 25 },
    { type: "MEETING" as const, subject: "Technical architecture review", contactIndex: 12, dealIndex: 7, companyIndex: 4, daysAgo: 6, duration: 75 },
    { type: "EMAIL" as const, subject: "Campaign results summary", contactIndex: 13, dealIndex: 8, companyIndex: 5, daysAgo: 30 },
    { type: "MEETING" as const, subject: "CMS requirements workshop", contactIndex: 14, dealIndex: 9, companyIndex: 5, daysAgo: 4, duration: 90 },
    { type: "CALL" as const, subject: "Negotiation update with Sophie", contactIndex: 15, companyIndex: 5, daysAgo: 2, duration: 40 },
    { type: "NOTE" as const, subject: "Coastal prefers phased approach", description: "They want to start with a pilot program before full rollout. Adjusting proposal.", contactIndex: 14, dealIndex: 9, companyIndex: 5, daysAgo: 3 },
    { type: "MEETING" as const, subject: "EHR integration kickoff", contactIndex: 16, dealIndex: 10, companyIndex: 6, daysAgo: 5, duration: 60 },
    { type: "CALL" as const, subject: "Compliance discussion with Summit", contactIndex: 17, dealIndex: 10, companyIndex: 6, daysAgo: 2, duration: 50 },
    { type: "EMAIL" as const, subject: "Security audit documentation", contactIndex: 18, dealIndex: 10, companyIndex: 6, daysAgo: 1 },
    { type: "NOTE" as const, subject: "Summit requires HIPAA compliance", description: "All data handling must be HIPAA compliant. Need to prepare compliance documentation.", dealIndex: 10, companyIndex: 6, daysAgo: 4 },
    { type: "CALL" as const, subject: "Post-mortem on lost Redwood deal", contactIndex: 19, dealIndex: 12, companyIndex: 7, daysAgo: 45, duration: 30 },
    { type: "NOTE" as const, subject: "Redwood went with competitor", description: "Lost to incumbent vendor who offered 20% discount. Relationship intact for future opportunities.", contactIndex: 19, dealIndex: 12, companyIndex: 7, daysAgo: 45 },
    { type: "EMAIL" as const, subject: "Re-engagement attempt with Redwood", contactIndex: 20, companyIndex: 7, daysAgo: 10 },
    { type: "MEETING" as const, subject: "IoT platform demonstration", contactIndex: 22, dealIndex: 13, companyIndex: 8, daysAgo: 8, duration: 60 },
    { type: "CALL" as const, subject: "Supply chain integration scope", contactIndex: 23, dealIndex: 13, companyIndex: 8, daysAgo: 3, duration: 45 },
    { type: "EMAIL" as const, subject: "Technical specs for BluePeak", contactIndex: 24, dealIndex: 13, companyIndex: 8, daysAgo: 2 },
    { type: "NOTE" as const, subject: "Manufacturing integration complex", description: "BluePeak has legacy ERP system. Integration will require custom middleware. Adding to scope.", dealIndex: 13, companyIndex: 8, daysAgo: 2 },
    { type: "CALL" as const, subject: "E-learning platform discovery", contactIndex: 26, dealIndex: 14, companyIndex: 9, daysAgo: 12, duration: 30 },
    { type: "EMAIL" as const, subject: "Course content migration plan", contactIndex: 27, dealIndex: 14, companyIndex: 9, daysAgo: 6 },
    { type: "MEETING" as const, subject: "Curriculum mapping session", contactIndex: 27, dealIndex: 14, companyIndex: 9, daysAgo: 4, duration: 90 },
    { type: "NOTE" as const, subject: "Catalyst needs LTI integration", description: "Their existing LMS uses LTI standards. Our platform needs to support LTI 1.3.", dealIndex: 14, companyIndex: 9, daysAgo: 3 },
    { type: "CALL" as const, subject: "Weekly pipeline review", daysAgo: 0, duration: 30 },
    { type: "EMAIL" as const, subject: "Monthly newsletter sent", daysAgo: 7 },
    { type: "MEETING" as const, subject: "Team standup", daysAgo: 0, duration: 15 },
    { type: "CALL" as const, subject: "Vendor evaluation call", contactIndex: 25, companyIndex: 8, daysAgo: 9, duration: 40 },
    { type: "EMAIL" as const, subject: "Partnership proposal from BluePeak", contactIndex: 22, companyIndex: 8, daysAgo: 5 },
  ];

  await Promise.all(
    activitiesData.map((a) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (a.daysAgo || 0));
      return prisma.activity.create({
        data: {
          type: a.type,
          subject: a.subject,
          description: a.description,
          date,
          duration: a.duration,
          ownerId: user.id,
          contactId: a.contactIndex !== undefined ? contacts[a.contactIndex].id : undefined,
          dealId: a.dealIndex !== undefined ? deals[a.dealIndex].id : undefined,
          companyId: a.companyIndex !== undefined ? companies[a.companyIndex].id : undefined,
        },
      });
    })
  );
  console.log("✓ Created 40 activities");

  // Create tasks
  const tasksData = [
    { title: "Send revised proposal to Meridian", daysFromNow: 1, priority: "HIGH" as const, status: "TODO" as const, contactIndex: 0, dealIndex: 0, companyIndex: 0 },
    { title: "Schedule demo with Meridian engineering", daysFromNow: 3, priority: "MEDIUM" as const, status: "TODO" as const, contactIndex: 2, dealIndex: 0, companyIndex: 0 },
    { title: "Update pricing sheet for Apex", daysFromNow: -1, priority: "URGENT" as const, status: "IN_PROGRESS" as const, contactIndex: 3, dealIndex: 3, companyIndex: 1 },
    { title: "Follow up on Apex contract renewal", daysFromNow: 0, priority: "HIGH" as const, status: "TODO" as const, contactIndex: 4, dealIndex: 2, companyIndex: 1 },
    { title: "Prepare Greenfield intro deck", daysFromNow: 5, priority: "MEDIUM" as const, status: "TODO" as const, contactIndex: 6, dealIndex: 4, companyIndex: 2 },
    { title: "Review analytics requirements doc", daysFromNow: 2, priority: "HIGH" as const, status: "IN_PROGRESS" as const, contactIndex: 8, dealIndex: 5, companyIndex: 3 },
    { title: "Send data pipeline SOW", daysFromNow: -2, priority: "URGENT" as const, status: "TODO" as const, contactIndex: 9, dealIndex: 6, companyIndex: 3 },
    { title: "Call NovaBridge for technical review", daysFromNow: 7, priority: "MEDIUM" as const, status: "TODO" as const, contactIndex: 11, dealIndex: 7, companyIndex: 4 },
    { title: "Finalize CMS proposal for Coastal", daysFromNow: 4, priority: "HIGH" as const, status: "TODO" as const, contactIndex: 14, dealIndex: 9, companyIndex: 5 },
    { title: "Submit HIPAA compliance docs", daysFromNow: 1, priority: "URGENT" as const, status: "IN_PROGRESS" as const, contactIndex: 17, dealIndex: 10, companyIndex: 6 },
    { title: "Prepare security audit response", daysFromNow: 3, priority: "HIGH" as const, status: "TODO" as const, contactIndex: 18, dealIndex: 10, companyIndex: 6 },
    { title: "Draft re-engagement email for Redwood", daysFromNow: 10, priority: "LOW" as const, status: "TODO" as const, contactIndex: 20, companyIndex: 7 },
    { title: "Create IoT demo environment", daysFromNow: 5, priority: "MEDIUM" as const, status: "TODO" as const, dealIndex: 13, companyIndex: 8 },
    { title: "Research LTI 1.3 integration", daysFromNow: 8, priority: "MEDIUM" as const, status: "TODO" as const, dealIndex: 14, companyIndex: 9 },
    { title: "Update CRM with latest deal notes", daysFromNow: -3, priority: "LOW" as const, status: "DONE" as const },
    { title: "Prepare weekly pipeline report", daysFromNow: 0, priority: "MEDIUM" as const, status: "TODO" as const },
    { title: "Review contract templates", daysFromNow: -5, priority: "LOW" as const, status: "DONE" as const },
    { title: "Schedule Q2 planning meeting", daysFromNow: 14, priority: "LOW" as const, status: "TODO" as const },
    { title: "Update competitor analysis", daysFromNow: -1, priority: "MEDIUM" as const, status: "CANCELLED" as const },
    { title: "Send thank-you note to Coastal team", daysFromNow: 2, priority: "LOW" as const, status: "TODO" as const, contactIndex: 13, companyIndex: 5 },
  ];

  await Promise.all(
    tasksData.map((t) => {
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + (t.daysFromNow || 0));
      return prisma.task.create({
        data: {
          title: t.title,
          dueDate,
          priority: t.priority,
          status: t.status,
          ownerId: user.id,
          contactId: t.contactIndex !== undefined ? contacts[t.contactIndex].id : undefined,
          dealId: t.dealIndex !== undefined ? deals[t.dealIndex].id : undefined,
          companyId: t.companyIndex !== undefined ? companies[t.companyIndex].id : undefined,
        },
      });
    })
  );
  console.log("✓ Created 20 tasks");

  console.log("\n✅ Seeding complete!");
  console.log("Login: demo@opendesk.com / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
