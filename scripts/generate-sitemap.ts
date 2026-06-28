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
    'returns',
    'fabric-gallery',
    'uniform-simulator'
  ];

  let blogsList: any[] = [];
  let productsList: any[] = [];
  
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

  // Fetch blogs
  try {
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

  // Fetch products
  try {
    if (projectId) {
      const productsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/products`;
      const pResp = await fetch(productsUrl);
      const pData = await pResp.json();
      if (pData.documents) {
        productsList = pData.documents;
      }
    }
  } catch (e) {
    console.warn("Could not query products for sitemap generation in script:", e);
  }

  const countries = [
    { prefix: '', isDefault: true },
    { prefix: 'tanzania', isDefault: false },
    { prefix: 'dr-congo', isDefault: false },
    { prefix: 'uganda', isDefault: false },
    { prefix: 'ethiopia', isDefault: false }
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // 1. Static Pages with country prefixing and trailing slashes
  countries.forEach(({ prefix }) => {
    const countryPart = prefix ? `/${prefix}` : '';
    staticPages.forEach((page) => {
      const pagePart = page ? `/${page}` : '';
      let loc = '';
      if (!countryPart && !pagePart) {
        loc = 'https://naisiaetextiles.com/';
      } else {
        loc = `https://naisiaetextiles.com${countryPart}${pagePart}/`;
      }
      xml += `  <url>\n`;
      xml += `    <loc>${loc}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n`;
      xml += `  </url>\n`;
    });
  });

  // 2. Dynamic products with country prefixing and trailing slashes
  countries.forEach(({ prefix }) => {
    const countryPart = prefix ? `/${prefix}` : '';
    productsList.forEach((doc: any) => {
      try {
        const id = doc.name.split('/').pop();
        if (!id) return;
        const loc = `https://naisiaetextiles.com${countryPart}/product/${id}/`;
        xml += `  <url>\n`;
        xml += `    <loc>${loc}</loc>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.9</priority>\n`;
        xml += `  </url>\n`;
      } catch (err) {}
    });
  });

  // 3. Dynamic blog posts with country prefixing
  countries.forEach(({ prefix }) => {
    const countryPart = prefix ? `/${prefix}` : '';
    blogsList.forEach((doc: any) => {
      try {
        const fields = doc.fields;
        const slug = fields.slug?.stringValue || doc.name.split('/').pop();
        const loc = `https://naisiaetextiles.com${countryPart}/blog/?post=${slug}`;
        xml += `  <url>\n`;
        xml += `    <loc>${loc}</loc>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
      } catch (err) {}
    });
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
