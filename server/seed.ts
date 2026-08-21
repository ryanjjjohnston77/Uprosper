import { storage } from "./storage";

async function seed() {
  console.log("Seeding database...");

  // Create sample clients
  const client1 = await storage.createClient({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+44 7700 900000",
    status: "Active",
    mortgageValue: "245000",
    renewalDate: "Dec 2025",
    lastContact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    brokerId: 1,
  });

  const client2 = await storage.createClient({
    name: "Sarah Smith",
    email: "sarah.smith@example.com",
    phone: "+44 7700 900001",
    status: "Pending",
    mortgageValue: "310000",
    renewalDate: "Mar 2026",
    lastContact: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    brokerId: 1,
  });

  const client3 = await storage.createClient({
    name: "Michael Johnson",
    email: "michael.j@example.com",
    phone: "+44 7700 900002",
    status: "Active",
    mortgageValue: "180000",
    renewalDate: "Aug 2024",
    lastContact: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    brokerId: 1,
  });

  const client4 = await storage.createClient({
    name: "Emily Brown",
    email: "emily.brown@example.com",
    phone: "+44 7700 900003",
    status: "Review",
    mortgageValue: "420000",
    renewalDate: "Jan 2025",
    lastContact: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    brokerId: 1,
  });

  const client5 = await storage.createClient({
    name: "David Wilson",
    email: "david.wilson@example.com",
    phone: "+44 7700 900004",
    status: "Active",
    mortgageValue: "290000",
    renewalDate: "Nov 2025",
    lastContact: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    brokerId: 1,
  });

  // Create journey steps for client 1 (John Doe)
  await storage.createJourneyStep({
    clientId: client1.id,
    stepId: 1,
    stepTitle: "Secure Mortgage",
    status: "completed",
    completedAt: new Date("2023-12-01"),
  });

  await storage.createJourneyStep({
    clientId: client1.id,
    stepId: 2,
    stepTitle: "Investment ISA",
    status: "current",
  });

  await storage.createJourneyStep({
    clientId: client1.id,
    stepId: 3,
    stepTitle: "Family Savings ISA",
    status: "locked",
  });

  await storage.createJourneyStep({
    clientId: client1.id,
    stepId: 4,
    stepTitle: "Wealth Review",
    status: "locked",
  });

  await storage.createJourneyStep({
    clientId: client1.id,
    stepId: 5,
    stepTitle: "Retirement Plan",
    status: "locked",
  });

  await storage.createJourneyStep({
    clientId: client1.id,
    stepId: 6,
    stepTitle: "Will & Succession",
    status: "locked",
  });

  // Create rewards for client 1
  await storage.createReward({
    clientId: client1.id,
    type: "coffee",
    title: "It's Coffee Time!",
    description: "A thank you for being a valued client. Enjoy a coffee on us at your local cafe.",
    claimed: false,
  });

  // Create offers for client 1
  await storage.createOffer({
    clientId: client1.id,
    type: "insurance",
    title: "Income Protection",
    description: "Exclusive offer for mortgage holders. Protect your payments starting from £12/mo.",
    value: "£12/mo",
    status: "active",
  });

  await storage.createOffer({
    clientId: client1.id,
    type: "wealth",
    title: "Prosperity Bonus",
    description: "Open a Stocks & Shares ISA this month and we'll add £50 to kickstart your growth.",
    value: "£50 bonus",
    status: "active",
  });

  // Create notifications for client 1
  await storage.createNotification({
    clientId: client1.id,
    type: "payment",
    title: "Mortgage Payment Reminder",
    message: "Your monthly payment of £1,245 is due in 3 days.",
    read: false,
  });

  // Add offers for other clients
  await storage.createOffer({
    clientId: client2.id,
    type: "insurance",
    title: "Life Cover",
    description: "Protect your family's future with life insurance.",
    value: "Quote available",
    status: "active",
  });

  await storage.createOffer({
    clientId: client3.id,
    type: "wealth",
    title: "ISA Upgrade",
    description: "Boost your savings with our enhanced ISA rates.",
    value: "4.5% AER",
    status: "active",
  });

  await storage.createOffer({
    clientId: client3.id,
    type: "insurance",
    title: "Home Insurance",
    description: "Comprehensive home insurance at competitive rates.",
    value: "From £15/mo",
    status: "active",
  });

  await storage.createOffer({
    clientId: client3.id,
    type: "pension",
    title: "Pension Review",
    description: "Free pension review and planning session.",
    value: "Free consultation",
    status: "active",
  });

  await storage.createOffer({
    clientId: client5.id,
    type: "mortgage",
    title: "Remortgage Opportunity",
    description: "Better rates available for your upcoming renewal.",
    value: "Save up to £200/mo",
    status: "active",
  });

  console.log("Database seeded successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
