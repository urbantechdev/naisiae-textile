import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get package root ES equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

async function generateSitemap() {
  console.log("Starting sitemap generator script...");
  
  const staticPages = [
    '',
    'about',
    'services',
    'products',
    'categories',
    'portfolio',
    'wholesale',
    'contact',
    'faq',
    'blog',
    'careers',
    'privacy',
    'terms',
    'shipping',
    'returns'
  ];

  let blogsList: any[] = [];
  try {
    const configPath = path.join(rootDir, "firebase-applet-config.json");
    let projectId = "";
    let databaseId = "(default)";

    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      projectId = config.projectId;
      databaseId = config.firestoreDatabaseId || "(default)";
    } else {
      projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "";
      databaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "(default)";
    }

    if (projectId) {
      const blogsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/blogs`;
      const bResp = await fetch(blogsUrl);
      const bData = await bResp.json();
      if (bData.documents) {
        blogsList = bData.documents;
      }
    }
  } catch (e) {
    console.warn("Could not query blogs for sitemap generation in script:", e);
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Static Pages with trailing slashes
  staticPages.forEach((page) => {
    const slash = page === '' ? '' : '/';
    xml += `  <url>\n`;
    xml += `    <loc>https://naisiaetextiles.com/${page}${slash}</loc>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n`;
    xml += `  </url>\n`;
  });

  // Dynamic blog posts with trailing slashes
  blogsList.forEach((doc: any) => {
    try {
      const fields = doc.fields;
      const slug = fields.slug?.stringValue || doc.name.split('/').pop();
      xml += `  <url>\n`;
      xml += `    <loc>https://naisiaetextiles.com/blog/?post=${slug}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    } catch (err) {}
  });

  xml += `</urlset>`;

  const publicPath = path.join(rootDir, "public");
  const distPath = path.join(rootDir, "dist");

  // Write to public folder
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath, { recursive: true });
  }
  fs.writeFileSync(path.join(publicPath, "sitemap.xml"), xml, "utf-8");
  console.log("Successfully wrote sitemap.xml to /public");

  // Write to dist folder if it exists
  if (fs.existsSync(distPath)) {
    fs.writeFileSync(path.join(distPath, "sitemap.xml"), xml, "utf-8");
    console.log("Successfully wrote sitemap.xml to /dist");
  }
}

generateSitemap().catch(console.error);
