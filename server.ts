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
    try {
      const productId = req.params.productId;
      const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8"));
      const projectId = config.projectId;
      const databaseId = config.firestoreDatabaseId || "(default)";
      
      // Fetch settings for global state and logo preload
      const settingsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/settings/site`;
      const settingsResponse = await fetch(settingsUrl);
      const settingsData = await settingsResponse.json();
      
      let siteSettings = {
        siteName: "Uhuru Market Uniforms",
        siteTagline: "Naisiae Textiles Nairobi",
        siteLogo: "",
        sharingImage: ""
      };
      
      if (settingsData.fields) {
        siteSettings = {
          siteName: settingsData.fields.siteName?.stringValue || "Uhuru Market Uniforms",
          siteTagline: settingsData.fields.siteTagline?.stringValue || "Naisiae Textiles Nairobi",
          siteLogo: settingsData.fields.siteLogo?.stringValue || "",
          sharingImage: settingsData.fields.sharingImage?.stringValue || ""
        };
      }

      // Fetch product data
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/products/${productId}`;
      const response = await fetch(firestoreUrl);
      const productData = await response.json();
      
      const indexHtml = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
      
      if (productData.fields) {
        const name = productData.fields.name?.stringValue || "Product";
        const description = productData.fields.description?.stringValue || "Quality School Uniforms and corporate wear.";
        const imageUrl = productData.fields.imageUrl?.stringValue || "";
        const price = productData.fields.price?.doubleValue || productData.fields.price?.integerValue || 0;

        const logoUrl = siteSettings.siteLogo;
        const preloadTags = logoUrl ? `<link rel="preload" as="image" href="${logoUrl}" fetchpriority="high">` : "";
        const injectSettings = `<script>window.__PRELOADED_SETTINGS__ = ${JSON.stringify(siteSettings)};</script>`;

        const metaTags = `
          <title>${name} | Uhuru Market Uniforms Nairobi</title>
          <meta name="description" content="${description}" />
          <link rel="canonical" href="https://naisiaetextiles.com/product/${productId}" />
          <meta property="og:title" content="${name} - ${price.toLocaleString()}/- | Uhuru Market Uniforms" />
          <meta property="og:description" content="${description}" />
          <meta property="og:image" content="${imageUrl}" />
          <meta property="og:url" content="https://naisiaetextiles.com/product/${productId}" />
          <meta property="og:type" content="product" />
          <meta name="twitter:card" content="summary_large_image" />
          ${preloadTags}
          ${injectSettings}
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
    next();
  });

  app.get("/", async (req, res, next) => {
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
        const siteSettings = {
          siteName: settingsData.fields.siteName?.stringValue || "Uhuru Market Uniforms",
          siteTagline: settingsData.fields.siteTagline?.stringValue || "Naisiae Textiles Nairobi",
          siteLogo: settingsData.fields.siteLogo?.stringValue || "",
          sharingImage: settingsData.fields.sharingImage?.stringValue || "",
          sharingTitle: settingsData.fields.sharingTitle?.stringValue || "",
          sharingDescription: settingsData.fields.sharingDescription?.stringValue || ""
        };

        const title = siteSettings.sharingTitle || `${siteSettings.siteName} | ${siteSettings.siteTagline}`;
        const tagline = siteSettings.siteTagline;
        const description = siteSettings.sharingDescription || "Official website for Uhuru Market Uniforms. Premium school uniforms, corporate wear, and branding based in Nairobi.";
        const imageUrl = siteSettings.sharingImage || siteSettings.siteLogo || "";

        const logoUrl = siteSettings.siteLogo;
        const preloadTags = logoUrl ? `<link rel="preload" as="image" href="${logoUrl}" fetchpriority="high">` : "";
        const injectSettings = `<script>window.__PRELOADED_SETTINGS__ = ${JSON.stringify(siteSettings)};</script>`;

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
          ${preloadTags}
          ${injectSettings}
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
    next();
  });

  // Generic Metadata Middleware for handled routes
  app.get(["/products", "/categories", "/services", "/portfolio", "/contact", "/about", "/wholesale"], async (req, res, next) => {
    try {
      const requestPath = req.path;
      let title = "Uhuru Market Uniforms | Naisiae Textiles Nairobi";
      let description = "Official Uhuru Market Uniforms manufacturing and textile solutions. High-quality school uniforms and branding.";
      
      if (requestPath === '/products') {
        title = "Our Products | Uhuru Market Uniforms Nairobi";
        description = "Browse our full catalog of custom-tailored Uhuru Market Uniforms. High-quality garments for schools and institutions.";
      } else if (requestPath === '/categories') {
        title = "Uniform Categories | Uhuru Market Uniforms";
        description = "Explore our manufacturing categories including School Uniforms, Hospitality, and Corporate branding in Nairobi.";
      } else if (requestPath === '/services') {
        title = "Manufacturing Services | Uhuru Market Uniforms";
        description = "Bulk textile production, industrial stitching, and branding services at Uhuru Market, Nairobi.";
      } else if (requestPath === '/portfolio') {
        title = "Our Projects | Uhuru Market Uniforms Portfolio";
        description = "See examples of bulk school uniform orders we have successfully delivered across Kenya.";
      } else if (requestPath === '/contact') {
        title = "Contact Us | Uhuru Market Uniforms Nairobi";
        description = "Get in touch for bulk orders. Call +254792021795 or visit our Uhuru Market workshop.";
      } else if (requestPath === '/about') {
        title = "About Uhuru Market Uniforms - Naisiae Textiles";
        description = "Leaders in institutional uniform manufacturing at Uhuru Market Nairobi.";
      } else if (requestPath === '/wholesale') {
        title = "Wholesale Deals | Uhuru Market Uniforms Nairobi";
        description = "Specialized bulk pricing for schools and institutions. Get factory-direct rates from Uhuru Market.";
      }

      const indexHtml = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
      
      // Fetch settings for LOGO and Global Preload
      let siteSettings = {
        siteName: "Naisiae Textiles Limited",
        siteTagline: "School Uniforms & Branding",
        siteLogo: "",
        sharingImage: ""
      };

      try {
        const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8"));
        const projectId = config.projectId;
        const databaseId = config.firestoreDatabaseId || "(default)";
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/settings/site`;
        const settingsResponse = await fetch(firestoreUrl);
        const settingsData = await settingsResponse.json();
        
        if (settingsData.fields) {
          siteSettings = {
            siteName: settingsData.fields.siteName?.stringValue || "Naisiae Textiles Limited",
            siteTagline: settingsData.fields.siteTagline?.stringValue || "School Uniforms & Branding",
            siteLogo: settingsData.fields.siteLogo?.stringValue || "",
            sharingImage: settingsData.fields.sharingImage?.stringValue || ""
          };
        }
      } catch (e) {
        console.error("Failed to fetch settings for preload:", e);
      }

      const logoUrl = siteSettings.siteLogo;
      const preloadTags = logoUrl ? `<link rel="preload" as="image" href="${logoUrl}" fetchpriority="high">` : "";
      const injectSettings = `<script>window.__PRELOADED_SETTINGS__ = ${JSON.stringify(siteSettings)};</script>`;

      const canonical = `<link rel="canonical" href="https://naisiaetextiles.com${requestPath}" />`;
      const metaTags = `
        <title>${title}</title>
        <meta name="description" content="${description}" />
        ${canonical}
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:url" content="https://naisiaetextiles.com${requestPath}" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="${siteSettings.sharingImage || siteSettings.siteLogo || 'https://naisiaetextiles.com/og-image.jpg'}" />
        ${preloadTags}
        ${injectSettings}
      `;
      
      let html = indexHtml.replace(/<title>.*?<\/title>/, metaTags);
      html = html.replace(/<meta name="description".*?\/>/, "");
      html = html.replace(/<link rel="canonical".*?\/>/, "");
      
      res.send(html);
      return;
    } catch (e) {
      console.error("SEO Middleware error (Pages):", e);
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
