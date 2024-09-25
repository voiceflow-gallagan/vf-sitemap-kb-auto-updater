import { uploadDocument } from "./kbManager";

interface QueueItem {
  url: string;
  overwrite: boolean;
  apiKey: string;
}

const queue: QueueItem[] = [];
let isProcessing = false;
let processedCount = 0;

export function addToQueue(item: QueueItem) {
  queue.push(item);
}

export async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  while (queue.length > 0) {
    const item = queue.shift();
    if (item) {
      const result = await uploadDocument(item.url, item.overwrite, item.apiKey);
      if (result) {
        console.log(`Updated document: ${item.url}`);
        processedCount++;
      }
    }
  }

  isProcessing = false;
  console.log(`Processing completed. Updated ${processedCount} documents.`);
}

export function getQueueStatus() {
  return {
    isProcessing,
    remaining: queue.length,
    processed: processedCount,
  };
}

export function resetProcessedCount() {
  processedCount = 0;
}
