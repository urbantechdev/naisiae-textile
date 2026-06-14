import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get package root ES equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

async function generateMerchantFeed() {
  console.log("Starting Google Merchant feed generator script...");

  let productsList: any[] = [];
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
      const productsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/products?pageSize=300`;
      const pResp = await fetch(productsUrl);
      const pData = await pResp.json();
      if (pData.documents) {
        productsList = pData.documents;
      }
    }
  } catch (e: any) {
    console.warn("Could not query products for merchant feed generation in script:", e.message);
  }

  // Helper functions for parsing Firestore typed fields safely
  const getVal = (field: any) => {
    if (!field) return undefined;
    if ('stringValue' in field) return field.stringValue;
    if ('integerValue' in field) return parseInt(field.integerValue, 10);
    if ('doubleValue' in field) return parseFloat(field.doubleValue);
    if ('booleanValue' in field) return field.booleanValue;
    return undefined;
  };

  const escapeXml = (unsafe: string): string => {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  const truncateDesc = (text: string, limit: number = 85): string => {
    if (!text) return "";
    if (text.length <= limit) return text;
    return text.substring(0, limit - 3) + "...";
  };

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n`;
  xml += `  <channel>\n`;
  xml += `    <title>${escapeXml("Naisiae Textiles | Google Merchant Product Feed")}</title>\n`;
  xml += `    <link>https://naisiaetextiles.com</link>\n`;
  xml += `    <description>${escapeXml("Premium Uhuru Market Uniforms in Nairobi. High school uniforms, college sweaters.")}</description>\n`;
  xml += `    <language>en-us</language>\n`;
  xml += `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;

  productsList.forEach((doc: any) => {
    try {
      const fields = doc.fields || {};
      const isProductActive = fields.active ? getVal(fields.active) : true;
      
      if (isProductActive === false) return;

      const id = doc.name.split('/').pop() || '';
      const name = escapeXml(getVal(fields.name) || 'Premium Textiles Apparel');
      const rawDesc = getVal(fields.description) || `${name} manufactured at Naisiae Textiles in Uhuru Market, Nairobi. Industry-grade fabric constructed for daily wear.`;
      const desc = escapeXml(truncateDesc(rawDesc, 85));
      
      const link = `https://naisiaetextiles.com/products/?product=${encodeURIComponent(id)}`;
      
      let imageUrl = getVal(fields.imageUrl);
      if (!imageUrl && fields.imageUrls) {
        const urlsData = fields.imageUrls.arrayValue?.values || [];
        if (urlsData.length > 0) {
          imageUrl = urlsData[0].stringValue;
        }
      }
      if (!imageUrl) {
        imageUrl = "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80";
      }
      const cleanImageUrl = escapeXml(imageUrl);

      const priceVal = fields.price ? getVal(fields.price) : 1000;
      const cleanPrice = `${priceVal ? Number(priceVal) : 1000} KES`;

      const category = getVal(fields.category) || 'School Uniforms';
      const subCategory = getVal(fields.subCategory) || 'Apparel';
      
      let googleCategory = 'Apparel &amp; Accessories &gt; Clothing &gt; Uniforms';
      if (category.toLowerCase().includes('chef')) {
        googleCategory = 'Apparel &amp; Accessories &gt; Clothing &gt; Uniforms &gt; Food Service Uniforms';
      } else if (category.toLowerCase().includes('corporate') || category.toLowerCase().includes('branding')) {
        googleCategory = 'Apparel &amp; Accessories &gt; Clothing &gt; Office wear';
      }

      const stockCount = fields.stock ? Number(getVal(fields.stock)) : 100;
      const availability = stockCount > 0 ? 'in_stock' : 'out_of_stock';

      xml += `    <item>\n`;
      xml += `      <g:id>${escapeXml(id)}</g:id>\n`;
      xml += `      <g:title>${name}</g:title>\n`;
      xml += `      <g:description>${desc}</g:description>\n`;
      xml += `      <g:link>${escapeXml(link)}</g:link>\n`;
      xml += `      <g:image_link>${cleanImageUrl}</g:image_link>\n`;
      xml += `      <g:condition>new</g:condition>\n`;
      xml += `      <g:availability>${availability}</g:availability>\n`;
      xml += `      <g:price>${cleanPrice}</g:price>\n`;
      xml += `      <g:brand>Naisiae Textiles</g:brand>\n`;
      xml += `      <g:google_product_category>${googleCategory}</g:google_product_category>\n`;
      xml += `      <g:product_type>${escapeXml(category)} &gt; ${escapeXml(subCategory)}</g:product_type>\n`;
      xml += `      <g:shipping>\n`;
      xml += `        <g:country>KE</g:country>\n`;
      xml += `        <g:service>Standard Delivery</g:service>\n`;
      xml += `        <g:price>350 KES</g:price>\n`;
      xml += `      </g:shipping>\n`;
      xml += `    </item>\n`;
    } catch (itemErr: any) {
      console.warn("Error rendering item in merchant feed script:", itemErr.message);
    }
  });

  xml += `  </channel>\n`;
  xml += `</rss>`;

  const publicPath = path.join(rootDir, "public");
  const distPath = path.join(rootDir, "dist");

  // Ensure public folder exists
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath, { recursive: true });
  }

  // Write both files to public folder
  fs.writeFileSync(path.join(publicPath, "merchant-feed.xml"), xml, "utf-8");
  fs.writeFileSync(path.join(publicPath, "google-merchant-feed.xml"), xml, "utf-8");
  console.log("Successfully wrote merchant-feed.xml and google-merchant-feed.xml to /public");

  // Ensure dist folder exists if we write to it
  if (fs.existsSync(distPath)) {
    fs.writeFileSync(path.join(distPath, "merchant-feed.xml"), xml, "utf-8");
    fs.writeFileSync(path.join(distPath, "google-merchant-feed.xml"), xml, "utf-8");
    console.log("Successfully wrote merchant-feed.xml and google-merchant-feed.xml to /dist");
  }
}

generateMerchantFeed().catch(console.error);
