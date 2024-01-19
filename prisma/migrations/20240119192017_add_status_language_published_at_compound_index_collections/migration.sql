-- CreateIndex
CREATE INDEX `Collection_status_language_publishedAt_idx` ON `Collection`(`status`, `language`, `publishedAt`);
