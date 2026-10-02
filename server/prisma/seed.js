const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const categories = [
  { name: 'Poleras',    iconKey: 'Poleras',    sizeType: 'LETTER' },
  { name: 'Camisas',    iconKey: 'Camisas',    sizeType: 'LETTER' },
  { name: 'Polos',      iconKey: 'Polos',      sizeType: 'LETTER' },
  { name: 'Chaquetas',  iconKey: 'Chaquetas',  sizeType: 'LETTER' },
  { name: 'Vestidos',   iconKey: 'Vestidos',   sizeType: 'LETTER' },
  { name: 'Pantalones', iconKey: 'Pantalones', sizeType: 'NUMERIC' },
  { name: 'Jeans',      iconKey: 'Pantalones', sizeType: 'NUMERIC' },
  { name: 'Shorts',     iconKey: 'Pantalones', sizeType: 'NUMERIC' },
  { name: 'Zapatos',    iconKey: 'Pantalones', sizeType: 'SHOES' },
];

async function main() {
  console.log('🌱 Ejecutando seed de categorías...');

  for (const category of categories) {

    const existing = await prisma.category.findFirst({
      where: {
        name: category.name,
      },
    });

    if (existing) {
      await prisma.category.update({
        where: {
          id: existing.id,
        },
        data: {
          iconKey: category.iconKey,
          sizeType: category.sizeType,
        },
      });

      console.log(`🔄 ${category.name} actualizada`);
    } else {
      const created = await prisma.category.create({
        data: category,
      });

      console.log(
        `✅ ${created.name} creada con ID ${created.id}`
      );
    }
  }

  console.log('✅ Seed finalizado correctamente.');
}

main()
  .catch((error) => {
    console.error('❌ Error ejecutando seed:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });