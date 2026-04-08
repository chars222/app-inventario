-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "discountPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gallery" TEXT[],
ADD COLUMN     "imageUrl" TEXT;
