-- AlterTable
ALTER TABLE "Combo" ADD COLUMN     "priceDown" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "priceUp" INTEGER NOT NULL DEFAULT 10000000;
