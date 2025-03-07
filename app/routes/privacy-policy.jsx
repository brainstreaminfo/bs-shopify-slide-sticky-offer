import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const loader = async () => {
  const filePath = path.join(__dirname, "../../public/privacy-policy.html");

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return new Response(content, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    return new Response("File not found", { status: 404 });
  }
};