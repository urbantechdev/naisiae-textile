import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

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
            <meta name="description" content="${description}" />
            <link rel="canonical" href="https://naisiaetextiles.com/product/${productId}" />
            <meta property="og:title" content="${name} - ${price.toLocaleString()}/- | Uhuru Market Uniforms" />
            <meta property="og:description" content="${description}" />
            <meta property="og:image" content="${imageUrl}" />
            <meta property="og:url" content="https://naisiaetextiles.com/product/${productId}" />
            <meta property="og:type" content="product" />
            <meta name="twitter:card" content="summary_large_image" />
          `;
          
          let html = indexHtml.replace(/<title>.*?<\/title>/, metaTags);
          html = html.replace(/<meta name="description".*?\/>/, "");
          html = html.replace(/<link rel="canonical".*?\/>/, "");
          res.send(html);
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
            <meta name="description" content="${description}" />
            <link rel="canonical" href="https://naisiaetextiles.com/" />
            <meta property="og:title" content="${title} | ${tagline}" />
            <meta property="og:description" content="${description}" />
            <meta property="og:image" content="${imageUrl}" />
            <meta property="og:url" content="https://naisiaetextiles.com/" />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
          `;
          
          let html = indexHtml.replace(/<title>.*?<\/title>/, metaTags);
          html = html.replace(/<meta name="description".*?\/>/, "");
          html = html.replace(/<link rel="canonical".*?\/>/, "");
          res.send(html);
          return;
        }
      } catch (e) {
        console.error("SEO Middleware error (Home):", e);
      }
    }
    next();
  });

  // Generic Bot Metadata Middleware for handled routes
  app.get(["/products", "/categories", "/services", "/portfolio", "/contact", "/about", "/wholesale"], async (req, res, next) => {
    const isBot = /bot|googlebot|facebookexternalhit|twitterbot|whatsapp|bingbot|linkedinbot/i.test(req.headers["user-agent"] || "");
    
    if (isBot) {
      try {
        const requestPath = req.path;
        let title = "Uhuru Market Uniforms";
        let description = "Premium uniform manufacturing and textile solutions in Nairobi.";
        
        if (requestPath === '/products') {
          title = "Our Uniform Products | Uhuru Market Uniforms";
          description = "Browse our full catalog of custom-tailored garments. High-quality school uniforms and specialized corporate wear.";
        } else if (requestPath === '/categories') {
          title = "Uniform Categories | Uhuru Market Uniforms";
          description = "Explore our manufacturing categories including Education, Hospitality, Medical, and Corporate branding.";
        } else if (requestPath === '/services') {
          title = "Manufacturing Services | Uhuru Market Uniforms";
          description = "Bulk textile production, heavy industrial stitching, embroidery and screen printing capabilities.";
        } else if (requestPath === '/portfolio') {
          title = "Our Projects | Uhuru Market Uniforms";
          description = "See examples of bulk uniform orders we have successfully delivered across Kenya.";
        } else if (requestPath === '/contact') {
          title = "Contact Us | Uhuru Market Uniforms";
          description = "Get in touch for bulk orders. Call +254792021795 or visit Uhuru Market, Nairobi.";
        } else if (requestPath === '/about') {
          title = "About Naisiae Textiles | Uhuru Market Uniforms";
          description = "Leaders in institutional uniform manufacturing at Uhuru Market since inception.";
        } else if (requestPath === '/wholesale') {
          title = "Wholesale Uniform Deals | Uhuru Market Uniforms";
          description = "Specialized bulk pricing for schools and institutions. Get factory-direct rates.";
        }

        const indexHtml = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
        const canonical = `<link rel="canonical" href="https://naisiaetextiles.com${requestPath}" />`;
        const metaTags = `
          <title>${title}</title>
          <meta name="description" content="${description}" />
          ${canonical}
          <meta property="og:title" content="${title}" />
          <meta property="og:description" content="${description}" />
          <meta property="og:url" content="https://naisiaetextiles.com${requestPath}" />
          <meta property="og:type" content="website" />
        `;
        
        // Remove existing tags that we are replacing to avoid duplicates
        let html = indexHtml.replace(/<title>.*?<\/title>/, metaTags);
        html = html.replace(/<meta name="description".*?\/>/, "");
        html = html.replace(/<link rel="canonical".*?\/>/, "");
        
        res.send(html);
        return;
      } catch (e) {
        console.error("SEO Middleware error (Pages):", e);
      }
    }
    next();
  });

  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode...`);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa", 
    });
    app.use(vite.middlewares);
    
    // Improved SPA fallback for development
    app.get('*', async (req, res, next) => {
      // Skip API routes
      if (req.originalUrl.startsWith('/api/')) {
        return next();
      }

      const url = req.originalUrl;
      try {
        const templatePath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(templatePath, 'utf-8');
        // Inject Vite transform
        const html = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        console.error("Vite fallback error:", e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
      console.error(`ERROR: Production mode detected but 'dist' directory not found at ${distPath}`);
    }
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
