import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface ResourceImportData {
  title: string;
  url: string;
  type: string;
  role: string;
  targetSkillNames: string[];
}

async function importResources() {
  console.log('Starting resource import...');
  const dataPath = path.join(process.cwd(), 'data', 'resources.json');
  
  if (!fs.existsSync(dataPath)) {
    console.error('Resource data file not found at:', dataPath);
    process.exit(1);
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const resources: ResourceImportData[] = JSON.parse(rawData);

  let successCount = 0;

  for (const res of resources) {
    // Check if resource already exists to avoid duplicates
    let resourceRecord = await prisma.resource.findFirst({
      where: { url: res.url }
    });

    if (!resourceRecord) {
      resourceRecord = await prisma.resource.create({
        data: {
          title: res.title,
          url: res.url,
          type: res.type,
          role: res.role,
        }
      });
    }

    // Map resource to skills based on skill names
    for (const skillName of res.targetSkillNames) {
      const skillRecord = await prisma.skill.findFirst({
        where: { name: skillName }
      });

      if (skillRecord) {
        // Upsert the mapping
        const existingMapping = await prisma.resourceSkill.findUnique({
          where: {
            resourceId_skillId: {
              resourceId: resourceRecord.id,
              skillId: skillRecord.id
            }
          }
        });

        if (!existingMapping) {
          await prisma.resourceSkill.create({
            data: {
              resourceId: resourceRecord.id,
              skillId: skillRecord.id
            }
          });
        }
      } else {
        console.warn(`Warning: Skill '${skillName}' not found in database. Skipping mapping for resource '${res.title}'.`);
      }
    }
    
    successCount++;
  }

  console.log(`Successfully imported and mapped ${successCount} resources.`);
}

importResources()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
