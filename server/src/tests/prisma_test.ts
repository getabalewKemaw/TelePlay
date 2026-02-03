import prisma from '../lib/prisma.js';

async function test() {
    try {
        const count = await prisma.mediaFile.count();
        console.log(`Connection successful. MediaFile count: ${count}`);

        // Test creation
        const testFile = await prisma.mediaFile.create({
            data: {
                filename: 'test.mp3',
                originalPath: '/tmp/test.mp3',
                duration: 120,
                status: 'pending'
            }
        });
        console.log(`Created test file with ID: ${testFile.id}`);

        // Cleanup
        await prisma.mediaFile.delete({ where: { id: testFile.id } });
        console.log('Cleanup successful');

    } catch (err) {
        console.error("Prisma test error:", err);
    } finally {
        await prisma.$disconnect();
    }
}

test();
