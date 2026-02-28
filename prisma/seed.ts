import { PrismaClient } from "../app/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("change-this-password", 12);

  await prisma.admin.upsert({
    where: { email: "admin@yoursite.com" },
    update: {},
    create: {
      email: "admin@yoursite.com",
      password: hashedPassword,
    },
  });

  console.log("✓ Admin account seeded: admin@yoursite.com");
  console.log("  Password: change-this-password");
  console.log("  ⚠  Change this immediately after first login!");

  // Seed sample articles for development
  const sampleArticles = [
    {
      title: "Why I Wrote This Book",
      slug: "why-i-wrote-this-book",
      excerpt:
        "Every book starts with a question that won't leave you alone. This is the story of mine.",
      content: `## The Question That Started It All\n\nSome ideas refuse to let go. For years, the concept behind this book lived rent-free in my mind...\n\n## The Writing Process\n\nWriting a book is an act of sustained obsession. You have to believe, against all evidence some days, that the story matters enough to tell.\n\n## What I Hope You Take Away\n\nIf you walk away with one thing, I hope it's this: [key insight placeholder].`,
      published: true,
    },
    {
      title: "The Research Behind the Story",
      slug: "the-research-behind-the-story",
      excerpt:
        "Three years of research distilled into a narrative. Here's what I discovered along the way.",
      content: `## Where the Research Began\n\nThe archives don't give up their secrets easily. My first visit to [location placeholder] was humbling...\n\n## Unexpected Discoveries\n\nThe most interesting findings are always the ones you weren't looking for...\n\n## How Research Shapes Story\n\nFacts constrain and liberate simultaneously. Every real detail grounds the narrative in something larger than invention.`,
      published: true,
    },
    {
      title: "Draft: Upcoming Chapter Notes",
      slug: "draft-upcoming-chapter-notes",
      excerpt: "Working notes for the next installment.",
      content: `## Chapter Notes\n\n- Point A\n- Point B\n- Point C\n\n## Open Questions\n\n[Notes to self — this is a draft]`,
      published: false,
    },
  ];

  for (const article of sampleArticles) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {},
      create: article,
    });
    console.log(`✓ Article: "${article.title}"`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
