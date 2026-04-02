import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import Stripe from "stripe";
import rateLimit from "express-rate-limit";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set up rate limiter: maximum of 100 requests per 15 minutes
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Muitas requisições feitas por este IP. Por favor, tente novamente após 15 minutos.",
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

  // Apply rate limiter to all /api routes
  app.use("/api", limiter);

  // Stripe requires raw body for webhook verification
  app.post(
    "/api/stripe-webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"];
      const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
      const stripeKey = process.env.STRIPE_SECRET_KEY;

      if (!stripeSecret || !stripeKey) {
        return res.status(500).send("Stripe keys not configured");
      }

      const stripe = new Stripe(stripeKey);

      try {
        const event = stripe.webhooks.constructEvent(req.body, sig as string, stripeSecret);
        
        // Handle the event
        if (event.type === 'checkout.session.completed') {
          const session = event.data.object;
          
          try {
            // Read Firebase config to get project details
            const configPath = path.join(process.cwd(), "firebase-applet-config.json");
            const configRaw = await fs.readFile(configPath, "utf-8");
            const firebaseConfig = JSON.parse(configRaw);
            const projectId = firebaseConfig.projectId;
            const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";

            const purchaseId = session.id; // Use Stripe session ID as document ID for idempotency
            const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/purchases/${purchaseId}`;
            
            const purchaseData = {
              fields: {
                userId: { stringValue: session.customer_email || session.metadata?.userId || "unknown" },
                productId: { stringValue: session.metadata?.productId || "unknown" },
                amount: { integerValue: session.amount_total || 0 },
                currency: { stringValue: session.currency || "BRL" },
                status: { stringValue: "completed" },
                webhookSecret: { stringValue: "stripe_webhook_secret_key_123" }, // To bypass rules
                createdAt: { timestampValue: new Date().toISOString() }
              }
            };

            const response = await fetch(firestoreUrl, {
              method: 'PATCH', // PATCH acts as upsert in Firestore REST API when document ID is specified
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(purchaseData)
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('Failed to save purchase to Firestore:', errorText);
            } else {
              console.log('Payment successful and saved for session:', session.id);
            }
          } catch (dbError) {
            console.error('Error saving purchase to database:', dbError);
          }
        }

        res.json({ received: true });
      } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
      }
    }
  );

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/crm-webhook", async (req, res) => {
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nUrl) {
      return res.status(500).json({ error: "N8N webhook URL not configured" });
    }

    try {
      const response = await fetch(n8nUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      
      if (!response.ok) {
        throw new Error(`N8N responded with status: ${response.status}`);
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("CRM Webhook Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/checkout", async (req, res) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    try {
      // Read Firebase config to get project details
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      const configRaw = await fs.readFile(configPath, "utf-8");
      const firebaseConfig = JSON.parse(configRaw);
      const projectId = firebaseConfig.projectId;
      const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";

      // Fetch product from Firestore REST API
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/products/${productId}`;
      const productRes = await fetch(firestoreUrl);
      
      if (!productRes.ok) {
        return res.status(404).json({ error: "Product not found" });
      }

      const productData = await productRes.json();
      const fields = productData.fields;
      
      if (!fields || !fields.isActive?.booleanValue) {
        return res.status(400).json({ error: "Product is not active" });
      }

      const priceVal = fields.price?.integerValue || fields.price?.doubleValue || "0";
      const price = parseInt(priceVal.toString(), 10);
      const currency = fields.currency?.stringValue || "BRL";
      
      // Title is a map of languages
      const titleMap = fields.title?.mapValue?.fields;
      const title = titleMap?.pt?.stringValue || titleMap?.en?.stringValue || "Product";

      if (price <= 0) {
        return res.status(400).json({ error: "Invalid product price" });
      }

      const stripe = new Stripe(stripeKey);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: title,
              },
              unit_amount: price,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        metadata: { productId },
        success_url: `${process.env.APP_URL || 'http://localhost:3000'}/dashboard?payment=success`,
        cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/dashboard?payment=cancelled`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe Checkout Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
