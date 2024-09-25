import { readFile, writeFile } from "fs/promises";

interface Document {
  documentID: string;
  data: {
    type: string;
    url: string;
  };
  updatedAt: string;
}

const API_KEY = Bun.env.VOICEFLOW_API_KEY;
const KB_DOCS_URL = "https://api.voiceflow.com/v1/knowledge-base/docs";
const KB_UPLOAD_URL = "https://api.voiceflow.com/v3alpha/knowledge-base/docs/upload";

export async function getExistingDocs(apiKey: string): Promise<Document[]> {
  let allDocs: Document[] = [];
  let cursor: string | null = null;

  do {
    const url = cursor ? `${KB_DOCS_URL}?cursor=${cursor}` : KB_DOCS_URL;
    const response = await fetch(url, {
      headers: { Authorization: apiKey },
    });
    const data = await response.json() as { documents: any[]; cursor: string | null };
    allDocs = allDocs.concat(data.documents);
    cursor = data.cursor;
  } while (cursor);

  return allDocs;
}

export async function uploadDocument(url: string, overwrite: boolean, apiKey: string) {
  const response = await fetch(`${KB_UPLOAD_URL}?overwrite=${overwrite}`, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        type: "url",
        url: url,
      },
    }),
  });

  if (!response.ok) {
    if (response.status === 409 && !overwrite) {
      return false; // Document already exists and overwrite is false
    } else {
      throw new Error(`Failed to upload document: ${response.statusText}`);
    }
  }

  const result = await response.json();

  if (result && typeof result === 'object' && 'data' in result && typeof result.data === 'object') {
    await updateLocalDb(result.data as Document);
    return true; // Document was updated
  } else {
    console.error('Invalid API response:', result);
    return false;
  }
}

async function updateLocalDb(document: Document) {
  const dbPath = "./db/documents.json";
  let documents: Document[] = [];
  try {
    const data = await readFile(dbPath, "utf8");
    documents = JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is empty, start with an empty array
  }

  if (document && document.documentID) {
    const index = documents.findIndex(doc => doc.documentID === document.documentID);

    if (index !== -1) {
      documents[index] = document; // Update existing document
    } else {
      documents.push(document); // Add new document
    }
  } else {
    console.error('Document is undefined or missing documentID');
  }

  await writeFile(dbPath, JSON.stringify(documents, null, 2));
}

