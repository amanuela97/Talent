/*
  Warnings:

  - Added the required column `userReplyId` to the `Reply` table without a default value. This is not possible if the table is not empty.

*/
-- First add the column as nullable
ALTER TABLE "Reply" ADD COLUMN "userReplyId" TEXT;

-- Update existing replies to use the talent's user ID
UPDATE "Reply" r
SET "userReplyId" = (
  SELECT t."talentId"
  FROM "Review" rev
  JOIN "Talent" t ON t."talentId" = rev."talentReviewId"
  WHERE rev."reviewId" = r."reviewReplyId"
);

-- Now make the column required
ALTER TABLE "Reply" ALTER COLUMN "userReplyId" SET NOT NULL;

-- Add the foreign key constraint
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_userReplyId_fkey" FOREIGN KEY ("userReplyId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
