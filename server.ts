import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { GoogleGenAI, SchemaType } from "@google/genai";

// ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gemini AI Setup (Server-side)
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || "");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API route for Gemini AI Generation
  app.post("/api/ai/generate-product", async (req, res) => {
    try {
      const { base64Image, mimeType } = req.body;
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key not configured on server" });
      }

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `Analyze this image of a textile/apparel product and generate professional product details. 
      Categories: 'School Uniforms', 'College Wear', 'Corporate Wear', 'Sports Kits', 'Healthcare', 'Hospitality', 'Branding & Print'.
      Provide a competitive price suggestion in Kenyan Shillings (KSH).`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();
      // Try to extract JSON if it's wrapped in triple backticks
      const cleaned = text.replace(/```json|```/g, "").trim();
      res.json(JSON.parse(cleaned));
    } catch (error) {
      console.error("Gemini Server Error:", error);
      res.status(500).json({ error: "Failed to generate product via AI" });
    }
  });

  app.post("/api/ai/analyze-batch", async (req, res) => {
    try {
      const { products } = req.body;
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key not configured on server" });
      }

      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              analyzedProducts: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    originalName: { type: SchemaType.STRING },
                    suggestedName: { type: SchemaType.STRING },
                    suggestedCategory: { type: SchemaType.STRING },
                    suggestedSubCategory: { type: SchemaType.STRING },
                    suggestedTags: { 
                      type: SchemaType.ARRAY,
                      items: { type: SchemaType.STRING }
                    },
                    isIssueFound: { type: SchemaType.BOOLEAN },
                    issueDescription: { type: SchemaType.STRING }
                  },
                  required: ["originalName", "suggestedCategory", "isIssueFound"]
                }
              }
            }
          }
        }
      });
      
      const prompt = `Analyze this batch of apparel products for a Kenyan textile company called Uhuru Market Uniforms.
      Valid Categories: 'School Uniforms', 'College Wear', 'Corporate Wear', 'Sports Kits', 'Healthcare', 'Hospitality', 'Branding & Print'.
      
      For each product:
      1. Verify if the category matches the name.
      2. Suggest missing tags (e.g., 'Wholesale', 'Custom', 'Cotton').
      3. Identify if the sub-category is appropriate.
      
      Products to analyze:
      ${JSON.stringify(products.map((p: any) => ({ name: p.name, category: p.category, description: p.description })))}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      res.json(JSON.parse(response.text()));
    } catch (error) {
      console.error("Gemini Batch Analysis Error:", error);
      res.status(500).json({ error: "Failed to analyze batch via AI" });
    }
  });

  app.post("/api/ai/generate-description", async (req, res) => {
    try {
      const { name, category, tags } = req.body;
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Generate a professional, compelling marketing description for a product:
      Name: ${name}
      Category: ${category}
      Tags: ${tags.join(', ')}
       Concise (2-3 paragraphs), high quality emphasis. Return ONLY text.`;

      const result = await model.generateContent(prompt);
      res.json({ description: result.response.text() });
    } catch (error) {
       res.status(500).json({ error: "Failed to generate description" });
    }
  });

  // API route to resolve social/short links (like Canva) to direct image URLs
  app.get("/api/resolve-image", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) return res.status(400).json({ error: "Missing URL" });

    try {
      // Follow redirects to get the real page
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
        },
        redirect: 'follow'
      });
      
      const contentType = response.headers.get("content-type");
      if (contentType?.startsWith("image/")) {
         return res.json({ resolvedUrl: targetUrl });
      }

      const html = await response.text();
      
      // Look for og:image or twitter:image
      const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || 
                           html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
      
      if (ogImageMatch && ogImageMatch[1]) {
        return res.json({ resolvedUrl: ogImageMatch[1] });
      }

      const twitterImageMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
      if (twitterImageMatch && twitterImageMatch[1]) {
        return res.json({ resolvedUrl: twitterImageMatch[1] });
      }

      // Special handling for Canva embeds if redirect leads to a design page
      // Often the image is in a schema or more complex meta
      res.json({ resolvedUrl: targetUrl }); // Fallback
    } catch (error) {
      console.error("Link resolution error:", error);
      res.status(500).json({ error: "Failed to resolve URL" });
    }
  });

  // Simple SEO middleware for social media crawlers
  app.get("/product/:productId", async (req, res, next) => {
    const isBot = /bot|googlebot|facebookexternalhit|twitterbot|whatsapp|bingbot|linkedinbot/i.test(req.headers["user-agent"] || "");
    
    if (isBot) {
      const productId = req.params.productId;
      try {
        const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8"));
        const projectId = config.projectId;
        const databaseId = config.firestoreDatabaseId || "(default)";
        
        // Fetch product via REST API (publicly accessible)
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/products/${productId}`;
        const response = await fetch(firestoreUrl);
        const productData = await response.json();
        
        const indexHtml = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
        
        if (productData.fields) {
          const name = productData.fields.name?.stringValue || "Product";
          const description = productData.fields.description?.stringValue || "Quality school uniforms and corporate wear.";
          const imageUrl = productData.fields.imageUrl?.stringValue || "";
          const price = productData.fields.price?.doubleValue || productData.fields.price?.integerValue || 0;

          const metaTags = `
            <title>${name} | Uhuru Market Uniforms</title>
            <meta property="og:title" content="${name} - KES ${price.toLocaleString()} | Uhuru Market Uniforms" />
            <meta property="og:description" content="${description}" />
            <meta property="og:image" content="${imageUrl}" />
            <meta property="og:type" content="product" />
            <meta name="twitter:card" content="summary_large_image" />
          `;
          
          res.send(indexHtml.replace('<title>Uhuru Market Uniforms - Premium Uniforms & Branding</title>', metaTags));
          return;
        }
      } catch (e) {
        console.error("SEO Middleware error (Product):", e);
      }
    }
    next();
  });

  app.get("/", async (req, res, next) => {
    const isBot = /bot|googlebot|facebookexternalhit|twitterbot|whatsapp|bingbot|linkedinbot/i.test(req.headers["user-agent"] || "");
    
    if (isBot) {
      try {
        const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8"));
        const projectId = config.projectId;
        const databaseId = config.firestoreDatabaseId || "(default)";
        
        // Fetch settings via REST API
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/settings/site`;
        const response = await fetch(firestoreUrl);
        const settingsData = await response.json();
        
        const indexHtml = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
        
        if (settingsData.fields) {
          const title = settingsData.fields.sharingTitle?.stringValue || settingsData.fields.siteName?.stringValue || "Uhuru Market Uniforms";
          const tagline = settingsData.fields.siteTagline?.stringValue || "Uniforms & Branding";
          const description = settingsData.fields.sharingDescription?.stringValue || "Quality school uniforms and corporate wear.";
          const imageUrl = settingsData.fields.sharingImage?.stringValue || settingsData.fields.siteLogo?.stringValue || "";

          const metaTags = `
            <title>${title} | ${tagline}</title>
            <meta property="og:title" content="${title} | ${tagline}" />
            <meta property="og:description" content="${description}" />
            <meta property="og:image" content="${imageUrl}" />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
          `;
          
          res.send(indexHtml.replace('<title>Uhuru Market Uniforms - Premium Uniforms & Branding</title>', metaTags));
          return;
        }
      } catch (e) {
        console.error("SEO Middleware error (Home):", e);
      }
    }
    next();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
