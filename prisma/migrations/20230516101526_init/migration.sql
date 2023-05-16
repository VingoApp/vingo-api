-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "endpoint" TEXT,
    "public_key" TEXT,
    "auth_token" TEXT,
    "userId" INTEGER,
    "expire_date" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Notification_auth_token_key" ON "Notification"("auth_token");
